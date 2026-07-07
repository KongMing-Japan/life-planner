import { CalendarDays, Plus, Settings2, Sparkles, Trash2, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import type { I18nCopy, Locale } from '../i18n'
import type { Adult, Child, LifeEvent, PlannerV2 } from '../types'
import { NumberField, SectionHeading } from './Fields'

type Props = { plan: PlannerV2; onChange: (plan: PlannerV2) => void; locale: Locale; copy: I18nCopy }
type InputMode = 'simple' | 'detailed'

const nextId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export function InputPanel({ plan, onChange, locale, copy }: Props) {
  const [mode, setMode] = useState<InputMode>('simple')
  const primary = plan.adults.find((adult) => adult.role === 'primary') ?? plan.adults[0]
  const spouse = plan.adults.find((adult) => adult.role === 'spouse')
  const totalBefore = plan.expenses.housingBeforeRetirement + plan.expenses.livingBeforeRetirement + plan.expenses.annualTravel
  const totalAfter = plan.expenses.housingAfterRetirement + plan.expenses.livingAfterRetirement + plan.expenses.annualTravel
  const endAgeLabel = locale === 'ja' ? `${plan.assumptions.endAge}歳まで` : locale === 'zh' ? `计算至 ${plan.assumptions.endAge}岁` : `through age ${plan.assumptions.endAge}`

  const updateAdult = (id: string, patch: Partial<Adult>) => {
    onChange({ ...plan, adults: plan.adults.map((adult) => adult.id === id ? { ...adult, ...patch } : adult) })
  }

  const addSpouse = () => {
    if (spouse) return
    onChange({
      ...plan,
      adults: [...plan.adults, {
        id: 'spouse', role: 'spouse', name: copy.spouse, currentAge: Math.max(18, primary.currentAge - 2),
        annualSalary: 5_000_000, annualSalaryGrowth: 0, retireAge: 65, pensionStartAge: 65, annualPension: 1_500_000,
        medicalStartAge: 70, annualMedicalExpense: 800_000,
      }],
    })
  }

  const addChild = () => {
    const childLabel = locale === 'ja' ? `子ども${plan.children.length + 1}` : locale === 'zh' ? `孩子 ${plan.children.length + 1}` : `Child ${plan.children.length + 1}`
    const child: Child = { id: nextId('child'), name: childLabel, currentAge: 0 }
    onChange({ ...plan, children: [...plan.children, child] })
  }

  const updateChild = (id: string, patch: Partial<Child>) => {
    onChange({ ...plan, children: plan.children.map((child) => child.id === id ? { ...child, ...patch } : child) })
  }

  const setAnnualExpense = (phase: 'before' | 'after', total: number) => {
    const travel = Math.min(plan.expenses.annualTravel, Math.max(0, total))
    const remainder = Math.max(0, total - travel)
    const housingKey = phase === 'before' ? 'housingBeforeRetirement' : 'housingAfterRetirement'
    const livingKey = phase === 'before' ? 'livingBeforeRetirement' : 'livingAfterRetirement'
    const currentHousing = plan.expenses[housingKey]
    const currentLiving = plan.expenses[livingKey]
    const housingShare = currentHousing + currentLiving > 0 ? currentHousing / (currentHousing + currentLiving) : 0.3
    onChange({ ...plan, expenses: { ...plan.expenses, [housingKey]: remainder * housingShare, [livingKey]: remainder * (1 - housingShare) } })
  }

  const updateEvent = (id: string, patch: Partial<LifeEvent>) => {
    onChange({ ...plan, events: plan.events.map((event) => event.id === id ? { ...event, ...patch } : event) })
  }

  const addEvent = () => {
    onChange({ ...plan, events: [...plan.events, {
      id: nextId('event'), name: copy.newEvent, memberId: null, type: 'expense',
      startYear: plan.assumptions.startYear + 1, duration: 1, annualAmount: 1_000_000, taxable: false,
    }] })
  }

  return (
    <aside className={`input-panel input-mode-${mode}`}>
      <div className="input-mode-switch" role="group" aria-label={copy.inputMode}>
        <button className={mode === 'simple' ? 'active' : ''} type="button" onClick={() => setMode('simple')}><Sparkles />{copy.simple}</button>
        <button className={mode === 'detailed' ? 'active' : ''} type="button" onClick={() => setMode('detailed')}><Settings2 />{copy.detailed}</button>
      </div>

      {mode === 'simple' ? (
        <section className="quick-input-card">
          <div className="quick-input-head"><div><span>QUICK START</span><h2>{copy.quickTitle}</h2></div><b>{copy.liveCalc}</b></div>
          <div className="quick-grid">
            <NumberField label={copy.assetsNow} value={plan.assumptions.initialAssets} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(initialAssets) => onChange({ ...plan, assumptions: { ...plan.assumptions, initialAssets } })} />
            <NumberField label={copy.annualExpense} value={totalBefore} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(value) => setAnnualExpense('before', value)} />
            <NumberField label={copy.yourAge} value={primary.currentAge} min={18} max={100} suffix={copy.age} onChange={(currentAge) => updateAdult(primary.id, { currentAge })} />
            <NumberField label={copy.yourIncome} value={primary.annualSalary} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(annualSalary) => updateAdult(primary.id, { annualSalary })} />
            <NumberField label={copy.retireAge} value={primary.retireAge} min={primary.currentAge} max={90} suffix={copy.age} onChange={(retireAge) => updateAdult(primary.id, { retireAge })} />
            <NumberField label={copy.retirementExpense} value={totalAfter} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(value) => setAnnualExpense('after', value)} />
          </div>

          <div className="quick-family">
            <div className="quick-row-title"><strong>{copy.family}</strong>{spouse ? <button type="button" onClick={() => onChange({ ...plan, adults: plan.adults.filter((adult) => adult.id !== spouse.id) })}><Trash2 />{copy.removeSpouse}</button> : <button type="button" onClick={addSpouse}><UserPlus />{copy.addSpouse}</button>}</div>
            {spouse ? <div className="quick-spouse"><NumberField label={copy.spouseAge} value={spouse.currentAge} min={18} max={100} suffix={copy.age} onChange={(currentAge) => updateAdult(spouse.id, { currentAge })} /><NumberField label={copy.spouseIncome} value={spouse.annualSalary} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(annualSalary) => updateAdult(spouse.id, { annualSalary })} /></div> : <p>{copy.singleHousehold}</p>}
            <div className="child-chips">{plan.children.map((child) => <span key={child.id}>{child.name} · {child.currentAge}{copy.age}<button aria-label={`${copy.delete}${child.name}`} type="button" onClick={() => onChange({ ...plan, children: plan.children.filter((item) => item.id !== child.id) })}>×</button></span>)}<button type="button" onClick={addChild}><Plus />{copy.addChild}</button></div>
          </div>

          <div className="assumption-note">
            <Settings2 /><div><strong>{copy.standardAssumptions}</strong><p>{copy.nominalReturn} {Math.round(plan.assumptions.nominalReturn * 1000) / 10}% · {copy.inflation} {Math.round(plan.assumptions.inflation * 1000) / 10}% · {endAgeLabel}</p></div><button type="button" onClick={() => setMode('detailed')}>{copy.change}</button>
          </div>
        </section>
      ) : (
        <details className="input-section" open>
          <summary><Users /><span>{copy.household}</span></summary>
          <div className="input-section-body">
            <SectionHeading icon={<span className="section-index">01</span>} title={copy.assetsAssumptions} />
            <div className="field-grid two">
              <NumberField label={copy.startYear} value={plan.assumptions.startYear} min={2020} max={2100} onChange={(startYear) => onChange({ ...plan, assumptions: { ...plan.assumptions, startYear } })} />
              <NumberField label={copy.planUntil} value={plan.assumptions.endAge} min={80} max={120} suffix={copy.age} onChange={(endAge) => onChange({ ...plan, assumptions: { ...plan.assumptions, endAge } })} />
              <NumberField label={copy.investableAssets} value={plan.assumptions.initialAssets} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(initialAssets) => onChange({ ...plan, assumptions: { ...plan.assumptions, initialAssets } })} />
              <NumberField label={copy.nominalReturn} value={plan.assumptions.nominalReturn * 100} min={-20} max={30} step={0.1} suffix="%" onChange={(value) => onChange({ ...plan, assumptions: { ...plan.assumptions, nominalReturn: value / 100 } })} />
              <NumberField label={copy.inflation} value={plan.assumptions.inflation * 100} min={-5} max={20} step={0.1} suffix="%" onChange={(value) => onChange({ ...plan, assumptions: { ...plan.assumptions, inflation: value / 100 } })} />
              <NumberField label={copy.borrowingRate} value={plan.assumptions.borrowingRate * 100} min={0} max={30} step={0.1} suffix="%" onChange={(value) => onChange({ ...plan, assumptions: { ...plan.assumptions, borrowingRate: value / 100 } })} />
            </div>

            <SectionHeading icon={<span className="section-index">02</span>} title={copy.householdMembers} action={!spouse ? <button className="text-button" type="button" onClick={addSpouse}><UserPlus />{copy.addSpouse}</button> : undefined} />
            <div className="member-stack">{plan.adults.map((adult) => <article className="member-card" key={adult.id}>
              <div className="member-card-title"><label><span>{adult.role === 'primary' ? copy.primary : copy.spouse}</span><input aria-label={`${adult.role === 'primary' ? copy.primary : copy.spouse} ${copy.name}`} value={adult.name} onChange={(event) => updateAdult(adult.id, { name: event.target.value })} /></label>{adult.role === 'spouse' ? <button aria-label={`${copy.delete} ${copy.spouse}`} type="button" onClick={() => onChange({ ...plan, adults: plan.adults.filter((item) => item.id !== adult.id) })}><Trash2 /></button> : null}</div>
              <div className="field-grid two compact">
                <NumberField label={copy.currentAge} value={adult.currentAge} min={18} max={100} suffix={copy.age} onChange={(currentAge) => updateAdult(adult.id, { currentAge })} />
                <NumberField label={copy.grossIncome} value={adult.annualSalary} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(annualSalary) => updateAdult(adult.id, { annualSalary })} />
                <NumberField label={copy.salaryRealGrowth} value={adult.annualSalaryGrowth * 100} min={-10} max={20} step={0.1} suffix="%" onChange={(value) => updateAdult(adult.id, { annualSalaryGrowth: value / 100 })} />
                <NumberField label={copy.retireAge} value={adult.retireAge} min={adult.currentAge} max={90} suffix={copy.age} onChange={(retireAge) => updateAdult(adult.id, { retireAge })} />
                <NumberField label={copy.pensionStart} value={adult.pensionStartAge} min={50} max={100} suffix={copy.age} onChange={(pensionStartAge) => updateAdult(adult.id, { pensionStartAge })} />
                <NumberField label={copy.annualPension} value={adult.annualPension} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(annualPension) => updateAdult(adult.id, { annualPension })} />
                <NumberField label={copy.medicalStart} value={adult.medicalStartAge} min={40} max={110} suffix={copy.age} onChange={(medicalStartAge) => updateAdult(adult.id, { medicalStartAge })} />
                <NumberField label={copy.annualMedical} value={adult.annualMedicalExpense} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(annualMedicalExpense) => updateAdult(adult.id, { annualMedicalExpense })} />
              </div>
            </article>)}</div>

            <div className="children-heading"><strong>{copy.children}</strong><button className="text-button" type="button" onClick={addChild}><Plus />{copy.addChild}</button></div>
            <div className="children-list">{plan.children.length === 0 ? <p className="empty-copy">{copy.noChildren}</p> : plan.children.map((child) => <div className="child-row" key={child.id}><input aria-label={`${child.name} ${copy.name}`} value={child.name} onChange={(event) => updateChild(child.id, { name: event.target.value })} /><label><input aria-label={`${child.name} ${copy.age}`} type="number" min={0} max={60} value={child.currentAge} onChange={(event) => updateChild(child.id, { currentAge: Number(event.target.value) || 0 })} /><span>{copy.age}</span></label><button aria-label={`${copy.delete} ${child.name}`} type="button" onClick={() => onChange({ ...plan, children: plan.children.filter((item) => item.id !== child.id) })}><Trash2 /></button></div>)}</div>

            <SectionHeading icon={<span className="section-index">03</span>} title={copy.householdExpenseDetail} />
            <div className="field-grid two">
              <NumberField label={copy.housingBefore} value={plan.expenses.housingBeforeRetirement} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(value) => onChange({ ...plan, expenses: { ...plan.expenses, housingBeforeRetirement: value } })} />
              <NumberField label={copy.housingAfter} value={plan.expenses.housingAfterRetirement} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(value) => onChange({ ...plan, expenses: { ...plan.expenses, housingAfterRetirement: value } })} />
              <NumberField label={copy.livingBefore} value={plan.expenses.livingBeforeRetirement} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(value) => onChange({ ...plan, expenses: { ...plan.expenses, livingBeforeRetirement: value } })} />
              <NumberField label={copy.livingAfter} value={plan.expenses.livingAfterRetirement} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(value) => onChange({ ...plan, expenses: { ...plan.expenses, livingAfterRetirement: value } })} />
              <NumberField label={copy.travel} value={plan.expenses.annualTravel} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(value) => onChange({ ...plan, expenses: { ...plan.expenses, annualTravel: value } })} />
            </div>
            <details className="advanced-settings"><summary>{copy.taxSettings}</summary><div className="field-grid three compact">
              <NumberField label={copy.salaryTax} value={plan.assumptions.salaryTaxRate * 100} min={0} max={100} suffix="%" onChange={(value) => onChange({ ...plan, assumptions: { ...plan.assumptions, salaryTaxRate: value / 100 } })} />
              <NumberField label={copy.pensionTax} value={plan.assumptions.pensionTaxRate * 100} min={0} max={100} suffix="%" onChange={(value) => onChange({ ...plan, assumptions: { ...plan.assumptions, pensionTaxRate: value / 100 } })} />
              <NumberField label={copy.eventTax} value={plan.assumptions.eventTaxRate * 100} min={0} max={100} suffix="%" onChange={(value) => onChange({ ...plan, assumptions: { ...plan.assumptions, eventTaxRate: value / 100 } })} />
            </div></details>
            <details className="calculation-rules"><summary>{copy.calculationRules}</summary><ul><li>{copy.ruleRealMoney}</li><li>{copy.ruleAssetTiming}</li><li>{copy.ruleRetirement}</li><li>{copy.ruleDebt}</li><li>{copy.ruleScope}</li></ul></details>
          </div>
        </details>
      )}

      <details className="input-section events-section">
        <summary><CalendarDays /><span>{copy.events}</span><b>{plan.events.length}</b></summary>
        <div className="input-section-body"><p className="section-help">{copy.eventHelp}</p><div className="event-stack">
          {plan.events.map((event) => <article className={`event-editor ${event.type} ${mode === 'simple' ? 'event-editor-simple' : ''}`} key={event.id}>
            <div className="event-editor-head"><div className="event-type-toggle"><button className={event.type === 'expense' ? 'active' : ''} type="button" onClick={() => updateEvent(event.id, { type: 'expense', taxable: false })}>{copy.expense}</button><button className={event.type === 'income' ? 'active' : ''} type="button" onClick={() => updateEvent(event.id, { type: 'income' })}>{copy.income}</button></div><button aria-label={`${copy.delete} ${event.name}`} type="button" onClick={() => onChange({ ...plan, events: plan.events.filter((item) => item.id !== event.id) })}><Trash2 /></button></div>
            <label className="event-name"><span>{copy.eventName}</span><input value={event.name} onChange={(e) => updateEvent(event.id, { name: e.target.value })} /></label>
            <div className="event-fields"><NumberField label={copy.eventStart} value={event.startYear} min={plan.assumptions.startYear} max={plan.assumptions.startYear + 120} onChange={(startYear) => updateEvent(event.id, { startYear })} /><NumberField label={copy.duration} value={event.duration} min={1} max={100} suffix={copy.year} onChange={(duration) => updateEvent(event.id, { duration })} /><NumberField label={copy.annualAmount} value={event.annualAmount} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(annualAmount) => updateEvent(event.id, { annualAmount })} /></div>
            {mode === 'detailed' ? <div className="event-meta"><label><span>{copy.relatedMember}</span><select value={event.memberId ?? ''} onChange={(e) => updateEvent(event.id, { memberId: e.target.value || null })}><option value="">{copy.householdShared}</option>{[...plan.adults, ...plan.children].map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>{event.type === 'income' ? <label className="check-field"><input type="checkbox" checked={event.taxable} onChange={(e) => updateEvent(event.id, { taxable: e.target.checked })} /><span>{copy.taxable}</span></label> : null}</div> : null}
          </article>)}
        </div><button className="add-event-button" type="button" onClick={addEvent}><Plus />{copy.addEvent}</button></div>
      </details>
    </aside>
  )
}
