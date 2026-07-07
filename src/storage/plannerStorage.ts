import { clonePlan, defaultPlan } from '../data/defaultPlan'
import type { Adult, LifeEvent, PlannerV2 } from '../types'

const STORAGE_KEY = 'life-planner-v2'
const LEGACY_STORAGE_KEY = 'life-planner-v1'

type UnknownRecord = Record<string, unknown>

const record = (value: unknown): UnknownRecord | null =>
  value && typeof value === 'object' ? value as UnknownRecord : null

const numberValue = (value: unknown, fallback: number) => {
  const result = Number(value)
  return Number.isFinite(result) ? result : fallback
}

const normalizeV2Plan = (plan: PlannerV2): PlannerV2 => ({
  ...plan,
  assumptions: {
    ...plan.assumptions,
    borrowingRate: numberValue(plan.assumptions.borrowingRate, 0.06),
  },
  adults: plan.adults.map((adult) => ({
    ...adult,
    annualSalaryGrowth: numberValue(adult.annualSalaryGrowth, 0),
  })),
})

const isPreviousBuiltInExample = (plan: PlannerV2) =>
  plan.adults[0]?.currentAge === 45 &&
  plan.adults[1]?.currentAge === 40 &&
  plan.children.length === 1 &&
  plan.children[0]?.currentAge === 7 &&
  plan.events.some((event) => event.id === 'school-primary') &&
  plan.events.some((event) => event.id === 'home-purchase')

const eventFromLegacy = (event: UnknownRecord, index: number): LifeEvent => {
  const amount = numberValue(event.amount, 0)
  return {
    id: `legacy-event-${index}`,
    name: String(event.note || `事件 ${index + 1}`),
    memberId: null,
    type: amount >= 0 ? 'income' : 'expense',
    startYear: numberValue(event.year, new Date().getFullYear()),
    duration: Math.max(1, numberValue(event.duration, 1)),
    annualAmount: Math.abs(amount),
    taxable: amount > 0,
  }
}

export function migrateLegacyPlan(input: unknown): PlannerV2 | null {
  const root = record(input)
  if (!root) return null
  const payload = record(root.plan) ?? record(root.currentPlan) ?? root
  if (payload.version === 2 && Array.isArray(payload.adults)) return normalizeV2Plan(payload as unknown as PlannerV2)
  const setup = record(payload.setup)
  const events = Array.isArray(payload.events) ? payload.events : null
  if (!setup || !events) return null

  const startYear = numberValue(setup.Start_Year, new Date().getFullYear())
  const primary: Adult = {
    id: 'primary',
    role: 'primary',
    name: '本人',
    currentAge: startYear - numberValue(setup.Person1_Birth_Year, startYear - 40),
    annualSalary: numberValue(setup.Person1_Salary_Start, 0),
    annualSalaryGrowth: 0,
    retireAge: numberValue(setup.Person1_Retire_Age, 65),
    pensionStartAge: numberValue(setup.Person1_Pension_Start_Age, 65),
    annualPension: numberValue(setup.Person1_Pension_Income, 0),
    medicalStartAge: numberValue(setup.Person1_Medical_Start_Age, 70),
    annualMedicalExpense: Math.abs(numberValue(setup.Person1_Medical_Annual, 0)),
  }
  const adults = [primary]
  const spouseSalary = numberValue(setup.Person2_Salary_Start, 0)
  if (spouseSalary > 0 || setup.Person2_Birth_Year) {
    adults.push({
      id: 'spouse',
      role: 'spouse',
      name: '配偶',
      currentAge: startYear - numberValue(setup.Person2_Birth_Year, startYear - 38),
      annualSalary: spouseSalary,
      annualSalaryGrowth: 0,
      retireAge: numberValue(setup.Person2_Retire_Age, 65),
      pensionStartAge: numberValue(setup.Person2_Pension_Start_Age, 65),
      annualPension: numberValue(setup.Person2_Pension_Income, 0),
      medicalStartAge: numberValue(setup.Person2_Medical_Start_Age, 70),
      annualMedicalExpense: Math.abs(numberValue(setup.Person2_Medical_Annual, 0)),
    })
  }

  const childBirthYear = numberValue(setup.Child1_Birth_Year, 0)
  return {
    version: 2,
    assumptions: {
      startYear,
      endAge: numberValue(setup.End_Age, 100),
      initialAssets: numberValue(setup.Initial_Asset, 0),
      nominalReturn: numberValue(setup.Invest_Return, 0.05),
      inflation: numberValue(setup.Inflation, 0.02),
      salaryTaxRate: numberValue(setup.Income_Tax_Rate, 0.3),
      pensionTaxRate: numberValue(setup.Pension_Tax_Rate, 0.15),
      eventTaxRate: numberValue(setup.Events_Tax_Rate, 0.3),
      borrowingRate: 0.06,
    },
    adults,
    children: childBirthYear
      ? [{ id: 'child-1', name: '孩子 1', currentAge: startYear - childBirthYear }]
      : [],
    expenses: {
      housingBeforeRetirement: Math.abs(numberValue(setup.Housing_Annual_Pre, 0)),
      housingAfterRetirement: Math.abs(numberValue(setup.Housing_Annual_Post, 0)),
      livingBeforeRetirement: Math.abs(numberValue(setup.Living_Annual_Pre, 0)),
      livingAfterRetirement: Math.abs(numberValue(setup.Living_Annual_Post, 0)),
      annualTravel: Math.abs(numberValue(setup.Travel_Annual, 0)),
    },
    events: events
      .map((item, index) => record(item) ? eventFromLegacy(record(item)!, index) : null)
      .filter((item): item is LifeEvent => Boolean(item)),
  }
}

export function loadPlan(): PlannerV2 {
  try {
    const current = localStorage.getItem(STORAGE_KEY)
    if (current) {
      const loaded = migrateLegacyPlan(JSON.parse(current))
      return loaded && !isPreviousBuiltInExample(loaded) ? loaded : clonePlan(defaultPlan)
    }
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    const migrated = legacy ? migrateLegacyPlan(JSON.parse(legacy)) : null
    return migrated ?? clonePlan(defaultPlan)
  } catch {
    return clonePlan(defaultPlan)
  }
}

export function savePlan(plan: PlannerV2) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan))
}

export function exportPlan(plan: PlannerV2) {
  return JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), plan }, null, 2)
}

export function importPlan(text: string): PlannerV2 {
  const plan = migrateLegacyPlan(JSON.parse(text))
  if (!plan) throw new Error('无法识别该计划文件')
  return plan
}
