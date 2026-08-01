import { ChevronDown, Languages } from 'lucide-react'
import { useRef } from 'react'
import { locales, type Locale } from '../i18n'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
        <div className="flex flex-col gap-1 p-1">
          {locales.map((item) => {
            const isActive = locale === item.id
            return (
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                size="sm"
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={cn('justify-start text-xs w-full', isActive && 'is-active font-semibold')}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Button>
            )
          })}
        </div>
      </div>
    </details>
  )
}
