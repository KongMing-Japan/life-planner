import { type InputHTMLAttributes, type ReactNode, useEffect, useState } from 'react'

type NumberFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
  hint?: string
  scale?: number
}

export function NumberField({ label, value, onChange, suffix, hint, scale = 1, min, max, step, ...props }: NumberFieldProps) {
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
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-control">
        <input
          {...props}
          type="number"
          min={typeof min === 'number' ? min / scale : min}
          max={typeof max === 'number' ? max / scale : max}
          step={typeof step === 'number' ? step / scale : step}
          value={inputValue}
          onChange={handleInputChange}
        />
        {suffix ? <em>{suffix}</em> : null}
      </span>
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

export function SectionHeading({ icon, title, action }: { icon: ReactNode; title: string; action?: ReactNode }) {
  return (
    <div className="section-heading">
      <span>{icon}<strong>{title}</strong></span>
      {action}
    </div>
  )
}
