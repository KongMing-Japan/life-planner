import { GitCompareArrows, RotateCcw, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { clonePlan, templates } from '../data/defaultPlan'
import { buildPlanOutput } from '../engine/planner'
import { formatMoney, type I18nCopy, type Locale } from '../i18n'
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

export function ToolsDrawer({ open, plan, scenario, locale, copy, onClose, onPlanChange, onScenarioChange }: Props) {
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
        {message ? <div style={{ margin: '0 1rem 1rem', padding: '0.5rem 0.8rem', background: 'var(--blue-50)', color: 'var(--blue-700)', border: '1px solid rgba(10,107,242,0.1)', borderRadius: '0.4rem', fontSize: '0.58rem', fontWeight: 600 }}>{message}</div> : null}

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
