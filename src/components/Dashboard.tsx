import { AlertTriangle, CalendarClock, Landmark, TrendingDown, WalletCards } from 'lucide-react'
import { useMemo } from 'react'
import {
  Area, AreaChart, Bar, CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { I18nCopy, Locale } from '../i18n'
import { formatMoney, formatPercent, statusLabel } from '../i18n'
import type { PlanOutput, ProjectionRow } from '../types'

type ChartRow = ProjectionRow & { assetPositive: number; assetNegative: number; expenseBar: number }
type TooltipPayload = { payload?: ChartRow }
type Props = { output: PlanOutput; locale: Locale; copy: I18nCopy }

function WealthTooltip({ active, payload, locale, copy }: { active?: boolean; payload?: TooltipPayload[]; locale: Locale; copy: I18nCopy }) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  return <div className="chart-tooltip"><strong>{row.year}{copy.year} · {row.primaryAge}{copy.age}</strong><span>{copy.endAssets} <b>{formatMoney(row.endAssets, locale)}</b></span><span>{copy.afterTaxIncome} <b>{formatMoney(row.totalIncome, locale)}</b></span><span>{copy.totalExpense} <b>{formatMoney(row.totalExpense, locale)}</b></span>{row.eventNames.length ? <small>{row.eventNames.join(' · ')}</small> : null}</div>
}

function CashflowTooltip({ active, payload, locale, copy }: { active?: boolean; payload?: TooltipPayload[]; locale: Locale; copy: I18nCopy }) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  return <div className="chart-tooltip"><strong>{row.year}{copy.year} · {row.primaryAge}{copy.age}</strong><span>{copy.afterTaxIncome} <b>{formatMoney(row.totalIncome, locale)}</b></span><span>{copy.totalExpense} <b>{formatMoney(row.totalExpense, locale)}</b></span><span>{copy.netCashflow} <b>{formatMoney(row.netCashFlow, locale)}</b></span></div>
}

export function Dashboard({ output, locale, copy }: Props) {
  const chartData = useMemo<ChartRow[]>(() => output.projection.map((row) => ({
    ...row, assetPositive: Math.max(0, row.endAssets), assetNegative: Math.min(0, row.endAssets), expenseBar: -row.totalExpense,
  })), [output.projection])
  const eventRows = useMemo(() => chartData.filter((row, index) =>
    row.eventNames.some((name) => !chartData[index - 1]?.eventNames.includes(name)),
  ), [chartData])
  const statusClass = output.summary.status === '资金不足' ? 'danger' : output.summary.status === '接近 Die with Zero' ? 'success' : 'neutral'
  const requiredReturn = output.summary.requiredNominalReturn
  const returnClass = requiredReturn === null || output.summary.assumedNominalReturn + 0.00001 < requiredReturn ? 'danger' : 'success'
  const spendingAdjustment = output.summary.retirementSpendingAdjustment
  const spendingClass = spendingAdjustment === null || spendingAdjustment < -1 ? 'danger' : spendingAdjustment > 1 ? 'success' : 'neutral'
  const spendingNote = spendingAdjustment === null ? copy.notAchievable : spendingAdjustment > 1 ? copy.canSpendMore : spendingAdjustment < -1 ? copy.mustSpendLess : copy.onTarget
  const moneyTick = (value: number) => formatMoney(Number(value), locale)
  const ageTick = (age: number) => `${age}${copy.age}`

  return <section className="dashboard-stack">
    <div className="dashboard-head"><div><span className="eyebrow">DIE WITH ZERO SIMULATION</span><h1>{copy.dashboard}</h1><p>{copy.dashboardSubtitle} {formatPercent(output.summary.realReturn)}</p></div><span className={`status-pill ${statusClass}`}>{statusLabel(output.summary.status, copy)}</span></div>

    <div className="kpi-grid">
      <article className={`kpi-card ${statusClass}`}><span><WalletCards />{output.summary.terminalAge}{copy.balanceAt}</span><strong>{formatMoney(output.summary.terminalAssets, locale)}</strong><small>{output.summary.terminalYear}{copy.year} {copy.yearEnd}</small></article>
      <article className={`kpi-card ${returnClass}`}><span><Landmark />{copy.requiredReturn}</span><strong>{requiredReturn === null ? '—' : formatPercent(requiredReturn)}</strong><small>{requiredReturn === null ? copy.notAchievable : `${copy.currentAssumption} ${formatPercent(output.summary.assumedNominalReturn)}`}</small></article>
      <article className="kpi-card"><span><CalendarClock />{copy.firstShortfall}</span><strong>{output.summary.firstNegativeYear ? `${output.summary.firstNegativeAge}${copy.age}` : copy.notOccurred}</strong><small>{output.summary.firstNegativeYear ? `${output.summary.firstNegativeYear}${copy.year}` : copy.staysPositive}</small></article>
      <article className={`kpi-card ${spendingClass}`}><span><TrendingDown />{copy.retirementAdjustment}</span><strong>{spendingAdjustment === null ? '—' : formatMoney(Math.abs(spendingAdjustment), locale)}</strong><small>{spendingNote}</small></article>
    </div>

    <article className="chart-card cashflow-card chart-card-primary">
      <div className="chart-heading"><div><span className="chart-order">01 · CASH FLOW</span><h2>{copy.cashflowTitle}</h2><p>{copy.cashflowHelp}</p></div><div className="chart-legend"><span className="blue">{copy.afterTaxIncome}</span><span className="red">{copy.totalExpense}</span><span className="navy-line">{copy.netCashflow}</span></div></div>
      <div className="cashflow-chart" aria-label={copy.cashflowTitle}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 14, right: 18, left: 12, bottom: 2 }} barCategoryGap="8%" stackOffset="sign">
            <CartesianGrid stroke="#e7edf5" vertical={false} />
            <XAxis dataKey="primaryAge" tickLine={false} axisLine={false} minTickGap={24} tickFormatter={ageTick} tick={{ fill: '#718097', fontSize: 10 }} />
            <YAxis tickLine={false} axisLine={false} width={86} tickFormatter={moneyTick} tick={{ fill: '#718097', fontSize: 10 }} />
            <Tooltip content={<CashflowTooltip locale={locale} copy={copy} />} />
            <ReferenceLine y={0} stroke="#7b899b" strokeWidth={1.3} />
            <Bar dataKey="totalIncome" stackId="annual" fill="#0a6bf2" maxBarSize={15} radius={[2, 2, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="expenseBar" stackId="annual" fill="#e53935" maxBarSize={15} radius={[0, 0, 2, 2]} isAnimationActive={false} />
            <Line type="monotone" dataKey="netCashFlow" stroke="#183b63" strokeWidth={2.2} dot={{ r: 1.8, fill: '#183b63', strokeWidth: 0 }} activeDot={{ r: 4 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </article>

    <article className="chart-card wealth-card">
      <div className="chart-heading"><div><span className="chart-order">02 · ASSETS</span><h2>{copy.assetsTitle}</h2><p>{copy.assetsHelp}</p></div><div className="chart-legend"><span className="blue">{copy.positiveAssets}</span><span className="red">{copy.shortfall}</span></div></div>
      <div className="wealth-chart" aria-label={copy.assetsTitle}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 18, left: 12, bottom: 4 }}>
            <defs><linearGradient id="assetBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0a6bf2" stopOpacity={0.34} /><stop offset="100%" stopColor="#0a6bf2" stopOpacity={0.04} /></linearGradient><linearGradient id="assetRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e53935" stopOpacity={0.08} /><stop offset="100%" stopColor="#e53935" stopOpacity={0.32} /></linearGradient></defs>
            <CartesianGrid stroke="#e7edf5" vertical={false} /><XAxis dataKey="primaryAge" tickLine={false} axisLine={false} minTickGap={24} tickFormatter={ageTick} tick={{ fill: '#718097', fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} width={86} tickFormatter={moneyTick} tick={{ fill: '#718097', fontSize: 10 }} />
            <Tooltip content={<WealthTooltip locale={locale} copy={copy} />} /><ReferenceLine y={0} stroke="#9aa8ba" strokeWidth={1.2} /><Area type="monotone" dataKey="assetPositive" stroke="#0a6bf2" strokeWidth={2.5} fill="url(#assetBlue)" isAnimationActive={false} /><Area type="monotone" dataKey="assetNegative" stroke="#e53935" strokeWidth={2.5} fill="url(#assetRed)" isAnimationActive={false} />
            {eventRows.map((row) => <ReferenceDot key={row.year} x={row.primaryAge} y={row.endAssets} r={4} fill="#16b8bd" stroke="#fff" strokeWidth={2} />)}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>

    {output.summary.firstNegativeYear ? <div className="risk-callout"><AlertTriangle /><div><strong>{output.summary.firstNegativeAge}{copy.riskTitle}</strong><p>{copy.riskHelp}</p></div></div> : null}

    <details className="annual-details" id="annual-details"><summary>{copy.annualDetails}<span>{output.projection.length} {copy.year}</span></summary><div className="table-scroll"><table><thead><tr><th>{copy.yearAge}</th><th>{copy.startAssets}</th><th>{copy.afterTaxIncome}</th><th>{copy.totalExpense}</th><th>{copy.investmentGain}</th><th>{copy.endAssets}</th><th>{copy.eventColumn}</th></tr></thead><tbody>{output.projection.map((row) => <tr key={row.year}><td><strong>{row.year}</strong><small>{row.primaryAge}{copy.age}</small></td><td>{formatMoney(row.startAssets, locale)}</td><td>{formatMoney(row.totalIncome, locale)}</td><td>{formatMoney(row.totalExpense, locale)}</td><td className={row.investmentGain < 0 ? 'negative' : ''}>{formatMoney(row.investmentGain, locale)}</td><td className={row.endAssets < 0 ? 'negative strong' : 'strong'}>{formatMoney(row.endAssets, locale)}</td><td>{row.eventNames.join('、') || copy.noEvent}</td></tr>)}</tbody></table></div></details>
  </section>
}
