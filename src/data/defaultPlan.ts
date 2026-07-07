import type { PlannerV2 } from '../types'

const year = new Date().getFullYear()

export const defaultPlan: PlannerV2 = {
  version: 2,
  assumptions: {
    startYear: year,
    endAge: 100,
    initialAssets: 15_000_000,
    nominalReturn: 0.04,
    inflation: 0.02,
    salaryTaxRate: 0.3,
    pensionTaxRate: 0.15,
    eventTaxRate: 0.3,
    borrowingRate: 0.06,
  },
  adults: [
    {
      id: 'primary',
      role: 'primary',
      name: '本人',
      currentAge: 35,
      annualSalary: 8_000_000,
      annualSalaryGrowth: 0,
      retireAge: 65,
      pensionStartAge: 65,
      annualPension: 1_800_000,
      medicalStartAge: 70,
      annualMedicalExpense: 800_000,
    },
    {
      id: 'spouse',
      role: 'spouse',
      name: '配偶者',
      currentAge: 35,
      annualSalary: 5_000_000,
      annualSalaryGrowth: 0,
      retireAge: 65,
      pensionStartAge: 65,
      annualPension: 1_400_000,
      medicalStartAge: 70,
      annualMedicalExpense: 800_000,
    },
  ],
  children: [
    { id: 'child-1', name: '子ども1', currentAge: 6 },
    { id: 'child-2', name: '子ども2', currentAge: 2 },
  ],
  expenses: {
    housingBeforeRetirement: 0,
    housingAfterRetirement: 0,
    livingBeforeRetirement: 4_200_000,
    livingAfterRetirement: 3_000_000,
    annualTravel: 600_000,
  },
  events: [
    {
      id: 'rent-before-home',
      name: '住宅購入前の家賃',
      memberId: null,
      type: 'expense',
      startYear: year,
      duration: 3,
      annualAmount: 1_440_000,
      taxable: false,
    },
    {
      id: 'home-down-payment',
      name: '住宅購入・頭金',
      memberId: null,
      type: 'expense',
      startYear: year + 3,
      duration: 1,
      annualAmount: 6_000_000,
      taxable: false,
    },
    {
      id: 'home-loan',
      name: '住宅ローン返済',
      memberId: null,
      type: 'expense',
      startYear: year + 3,
      duration: 30,
      annualAmount: 1_800_000,
      taxable: false,
    },
    { id: 'education-child-1', name: '子ども1 教育費', memberId: 'child-1', type: 'expense', startYear: year + 6, duration: 10, annualAmount: 1_000_000, taxable: false },
    { id: 'education-child-2', name: '子ども2 教育費', memberId: 'child-2', type: 'expense', startYear: year + 10, duration: 10, annualAmount: 1_000_000, taxable: false },
    { id: 'car-replacement', name: '自動車の買い替え', memberId: null, type: 'expense', startYear: year + 8, duration: 1, annualAmount: 3_000_000, taxable: false },
    { id: 'home-renovation', name: '住宅リフォーム', memberId: null, type: 'expense', startYear: year + 23, duration: 1, annualAmount: 4_000_000, taxable: false },
  ],
}

export const clonePlan = (plan: PlannerV2): PlannerV2 =>
  typeof structuredClone === 'function'
    ? structuredClone(plan)
    : JSON.parse(JSON.stringify(plan)) as PlannerV2

export const templates = [
  { id: 'standard', name: '標準4人家族', build: () => clonePlan(defaultPlan) },
  {
    id: 'single',
    name: '単身・堅実型',
    build: () => {
      const plan = clonePlan(defaultPlan)
      plan.assumptions.initialAssets = 8_000_000
      plan.assumptions.nominalReturn = 0.04
      plan.adults = [
        { ...plan.adults[0], currentAge: 35, annualSalary: 7_000_000, annualPension: 1_500_000 },
      ]
      plan.children = []
      plan.expenses = {
        housingBeforeRetirement: 1_440_000,
        housingAfterRetirement: 1_200_000,
        livingBeforeRetirement: 2_400_000,
        livingAfterRetirement: 2_100_000,
        annualTravel: 500_000,
      }
      plan.events = []
      return plan
    },
  },
  {
    id: 'family',
    name: '共働き・子育て世帯',
    build: () => {
      const plan = clonePlan(defaultPlan)
      plan.assumptions.initialAssets = 12_000_000
      plan.adults[0].currentAge = 38
      plan.adults[1].currentAge = 36
      plan.adults[0].annualSalary = 8_000_000
      plan.adults[1].annualSalary = 6_000_000
      plan.children = [
        { id: 'child-1', name: '孩子 1', currentAge: 8 },
        { id: 'child-2', name: '孩子 2', currentAge: 4 },
      ]
      return plan
    },
  },
] as const
