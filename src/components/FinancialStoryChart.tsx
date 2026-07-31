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

function StoryTooltip({ active, payload, locale, copy, reconciliationLabel }: { active?: boolean; payload?: TooltipPayload[]; locale: Locale; copy: I18nCopy; reconciliationLabel: string }) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  return <div className="chart-tooltip gf-tooltip m3-tooltip">
    <div className="gf-tooltip-header">
      <strong>{row.year}{copy.year} · {row.primaryAge}{copy.age}</strong>
      <span className="m3-chip info">{reconciliationLabel}</span>
      {row.eventNames.length ? <span className="m3-chip success">{row.eventNames.join(' · ')}</span> : null}
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
    ? { order: 'MATERIAL 3 WORKSPACE', selectedAge: '選択年齢', reconciliation: '年間資産の内訳', noEvent: '大型イベントなし', rounding: '万円単位は四捨五入' }
    : { order: 'MATERIAL 3 WORKSPACE', selectedAge: '选择年龄', reconciliation: '年度资产核算', noEvent: '无大型事件', rounding: '万日元单位四舍五入' }

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

  return <article className="m3-card financial-story-card gf-story-card">
    {/* Material 3 Hero Metric Header */}
    <div className="m3-hero-header">
      <div className="m3-hero-title-group">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="m3-chip primary">LIFEOS PLANNER</span>
          <span className="m3-chip info" style={{ fontSize: 11 }}>{labels.reconciliation}</span>
        </div>
        <h2>{copy.assetsTitle}</h2>
      </div>
      <div className="m3-hero-price-group">
        <div className="m3-hero-price">{formatMoney(selected.endAssets, locale)}</div>
        <span className={`m3-chip ${isPositiveGrowth ? 'success' : 'danger'}`}>
          {isPositiveGrowth ? '▲ +' : '▼ '}
          {formatMoney(Math.abs(netGrowth), locale)} ({isPositiveGrowth ? '+' : ''}{growthPercent.toFixed(1)}%)
        </span>
        <small style={{ display: 'block', marginTop: 4, color: '#747775' }}>
          {selected.primaryAge}{copy.age} {copy.balanceAt}
        </small>
      </div>
    </div>

    {/* Material 3 Toolbar (Range Switcher & Chart View Tabs) */}
    <div className="m3-toolbar">
      <div className="m3-range-group" role="group" aria-label="Time Horizon">
        <button type="button" className={`m3-range-pill ${range === 'MAX' ? 'active' : ''}`} onClick={() => setRange('MAX')}>{copy.rangeMax}</button>
        <button type="button" className={`m3-range-pill ${range === 'WORK' ? 'active' : ''}`} onClick={() => setRange('WORK')}>{copy.rangeWork}</button>
        <button type="button" className={`m3-range-pill ${range === 'RETIRE' ? 'active' : ''}`} onClick={() => setRange('RETIRE')}>{copy.rangeRetire}</button>
        <button type="button" className={`m3-range-pill ${range === '30s' ? 'active' : ''}`} onClick={() => setRange('30s')}>{copy.range30s}</button>
        <button type="button" className={`m3-range-pill ${range === '40s' ? 'active' : ''}`} onClick={() => setRange('40s')}>{copy.range40s}</button>
        <button type="button" className={`m3-range-pill ${range === '50s' ? 'active' : ''}`} onClick={() => setRange('50s')}>{copy.range50s}</button>
        <button type="button" className={`m3-range-pill ${range === '60s' ? 'active' : ''}`} onClick={() => setRange('60s')}>{copy.range60s}</button>
      </div>

      <div className="m3-tab-group" role="tablist">
        <button type="button" role="tab" aria-selected={activeTab === 'assets'} className={`m3-tab-button ${activeTab === 'assets' ? 'active' : ''}`} onClick={() => setActiveTab('assets')}>{copy.tabAssets}</button>
        <button type="button" role="tab" aria-selected={activeTab === 'cashflow'} className={`m3-tab-button ${activeTab === 'cashflow' ? 'active' : ''}`} onClick={() => setActiveTab('cashflow')}>{copy.tabCashflow}</button>
        <button type="button" role="tab" aria-selected={activeTab === 'gains'} className={`m3-tab-button ${activeTab === 'gains' ? 'active' : ''}`} onClick={() => setActiveTab('gains')}>{copy.tabGains}</button>
      </div>
    </div>

    {/* Age Range Slider Input */}
    <label className="story-age-control gf-age-control" style={{ marginBottom: 16 }}>
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

    {/* Material 3 Quick Stat Highlight Grid */}
    <div className="m3-stat-grid" aria-live="polite">
      <div className="m3-stat-card">
        <span>{copy.endAssets}</span>
        <strong className={selected.endAssets < 0 ? 'negative' : 'positive'}>{formatMoney(selected.endAssets, locale)}</strong>
      </div>
      <div className="m3-stat-card">
        <span>{copy.netCashflow}</span>
        <strong className={selected.netCashFlow < 0 ? 'negative' : 'positive'}>{formatMoney(selected.netCashFlow, locale)}</strong>
      </div>
      <div className="m3-stat-card">
        <span>{copy.investmentGain}</span>
        <strong className={selected.investmentGain < 0 ? 'negative' : 'positive'}>{formatMoney(selected.investmentGain, locale)}</strong>
      </div>
      <div className="m3-stat-card">
        <span>{copy.afterTaxIncome}</span>
        <strong className="positive">{formatMoney(selected.totalIncome, locale)}</strong>
      </div>
    </div>

    {/* Recharts Render View */}
    <div className="story-chart gf-chart-container" style={{ marginBottom: 0 }} aria-label={`${copy.assetsTitle} · ${copy.cashflowTitle}`}>
      {activeTab === 'assets' && (
        <div className="story-assets-chart gf-main-chart-view">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={chartMargin}>
              <defs>
                <linearGradient id="m3AssetBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0b57d0" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0b57d0" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="m3AssetRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b3261e" stopOpacity={0.05} />
                  <stop offset="100%" stopColor="#b3261e" stopOpacity={0.35} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e0e4ec" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="primaryAge" tickLine={false} axisLine={false} minTickGap={24} tickFormatter={ageTick} tick={{ fill: '#444746', fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={moneyTick} tick={{ fill: '#444746', fontSize: 11 }} />
              <Tooltip content={<StoryTooltip locale={locale} copy={copy} reconciliationLabel={labels.reconciliation} />} />
              <ReferenceLine y={0} stroke="#c4c7c5" strokeWidth={1.5} />
              <ReferenceLine x={selected.primaryAge} stroke="#0b57d0" strokeDasharray="4 4" strokeWidth={1.5} />
              <Area type="monotone" dataKey="assetPositive" stroke="#0b57d0" strokeWidth={2.8} fill="url(#m3AssetBlue)" isAnimationActive={false} />
              <Area type="monotone" dataKey="assetNegative" stroke="#b3261e" strokeWidth={2.8} fill="url(#m3AssetRed)" isAnimationActive={false} />
              {eventRows.map((row) => (
                <ReferenceDot key={row.year} x={row.primaryAge} y={row.endAssets} r={4} fill="#146c2e" stroke="#fff" strokeWidth={2} />
              ))}
              <ReferenceDot x={selected.primaryAge} y={selected.endAssets} r={6} fill="#fff" stroke={selected.endAssets < 0 ? '#b3261e' : '#0b57d0'} strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'cashflow' && (
        <div className="story-cashflow-chart gf-main-chart-view">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ ...chartMargin, bottom: 8 }} barCategoryGap="12%" stackOffset="sign">
              <CartesianGrid stroke="#e0e4ec" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="primaryAge" tickLine={false} axisLine={false} minTickGap={24} tickFormatter={ageTick} tick={{ fill: '#444746', fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={moneyTick} tick={{ fill: '#444746', fontSize: 11 }} />
              <Tooltip content={<StoryTooltip locale={locale} copy={copy} reconciliationLabel={labels.reconciliation} />} />
              <ReferenceLine y={0} stroke="#c4c7c5" strokeWidth={1.5} />
              <ReferenceLine x={selected.primaryAge} stroke="#0b57d0" strokeDasharray="4 4" strokeWidth={1.5} />
              <Bar dataKey="totalIncome" stackId="annual" fill="#0b57d0" maxBarSize={16} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="expenseBar" stackId="annual" fill="#b3261e" maxBarSize={16} radius={[0, 0, 4, 4]} isAnimationActive={false} />
              <Line type="monotone" dataKey="netCashFlow" stroke="#e37100" strokeWidth={2.4} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'gains' && (
        <div className="story-assets-chart gf-main-chart-view">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={chartMargin}>
              <defs>
                <linearGradient id="m3GainsGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#146c2e" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#146c2e" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e0e4ec" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="primaryAge" tickLine={false} axisLine={false} minTickGap={24} tickFormatter={ageTick} tick={{ fill: '#444746', fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={moneyTick} tick={{ fill: '#444746', fontSize: 11 }} />
              <Tooltip content={<StoryTooltip locale={locale} copy={copy} reconciliationLabel={labels.reconciliation} />} />
              <ReferenceLine y={0} stroke="#c4c7c5" strokeWidth={1.5} />
              <ReferenceLine x={selected.primaryAge} stroke="#0b57d0" strokeDasharray="4 4" strokeWidth={1.5} />
              <Area type="monotone" dataKey="endAssets" stroke="#146c2e" strokeWidth={2.8} fill="url(#m3GainsGreen)" isAnimationActive={false} />
              <Line type="monotone" dataKey="principalBase" stroke="#747775" strokeWidth={1.8} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  </article>
}


