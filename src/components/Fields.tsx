import { type InputHTMLAttributes, type ReactNode, useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type NumberFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
  hint?: string
  scale?: number
}

const getSuffixPaddingClass = (suffix?: string) => {
  if (!suffix) return 'pr-3'
  const len = suffix.length
  if (len >= 3) return 'pr-14'
  if (len === 2) return 'pr-10'
  return 'pr-7'
}

export function NumberField({ label, value, onChange, suffix, hint, scale = 1, min, max, step, className, ...props }: NumberFieldProps) {
  const scaledValue = Number.isFinite(value) ? value / scale : 0
  const [inputValue, setInputValue] = useState<string>(scaledValue.toString())

  useEffect(() => {
    const nextValStr = scaledValue.toString()
    if (Number(inputValue) !== scaledValue || (inputValue === '' && scaledValue !== 0)) {
      setInputValue(nextValStr)
    }
  }, [value, scale])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = event.target.value
    setInputValue(valStr)

    const numVal = valStr === '' ? 0 : Number(valStr)
    if (!isNaN(numVal)) {
      onChange(numVal * scale)
    }
  }

  return (
    <label className={cn('field flex flex-col gap-1.5', className)}>
      <span className="field-label text-xs font-semibold text-slate-700 tracking-tight">{label}</span>
      <div className="field-control relative flex items-center">
        <Input
          {...props}
          aria-label={props['aria-label'] || `${label}${suffix || ''}`}
          type="number"
          min={typeof min === 'number' ? min / scale : min}
          max={typeof max === 'number' ? max / scale : max}
          step={typeof step === 'number' ? step / scale : step}
          value={inputValue}
          onChange={handleInputChange}
          className={cn(
            'h-9 text-xs font-medium bg-slate-50/50 hover:bg-slate-100/50 border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all rounded-lg text-slate-800',
            getSuffixPaddingClass(suffix),
            className
          )}
        />
        {suffix ? (
          <span className="absolute right-2.5 text-xs text-slate-400 font-medium select-none pointer-events-none">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? <small className="text-[10px] text-slate-400 font-normal leading-tight">{hint}</small> : null}
    </label>
  )
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  label?: string
  value: string
  onChange: (value: string) => void
  hint?: string
}

export function TextField({ label, value, onChange, hint, className, ...props }: TextFieldProps) {
  return (
    <label className={cn('field flex flex-col gap-1.5', className)}>
      {label ? <span className="field-label text-xs font-semibold text-slate-700 tracking-tight">{label}</span> : null}
      <Input
        {...props}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-9 text-xs font-semibold bg-slate-50/50 hover:bg-slate-100/50 border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all rounded-lg text-slate-800',
          className
        )}
      />
      {hint ? <small className="text-[10px] text-slate-400 font-normal leading-tight">{hint}</small> : null}
    </label>
  )
}

export type SelectOption = { value: string; label: string }

type SelectFieldProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  className?: string
  ariaLabel?: string
}

export function SelectField({ label, value, onChange, options, className, ariaLabel }: SelectFieldProps) {
  return (
    <label className={cn('field flex flex-col gap-1.5', className)}>
      {label ? <span className="field-label text-xs font-semibold text-slate-700 tracking-tight">{label}</span> : null}
      <div className="relative flex items-center">
        <select
          aria-label={ariaLabel || label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50/50 px-3 pr-8 text-xs font-medium text-slate-800 outline-none transition-all hover:bg-slate-100/50 focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500 cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
      </div>
    </label>
  )
}

export function SectionHeading({ icon, title, action }: { icon: ReactNode; title: string; action?: ReactNode }) {
  return (
    <div className="section-heading flex items-center justify-between gap-2 mb-3.5 pb-2 border-b border-slate-100">
      <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
        <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
          {icon}
        </span>
        <span className="tracking-tight">{title}</span>
      </div>
      {action}
    </div>
  )
}
