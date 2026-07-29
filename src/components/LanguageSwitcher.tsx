import { ChevronDown, Languages } from 'lucide-react'
import { useRef } from 'react'
import { locales, type Locale } from '../i18n'

type LanguageSwitcherProps = {
  locale: Locale
  onLocaleChange: (locale: Locale) => void
}

export function LanguageSwitcher({ locale, onLocaleChange }: LanguageSwitcherProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const currentLanguage = locales.find((item) => item.id === locale) ?? locales[0]

  const handleSelect = (code: Locale) => {
    onLocaleChange(code)
    if (detailsRef.current) {
      detailsRef.current.open = false
    }
  }

  return (
    <details ref={detailsRef} className="language-switcher">
      <summary>
        <span>
          <Languages size={15} />
          <span>{currentLanguage.label}</span>
        </span>
        <ChevronDown size={14} />
      </summary>

      <div className="language-menu">
        <div>
          {locales.map((item) => {
            const isActive = locale === item.id
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={isActive ? 'is-active' : ''}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
    </details>
  )
}
