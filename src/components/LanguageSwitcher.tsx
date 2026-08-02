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
    <details ref={detailsRef} className="language-switcher group relative">
      <summary className="flex items-center gap-1.5 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-1.5 bg-white text-xs font-medium text-slate-700 shadow-2xs cursor-pointer transition-colors select-none list-none [&::-webkit-details-marker]:hidden">
        <Languages className="h-3.5 w-3.5 text-slate-500" />
        <span>{currentLanguage.label}</span>
        <ChevronDown className="h-3 w-3 text-slate-400 ml-0.5 transition-transform duration-150 group-open:rotate-180" />
      </summary>

      <div className="language-menu absolute right-0 top-full mt-1.5 min-w-[7.5rem] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg z-50 animate-in fade-in-50 zoom-in-95">
        <div className="flex flex-col gap-0.5">
          {locales.map((item) => {
            const isActive = locale === item.id
            return (
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                size="sm"
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={cn(
                  'justify-start text-xs w-full px-2.5 py-1.5 h-auto rounded-lg',
                  isActive && 'is-active font-semibold text-sky-600 bg-sky-50'
                )}
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
