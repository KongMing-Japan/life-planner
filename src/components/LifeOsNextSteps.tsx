import { ArrowRight, Landmark, ReceiptText } from 'lucide-react'
import { formatMoney, type Locale } from '../i18n'
import type { PlannerV2 } from '../types'
import { Badge } from '@/components/ui/badge'

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
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs hover:shadow-xs transition-all mt-6" aria-labelledby="lifeos-next-title">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-100">
        <div>
          <Badge variant="secondary" className="mb-2 uppercase tracking-wider text-[10px] font-bold">LifeOS Ecosystem</Badge>
          <h2 id="lifeos-next-title" className="text-lg font-bold text-slate-900 tracking-tight m-0 mb-1">{text.title}</h2>
          <p className="text-xs text-slate-500 m-0">{text.description}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col items-start md:items-end shrink-0">
          <span className="text-[10px] text-slate-400 font-semibold">{text.assets}</span>
          <strong className="text-base font-black text-slate-900">{formatMoney(plan.assumptions.initialAssets, locale)}</strong>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <a
          href="https://portfolio.kongmingjapan.com/"
          className="group flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-sky-50/60 hover:border-sky-300 transition-all cursor-pointer"
        >
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-lg bg-white border border-slate-200 text-sky-600 shadow-2xs group-hover:scale-105 transition-transform">
              <Landmark className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <strong className="block text-xs font-bold text-slate-800 group-hover:text-sky-700">{text.portfolioTitle}</strong>
              <small className="block text-[11px] text-slate-500 leading-tight mt-0.5">{text.portfolioBody}</small>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" aria-hidden="true" />
        </a>
        <a
          href={`https://tax.kongmingjapan.com/${taxLocale}/?${taxParams}`}
          className="group flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-sky-50/60 hover:border-sky-300 transition-all cursor-pointer"
        >
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-lg bg-white border border-slate-200 text-sky-600 shadow-2xs group-hover:scale-105 transition-transform">
              <ReceiptText className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <strong className="block text-xs font-bold text-slate-800 group-hover:text-sky-700">{text.taxTitle}</strong>
              <small className="block text-[11px] text-slate-500 leading-tight mt-0.5">{text.taxBody}</small>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
