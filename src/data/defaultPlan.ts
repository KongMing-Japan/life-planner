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

export type PresetTemplate = {
  id: string
  avatar: string
  nameJa: string
  nameZh: string
  tagLineJa: string
  tagLineZh: string
  descJa: string
  descZh: string
  build: () => PlannerV2
}

export const templates: readonly PresetTemplate[] = [
  {
    id: 'standard',
    avatar: '👨‍👩‍👧‍👦',
    nameJa: '共働き4人家族',
    nameZh: '双职工 4人家庭',
    tagLineJa: '世帯年収1300万・子ども2人',
    tagLineZh: '家庭年收入1300万·子女2人',
    descJa: '東京都内の典型的共働き家庭。世帯年収1300万円、NISA活用、住宅ローン30年。',
    descZh: '东京典型双职工家庭。年收入1300万日元，使用NISA，30年按揭。',
    build: () => clonePlan(defaultPlan),
  },
  {
    id: 'single',
    avatar: '👱‍♂️',
    nameJa: '単身・着実形成',
    nameZh: '单身 稳健形成',
    tagLineJa: '30代独身・年収650万',
    tagLineZh: '30代单身·年收入650万',
    descJa: '30代独身会社員。年収650万円、積立NISA 5万円/月、堅実な資産形成を目指す。',
    descZh: '30代单身职员。年收入650万日元，每月定投NISA 5万，稳健积累。',
    build: () => {
      const plan = clonePlan(defaultPlan)
      plan.assumptions.initialAssets = 6_000_000
      plan.assumptions.nominalReturn = 0.04
      plan.assumptions.monthlyNisaContribution = 50_000
      plan.adults = [
        { ...plan.adults[0], currentAge: 32, annualSalary: 6_500_000, annualPension: 1_500_000 },
      ]
      plan.children = []
      plan.expenses = {
        housingBeforeRetirement: 1_680_000, // Tokyo single rent: 14万/month
        housingAfterRetirement: 1_200_000,  // Retirement housing: 10万/month
        livingBeforeRetirement: 2_400_000,  // Single living: 20万/month
        livingAfterRetirement: 2_160_000,   // Retirement living: 18万/month
        annualTravel: 500_000,
      }
      plan.events = []
      return plan
    },
  },
  {
    id: 'single_parent',
    avatar: '👨‍👩‍👧',
    nameJa: 'ひとり親家庭',
    nameZh: '单亲家庭',
    tagLineJa: '30代ひとり親・子ども1人',
    tagLineZh: '30代单亲·子女1人',
    descJa: '30代ひとり親。年収420万円、子ども1人、生活費・教育準備金を重視。',
    descZh: '30代单亲家长。年收入420万日元，抚养1个孩子，注重教育准备金。',
    build: () => {
      const plan = clonePlan(defaultPlan)
      plan.assumptions.initialAssets = 3_500_000
      plan.assumptions.monthlyNisaContribution = 30_000
      plan.adults = [
        { ...plan.adults[0], currentAge: 35, annualSalary: 4_200_000, annualPension: 1_300_000 },
      ]
      plan.children = [
        { id: 'child-1', name: '子ども1', currentAge: 5 },
      ]
      plan.expenses = {
        housingBeforeRetirement: 1_440_000, // Rent: 12万/month
        housingAfterRetirement: 1_080_000,  // Retirement housing: 9万/month
        livingBeforeRetirement: 3_000_000,  // Single parent + 1 child living: 25万/month
        livingAfterRetirement: 2_280_000,   // Retirement living: 19万/month
        annualTravel: 300_000,
      }
      plan.events = [
        { id: 'education-child-1', name: '子ども1 教育費', memberId: 'child-1', type: 'expense', startYear: year + 7, duration: 10, annualAmount: 1_000_000, taxable: false },
      ]
      return plan
    },
  },
  {
    id: 'homemaker',
    avatar: '👔',
    nameJa: '片働き・専業主婦',
    nameZh: '单收入 家庭主妇',
    tagLineJa: '年収850万・専業主婦・子ども2人',
    tagLineZh: '年收入850万·主妇·子女2人',
    descJa: '大企業会社員の夫と専業主婦の妻。子ども2人の教育費と老後資金のバランス設計。',
    descZh: '大企业职员与家庭主妇。平衡2个孩子的教育费与退休资金。',
    build: () => {
      const plan = clonePlan(defaultPlan)
      plan.assumptions.initialAssets = 10_000_000
      plan.adults[0].currentAge = 35
      plan.adults[1].currentAge = 35
      plan.adults[0].annualSalary = 8_500_000
      plan.adults[1].annualSalary = 0 // Homemaker spouse
      plan.adults[1].annualPension = 780_000 // Basic national pension
      plan.children = [
        { id: 'child-1', name: '子ども1', currentAge: 6 },
        { id: 'child-2', name: '子ども2', currentAge: 2 },
      ]
      return plan
    },
  },
  {
    id: 'empty_nester',
    avatar: '👵👴',
    nameJa: '50代・熟年夫婦',
    nameZh: '50代 熟年夫妻',
    tagLineJa: '子ども独立・50代・貯蓄2500万',
    tagLineZh: '子女离巢独立·50代·储蓄2500万',
    descJa: '子どもが独立・学費終了。夫52歳年収950万、妻50歳パート年収120万、老後本格準備。',
    descZh: '子女毕业独立。丈夫52岁年收入950万，妻子兼职120万，冲刺老后资金。',
    build: () => {
      const plan = clonePlan(defaultPlan)
      plan.assumptions.initialAssets = 25_000_000
      plan.assumptions.monthlyNisaContribution = 100_000
      plan.assumptions.monthlyIdecoContribution = 23_000
      plan.adults[0].currentAge = 52
      plan.adults[0].annualSalary = 9_500_000
      plan.adults[0].retireAge = 65
      plan.adults[0].annualPension = 2_200_000
      plan.adults[1].currentAge = 50
      plan.adults[1].annualSalary = 1_200_000
      plan.adults[1].retireAge = 65
      plan.adults[1].annualPension = 1_100_000
      plan.children = []
      plan.expenses = {
        housingBeforeRetirement: 1_800_000,
        housingAfterRetirement: 1_200_000,
        livingBeforeRetirement: 3_800_000,
        livingAfterRetirement: 3_200_000,
        annualTravel: 1_000_000,
      }
      plan.events = [
        { id: 'home-renovation', name: '住宅リフォーム', memberId: null, type: 'expense', startYear: year + 5, duration: 1, annualAmount: 4_000_000, taxable: false },
      ]
      return plan
    },
  },
  {
    id: 'fire',
    avatar: '🚀',
    nameJa: 'FIRE・早期リタイア',
    nameZh: 'FIRE 早期退休',
    tagLineJa: '30代・45歳リタイア目標',
    tagLineZh: '30代·目标45岁退休',
    descJa: '30代独身、貯蓄3000万円。NISA満額10万円/月、45歳早期リタイアを目指す高還元モデル。',
    descZh: '30代单身，储蓄3000万。每月NISA满额10万，目标45岁早期退休。',
    build: () => {
      const plan = clonePlan(defaultPlan)
      plan.assumptions.initialAssets = 30_000_000
      plan.assumptions.nominalReturn = 0.05
      plan.assumptions.postRetirementReturn = 0.04
      plan.assumptions.monthlyNisaContribution = 100_000
      plan.adults = [
        { ...plan.adults[0], currentAge: 33, annualSalary: 9_000_000, retireAge: 45, annualPension: 1_200_000 },
      ]
      plan.children = []
      plan.expenses = {
        housingBeforeRetirement: 1_440_000,
        housingAfterRetirement: 1_200_000,
        livingBeforeRetirement: 2_400_000,
        livingAfterRetirement: 2_160_000,
        annualTravel: 500_000,
      }
      plan.events = []
      return plan
    },
  },
] as const
