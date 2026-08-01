import { CalendarDays, Home, Landmark, Plus, Settings2, Sparkles, Trash2, UserPlus, Users, Wallet } from 'lucide-react'
import { useState } from 'react'
import type { I18nCopy, Locale } from '../i18n'
import type { Adult, Child, LifeEvent, PlannerV2 } from '../types'
import { NumberField, SectionHeading } from './Fields'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

import { templates } from '../data/defaultPlan'

type Props = { plan: PlannerV2; onChange: (plan: PlannerV2) => void; locale: Locale; copy: I18nCopy }
type InputMode = 'simple' | 'detailed'

const nextId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export function InputPanel({ plan, onChange, locale, copy }: Props) {
  const primary = plan.adults.find((adult) => adult.role === 'primary') ?? plan.adults[0]
  const spouse = plan.adults.find((adult) => adult.role === 'spouse')

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
    <aside className="input-panel">
      {/* One-Click Preset Personas Bar */}
      <div className="m3-card preset-personas-card" style={{ marginBottom: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: '0.04em' }}>
            {locale === 'ja' ? '⚡ 1秒で人生プロファイルを一括ロード' : '⚡ 一键装载经典人生画像模版'}
          </span>
          <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">FAST PRESETS</Badge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 6 }}>
          {templates.map((tpl) => (
            <Button
              key={tpl.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange(tpl.build())}
              className="h-8 text-xs font-medium justify-center"
            >
              {tpl.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="m3-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Quicken Step 01: About You & Household */}
        <section>
          <SectionHeading icon={<Users />} title={locale === 'ja' ? '01. あなたと家族 (About You)' : '01. 个人与家庭 (About You)'} action={!spouse ? <button className="text-button" type="button" onClick={addSpouse}><UserPlus />{copy.addSpouse}</button> : undefined} />
          <div className="field-grid two" style={{ marginBottom: 12 }}>
            <NumberField label={copy.startYear} value={plan.assumptions.startYear} min={2020} max={2100} onChange={(startYear) => onChange({ ...plan, assumptions: { ...plan.assumptions, startYear } })} />
            <NumberField label={copy.planUntil} value={plan.assumptions.endAge} min={80} max={120} suffix={copy.age} onChange={(endAge) => onChange({ ...plan, assumptions: { ...plan.assumptions, endAge } })} />
          </div>

            <div className="member-stack">{plan.adults.map((adult) => <article className="member-card" key={adult.id}>
              <div className="member-card-title"><label><span>{adult.role === 'primary' ? copy.primary : copy.spouse}</span><input aria-label={`${adult.role === 'primary' ? copy.primary : copy.spouse} ${copy.name}`} value={adult.name} onChange={(event) => updateAdult(adult.id, { name: event.target.value })} /></label>{adult.role === 'spouse' ? <button aria-label={`${copy.delete} ${copy.spouse}`} type="button" onClick={() => onChange({ ...plan, adults: plan.adults.filter((item) => item.id !== adult.id) })}><Trash2 /></button> : null}</div>
              <div className="field-grid two compact">
                <NumberField label={copy.currentAge} value={adult.currentAge} min={18} max={100} suffix={copy.age} onChange={(currentAge) => updateAdult(adult.id, { currentAge })} />
                <NumberField label={copy.retireAge} value={adult.retireAge} min={adult.currentAge} max={90} suffix={copy.age} onChange={(retireAge) => updateAdult(adult.id, { retireAge })} />
              </div>
            </article>)}</div>

            <div className="children-heading" style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{copy.children}</strong>
                <small style={{ marginLeft: 8, color: '#64748b', fontSize: 11 }}>
                  {locale === 'ja' ? '(22歳大学卒業で独立・扶養終了)' : '(22岁大学毕业自动独立解约)'}
                </small>
              </div>
              <button className="text-button" type="button" onClick={addChild}><Plus />{copy.addChild}</button>
            </div>
            <div className="children-list">{plan.children.length === 0 ? <p className="empty-copy">{copy.noChildren}</p> : plan.children.map((child) => <div className="child-row" key={child.id}><input aria-label={`${child.name} ${copy.name}`} value={child.name} onChange={(event) => updateChild(child.id, { name: event.target.value })} /><label><input aria-label={`${child.name} ${copy.age}`} type="number" min={0} max={60} value={child.currentAge} onChange={(event) => updateChild(child.id, { currentAge: Number(event.target.value) || 0 })} /><span>{copy.age}</span></label><button aria-label={`${copy.delete} ${child.name}`} type="button" onClick={() => onChange({ ...plan, children: plan.children.filter((item) => item.id !== child.id) })}><Trash2 /></button></div>)}</div>
          </section>

          {/* Quicken Step 02: Salaries & Earnings */}
          <section style={{ borderTop: '1px solid #e0e4ec', paddingTop: 16 }}>
            <SectionHeading icon={<Wallet />} title={locale === 'ja' ? '02. 労働所得与昇給率 (Salaries)' : '02. 职业薪资与增长 (Salaries)'} />
            <div className="member-stack">{plan.adults.map((adult) => <article className="member-card" key={`salary-${adult.id}`}>
              <div className="member-card-title"><span>{adult.name}</span></div>
              <div className="field-grid two compact">
                <NumberField label={copy.grossIncome} value={adult.annualSalary} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(annualSalary) => updateAdult(adult.id, { annualSalary })} />
                <NumberField label={copy.salaryRealGrowth} value={adult.annualSalaryGrowth * 100} min={-10} max={20} step={0.1} suffix="%" onChange={(value) => updateAdult(adult.id, { annualSalaryGrowth: value / 100 })} />
              </div>
            </article>)}</div>
          </section>

          {/* Quicken Step 03: Pensions & Social Security */}
          <section style={{ borderTop: '1px solid #e0e4ec', paddingTop: 16 }}>
            <SectionHeading icon={<Landmark />} title={locale === 'ja' ? '03. 公的年金・社会保障 (Pensions)' : '03. 公的年金与社保 (Pensions)'} />
            <div className="member-stack">{plan.adults.map((adult) => <article className="member-card" key={`pension-${adult.id}`}>
              <div className="member-card-title"><span>{adult.name}</span></div>
              <div className="field-grid two compact">
                <NumberField label={copy.pensionStart} value={adult.pensionStartAge} min={50} max={100} suffix={copy.age} onChange={(pensionStartAge) => updateAdult(adult.id, { pensionStartAge })} />
                <NumberField label={copy.annualPension} value={adult.annualPension} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(annualPension) => updateAdult(adult.id, { annualPension })} />
                <NumberField label={copy.medicalStart} value={adult.medicalStartAge} min={40} max={110} suffix={copy.age} onChange={(medicalStartAge) => updateAdult(adult.id, { medicalStartAge })} />
                <NumberField label={copy.annualMedical} value={adult.annualMedicalExpense} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(annualMedicalExpense) => updateAdult(adult.id, { annualMedicalExpense })} />
              </div>
            </article>)}</div>
          </section>

          {/* Quicken Step 04: Asset Buckets & Return Assumptions */}
          <section style={{ borderTop: '1px solid #e0e4ec', paddingTop: 16 }}>
            <SectionHeading icon={<Sparkles />} title={locale === 'ja' ? '04. 運用資産・NISA/iDeCo (Investments)' : '04. 资产分桶与投资收益 (Investments)'} />
            <div className="field-grid two compact" style={{ marginBottom: 12 }}>
              <NumberField label={copy.investableAssets} value={plan.assumptions.initialAssets} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(initialAssets) => onChange({ ...plan, assumptions: { ...plan.assumptions, initialAssets } })} />
              <NumberField label={copy.inflation} value={plan.assumptions.inflation * 100} min={-5} max={20} step={0.1} suffix="%" onChange={(value) => onChange({ ...plan, assumptions: { ...plan.assumptions, inflation: value / 100 } })} />
              <NumberField label={copy.nominalReturn} value={plan.assumptions.nominalReturn * 100} min={-20} max={30} step={0.1} suffix="%" onChange={(value) => onChange({ ...plan, assumptions: { ...plan.assumptions, nominalReturn: value / 100 } })} />
              <NumberField label={locale === 'ja' ? '退職後想定運用利回り' : '退休后名义年化收益'} value={(plan.assumptions.postRetirementReturn ?? plan.assumptions.nominalReturn) * 100} min={-20} max={30} step={0.1} suffix="%" onChange={(value) => onChange({ ...plan, assumptions: { ...plan.assumptions, postRetirementReturn: value / 100 } })} />
              <NumberField label={copy.borrowingRate} value={plan.assumptions.borrowingRate * 100} min={0} max={30} step={0.1} suffix="%" onChange={(value) => onChange({ ...plan, assumptions: { ...plan.assumptions, borrowingRate: value / 100 } })} />
              <NumberField label={copy.monthlyNisa} value={plan.assumptions.monthlyNisaContribution ?? 0} min={0} step={10_000} scale={10_000} suffix={copy.moneyUnit} onChange={(val) => onChange({ ...plan, assumptions: { ...plan.assumptions, monthlyNisaContribution: val } })} />
              <NumberField label={copy.monthlyIdeco} value={plan.assumptions.monthlyIdecoContribution ?? 0} min={0} step={5_000} scale={10_000} suffix={copy.moneyUnit} onChange={(val) => onChange({ ...plan, assumptions: { ...plan.assumptions, monthlyIdecoContribution: val } })} />
            </div>
            <label className="check-field" style={{ marginBottom: 8 }}>
              <input type="checkbox" checked={plan.assumptions.useJapanTaxEngine ?? true} onChange={(e) => onChange({ ...plan, assumptions: { ...plan.assumptions, useJapanTaxEngine: e.target.checked } })} />
              <strong>{copy.useJapanTax}</strong>
            </label>
          </section>

          {/* Quicken Step 05: Living Expenses */}
          <section style={{ borderTop: '1px solid #e0e4ec', paddingTop: 16 }}>
            <SectionHeading icon={<Home />} title={locale === 'ja' ? '05. 生活開支与余暇 (Living Expenses)' : '05. 日常生活开支 (Living Expenses)'} />
            <div className="field-grid two compact">
              <NumberField label={copy.housingBefore} value={plan.expenses.housingBeforeRetirement} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(value) => onChange({ ...plan, expenses: { ...plan.expenses, housingBeforeRetirement: value } })} />
              <NumberField label={copy.housingAfter} value={plan.expenses.housingAfterRetirement} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(value) => onChange({ ...plan, expenses: { ...plan.expenses, housingAfterRetirement: value } })} />
              <NumberField label={copy.livingBefore} value={plan.expenses.livingBeforeRetirement} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(value) => onChange({ ...plan, expenses: { ...plan.expenses, livingBeforeRetirement: value } })} />
              <NumberField label={copy.livingAfter} value={plan.expenses.livingAfterRetirement} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(value) => onChange({ ...plan, expenses: { ...plan.expenses, livingAfterRetirement: value } })} />
              <NumberField label={copy.travel} value={plan.expenses.annualTravel} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(value) => onChange({ ...plan, expenses: { ...plan.expenses, annualTravel: value } })} />
            </div>
          </section>

          {/* Quicken Step 06: Special Events & Loans */}
          <section style={{ borderTop: '1px solid #e0e4ec', paddingTop: 16 }}>
            <SectionHeading icon={<CalendarDays />} title={locale === 'ja' ? '06. 特別イベント・大型支出 (Special Events & Loans)' : '06. 重大事件与按揭借款 (Special Events & Loans)'} />
            <p className="section-help">{copy.eventHelp}</p>
            <div className="event-stack">
              {plan.events.map((event) => <article className={`event-editor ${event.type}`} key={event.id}>
                <div className="event-editor-head"><div className="event-type-toggle"><button className={event.type === 'expense' ? 'active' : ''} type="button" onClick={() => updateEvent(event.id, { type: 'expense', taxable: false })}>{copy.expense}</button><button className={event.type === 'income' ? 'active' : ''} type="button" onClick={() => updateEvent(event.id, { type: 'income' })}>{copy.income}</button></div><button aria-label={`${copy.delete} ${event.name}`} type="button" onClick={() => onChange({ ...plan, events: plan.events.filter((item) => item.id !== event.id) })}><Trash2 /></button></div>
                <label className="event-name"><span>{copy.eventName}</span><input value={event.name} onChange={(e) => updateEvent(event.id, { name: e.target.value })} /></label>
                <div className="event-fields"><NumberField label={copy.eventStart} value={event.startYear} min={plan.assumptions.startYear} max={plan.assumptions.startYear + 120} onChange={(startYear) => updateEvent(event.id, { startYear })} /><NumberField label={copy.duration} value={event.duration} min={1} max={100} suffix={copy.year} onChange={(duration) => updateEvent(event.id, { duration })} /><NumberField label={copy.annualAmount} value={event.annualAmount} min={0} step={100_000} scale={10_000} suffix={copy.moneyUnit} onChange={(annualAmount) => updateEvent(event.id, { annualAmount })} /></div>
                <div className="event-meta"><label><span>{copy.relatedMember}</span><select value={event.memberId ?? ''} onChange={(e) => updateEvent(event.id, { memberId: e.target.value || null })}><option value="">{copy.householdShared}</option>{[...plan.adults, ...plan.children].map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>{event.type === 'income' ? <label className="check-field"><input type="checkbox" checked={event.taxable} onChange={(e) => updateEvent(event.id, { taxable: e.target.checked })} /><span>{copy.taxable}</span></label> : null}</div>
              </article>)}
            </div>
            <button className="add-event-button" type="button" onClick={addEvent} style={{ marginTop: 10 }}><Plus />{copy.addEvent}</button>
          </section>
        </div>
    </aside>
  )
}
