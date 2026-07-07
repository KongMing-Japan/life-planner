export type AdultRole = 'primary' | 'spouse'
export type EventType = 'income' | 'expense'

export interface Adult {
  id: string
  role: AdultRole
  name: string
  currentAge: number
  annualSalary: number
  annualSalaryGrowth: number
  retireAge: number
  pensionStartAge: number
  annualPension: number
  medicalStartAge: number
  annualMedicalExpense: number
}

export interface Child {
  id: string
  name: string
  currentAge: number
}

export interface HouseholdExpenses {
  housingBeforeRetirement: number
  housingAfterRetirement: number
  livingBeforeRetirement: number
  livingAfterRetirement: number
  annualTravel: number
}

export interface PlannerAssumptions {
  startYear: number
  endAge: number
  initialAssets: number
  nominalReturn: number
  inflation: number
  salaryTaxRate: number
  pensionTaxRate: number
  eventTaxRate: number
  borrowingRate: number
}

export interface LifeEvent {
  id: string
  name: string
  memberId: string | null
  type: EventType
  startYear: number
  duration: number
  annualAmount: number
  taxable: boolean
}

export interface PlannerV2 {
  version: 2
  assumptions: PlannerAssumptions
  adults: Adult[]
  children: Child[]
  expenses: HouseholdExpenses
  events: LifeEvent[]
}

export interface ProjectionRow {
  year: number
  primaryAge: number
  startAssets: number
  investmentGain: number
  salaryIncome: number
  pensionIncome: number
  eventIncome: number
  tax: number
  totalIncome: number
  baseExpense: number
  medicalExpense: number
  eventExpense: number
  totalExpense: number
  netCashFlow: number
  endAssets: number
  eventNames: string[]
}

export type DieWithZeroStatus = '资金不足' | '接近 Die with Zero' | '结余偏高'

export interface ProjectionSummary {
  terminalYear: number
  terminalAge: number
  terminalAssets: number
  minimumAssets: number
  minimumYear: number
  firstNegativeYear: number | null
  firstNegativeAge: number | null
  status: DieWithZeroStatus
  realReturn: number
  realBorrowingRate: number
  requiredNominalReturn: number | null
  retirementSpendingAdjustment: number | null
  assumedNominalReturn: number
}

export interface PlanOutput {
  projection: ProjectionRow[]
  summary: ProjectionSummary
}
