import { Landmark, Orbit, ReceiptText, Route } from 'lucide-react'
import type { Locale } from '../i18n'

type LifeOsNavProps = {
  locale: Locale
  portfolioUrl?: string
  taxUrl?: string
}

export function LifeOsNav({
  locale,
  portfolioUrl = 'https://portfolio.kongmingjapan.com/',
  taxUrl,
}: LifeOsNavProps) {
  const defaultTaxUrl = `https://tax.kongmingjapan.com/${locale === 'zh' ? 'zh-CN' : 'ja'}/`
  const resolvedTaxUrl = taxUrl || defaultTaxUrl

  const products = [
    { id: 'planner', label: 'Planner', href: '/', icon: Route, isActive: true },
    { id: 'portfolio', label: 'Portfolio', href: portfolioUrl, icon: Landmark, isActive: false },
    { id: 'tax', label: 'Tax', href: resolvedTaxUrl, icon: ReceiptText, isActive: false },
  ] as const

  return (
    <div className="lifeos-eyebrow-nav flex items-center gap-2 mb-1.5">
      <a
        className="lifeos-eyebrow-brand flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-bold text-sm no-underline transition-colors"
        href="https://kongmingjapan.com/"
        target="_blank"
        rel="noreferrer"
      >
        <Orbit className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
        <span>LifeOS</span>
      </a>
      <span className="lifeos-eyebrow-divider text-slate-300 font-light select-none">/</span>
      <nav className="lifeos-eyebrow-menu flex items-center gap-1" aria-label="LifeOS Suite">
        {products.map((product) => {
          const Icon = product.icon
          return (
            <a
              key={product.id}
              className={`lifeos-menu-item flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-all ${
                product.isActive
                  ? 'active bg-sky-50 text-sky-700 font-semibold shadow-xs dark:bg-sky-950 dark:text-sky-300'
                  : 'text-slate-600 hover:text-sky-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
              href={product.href}
              target={product.id === 'planner' ? undefined : '_blank'}
              rel={product.id === 'planner' ? undefined : 'noreferrer'}
              aria-current={product.isActive ? 'page' : undefined}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{product.label}</span>
            </a>
          )
        })}
      </nav>
    </div>
  )
}
