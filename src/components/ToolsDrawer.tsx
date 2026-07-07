import { Download, FileJson, GitCompareArrows, RotateCcw, Upload, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { clonePlan, templates } from '../data/defaultPlan'
import { buildPlanOutput } from '../engine/planner'
import { formatMoney, type I18nCopy, type Locale } from '../i18n'
import { exportPlan, importPlan } from '../storage/plannerStorage'
import type { PlannerV2 } from '../types'

type Props = {
  open: boolean
  plan: PlannerV2
  scenario: PlannerV2 | null
  locale: Locale
  copy: I18nCopy
  onClose: () => void
  onPlanChange: (plan: PlannerV2) => void
  onScenarioChange: (plan: PlannerV2 | null) => void
}

const download = (name: string, content: string) => {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

export function ToolsDrawer({ open, plan, scenario, locale, copy, onClose, onPlanChange, onScenarioChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const baseOutput = useMemo(() => buildPlanOutput(plan), [plan])
  const scenarioOutput = useMemo(() => scenario ? buildPlanOutput(scenario) : null, [scenario])

  const adjustScenario = (action: 'retire-later' | 'expense-down' | 'return-up' | 'delay-event') => {
    const next = clonePlan(scenario ?? plan)
    if (action === 'retire-later') next.adults = next.adults.map((adult) => ({ ...adult, retireAge: Math.min(90, adult.retireAge + 1) }))
    if (action === 'expense-down') next.expenses = { ...next.expenses, livingBeforeRetirement: next.expenses.livingBeforeRetirement * 0.95, livingAfterRetirement: next.expenses.livingAfterRetirement * 0.95 }
    if (action === 'return-up') next.assumptions.nominalReturn += 0.005
    if (action === 'delay-event' && next.events[0]) next.events = next.events.map((event, index) => index === 0 ? { ...event, startYear: event.startYear + 1 } : event)
    onScenarioChange(next)
  }

  return (
    <>
      <button className={`drawer-backdrop ${open ? 'open' : ''}`} aria-label={copy.close} type="button" onClick={onClose} />
      <aside className={`tools-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="drawer-head"><div><span>TOOLS</span><h2>{copy.tools}</h2></div><button aria-label={copy.close} type="button" onClick={onClose}><X /></button></div>

        <section className="tool-section"><h3><FileJson />{copy.toolFiles}</h3><p>{copy.toolFilesHelp}</p>
          <div className="tool-actions"><button type="button" onClick={() => download('life-planner-v2.json', exportPlan(plan))}><Download />{copy.exportJson}</button><button type="button" onClick={() => inputRef.current?.click()}><Upload />{copy.importJson}</button></div>
          <input ref={inputRef} hidden type="file" accept="application/json,.json" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { onPlanChange(importPlan(await file.text())); setMessage(copy.importSuccess); } catch { setMessage(copy.importFailed); } event.currentTarget.value = '' }} />
          {message ? <small className="tool-message">{message}</small> : null}
        </section>

        <section className="tool-section"><h3><RotateCcw />{copy.templates}</h3><p>{copy.templatesHelp}</p><div className="template-list">{templates.map((template) => <button type="button" key={template.id} onClick={() => { onPlanChange(template.build()); setMessage(`${copy.templateLoaded}: ${template.name}`) }}><strong>{template.name}</strong><span>{copy.applyTemplate}</span></button>)}</div></section>

        <section className="tool-section"><h3><GitCompareArrows />{copy.scenario}</h3><p>{copy.scenarioHelp}</p>
          {!scenario ? <button className="primary-tool" type="button" onClick={() => onScenarioChange(clonePlan(plan))}>{copy.copyScenario}</button> : <>
            <div className="scenario-actions"><button type="button" onClick={() => adjustScenario('retire-later')}>{copy.retireLater}</button><button type="button" onClick={() => adjustScenario('expense-down')}>{copy.expenseDown}</button><button type="button" onClick={() => adjustScenario('return-up')}>{copy.returnUp}</button><button type="button" onClick={() => adjustScenario('delay-event')}>{copy.delayEvent}</button></div>
            <div className="scenario-result"><div><span>A · {copy.terminalBalance}</span><strong>{formatMoney(baseOutput.summary.terminalAssets, locale)}</strong></div><div><span>B · {copy.terminalBalance}</span><strong>{formatMoney(scenarioOutput?.summary.terminalAssets ?? 0, locale)}</strong></div><div className="scenario-delta"><span>{copy.difference}</span><strong>{formatMoney((scenarioOutput?.summary.terminalAssets ?? 0) - baseOutput.summary.terminalAssets, locale)}</strong></div></div>
            <div className="tool-actions"><button type="button" onClick={() => scenario && onPlanChange(clonePlan(scenario))}>{copy.applyB}</button><button type="button" onClick={() => onScenarioChange(null)}>{copy.clearB}</button></div>
          </>}
        </section>

        <a className="details-link" href="#annual-details" onClick={onClose}>{copy.jumpDetails}</a>
      </aside>
    </>
  )
}
