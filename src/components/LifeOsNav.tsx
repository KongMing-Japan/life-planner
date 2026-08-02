import { useState, useRef, useEffect } from 'react'
import {
  ChevronDown,
  Download,
  HelpCircle,
  Landmark,
  Orbit,
  ReceiptText,
  Route,
  Sparkles,
  Upload,
  BookOpen
} from 'lucide-react'
import type { Locale, I18nCopy } from '../i18n'
import type { PlannerV2 } from '../types'
import { exportPlan, importPlan } from '../storage/plannerStorage'
import { defaultPlan, clonePlan, templates } from '../data/defaultPlan'
import { LanguageSwitcher } from './LanguageSwitcher'

type LifeOsNavProps = {
  locale: Locale
  onLocaleChange: (locale: Locale) => void
  portfolioUrl?: string
  taxUrl?: string
  plan: PlannerV2
  onPlanChange: (plan: PlannerV2) => void
  copy: I18nCopy
}

export function LifeOsNav({
  locale,
  onLocaleChange,
  portfolioUrl = 'https://portfolio.kongmingjapan.com/',
  taxUrl,
  plan,
  onPlanChange,
  copy,
}: LifeOsNavProps) {
  const defaultTaxUrl = `https://tax.kongmingjapan.com/${locale === 'zh' ? 'zh-CN' : 'ja'}/`
  const resolvedTaxUrl = taxUrl || defaultTaxUrl

  const [toolsOpen, setToolsOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toolsRef = useRef<HTMLDivElement>(null)
  const guideRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setToolsOpen(false)
      }
      if (guideRef.current && !guideRef.current.contains(event.target as Node)) {
        setGuideOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const products = [
    { id: 'planner', label: 'Planner', href: '/', icon: Route, isActive: true },
    { id: 'portfolio', label: 'Portfolio', href: portfolioUrl, icon: Landmark, isActive: false },
    { id: 'tax', label: 'Tax', href: resolvedTaxUrl, icon: ReceiptText, isActive: false },
  ] as const

  const handleExportJson = () => {
    const jsonStr = exportPlan(plan)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `life-plan-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setToolsOpen(false)
  }

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const imported = importPlan(text)
        onPlanChange(imported)
        alert(locale === 'zh' ? '计划已成功导入' : 'プランを読み込みました')
      } catch {
        alert(locale === 'zh' ? '导入失败，文件格式不正确' : '読み込みに失敗しました')
      }
    }
    reader.readAsText(file)
    setToolsOpen(false)
  }

  const handleApplyTemplate = (index: number) => {
    const tmpl = templates[index]
    if (tmpl) {
      onPlanChange(tmpl.build())
      setToolsOpen(false)
    }
  }

  return (
    <header className="rounded-2xl border border-slate-200/90 bg-white p-2.5 px-4 md:px-5 shadow-2xs mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-800">
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Brand */}
        <a
          className="flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-bold text-sm no-underline transition-colors mr-0.5"
          href="https://kongmingjapan.com/"
          target="_blank"
          rel="noreferrer"
        >
          <Orbit className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
          <span className="tracking-tight text-slate-900 font-bold">LifeOS</span>
          <span className="sr-only">{copy.appTitle}</span>
        </a>

        {/* Divider */}
        <span className="text-slate-300 font-light select-none text-sm">/</span>

        {/* Product Switcher */}
        <nav className="flex items-center gap-1" aria-label="LifeOS Suite">
          {products.map((product) => {
            const Icon = product.icon
            return (
              <a
                key={product.id}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl transition-all ${
                  product.isActive
                    ? 'active bg-sky-50 text-sky-600 font-semibold border border-sky-200/70 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-100/80'
                }`}
                href={product.href}
                target={product.id === 'planner' ? undefined : '_blank'}
                rel={product.id === 'planner' ? undefined : 'noreferrer'}
                aria-current={product.isActive ? 'page' : undefined}
              >
                <Icon className={`h-3.5 w-3.5 ${product.isActive ? 'text-sky-600' : 'text-slate-500'}`} aria-hidden="true" />
                <span>{product.label}</span>
              </a>
            )
          })}
        </nav>

        {/* Vertical Divider */}
        <span className="h-4 w-px bg-slate-200 mx-1 flex-shrink-0 hidden md:block" />

        {/* Active Module & Secondary Nav Menus */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Primary Active Pill Button */}
          <span className="bg-blue-600 text-white font-medium rounded-full px-3.5 py-1 text-xs shadow-2xs select-none flex items-center gap-1">
            {locale === 'zh' ? '试算与规划' : 'ライフプラン・試算'}
          </span>

          {/* 試算ツール Dropdown */}
          <div className="relative" ref={toolsRef}>
            <button
              type="button"
              onClick={() => {
                setToolsOpen(!toolsOpen)
                setGuideOpen(false)
              }}
              className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100/80 transition-colors cursor-pointer select-none"
            >
              <span>{locale === 'zh' ? '测算工具' : '試算ツール'}</span>
              <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-150 ${toolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {toolsOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50 animate-in fade-in-50 zoom-in-95">
                <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  {locale === 'zh' ? '模板与数据' : 'テンプレート与データ'}
                </div>
                {templates.map((tmpl, idx) => (
                  <button
                    type="button"
                    key={tmpl.id}
                    onClick={() => handleApplyTemplate(idx)}
                    className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-600 rounded-lg transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>{locale === 'zh' ? tmpl.nameZh : tmpl.nameJa}</span>
                  </button>
                ))}
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-600 rounded-lg transition-colors"
                >
                  <Upload className="h-3.5 w-3.5 text-slate-500" />
                  <span>{locale === 'zh' ? '导入 JSON 计划' : 'JSON読み込み'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-600 rounded-lg transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>{locale === 'zh' ? '导出 JSON 计划' : 'JSON書き出し'}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportJson}
                  accept=".json"
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* プランガイド Dropdown */}
          <div className="relative" ref={guideRef}>
            <button
              type="button"
              onClick={() => {
                setGuideOpen(!guideOpen)
                setToolsOpen(false)
              }}
              className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100/80 transition-colors cursor-pointer select-none"
            >
              <span>{locale === 'zh' ? '税金・指南' : '税金・ガイド'}</span>
              <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-150 ${guideOpen ? 'rotate-180' : ''}`} />
            </button>

            {guideOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50 animate-in fade-in-50 zoom-in-95">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.querySelector('.calculation-rules') || document.querySelector('footer')
                    el?.scrollIntoView({ behavior: 'smooth' })
                    setGuideOpen(false)
                  }}
                  className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-600 rounded-lg transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                  <span>{locale === 'zh' ? '计算规则与假设' : '計算ルール与想定'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.querySelector('footer')
                    el?.scrollIntoView({ behavior: 'smooth' })
                    setGuideOpen(false)
                  }}
                  className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-600 rounded-lg transition-colors"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                  <span>{locale === 'zh' ? '免责声明' : '免責事項'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side: Language Switcher */}
      <div className="flex items-center gap-2 self-end md:self-auto">
        <LanguageSwitcher locale={locale} onLocaleChange={onLocaleChange} />
      </div>
    </header>
  )
}
