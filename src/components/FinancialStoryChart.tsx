import { useMemo, useState, type CSSProperties } from 'react'
import {
  Area, Bar, CartesianGrid, ComposedChart, ReferenceDot, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { I18nCopy, Locale } from '../i18n'
import { formatMoney } from '../i18n'
import type { ProjectionRow } from '../types'

type ChartRow = ProjectionRow & { assetPositive: number; assetNegative: number; expenseBar: number }
type TooltipPayload = { payload?: ChartRow }
type WaterfallStyle = CSSProperties & Record<'--wf-left' | '--wf-width' | '--wf-zero', string>

type Props = {
  projection: ProjectionRow[]
  locale: Locale
  copy: I18nCopy
}

const chartMargin = { top: 10, right: 18, left: 0, bottom: 0 }

function StoryTooltip({ active, payload, locale, copy }: { active?: boolean; payload?: TooltipPayload[]; locale: Locale; copy: I18nCopy }) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  return <div className="chart-tooltip">
    <strong>{row.year}{copy.year} · {row.primaryAge}{copy.age}</strong>
    <span>{copy.endAssets} <b>{formatMoney(row.endAssets, locale)}</b></span>
    <span>{copy.afterTaxIncome} <b>{formatMoney(row.totalIncome, locale)}</b></span>
    <span>{copy.totalExpense} <b>{formatMoney(row.totalExpense, locale)}</b></span>
    <span>{copy.netCashflow} <b>{formatMoney(row.netCashFlow, locale)}</b></span>
    {row.eventNames.length ? <small>{row.eventNames.join(' · ')}</small> : null}
  </div>
}

export function FinancialStoryChart({ projection, locale, copy }: Props) {
  const chartData = useMemo<ChartRow[]>(() => projection.map((row) => ({
    ...row,
    assetPositive: Math.max(0, row.endAssets),
    assetNegative: Math.min(0, row.endAssets),
    expenseBar: -row.totalExpense,
  })), [projection])
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const retirementIndex = chartData.findIndex((row) => row.salaryIncome === 0)
    return retirementIndex >= 0 ? retirementIndex : 0
  })
  const safeIndex = Math.min(selectedIndex, Math.max(0, chartData.length - 1))
  const selected = chartData[safeIndex]
  const eventRows = useMemo(() => chartData.filter((row, index) =>
    row.eventNames.some((name) => !chartData[index - 1]?.eventNames.includes(name)),
  ), [chartData])
  const labels = locale === 'ja'
    ? { order: '01 · FINANCIAL STORY', selectedAge: '選択年齢', reconciliation: '年間資産の内訳', noEvent: '大型イベントなし', rounding: '万円単位は四捨五入' }
    : { order: '01 · FINANCIAL STORY', selectedAge: '选择年龄', reconciliation: '年度资产核算', noEvent: '无大型事件', rounding: '万日元单位四舍五入' }
  const moneyTick = (value: number) => formatMoney(Number(value), locale)
  const ageTick = (age: number) => `${age}${copy.age}`

  if (!selected) return null

  const afterGain = selected.startAssets + selected.investmentGain
  const afterIncome = afterGain + selected.totalIncome
  const waterfall = [
    { label: copy.startAssets, value: selected.startAssets, from: 0, to: selected.startAssets, tone: 'asset' },
    { label: copy.investmentGain, value: selected.investmentGain, from: selected.startAssets, to: afterGain, tone: 'gain' },
    { label: copy.afterTaxIncome, value: selected.totalIncome, from: afterGain, to: afterIncome, tone: 'income' },
    { label: copy.totalExpense, value: -selected.totalExpense, from: afterIncome, to: selected.endAssets, tone: 'expense' },
    { label: copy.endAssets, value: selected.endAssets, from: 0, to: selected.endAssets, tone: selected.endAssets < 0 ? 'expense' : 'asset' },
  ]
  const endpoints = waterfall.flatMap((step) => [step.from, step.to, 0])
  const minimum = Math.min(...endpoints)
  const maximum = Math.max(...endpoints)
  const padding = Math.max(100_000, (maximum - minimum) * 0.08)
  const domainMinimum = minimum - padding
  const domainMaximum = maximum + padding
  const domainRange = Math.max(1, domainMaximum - domainMinimum)
  const position = (value: number) => ((value - domainMinimum) / domainRange) * 100
  const zeroPosition = position(0)

  return <article className="chart-card chart-card-primary financial-story-card">
    <div className="chart-heading story-heading">
      <div><span className="chart-order">{labels.order}</span><h2>{copy.assetsTitle}</h2><p>{copy.assetsHelp}</p></div>
      <div className="chart-legend story-legend">
        <span className="blue-line">{copy.endAssets}</span>
        <span className="blue-bar">{copy.afterTaxIncome}</span>
        <span className="red-bar">{copy.totalExpense}</span>
        <span className="teal-dot">{copy.eventColumn}</span>
      </div>
    </div>

    <label className="story-age-control">
      <span>{labels.selectedAge}<strong>{selected.primaryAge}{copy.age}</strong></span>
      <input
        aria-label={labels.selectedAge}
        type="range"
        min={0}
        max={Math.max(0, chartData.length - 1)}
        step={1}
        value={safeIndex}
        onInput={(event) => setSelectedIndex(Number(event.currentTarget.value))}
      />
    </label>

    <div className="story-stat-grid" aria-live="polite">
      <div><span>{copy.endAssets}</span><strong className={selected.endAssets < 0 ? 'negative' : ''}>{formatMoney(selected.endAssets, locale)}</strong></div>
      <div><span>{copy.netCashflow}</span><strong className={selected.netCashFlow < 0 ? 'negative' : ''}>{formatMoney(selected.netCashFlow, locale)}</strong></div>
      <div><span>{copy.investmentGain}</span><strong className={selected.investmentGain < 0 ? 'negative' : ''}>{formatMoney(selected.investmentGain, locale)}</strong></div>
    </div>

    <div className="story-chart" aria-label={`${copy.assetsTitle} · ${copy.cashflowTitle}`}>
      <div className="story-assets-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={chartMargin}>
            <defs>
              <linearGradient id="storyAssetBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0a6bf2" stopOpacity={0.3} /><stop offset="100%" stopColor="#0a6bf2" stopOpacity={0.035} /></linearGradient>
              <linearGradient id="storyAssetRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e53935" stopOpacity={0.06} /><stop offset="100%" stopColor="#e53935" stopOpacity={0.24} /></linearGradient>
            </defs>
            <CartesianGrid stroke="#e7edf5" vertical={false} />
            <XAxis dataKey="primaryAge" hide />
            <YAxis tickLine={false} axisLine={false} width={58} tickFormatter={moneyTick} tick={{ fill: '#718097', fontSize: 10 }} />
            <Tooltip content={<StoryTooltip locale={locale} copy={copy} />} />
            <ReferenceLine y={0} stroke="#9aa8ba" strokeWidth={1.2} />
            <ReferenceLine x={selected.primaryAge} stroke="#183b63" strokeDasharray="4 4" strokeWidth={1.2} />
            <Area type="linear" dataKey="assetPositive" stroke="#0a6bf2" strokeWidth={2.6} fill="url(#storyAssetBlue)" isAnimationActive={false} />
            <Area type="linear" dataKey="assetNegative" stroke="#e53935" strokeWidth={2.6} fill="url(#storyAssetRed)" isAnimationActive={false} />
            {eventRows.map((row) => <ReferenceDot key={row.year} x={row.primaryAge} y={row.endAssets} r={4} fill="#16b8bd" stroke="#fff" strokeWidth={2} />)}
            <ReferenceDot x={selected.primaryAge} y={selected.endAssets} r={5} fill="#fff" stroke={selected.endAssets < 0 ? '#e53935' : '#0a6bf2'} strokeWidth={3} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="story-cashflow-label"><strong>{copy.cashflowTitle}</strong><span>{selected.eventNames.join(' · ') || labels.noEvent}</span></div>
      <div className="story-cashflow-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ ...chartMargin, bottom: 2 }} barCategoryGap="10%" stackOffset="sign">
            <CartesianGrid stroke="#e7edf5" vertical={false} />
            <XAxis dataKey="primaryAge" tickLine={false} axisLine={false} minTickGap={24} tickFormatter={ageTick} tick={{ fill: '#718097', fontSize: 10 }} />
            <YAxis tickLine={false} axisLine={false} width={58} tickFormatter={moneyTick} tick={{ fill: '#718097', fontSize: 10 }} />
            <Tooltip content={<StoryTooltip locale={locale} copy={copy} />} />
            <ReferenceLine y={0} stroke="#7b899b" strokeWidth={1.2} />
            <ReferenceLine x={selected.primaryAge} stroke="#183b63" strokeDasharray="4 4" strokeWidth={1.2} />
            <Bar dataKey="totalIncome" stackId="annual" fill="#0a6bf2" maxBarSize={14} radius={[2, 2, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="expenseBar" stackId="annual" fill="#e53935" maxBarSize={14} radius={[0, 0, 2, 2]} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="story-waterfall-head"><strong>{labels.reconciliation}</strong><span>{selected.year}{copy.year} · {selected.primaryAge}{copy.age} · {labels.rounding}</span></div>
    <div className="story-waterfall" aria-live="polite">
      {waterfall.map((step) => {
        const left = position(Math.min(step.from, step.to))
        const right = position(Math.max(step.from, step.to))
        const style: WaterfallStyle = {
          '--wf-left': `${left}%`,
          '--wf-width': `${Math.max(0.4, right - left)}%`,
          '--wf-zero': `${zeroPosition}%`,
        }
        return <div className="story-waterfall-row" key={step.label}>
          <span>{step.label}</span>
          <div className="story-waterfall-track" style={style}><i className={`story-waterfall-bar ${step.tone}`} /></div>
          <strong className={step.value < 0 ? 'negative' : ''}>{formatMoney(step.value, locale)}</strong>
        </div>
      })}
    </div>
  </article>
}
