import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarClock, Landmark, Lightbulb, TrendingDown, Trophy, WalletCards } from 'lucide-react'
import type { I18nCopy, Locale } from '../i18n'
import { formatMoney, formatPercent, statusLabel } from '../i18n'
import type { PlannerV2, PlanOutput } from '../types'
import { FinancialStoryChart } from './FinancialStoryChart'

type Props = {
  output: PlanOutput
  locale: Locale
  copy: I18nCopy
  plan?: PlannerV2
  onPlanChange?: (plan: PlannerV2) => void
}
type TableTabKey = 'ledger' | 'events' | 'milestones'
type WorkspaceNavKey = 'overview' | 'chart' | 'ledger'

export function Dashboard({ output, locale, copy, plan, onPlanChange }: Props) {
  const [activeTableTab, setActiveTableTab] = useState<TableTabKey>('ledger')

  const primary = plan?.adults.find((adult) => adult.role === 'primary') ?? plan?.adults[0]

  const statusClass = output.summary.status === '资金不足' ? 'danger' : output.summary.status === '接近 Die with Zero' ? 'success' : 'primary'
  const requiredReturn = output.summary.requiredNominalReturn
  const spendingAdjustment = output.summary.retirementSpendingAdjustment
  const spendingNote = spendingAdjustment === null ? copy.notAchievable : spendingAdjustment > 1 ? copy.canSpendMore : spendingAdjustment < -1 ? copy.mustSpendLess : copy.onTarget

  const peakRow = useMemo(() => {
    if (!output.projection.length) return null
    return output.projection.reduce((max, r) => (r.endAssets > max.endAssets ? r : max), output.projection[0])
  }, [output.projection])

  const eventRows = useMemo(() => {
    return output.projection.filter((row) => row.eventNames.length > 0)
  }, [output.projection])

  const milestoneRows = useMemo(() => {
    if (!output.projection.length) return []
    const first = output.projection[0]
    const last = output.projection[output.projection.length - 1]
    const peak = peakRow
    const retirement = output.projection.find((r) => r.salaryIncome === 0)
    const negative = output.projection.find((r) => r.endAssets < 0)

    const list = [first, retirement, peak, negative, last].filter(Boolean) as typeof output.projection
    const map = new Map<number, typeof output.projection[0]>()
    list.forEach((r) => map.set(r.year, r))
    return Array.from(map.values()).sort((a, b) => a.year - b.year)
  }, [output.projection, peakRow])

  return <section className="dashboard-stack gf-dashboard-stack">
    {/* Dashboard Executive Header Card */}
    <div className="m3-card dashboard-head gf-dashboard-head">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="m3-chip primary" style={{ background: '#0284c7', color: '#ffffff', fontWeight: 700 }}>QUICKEN LIFETIME PLANNER</span>
          <h1 style={{ marginTop: 8, marginBottom: 4, fontSize: 28, fontWeight: 700 }}>{copy.dashboard}</h1>
          <p style={{ margin: 0, color: '#5e5e5e', fontSize: 13 }}>
            {copy.dashboardSubtitle} · {copy.realReturn} {formatPercent(output.summary.realReturn)}
          </p>
        </div>
        <span className={`m3-chip ${statusClass}`} style={{ padding: '6px 16px', fontSize: 13, fontWeight: 700 }}>
          {statusLabel(output.summary.status, copy)}
        </span>
      </div>
    </div>

    {/* Material 3 High-Level Financial Stat Cards Grid */}
    <div className="m3-stat-grid gf-kpi-grid">
      <article className="m3-stat-card kpi-card gf-kpi-card">
        <span><WalletCards />{output.summary.terminalAge}{copy.balanceAt}</span>
        <strong>{formatMoney(output.summary.terminalAssets, locale)}</strong>
        <small>{output.summary.terminalYear}{copy.year} {copy.yearEnd}</small>
      </article>

      {output.summary.monteCarlo && (
        <article className="m3-stat-card kpi-card gf-kpi-card">
          <span><Trophy />{copy.monteCarloSuccess}</span>
          <strong className={output.summary.monteCarlo.successRate >= 80 ? 'positive' : 'negative'}>
            {output.summary.monteCarlo.successRate}%
          </strong>
          <small>{copy.monteCarloTitle}</small>
        </article>
      )}

      {peakRow && (
        <article className="m3-stat-card kpi-card gf-kpi-card">
          <span><Trophy />{copy.peakAssets}</span>
          <strong>{formatMoney(peakRow.endAssets, locale)}</strong>
          <small>{peakRow.year}{copy.year} ({peakRow.primaryAge}{copy.age})</small>
        </article>
      )}

      <article className="m3-stat-card kpi-card gf-kpi-card">
        <span><Landmark />{copy.requiredReturn}</span>
        <strong>{requiredReturn === null ? '—' : formatPercent(requiredReturn)}</strong>
        <small>{requiredReturn === null ? copy.notAchievable : `${copy.currentAssumption} ${formatPercent(output.summary.assumedNominalReturn)}`}</small>
      </article>

      <article className="m3-stat-card kpi-card gf-kpi-card">
        <span><CalendarClock />{copy.firstShortfall}</span>
        <strong>{output.summary.firstNegativeYear ? `${output.summary.firstNegativeAge}${copy.age}` : copy.notOccurred}</strong>
        <small>{output.summary.firstNegativeYear ? `${output.summary.firstNegativeYear}${copy.year}` : copy.staysPositive}</small>
      </article>

      <article className="m3-stat-card kpi-card gf-kpi-card">
        <span><TrendingDown />{copy.retirementAdjustment}</span>
        <strong>{spendingAdjustment === null ? '—' : formatMoney(Math.abs(spendingAdjustment), locale)}</strong>
        <small>{spendingNote}</small>
      </article>
    </div>

    {/* Quicken Real-Time "What-If" Interactive Decision Bar */}
    {plan && onPlanChange && primary && (
      <div className="m3-card quicken-what-if-card">
        <div className="m3-hero-header">
          <div>
            <span className="m3-chip primary">WHAT-IF INTERACTIVE ENGINE</span>
            <h3 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700 }}>{copy.whatIfTitle}</h3>
          </div>
        </div>
        <div className="quicken-slider-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 12 }}>
          <div className="quicken-slider-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#334155' }}>
              <span>{copy.whatIfRetireAge}</span>
              <strong style={{ color: '#0284c7' }}>{primary.retireAge} {copy.age}</strong>
            </label>
            <input
              type="range"
              min={primary.currentAge}
              max={80}
              value={primary.retireAge}
              onChange={(e) => {
                const newAge = Number(e.target.value)
                onPlanChange({
                  ...plan,
                  adults: plan.adults.map((adult) => adult.id === primary.id ? { ...adult, retireAge: newAge } : adult),
                })
              }}
              style={{ width: '100%', marginTop: 6 }}
            />
          </div>

          <div className="quicken-slider-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#334155' }}>
              <span>{copy.whatIfNisa}</span>
              <strong style={{ color: '#16a34a' }}>¥{((plan.assumptions.monthlyNisaContribution ?? 0) / 10000).toFixed(1)}{copy.moneyUnit}/月</strong>
            </label>
            <input
              type="range"
              min={0}
              max={300_000}
              step={10_000}
              value={plan.assumptions.monthlyNisaContribution ?? 0}
              onChange={(e) => {
                onPlanChange({
                  ...plan,
                  assumptions: { ...plan.assumptions, monthlyNisaContribution: Number(e.target.value) },
                })
              }}
              style={{ width: '100%', marginTop: 6 }}
            />
          </div>

          <div className="quicken-slider-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#334155' }}>
              <span>{copy.whatIfRetireSpend}</span>
              <strong style={{ color: '#dc2626' }}>¥{((plan.expenses.livingAfterRetirement) / 10000).toFixed(0)}{copy.moneyUnit}/年</strong>
            </label>
            <input
              type="range"
              min={1_000_000}
              max={15_000_000}
              step={200_000}
              value={plan.expenses.livingAfterRetirement}
              onChange={(e) => {
                onPlanChange({
                  ...plan,
                  expenses: { ...plan.expenses, livingAfterRetirement: Number(e.target.value) },
                })
              }}
              style={{ width: '100%', marginTop: 6 }}
            />
          </div>
        </div>
      </div>
    )}

    {/* Hero Interactive Chart Card */}
    <FinancialStoryChart projection={output.projection} locale={locale} copy={copy} />

    {output.summary.firstNegativeYear ? (
      <div className="risk-callout gf-risk-callout m3-card" style={{ borderLeft: '4px solid var(--m3-on-danger-container)', background: 'var(--m3-danger-container)' }}>
        <AlertTriangle style={{ color: 'var(--m3-on-danger-container)' }} />
        <div>
          <strong style={{ color: 'var(--m3-on-danger-container)' }}>{output.summary.firstNegativeAge}{copy.riskTitle}</strong>
          <p style={{ margin: 0, color: 'var(--m3-on-danger-container)' }}>{copy.riskHelp}</p>
        </div>
      </div>
    ) : null}

    {/* Material 3 FP Financial Advisor Card */}
    <article className="m3-card fp-advice-card gf-advice-card">
      <div className="fp-advice-head gf-advice-head" style={{ marginBottom: 14 }}>
        <span className="fp-advice-icon" style={{ background: 'var(--m3-primary-container)', color: 'var(--m3-primary)' }}>
          <Lightbulb aria-hidden="true" />
        </span>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
          {locale === 'ja' ? 'FPからのライフプラン・アドバイス' : 'FP 理财规划专家建议'}
        </h3>
      </div>
      <ul className="fp-advice-list gf-advice-list">
        <li>
          <strong>{locale === 'ja' ? '生活防衛資金の確保' : '储备生活防卫资金'}：</strong>
          {locale === 'ja' 
            ? '生活費の6ヶ月〜1年分を目安に、流動性の高い現金預金（普通預金等）として手元に確保し、急な出費や収入減少に備えましょう。'
            : '建议保留 6 个月至 1 年的生活费作为高流动性的活期存款或货币基金，应对失业、医疗等突发状况。'}
        </li>
        <li>
          <strong>{locale === 'ja' ? '長期分散投資の活用' : '合理配置长期资产'}：</strong>
          {locale === 'ja'
            ? '想定運用利回り（4%程度）を安定して目指すため、税制優遇制度（NISA）を活用した世界分散インデックス投資などを組み込み、長期の複利効果を活かしましょう。'
            : '为稳健达成想定收益（约4%），建议利用税收优惠政策，配置低费率的宽基指数基金，通过长期定投摊薄成本并获得复利增值。'}
        </li>
        <li>
          <strong>{locale === 'ja' ? '固定費・保険のスリム化' : '精简优化家庭保障'}：</strong>
          {locale === 'ja'
            ? '民間の生命保険や医療保険は必要最低限にとどめ、日本の高額療養費制度などの公的保障を前提に保障の重複を徹底的に見直すことで、投資元本を増やすことが可能です。'
            : '利用好国家基本医保与大病互助，民营商业险建议仅覆盖“无法承受的极端风险”（如家庭顶梁柱的定期寿险等），避免高额保费吞噬积累的本金。'}
        </li>
        <li>
          <strong>{locale === 'ja' ? 'ライフイベント期のキャッシュフロー管理' : '动态调整与退休规划'}：</strong>
          {locale === 'ja'
            ? '教育費や住宅購入など大きなイベントが重なる時期は、一時的な赤字が発生しやすいため、ライフプラン上での貯蓄取り崩し計画を事前に立てておきましょう。'
            : '购房及子女教育期易出现阶段性现金流赤字，属于正常生命周期规律。需提早储备首付及教育准备金，并在资产变动时动态修正规划。'}
        </li>
      </ul>
    </article>

    {/* Bottom Collapsible Itemized Audit Ledger */}
    <details className="annual-details gf-details-wrapper m3-table-card bottom-audit-ledger" id="annual-details">
      <summary className="gf-details-summary m3-table-header" style={{ cursor: 'pointer', padding: '14px 20px' }}>
        <div className="gf-table-tabs-header" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
            {copy.bottomLedgerTitle ?? copy.annualDetails}
          </h2>
          <span className="m3-chip" style={{ fontSize: 12 }}>
            {locale === 'ja' ? 'クリックして逐年明細を展開 (Audit)' : '点击展开逐年财务明细 (Audit)'}
          </span>
        </div>
      </summary>

      <div style={{ marginTop: 12 }}>
        <div className="gf-table-tab-group m3-tab-group" role="tablist" style={{ marginBottom: 12 }}>
          <button
            type="button"
            className={`m3-tab-button ${activeTableTab === 'ledger' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setActiveTableTab('ledger') }}
          >
            {copy.tabLedger} ({output.projection.length})
          </button>
          <button
            type="button"
            className={`m3-tab-button ${activeTableTab === 'events' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setActiveTableTab('events') }}
          >
            {copy.tabEvents} ({eventRows.length})
          </button>
          <button
            type="button"
            className={`m3-tab-button ${activeTableTab === 'milestones' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setActiveTableTab('milestones') }}
          >
            {locale === 'ja' ? 'キーマイルストーン' : '关键里程碑'} ({milestoneRows.length})
          </button>
        </div>

        {/* Tab 1: Lifetime Financial Ledger Table */}
        {activeTableTab === 'ledger' && (
          <div className="table-scroll gf-table-scroll">
            <table className="gf-table m3-table">
              <thead>
                <tr>
                  <th>{copy.yearAge}</th>
                  <th>{copy.startAssets}</th>
                  <th>{copy.afterTaxIncome}</th>
                  <th>{copy.totalExpense}</th>
                  <th>{copy.investmentGain}</th>
                  <th>{copy.endAssets}</th>
                  <th>{copy.eventColumn}</th>
                </tr>
              </thead>
              <tbody>
                {output.projection.map((row) => (
                  <tr key={row.year}>
                    <td><strong>{row.year}</strong><small>{row.primaryAge}{copy.age}</small></td>
                    <td>{formatMoney(row.startAssets, locale)}</td>
                    <td>{formatMoney(row.totalIncome, locale)}</td>
                    <td>{formatMoney(row.totalExpense, locale)}</td>
                    <td className={row.investmentGain < 0 ? 'negative' : 'positive'}>{formatMoney(row.investmentGain, locale)}</td>
                    <td className={row.endAssets < 0 ? 'negative strong' : 'strong'}>{formatMoney(row.endAssets, locale)}</td>
                    <td>{row.eventNames.join('、') || copy.noEvent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Life Events Impact Table */}
        {activeTableTab === 'events' && (
          <div className="table-scroll gf-table-scroll">
            <table className="gf-table m3-table">
              <thead>
                <tr>
                  <th>{copy.yearAge}</th>
                  <th>{copy.eventColumn}</th>
                  <th>{copy.afterTaxIncome}</th>
                  <th>{copy.totalExpense}</th>
                  <th>{copy.netCashflow}</th>
                  <th>{copy.endAssets}</th>
                </tr>
              </thead>
              <tbody>
                {eventRows.length > 0 ? (
                  eventRows.map((row) => (
                    <tr key={row.year}>
                      <td><strong>{row.year}</strong><small>{row.primaryAge}{copy.age}</small></td>
                      <td><span className="m3-chip primary">{row.eventNames.join(' · ')}</span></td>
                      <td>{formatMoney(row.totalIncome, locale)}</td>
                      <td className="negative">{formatMoney(row.totalExpense, locale)}</td>
                      <td className={row.netCashFlow < 0 ? 'negative' : 'positive'}>{formatMoney(row.netCashFlow, locale)}</td>
                      <td className={row.endAssets < 0 ? 'negative strong' : 'strong'}>{formatMoney(row.endAssets, locale)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#747775', padding: '2rem' }}>
                      {copy.noEvent}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Milestones Summary Table */}
        {activeTableTab === 'milestones' && (
          <div className="table-scroll gf-table-scroll">
            <table className="gf-table m3-table">
              <thead>
                <tr>
                  <th>{copy.yearAge}</th>
                  <th>{copy.startAssets}</th>
                  <th>{copy.afterTaxIncome}</th>
                  <th>{copy.totalExpense}</th>
                  <th>{copy.investmentGain}</th>
                  <th>{copy.endAssets}</th>
                </tr>
              </thead>
              <tbody>
                {milestoneRows.map((row) => (
                  <tr key={row.year}>
                    <td><strong>{row.year}</strong><small>{row.primaryAge}{copy.age}</small></td>
                    <td>{formatMoney(row.startAssets, locale)}</td>
                    <td>{formatMoney(row.totalIncome, locale)}</td>
                    <td>{formatMoney(row.totalExpense, locale)}</td>
                    <td className={row.investmentGain < 0 ? 'negative' : 'positive'}>{formatMoney(row.investmentGain, locale)}</td>
                    <td className={row.endAssets < 0 ? 'negative strong' : 'strong'}>{formatMoney(row.endAssets, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </details>
  </section>
}


