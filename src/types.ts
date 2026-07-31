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
  postRetirementReturn?: number
  inflation: number
  salaryTaxRate: number
  pensionTaxRate: number
  eventTaxRate: number
  borrowingRate: number
  // Quicken & Japanese Tax Engine Options
  useJapanTaxEngine?: boolean
  monthlyNisaContribution?: number
  monthlyIdecoContribution?: number
  housingLoanBalance?: number
  housingLoanInterestRate?: number
  housingLoanYearsLeft?: number
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

export interface AssetBucketBreakdown {
  taxableAssets: number
  nisaAssets: number
  idecoAssets: number
}

export interface TaxBreakdown {
  socialSecurity: number
  incomeTax: number
  residentTax: number
  totalTax: number
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
  taxDetails?: TaxBreakdown
  totalIncome: number
  baseExpense: number
  medicalExpense: number
  eventExpense: number
  totalExpense: number
  netCashFlow: number
  endAssets: number
  buckets?: AssetBucketBreakdown
  eventNames: string[]
}

export type DieWithZeroStatus = '资金不足' | '接近 Die with Zero' | '结余偏高'

export interface MonteCarloSummary {
  successRate: number // 0 - 100%
  iterations: number
  medianTerminalAssets: number
  p10TerminalAssets: number
  p90TerminalAssets: number
}

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
  monteCarlo?: MonteCarloSummary
}

export interface PlanOutput {
  projection: ProjectionRow[]
  summary: ProjectionSummary
}

