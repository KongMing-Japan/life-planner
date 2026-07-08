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
    livingBeforeRetirement: 4_800_000, // Tokyo family of 4: 40万/month
    livingAfterRetirement: 3_600_000,  // Tokyo retirement: 30万/month
    annualTravel: 800_000,            // 80万/year
  },
  events: [
    {
      id: 'rent-before-home',
      name: '住宅購入前の家賃',
      memberId: null,
      type: 'expense',
      startYear: year,
      duration: 3,
      annualAmount: 2_160_000,         // Tokyo family rent: 18万/month
      taxable: false,
    },
    {
      id: 'home-down-payment',
      name: '住宅購入・頭金',
      memberId: null,
      type: 'expense',
      startYear: year + 3,
      duration: 1,
      annualAmount: 8_000_000,         // Tokyo home purchase down payment: 800万
      taxable: false,
    },
    {
      id: 'home-loan',
      name: '住宅ローン返済',
      memberId: null,
      type: 'expense',
      startYear: year + 3,
      duration: 30,
      annualAmount: 2_280_000,         // Tokyo mortgage payment: 19万/month
      taxable: false,
    },
    { id: 'education-child-1', name: '子ども1 教育費', memberId: 'child-1', type: 'expense', startYear: year + 6, duration: 10, annualAmount: 1_200_000, taxable: false }, // Tokyo school + cram school: 120万/year
    { id: 'education-child-2', name: '子ども2 教育費', memberId: 'child-2', type: 'expense', startYear: year + 10, duration: 10, annualAmount: 1_200_000, taxable: false },
    { id: 'car-replacement', name: '自動車の買い替え', memberId: null, type: 'expense', startYear: year + 8, duration: 1, annualAmount: 3_500_000, taxable: false },     // Family minivan: 350万
    { id: 'home-renovation', name: '住宅リフォーム', memberId: null, type: 'expense', startYear: year + 23, duration: 1, annualAmount: 5_000_000, taxable: false },        // Refurbishment: 500万
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
        housingBeforeRetirement: 1_680_000, // Tokyo single rent: 14万/month
        housingAfterRetirement: 1_200_000,  // Retirement housing: 10万/month
        livingBeforeRetirement: 2_640_000,  // Single living: 22万/month
        livingAfterRetirement: 2_280_000,   // Retirement living: 19万/month
        annualTravel: 600_000,             // Travel: 60万/year
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
        { id: 'child-1', name: '子ども1', currentAge: 8 },
        { id: 'child-2', name: '子ども2', currentAge: 4 },
      ]
      return plan
    },
  },
  {
    id: 'homemaker',
    name: '片働き・専業主婦世帯',
    build: () => {
      const plan = clonePlan(defaultPlan)
      plan.assumptions.initialAssets = 10_000_000
      plan.adults[0].currentAge = 35
      plan.adults[1].currentAge = 35
      plan.adults[0].annualSalary = 8_000_000
      plan.adults[1].annualSalary = 0 // Homemaker spouse
      plan.adults[1].annualPension = 780_000 // Basic national pension
      plan.children = [
        { id: 'child-1', name: '子ども1', currentAge: 6 },
        { id: 'child-2', name: '子ども2', currentAge: 2 },
      ]
      return plan
    },
  },
] as const
