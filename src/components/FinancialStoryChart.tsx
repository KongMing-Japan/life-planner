import { useMemo, useState, type CSSProperties } from 'react'
import {
  Area, Bar, CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { I18nCopy, Locale } from '../i18n'
import { formatMoney } from '../i18n'
import type { ProjectionRow } from '../types'

type ChartRow = ProjectionRow & {
  assetPositive: number
  assetNegative: number
  expenseBar: number
  cumulativeGains: number
  principalBase: number
}

type TooltipPayload = { payload?: ChartRow }
type WaterfallStyle = CSSProperties & Record<'--wf-left' | '--wf-width' | '--wf-zero', string>
type RangeKey = 'MAX' | 'WORK' | 'RETIRE' | '30s' | '40s' | '50s' | '60s'
type ChartTabKey = 'assets' | 'cashflow' | 'gains'

type Props = {
  projection: ProjectionRow[]
  locale: Locale
  copy: I18nCopy
}

const chartMargin = { top: 14, right: 18, left: 0, bottom: 4 }

function StoryTooltip({ active, payload, locale, copy }: { active?: boolean; payload?: TooltipPayload[]; locale: Locale; copy: I18nCopy }) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  return <div className="chart-tooltip gf-tooltip">
    <div className="gf-tooltip-header">
      <strong>{row.year}{copy.year} · {row.primaryAge}{copy.age}</strong>
      {row.eventNames.length ? <span className="gf-tooltip-event-tag">{row.eventNames.join(' · ')}</span> : null}
    </div>
    <div className="gf-tooltip-body">
      <div className="gf-tooltip-row">
        <span>{copy.endAssets}</span>
        <b className={row.endAssets < 0 ? 'negative' : 'positive'}>{formatMoney(row.endAssets, locale)}</b>
      </div>
      <div className="gf-tooltip-row">
        <span>{copy.afterTaxIncome}</span>
        <b>{formatMoney(row.totalIncome, locale)}</b>
      </div>
      <div className="gf-tooltip-row">
        <span>{copy.totalExpense}</span>
        <b className="negative">{formatMoney(row.totalExpense, locale)}</b>
      </div>
      <div className="gf-tooltip-row">
        <span>{copy.netCashflow}</span>
        <b className={row.netCashFlow < 0 ? 'negative' : 'positive'}>{formatMoney(row.netCashFlow, locale)}</b>
      </div>
      <div className="gf-tooltip-row">
        <span>{copy.investmentGain}</span>
        <b className={row.investmentGain < 0 ? 'negative' : 'positive'}>{formatMoney(row.investmentGain, locale)}</b>
      </div>
    </div>
  </div>
}

export function FinancialStoryChart({ projection, locale, copy }: Props) {
  const [range, setRange] = useState<RangeKey>('MAX')
  const [activeTab, setActiveTab] = useState<ChartTabKey>('assets')

  const fullChartData = useMemo<ChartRow[]>(() => {
    let cumGains = 0
    return projection.map((row) => {
      cumGains += row.investmentGain
      return {
        ...row,
        assetPositive: Math.max(0, row.endAssets),
        assetNegative: Math.min(0, row.endAssets),
        expenseBar: -row.totalExpense,
        cumulativeGains: cumGains,
        principalBase: Math.max(0, row.endAssets - cumGains),
      }
    })
  }, [projection])

  const filteredData = useMemo<ChartRow[]>(() => {
    if (!fullChartData.length) return []
    if (range === 'MAX') return fullChartData

    const retirementIndex = fullChartData.findIndex((r) => r.salaryIncome === 0)
    const retirementAge = retirementIndex >= 0 ? fullChartData[retirementIndex].primaryAge : 65

    switch (range) {
      case 'WORK':
        return fullChartData.filter((r) => r.primaryAge <= retirementAge)
      case 'RETIRE':
        return fullChartData.filter((r) => r.primaryAge >= retirementAge)
      case '30s':
        return fullChartData.filter((r) => r.primaryAge >= 30 && r.primaryAge < 40)
      case '40s':
        return fullChartData.filter((r) => r.primaryAge >= 40 && r.primaryAge < 50)
      case '50s':
        return fullChartData.filter((r) => r.primaryAge >= 50 && r.primaryAge < 60)
      case '60s':
        return fullChartData.filter((r) => r.primaryAge >= 60)
      default:
        return fullChartData
    }
  }, [fullChartData, range])

  const chartData = filteredData.length > 0 ? filteredData : fullChartData

  const [selectedIndex, setSelectedIndex] = useState(() => {
    const retirementIndex = fullChartData.findIndex((row) => row.salaryIncome === 0)
    return retirementIndex >= 0 ? retirementIndex : 0
  })

  const safeIndex = Math.min(selectedIndex, Math.max(0, fullChartData.length - 1))
  const selected = fullChartData[safeIndex]

  const initialAssets = fullChartData[0]?.startAssets ?? 0
  const terminalAssets = fullChartData[fullChartData.length - 1]?.endAssets ?? 0
  const netGrowth = terminalAssets - initialAssets
  const growthPercent = initialAssets > 0 ? (netGrowth / initialAssets) * 100 : 0
  const isPositiveGrowth = netGrowth >= 0

  const eventRows = useMemo(() => chartData.filter((row, index) =>
    row.eventNames.some((name) => !chartData[index - 1]?.eventNames.includes(name)),
  ), [chartData])

  const labels = locale === 'ja'
    ? { order: 'GOOGLE FINANCE STYLE', selectedAge: '選択年齢', reconciliation: '年間資産の内訳', noEvent: '大型イベントなし', rounding: '万円単位は四捨五入' }
    : { order: 'GOOGLE FINANCE STYLE', selectedAge: '选择年龄', reconciliation: '年度资产核算', noEvent: '无大型事件', rounding: '万日元单位四舍五入' }

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

  return <article className="chart-card chart-card-primary financial-story-card gf-story-card">
    {/* Google Finance Ticker & Header Banner */}
    <div className="gf-ticker-header">
      <div className="gf-ticker-title">
        <span className="gf-symbol-badge">LIFEOS</span>
        <h2>{copy.assetsTitle}</h2>
      </div>
      <div className="gf-ticker-price-row">
        <span className="gf-main-price">{formatMoney(selected.endAssets, locale)}</span>
        <span className={`gf-change-badge ${isPositiveGrowth ? 'up' : 'down'}`}>
          {isPositiveGrowth ? '▲ +' : '▼ '}
          {formatMoney(Math.abs(netGrowth), locale)} ({isPositiveGrowth ? '+' : ''}{growthPercent.toFixed(1)}%)
        </span>
        <span className="gf-price-subtitle">{`${selected.primaryAge}${copy.age}`} {copy.balanceAt}</span>
      </div>
    </div>

    {/* Toolbar: Range Pills & View Mode Tabs */}
    <div className="gf-toolbar">
      <div className="gf-range-selector" role="group" aria-label="Time Horizon">
        <button type="button" className={`gf-pill ${range === 'MAX' ? 'active' : ''}`} onClick={() => setRange('MAX')}>{copy.rangeMax}</button>
        <button type="button" className={`gf-pill ${range === 'WORK' ? 'active' : ''}`} onClick={() => setRange('WORK')}>{copy.rangeWork}</button>
        <button type="button" className={`gf-pill ${range === 'RETIRE' ? 'active' : ''}`} onClick={() => setRange('RETIRE')}>{copy.rangeRetire}</button>
        <button type="button" className={`gf-pill ${range === '30s' ? 'active' : ''}`} onClick={() => setRange('30s')}>{copy.range30s}</button>
        <button type="button" className={`gf-pill ${range === '40s' ? 'active' : ''}`} onClick={() => setRange('40s')}>{copy.range40s}</button>
        <button type="button" className={`gf-pill ${range === '50s' ? 'active' : ''}`} onClick={() => setRange('50s')}>{copy.range50s}</button>
        <button type="button" className={`gf-pill ${range === '60s' ? 'active' : ''}`} onClick={() => setRange('60s')}>{copy.range60s}</button>
      </div>

      <div className="gf-chart-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={activeTab === 'assets'} className={`gf-tab ${activeTab === 'assets' ? 'active' : ''}`} onClick={() => setActiveTab('assets')}>{copy.tabAssets}</button>
        <button type="button" role="tab" aria-selected={activeTab === 'cashflow'} className={`gf-tab ${activeTab === 'cashflow' ? 'active' : ''}`} onClick={() => setActiveTab('cashflow')}>{copy.tabCashflow}</button>
        <button type="button" role="tab" aria-selected={activeTab === 'gains'} className={`gf-tab ${activeTab === 'gains' ? 'active' : ''}`} onClick={() => setActiveTab('gains')}>{copy.tabGains}</button>
      </div>
    </div>

    {/* Interactive Age Range Scrubber */}
    <label className="story-age-control gf-age-control">
      <span>{labels.selectedAge}<strong>{`${selected.primaryAge}${copy.age}`}</strong> <small>({selected.year}{copy.year})</small></span>
      <input
        aria-label={labels.selectedAge}
        type="range"
        min={0}
        max={Math.max(0, fullChartData.length - 1)}
        step={1}
        value={safeIndex}
        onInput={(event) => setSelectedIndex(Number(event.currentTarget.value))}
      />
    </label>

    {/* Quick Stat Pill Highlights */}
    <div className="story-stat-grid gf-stat-grid" aria-live="polite">
      <div><span>{copy.endAssets}</span><strong className={selected.endAssets < 0 ? 'negative' : 'positive'}>{formatMoney(selected.endAssets, locale)}</strong></div>
      <div><span>{copy.netCashflow}</span><strong className={selected.netCashFlow < 0 ? 'negative' : 'positive'}>{formatMoney(selected.netCashFlow, locale)}</strong></div>
      <div><span>{copy.investmentGain}</span><strong className={selected.investmentGain < 0 ? 'negative' : 'positive'}>{formatMoney(selected.investmentGain, locale)}</strong></div>
      <div><span>{copy.afterTaxIncome}</span><strong className="positive">{formatMoney(selected.totalIncome, locale)}</strong></div>
    </div>

    {/* Main Visualization Container */}
    <div className="story-chart gf-chart-container" aria-label={`${copy.assetsTitle} · ${copy.cashflowTitle}`}>
      {activeTab === 'assets' && (
        <div className="story-assets-chart gf-main-chart-view">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={chartMargin}>
              <defs>
                <linearGradient id="gfAssetBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a73e8" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#1a73e8" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gfAssetRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d93025" stopOpacity={0.05} />
                  <stop offset="100%" stopColor="#d93025" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e8eaed" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="primaryAge" tickLine={false} axisLine={false} minTickGap={24} tickFormatter={ageTick} tick={{ fill: '#5f6368', fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={moneyTick} tick={{ fill: '#5f6368', fontSize: 11 }} />
              <Tooltip content={<StoryTooltip locale={locale} copy={copy} />} />
              <ReferenceLine y={0} stroke="#dadce0" strokeWidth={1.5} />
              <ReferenceLine x={selected.primaryAge} stroke="#1a73e8" strokeDasharray="4 4" strokeWidth={1.5} />
              <Area type="monotone" dataKey="assetPositive" stroke="#1a73e8" strokeWidth={2.5} fill="url(#gfAssetBlue)" isAnimationActive={false} />
              <Area type="monotone" dataKey="assetNegative" stroke="#d93025" strokeWidth={2.5} fill="url(#gfAssetRed)" isAnimationActive={false} />
              {eventRows.map((row) => (
                <ReferenceDot key={row.year} x={row.primaryAge} y={row.endAssets} r={4} fill="#188038" stroke="#fff" strokeWidth={2} />
              ))}
              <ReferenceDot x={selected.primaryAge} y={selected.endAssets} r={6} fill="#fff" stroke={selected.endAssets < 0 ? '#d93025' : '#1a73e8'} strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'cashflow' && (
        <div className="story-cashflow-chart gf-main-chart-view">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ ...chartMargin, bottom: 8 }} barCategoryGap="12%" stackOffset="sign">
              <CartesianGrid stroke="#e8eaed" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="primaryAge" tickLine={false} axisLine={false} minTickGap={24} tickFormatter={ageTick} tick={{ fill: '#5f6368', fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={moneyTick} tick={{ fill: '#5f6368', fontSize: 11 }} />
              <Tooltip content={<StoryTooltip locale={locale} copy={copy} />} />
              <ReferenceLine y={0} stroke="#dadce0" strokeWidth={1.5} />
              <ReferenceLine x={selected.primaryAge} stroke="#1a73e8" strokeDasharray="4 4" strokeWidth={1.5} />
              <Bar dataKey="totalIncome" stackId="annual" fill="#1a73e8" maxBarSize={16} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="expenseBar" stackId="annual" fill="#d93025" maxBarSize={16} radius={[0, 0, 3, 3]} isAnimationActive={false} />
              <Line type="monotone" dataKey="netCashFlow" stroke="#f9ab00" strokeWidth={2.2} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'gains' && (
        <div className="story-assets-chart gf-main-chart-view">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={chartMargin}>
              <defs>
                <linearGradient id="gfGainsGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#188038" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#188038" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e8eaed" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="primaryAge" tickLine={false} axisLine={false} minTickGap={24} tickFormatter={ageTick} tick={{ fill: '#5f6368', fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={moneyTick} tick={{ fill: '#5f6368', fontSize: 11 }} />
              <Tooltip content={<StoryTooltip locale={locale} copy={copy} />} />
              <ReferenceLine y={0} stroke="#dadce0" strokeWidth={1.5} />
              <ReferenceLine x={selected.primaryAge} stroke="#1a73e8" strokeDasharray="4 4" strokeWidth={1.5} />
              <Area type="monotone" dataKey="endAssets" stroke="#188038" strokeWidth={2.5} fill="url(#gfGainsGreen)" isAnimationActive={false} />
              <Line type="monotone" dataKey="principalBase" stroke="#5f6368" strokeWidth={1.8} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>

    {/* Waterfall Reconciliation Footer */}
    <div className="story-waterfall-head gf-waterfall-head">
      <strong>{labels.reconciliation}</strong>
      <span>{selected.year}{copy.year} · {selected.primaryAge}{copy.age} · {labels.rounding}</span>
    </div>
    <div className="story-waterfall gf-waterfall" aria-live="polite">
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

