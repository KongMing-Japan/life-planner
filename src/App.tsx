import { PanelRightOpen, ShieldCheck } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { InputPanel } from './components/InputPanel'
import { ChatAssistant } from './components/ChatAssistant'
import { buildPlanOutput } from './engine/planner'
import { getCopy, locales, type Locale } from './i18n'
import { loadPlan, savePlan } from './storage/plannerStorage'
import type { PlannerV2 } from './types'

export default function App() {
  const [plan, setPlan] = useState<PlannerV2>(() => loadPlan())
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('life-planner-language')
    return saved === 'zh' || saved === 'en' ? saved : 'ja'
  })
  const deferredPlan = useDeferredValue(plan)
  const output = useMemo(() => buildPlanOutput(deferredPlan), [deferredPlan])
  const copy = getCopy(locale)

  useEffect(() => {
    if (window.location.pathname !== '/') window.history.replaceState(null, '', '/')
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => savePlan(plan), 180)
    return () => window.clearTimeout(timer)
  }, [plan])

  useEffect(() => {
    localStorage.setItem('life-planner-language', locale)
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : locale
    document.title = `${copy.appTitle} | Life Planner`
  }, [copy.appTitle, locale])

  return (
    <div className="app-shell">
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
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.22rem' }}
              >
                <span>{item.id === 'ja' ? '🇯🇵' : item.id === 'zh' ? '🇨🇳' : '🇺🇸'}</span>
                <span>{item.short}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="planner-layout">
        <InputPanel plan={plan} onChange={setPlan} locale={locale} copy={copy} />
        <Dashboard output={output} locale={locale} copy={copy} />
      </main>

      <footer><p>{copy.disclaimer}</p><span>Life Planner v2 · {copy.localSave}</span></footer>
      <ChatAssistant plan={plan} locale={locale} copy={copy} onChange={setPlan} />
    </div>
  )
}
