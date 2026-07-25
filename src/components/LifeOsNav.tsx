import { Landmark, Orbit, ReceiptText, Route } from 'lucide-react'
import type { Locale } from '../i18n'

type LifeOsNavProps = {
  locale: Locale
}

const labels = {
  ja: { aria: 'LifeOS ツール', planner: 'Planner', portfolio: 'Portfolio', tax: 'Tax' },
  zh: { aria: 'LifeOS 工具', planner: 'Planner', portfolio: 'Portfolio', tax: 'Tax' },
} as const

export function LifeOsNav({ locale }: LifeOsNavProps) {
  const text = labels[locale]
  const products = [
    { id: 'planner', label: text.planner, href: '/', icon: Route },
    { id: 'portfolio', label: text.portfolio, href: 'https://portfolio.kongmingjapan.com/', icon: Landmark },
    { id: 'tax', label: text.tax, href: `https://tax.kongmingjapan.com/${locale === 'zh' ? 'zh-CN' : 'ja'}/`, icon: ReceiptText },
  ] as const

  return (
    <nav className="lifeos-nav" aria-label={text.aria}>
      <a className="lifeos-wordmark" href="https://kongmingjapan.com/">
        <Orbit aria-hidden="true" />
        <span>LifeOS</span>
      </a>
      <div className="lifeos-products">
        {products.map((product) => {
          const Icon = product.icon
          const isActive = product.id === 'planner'
          return (
            <a
              className={isActive ? 'is-active' : undefined}
              href={product.href}
              aria-current={isActive ? 'page' : undefined}
              key={product.id}
            >
              <Icon aria-hidden="true" />
              <span>{product.label}</span>
            </a>
          )
        })}
        <a href="https://radar.kongmingjapan.com/" target="_blank" rel="noreferrer" style={{ opacity: 0.75, fontSize: '0.8rem', marginLeft: '0.4rem', textDecoration: 'none', color: 'inherit' }}>
          Radar
        </a>
        <a href="https://lab.kongmingjapan.com/" target="_blank" rel="noreferrer" style={{ opacity: 0.75, fontSize: '0.8rem', marginLeft: '0.4rem', textDecoration: 'none', color: 'inherit' }}>
          Lab
        </a>
        <a href="https://kids.kongmingjapan.com/" target="_blank" rel="noreferrer" style={{ opacity: 0.75, fontSize: '0.8rem', marginLeft: '0.4rem', textDecoration: 'none', color: 'inherit' }}>
          Kids
        </a>
      </div>
    </nav>
  )
}
