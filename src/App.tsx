import { PanelRightOpen, ShieldCheck } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { InputPanel } from './components/InputPanel'
import { ToolsDrawer } from './components/ToolsDrawer'
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
  const [scenario, setScenario] = useState<PlannerV2 | null>(null)
  const [toolsOpen, setToolsOpen] = useState(false)
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
            {locales.map((item) => <button className={locale === item.id ? 'active' : ''} type="button" key={item.id} title={item.label} onClick={() => setLocale(item.id)}>{item.short}</button>)}
          </div>
          <button className="tools-button" type="button" onClick={() => setToolsOpen(true)}><PanelRightOpen />{copy.tools}</button>
        </div>
      </header>

      <main className="planner-layout">
        <InputPanel plan={plan} onChange={setPlan} locale={locale} copy={copy} />
        <Dashboard output={output} locale={locale} copy={copy} />
      </main>

      <footer><p>{copy.disclaimer}</p><span>Life Planner v2 · {copy.localSave}</span></footer>
      <ToolsDrawer open={toolsOpen} plan={plan} scenario={scenario} locale={locale} copy={copy} onClose={() => setToolsOpen(false)} onPlanChange={setPlan} onScenarioChange={setScenario} />
      <ChatAssistant plan={plan} locale={locale} copy={copy} onChange={setPlan} />
    </div>
  )
}
