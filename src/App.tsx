import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { InputPanel } from './components/InputPanel'
import { ChatAssistant } from './components/ChatAssistant'
import { LifeOsNextSteps } from './components/LifeOsNextSteps'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { LifeOsNav } from './components/LifeOsNav'
import { buildPlanOutput } from './engine/planner'
import { getCopy, type Locale } from './i18n'
import { loadPlan, savePlan } from './storage/plannerStorage'
import type { PlannerV2 } from './types'

const readHandoffPlan = (): PlannerV2 => {
  const saved = loadPlan()
  const params = new URLSearchParams(window.location.search)
  const source = params.get('source')
  if (source !== 'tax' && source !== 'portfolio') return saved

  const readPositive = (key: string, allowZero = false) => {
    if (!params.has(key)) return null
    const value = Number(params.get(key))
    return Number.isFinite(value) && (allowZero ? value >= 0 : value > 0) ? value : null
  }
  const income = readPositive('income', true)
  const age = readPositive('age')
  const assets = readPositive('assets', true)

  return {
    ...saved,
    assumptions: assets === null
      ? saved.assumptions
      : { ...saved.assumptions, initialAssets: assets },
    adults: saved.adults.map((adult, index) => index === 0
      ? {
          ...adult,
          annualSalary: income ?? adult.annualSalary,
          currentAge: age === null ? adult.currentAge : Math.round(age),
        }
      : adult),
  }
}

export default function App() {
  const [plan, setPlan] = useState<PlannerV2>(readHandoffPlan)
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('life-planner-language')
    return saved === 'zh' ? saved : 'ja'
  })
  const deferredPlan = useDeferredValue(plan)
  const output = useMemo(() => buildPlanOutput(deferredPlan), [deferredPlan])
  const copy = getCopy(locale)

  const primaryAdult = plan.adults[0]
  const totalIncome = plan.adults.reduce((acc, adult) => acc + adult.annualSalary, 0)
  const portfolioParams = useMemo(() => new URLSearchParams({
    source: 'planner',
    assets: String(plan.assumptions.initialAssets ?? 0),
    income: String(totalIncome),
    age: String(primaryAdult?.currentAge ?? 35),
  }).toString(), [plan.assumptions.initialAssets, totalIncome, primaryAdult?.currentAge])

  const taxParams = useMemo(() => new URLSearchParams({
    source: 'planner',
    income: String(totalIncome),
    age: String(primaryAdult?.currentAge ?? 35),
    dependents: String(plan.children.length),
  }).toString(), [totalIncome, primaryAdult?.currentAge, plan.children.length])

  const portfolioUrl = `https://portfolio.kongmingjapan.com/?${portfolioParams}`
  const taxLocale = locale === 'zh' ? 'zh-CN' : 'ja'
  const taxUrl = `https://tax.kongmingjapan.com/${taxLocale}/?${taxParams}`

  useEffect(() => {
    const source = new URLSearchParams(window.location.search).get('source')
    if (window.location.pathname !== '/' || source === 'tax' || source === 'portfolio') {
      window.history.replaceState(null, '', '/')
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => savePlan(plan), 180)
    return () => window.clearTimeout(timer)
  }, [plan])

  useEffect(() => {
    localStorage.setItem('life-planner-language', locale)
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : locale
    document.title = `${copy.appTitle} | Kong Ming`
  }, [copy.appTitle, locale])

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <div>
            <LifeOsNav locale={locale} portfolioUrl={portfolioUrl} taxUrl={taxUrl} />
            <h1>{copy.appTitle}</h1>
            <p>{copy.appSubtitle}</p>
          </div>
        </div>
        <div className="header-actions">
          <LanguageSwitcher locale={locale} onLocaleChange={setLocale} />
        </div>
      </header>

      <main className="planner-layout">
        <InputPanel plan={plan} onChange={setPlan} locale={locale} copy={copy} />
        <Dashboard output={output} locale={locale} copy={copy} plan={plan} onPlanChange={setPlan} />
      </main>

      <LifeOsNextSteps locale={locale} plan={plan} />

      <footer>
        <p>{copy.disclaimer}</p>
        <div style={{ fontSize: '0.75rem', opacity: 0.7, margin: '0.3rem 0' }}>
          <span>KongMing Network: </span>
          <a href="https://kongmingjapan.com/" target="_blank" rel="noreferrer">KongMing</a> ·{' '}
          <a href="https://radar.kongmingjapan.com/" target="_blank" rel="noreferrer">Radar</a> ·{' '}
          <a href="https://lab.kongmingjapan.com/" target="_blank" rel="noreferrer">Lab</a> ·{' '}
          <a href="https://kids.kongmingjapan.com/" target="_blank" rel="noreferrer">Kids</a> ·{' '}
          <a href="https://tax.kongmingjapan.com/" target="_blank" rel="noreferrer">Tax</a> ·{' '}
          <a href="https://planner.kongmingjapan.com/">Planner</a> ·{' '}
          <a href="https://portfolio.kongmingjapan.com/" target="_blank" rel="noreferrer">Portfolio</a>
        </div>
        <span>LifeOS Planner · {copy.localSave}</span>
      </footer>
      <ChatAssistant plan={plan} locale={locale} copy={copy} onChange={setPlan} />
    </div>
  )
}
