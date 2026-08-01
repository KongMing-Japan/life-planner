import { CalendarDays, Home, Landmark, Plus, Settings2, Sparkles, Trash2, UserPlus, Users, Wallet } from 'lucide-react'
import { useState } from 'react'
import type { I18nCopy, Locale } from '../i18n'
import type { Adult, Child, LifeEvent, PlannerV2 } from '../types'
import { NumberField, SectionHeading } from './Fields'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

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
      {/* Notion-style Preset Persona Selection Card */}
      <div className="m3-card preset-personas-card p-3.5 mb-3 bg-slate-50/50 border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-slate-700 tracking-wide flex items-center gap-1.5">
            <span>⚡</span>
            <span>{locale === 'ja' ? '人生プロファイル模版' : '经典人生画像模版'}</span>
          </span>
          <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">PERSONAS</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((tpl) => {
            const name = locale === 'zh' ? tpl.nameZh : tpl.nameJa
            const tagLine = locale === 'zh' ? tpl.tagLineZh : tpl.tagLineJa
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onChange(tpl.build())}
                className="group flex items-center gap-2.5 p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-sky-50/70 hover:border-sky-300 transition-all text-left shadow-2xs cursor-pointer"
              >
                <img
                  src={tpl.image}
                  alt={name}
                  className="w-9 h-9 rounded-full border border-slate-200/70 object-cover shadow-2xs group-hover:scale-105 transition-transform flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-sky-700 truncate">
                    {name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                    {tagLine}
                  </div>
                </div>
              </button>
            )
          })}
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
          <section className="pt-4 border-t border-slate-100">
            <SectionHeading icon={<CalendarDays />} title={locale === 'ja' ? '06. 特別イベント・大型支出 (Special Events & Loans)' : '06. 重大事件与按揭借款 (Special Events & Loans)'} />
            <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">{copy.eventHelp}</p>
            <div className="flex flex-col gap-3">
              {plan.events.map((event) => (
                <article
                  key={event.id}
                  className={cn(
                    'group relative p-3.5 rounded-xl border transition-all flex flex-col gap-3 bg-white shadow-2xs',
                    event.type === 'expense'
                      ? 'border-slate-200/90 hover:border-rose-300'
                      : 'border-slate-200/90 hover:border-emerald-300'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Modern Pill Segmented Control for Expense / Income */}
                    <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/70">
                      <button
                        type="button"
                        onClick={() => updateEvent(event.id, { type: 'expense', taxable: false })}
                        className={cn(
                          'px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer',
                          event.type === 'expense'
                            ? 'bg-rose-500 text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-700'
                        )}
                      >
                        {copy.expense}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateEvent(event.id, { type: 'income' })}
                        className={cn(
                          'px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer',
                          event.type === 'income'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-700'
                        )}
                      >
                        {copy.income}
                      </button>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      aria-label={`${copy.delete} ${event.name}`}
                      onClick={() => onChange({ ...plan, events: plan.events.filter((item) => item.id !== event.id) })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Event Name Input */}
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-700">{copy.eventName}</span>
                    <Input
                      value={event.name}
                      onChange={(e) => updateEvent(event.id, { name: e.target.value })}
                      className="h-9 text-xs font-semibold bg-slate-50/50 border-slate-200 focus:bg-white focus:border-sky-500 rounded-lg"
                    />
                  </label>

                  {/* 3-Column Inputs: Start Year, Duration, Annual Amount */}
                  <div className="grid grid-cols-3 gap-2">
                    <NumberField
                      label={copy.eventStart}
                      value={event.startYear}
                      min={plan.assumptions.startYear}
                      max={plan.assumptions.startYear + 120}
                      onChange={(startYear) => updateEvent(event.id, { startYear })}
                    />
                    <NumberField
                      label={copy.duration}
                      value={event.duration}
                      min={1}
                      max={100}
                      suffix={copy.year}
                      onChange={(duration) => updateEvent(event.id, { duration })}
                    />
                    <NumberField
                      label={copy.annualAmount}
                      value={event.annualAmount}
                      min={0}
                      step={100_000}
                      scale={10_000}
                      suffix={copy.moneyUnit}
                      onChange={(annualAmount) => updateEvent(event.id, { annualAmount })}
                    />
                  </div>

                  {/* Related Member & Taxable Checkbox */}
                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <span>{copy.relatedMember}</span>
                      <select
                        value={event.memberId ?? ''}
                        onChange={(e) => updateEvent(event.id, { memberId: e.target.value || null })}
                        className="h-8 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2 text-slate-700 focus:bg-white focus:border-sky-500 outline-none"
                      >
                        <option value="">{copy.householdShared}</option>
                        {[...plan.adults, ...plan.children].map((member) => (
                          <option value={member.id} key={member.id}>{member.name}</option>
                        ))}
                      </select>
                    </label>
                    {event.type === 'income' ? (
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={event.taxable}
                          onChange={(e) => updateEvent(event.id, { taxable: e.target.checked })}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span>{copy.taxable}</span>
                      </label>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addEvent}
              className="w-full mt-3 h-9 text-xs font-semibold border-dashed border-sky-300 bg-sky-50/50 text-sky-700 hover:bg-sky-100 hover:border-sky-400 gap-1.5 rounded-xl cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{copy.addEvent}</span>
            </Button>
          </section>
        </div>
    </aside>
  )
}
