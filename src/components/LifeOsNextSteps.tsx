import { ArrowRight, Landmark, ReceiptText } from 'lucide-react'
import { formatMoney, type Locale } from '../i18n'
import type { PlannerV2 } from '../types'

type LifeOsNextStepsProps = {
  locale: Locale
  plan: PlannerV2
}

const copy = {
  ja: {
    title: '人生設計を、運用と税引後の数字につなぐ',
    description: '長期計画の前提を、LifeOS Portfolioの資産配分とLifeOS Taxの手取り試算で具体化します。',
    assets: '現在の運用資産',
    portfolioTitle: 'LifeOS Portfolioで資産配分を確認',
    portfolioBody: '複数口座の保有銘柄をまとめ、人生目標を支える運用構成になっているか確認します。',
    taxTitle: 'LifeOS Taxで手取りを精緻化',
    taxBody: '年収・年齢・扶養人数を引き継ぎ、税金と社会保険料を詳しく試算します。',
  },
  zh: {
    title: '把人生规划连接到投资与税后数字',
    description: '用 LifeOS Portfolio 的资产配置和 LifeOS Tax 的到手收入试算，让长期规划更具体。',
    assets: '当前可投资资产',
    portfolioTitle: '在 LifeOS Portfolio 检查资产配置',
    portfolioBody: '汇总多个账户的持仓，确认投资结构是否能够支撑人生目标。',
    taxTitle: '在 LifeOS Tax 细化到手收入',
    taxBody: '带入年收入、年龄和子女数量，进一步估算税金与社会保险费。',
  },
} as const

export function LifeOsNextSteps({ locale, plan }: LifeOsNextStepsProps) {
  const text = copy[locale]
  const primary = plan.adults[0]
  const taxParams = new URLSearchParams({
    source: 'planner',
    income: String(primary?.annualSalary ?? 0),
    age: String(primary?.currentAge ?? 35),
    dependents: String(plan.children.length),
  })
  const taxLocale = locale === 'zh' ? 'zh-CN' : 'ja'

  return (
    <section className="lifeos-next-steps" aria-labelledby="lifeos-next-title">
      <div className="lifeos-next-heading">
        <div>
          <span>LifeOS</span>
          <h2 id="lifeos-next-title">{text.title}</h2>
          <p>{text.description}</p>
        </div>
        <div className="lifeos-current-value">
          <span>{text.assets}</span>
          <strong>{formatMoney(plan.assumptions.initialAssets, locale)}</strong>
        </div>
      </div>
      <div className="lifeos-next-grid">
        <a href="https://portfolio.kongmingjapan.com/">
          <Landmark aria-hidden="true" />
          <span><strong>{text.portfolioTitle}</strong><small>{text.portfolioBody}</small></span>
          <ArrowRight aria-hidden="true" />
        </a>
        <a href={`https://tax.kongmingjapan.com/${taxLocale}/?${taxParams}`}>
          <ReceiptText aria-hidden="true" />
          <span><strong>{text.taxTitle}</strong><small>{text.taxBody}</small></span>
          <ArrowRight aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
