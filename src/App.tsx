import { ShieldCheck } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { InputPanel } from './components/InputPanel'
import { ChatAssistant } from './components/ChatAssistant'
import { LifeOsNav } from './components/LifeOsNav'
import { LifeOsNextSteps } from './components/LifeOsNextSteps'
import { buildPlanOutput } from './engine/planner'
import { getCopy, locales, type Locale } from './i18n'
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
      <LifeOsNav locale={locale} />
      <header className="app-header">
        <div className="brand-block">
          <span className="brand-mark"><ShieldCheck /></span>
          <div><h1>{copy.appTitle}</h1><p>{copy.appSubtitle}</p></div>
        </div>
        <div className="header-actions">
          <div className="language-switch" role="group" aria-label={copy.language}>
            {locales.map((item) => (
              <button
                className={locale === item.id ? 'active' : ''}
                type="button"
                key={item.id}
                title={item.label}
                onClick={() => setLocale(item.id)}
              >
                {item.id === 'ja' ? (
                  <svg viewBox="0 0 24 24" width="16" height="16" style={{ borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                    <rect width="24" height="24" fill="#ffffff" />
                    <circle cx="12" cy="12" r="5.5" fill="#bc002d" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="16" height="16" style={{ borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.12)', flexShrink: 0 }}>
                    <rect width="24" height="24" fill="#de2910" />
                    <polygon points="12,5 14,11 20,11 15,15 17,21 12,17 7,21 9,15 4,11 10,11" fill="#ffde00" style={{ transform: 'scale(0.85)', transformOrigin: '12px 12px' }} />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="planner-layout">
        <InputPanel plan={plan} onChange={setPlan} locale={locale} copy={copy} />
        <Dashboard output={output} locale={locale} copy={copy} />
      </main>

      <LifeOsNextSteps locale={locale} plan={plan} />

      <footer><p>{copy.disclaimer}</p><span>LifeOS Planner · {copy.localSave}</span></footer>
      <ChatAssistant plan={plan} locale={locale} copy={copy} onChange={setPlan} />
    </div>
  )
}
