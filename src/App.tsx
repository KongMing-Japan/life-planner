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
    return saved === 'zh' ? saved : 'ja'
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

      <footer><p>{copy.disclaimer}</p><span>Life Planner v2 · {copy.localSave}</span></footer>
      <ChatAssistant plan={plan} locale={locale} copy={copy} onChange={setPlan} />
    </div>
  )
}
