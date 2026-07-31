import type { LifeEvent, MonteCarloSummary, PlanOutput, PlannerV2, ProjectionRow, ProjectionSummary, TaxBreakdown } from '../types'

const activeEvent = (event: LifeEvent, year: number) =>
  year >= event.startYear && year < event.startYear + Math.max(1, event.duration)

export const calculateRealReturn = (nominalReturn: number, inflation: number) =>
  (1 + nominalReturn) / (1 + inflation) - 1

const householdRetirementOffset = (plan: PlannerV2) => Math.max(
  ...plan.adults.map((adult) => adult.retireAge - adult.currentAge),
)

// Japanese Salary Income Deduction (給与所得控除)
export function getJapanSalaryDeduction(salary: number): number {
  if (salary <= 0) return 0
  if (salary <= 1_800_000) return Math.max(550_000, salary * 0.4 - 100_000)
  if (salary <= 3_600_000) return salary * 0.3 + 80_000
  if (salary <= 6_600_000) return salary * 0.2 + 440_000
  if (salary <= 8_500_000) return salary * 0.1 + 1_100_000
  return 1_950_000
}

// Japanese Tax Engine (Social Security + Progressive Income Tax + Resident Tax)
export function calculateJapanTax(grossSalary: number, pensionIncome: number, idecoAnnualContribution: number = 0): TaxBreakdown {
  if (grossSalary <= 0 && pensionIncome <= 0) {
    return { socialSecurity: 0, incomeTax: 0, residentTax: 0, totalTax: 0 }
  }

  // 1. Social Security (健康保険 + 厚生年金 + 雇用保険 ≈ 14.5%)
  const socialSecurity = grossSalary * 0.145

  // 2. Taxable Salary Base (Basic Deduction 48万)
  const salaryDeduction = getJapanSalaryDeduction(grossSalary)
  const salaryTaxableIncome = Math.max(0, grossSalary - salaryDeduction - socialSecurity - 480_000 - idecoAnnualContribution)

  // Progressive Income Tax (所得税)
  let incomeTax = 0
  if (salaryTaxableIncome > 0) {
    if (salaryTaxableIncome <= 1_950_000) incomeTax = salaryTaxableIncome * 0.05
    else if (salaryTaxableIncome <= 3_300_000) incomeTax = salaryTaxableIncome * 0.10 - 97_500
    else if (salaryTaxableIncome <= 6_950_000) incomeTax = salaryTaxableIncome * 0.20 - 427_500
    else if (salaryTaxableIncome <= 9_000_000) incomeTax = salaryTaxableIncome * 0.23 - 636_000
    else if (salaryTaxableIncome <= 18_000_000) incomeTax = salaryTaxableIncome * 0.33 - 1_536_000
    else incomeTax = salaryTaxableIncome * 0.40 - 2_796_000
  }

  // Resident Tax (住民税 10%, Basic deduction 43万)
  const residentTaxableIncome = Math.max(0, grossSalary - salaryDeduction - socialSecurity - 430_000 - idecoAnnualContribution)
  const residentTax = residentTaxableIncome * 0.10

  // Pension Tax (公的年金等控除)
  let pensionTax = 0
  if (pensionIncome > 0) {
    const taxablePension = Math.max(0, pensionIncome - 1_100_000)
    pensionTax = taxablePension * 0.15
  }

  const totalTax = Math.round(socialSecurity + incomeTax + residentTax + pensionTax)
  return {
    socialSecurity: Math.round(socialSecurity),
    incomeTax: Math.round(incomeTax),
    residentTax: Math.round(residentTax + pensionTax),
    totalTax,
  }
}

// Box-Muller Normal Random Distribution for Monte Carlo Simulation
function randomNormal(mean: number, stdDev: number): number {
  let u1 = 0
  let u2 = 0
  while (u1 === 0) u1 = Math.random()
  while (u2 === 0) u2 = Math.random()
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
  return z0 * stdDev + mean
}

export function runMonteCarloSimulation(plan: PlannerV2, iterations = 500): MonteCarloSummary {
  const terminalAssetsList: number[] = []
  let solventCount = 0

  for (let i = 0; i < iterations; i += 1) {
    const stochasticPlan: PlannerV2 = {
      ...plan,
      assumptions: {
        ...plan.assumptions,
        nominalReturn: Math.max(-0.25, randomNormal(plan.assumptions.nominalReturn, 0.15)),
      },
    }
    const projection = generateProjection(stochasticPlan)
    const terminal = projection.at(-1)?.endAssets ?? 0
    terminalAssetsList.push(terminal)
    if (terminal >= 0) solventCount += 1
  }

  terminalAssetsList.sort((a, b) => a - b)
  const p10Index = Math.floor(iterations * 0.1)
  const p50Index = Math.floor(iterations * 0.5)
  const p90Index = Math.floor(iterations * 0.9)

  return {
    successRate: Math.round((solventCount / iterations) * 100),
    iterations,
    medianTerminalAssets: terminalAssetsList[p50Index] ?? 0,
    p10TerminalAssets: terminalAssetsList[p10Index] ?? 0,
    p90TerminalAssets: terminalAssetsList[p90Index] ?? 0,
  }
}

const retirementSolvencyScore = (plan: PlannerV2) => {
  const projection = generateProjection(plan)
  const retirementRows = projection.slice(Math.max(0, householdRetirementOffset(plan)))
  if (!retirementRows.length) return projection.at(-1)?.endAssets ?? 0
  return Math.min(...retirementRows.map((row) => row.endAssets))
}

export function findRequiredNominalReturn(plan: PlannerV2) {
  const withReturn = (nominalReturn: number) => retirementSolvencyScore({
    ...plan,
    assumptions: { ...plan.assumptions, nominalReturn },
  })
  if (withReturn(0) >= 0) return 0
  if (withReturn(0.3) < 0) return null
  let low = 0
  let high = 0.3
  for (let index = 0; index < 60; index += 1) {
    const middle = (low + high) / 2
    if (withReturn(middle) >= 0) high = middle
    else low = middle
  }
  return high
}

export function findRetirementSpendingAdjustment(plan: PlannerV2) {
  const withAdjustment = (adjustment: number) => retirementSolvencyScore({
    ...plan,
    expenses: {
      ...plan.expenses,
      livingAfterRetirement: Math.max(0, plan.expenses.livingAfterRetirement + adjustment),
    },
  })
  const baseScore = withAdjustment(0)
  if (Math.abs(baseScore) < 0.01) return 0
  if (baseScore < 0) {
    const low = -plan.expenses.livingAfterRetirement
    if (withAdjustment(low) < 0) return null
    let lower = low
    let upper = 0
    for (let index = 0; index < 60; index += 1) {
      const middle = (lower + upper) / 2
      if (withAdjustment(middle) >= 0) lower = middle
      else upper = middle
    }
    return lower
  }

  let lower = 0
  let upper = Math.max(1_000_000, plan.expenses.livingAfterRetirement)
  while (withAdjustment(upper) >= 0 && upper < 100_000_000) upper *= 2
  if (withAdjustment(upper) >= 0) return upper
  for (let index = 0; index < 60; index += 1) {
    const middle = (lower + upper) / 2
    if (withAdjustment(middle) >= 0) lower = middle
    else upper = middle
  }
  return lower
}

export function generateProjection(plan: PlannerV2): ProjectionRow[] {
  const primary = plan.adults.find((adult) => adult.role === 'primary') ?? plan.adults[0]
  if (!primary) return []

  const years = Math.max(1, plan.assumptions.endAge - primary.currentAge + 1)
  const realReturn = calculateRealReturn(
    plan.assumptions.nominalReturn,
    plan.assumptions.inflation,
  )
  const realBorrowingRate = calculateRealReturn(
    plan.assumptions.borrowingRate,
    plan.assumptions.inflation,
  )
  const retirementOffset = householdRetirementOffset(plan)
  let assets = plan.assumptions.initialAssets
  const rows: ProjectionRow[] = []

  const monthlyNisa = plan.assumptions.monthlyNisaContribution ?? 0
  const monthlyIdeco = plan.assumptions.monthlyIdecoContribution ?? 0
  let nisaBalance = 0
  let idecoBalance = 0

  for (let offset = 0; offset < years; offset += 1) {
    const year = plan.assumptions.startYear + offset
    let salaryIncome = 0
    let pensionIncome = 0
    let medicalExpense = 0

    for (const adult of plan.adults) {
      const age = adult.currentAge + offset
      if (age < adult.retireAge) salaryIncome += adult.annualSalary * (1 + adult.annualSalaryGrowth) ** offset
      if (age >= adult.pensionStartAge) pensionIncome += adult.annualPension
      if (age >= adult.medicalStartAge) medicalExpense += adult.annualMedicalExpense
    }

    let eventIncome = 0
    let taxableEventIncome = 0
    let eventExpense = 0
    const eventNames: string[] = []

    for (const event of plan.events) {
      if (!activeEvent(event, year)) continue
      eventNames.push(event.name)
      if (event.type === 'income') {
        eventIncome += event.annualAmount
        if (event.taxable) taxableEventIncome += event.annualAmount
      } else {
        eventExpense += event.annualAmount
      }
    }

    // Tax Engine Selection (Japanese Tax Engine vs Standard Rates)
    let tax = 0
    let taxDetails: TaxBreakdown | undefined
    const annualIdeco = monthlyIdeco * 12

    if (plan.assumptions.useJapanTaxEngine) {
      taxDetails = calculateJapanTax(salaryIncome, pensionIncome, annualIdeco)
      tax = taxDetails.totalTax + taxableEventIncome * plan.assumptions.eventTaxRate
    } else {
      tax =
        salaryIncome * plan.assumptions.salaryTaxRate +
        pensionIncome * plan.assumptions.pensionTaxRate +
        taxableEventIncome * plan.assumptions.eventTaxRate
    }

    const totalIncome = salaryIncome + pensionIncome + eventIncome - tax
    const retiredHousehold = offset >= retirementOffset
    const currentNominalReturn = retiredHousehold && plan.assumptions.postRetirementReturn !== undefined
      ? plan.assumptions.postRetirementReturn
      : plan.assumptions.nominalReturn
    const realReturn = calculateRealReturn(currentNominalReturn, plan.assumptions.inflation)

    const baseExpense =
      (retiredHousehold
        ? plan.expenses.housingAfterRetirement + plan.expenses.livingAfterRetirement
        : plan.expenses.housingBeforeRetirement + plan.expenses.livingBeforeRetirement) +
      plan.expenses.annualTravel
    const totalExpense = baseExpense + medicalExpense + eventExpense
    const netCashFlow = totalIncome - totalExpense
    const startAssets = assets
    const investmentGain = startAssets * (startAssets >= 0 ? realReturn : realBorrowingRate)

    // Multi-bucket asset compounding
    if (monthlyNisa > 0) {
      const annualNisa = monthlyNisa * 12
      nisaBalance = (nisaBalance + annualNisa) * (1 + realReturn)
    }
    if (annualIdeco > 0 && !retiredHousehold) {
      idecoBalance = (idecoBalance + annualIdeco) * (1 + realReturn)
    }

    const endAssets = startAssets + investmentGain + netCashFlow
    assets = endAssets

    rows.push({
      year,
      primaryAge: primary.currentAge + offset,
      startAssets,
      investmentGain,
      salaryIncome,
      pensionIncome,
      eventIncome,
      tax,
      taxDetails,
      totalIncome,
      baseExpense,
      medicalExpense,
      eventExpense,
      totalExpense,
      netCashFlow,
      endAssets,
      buckets: {
        taxableAssets: Math.max(0, endAssets - nisaBalance - idecoBalance),
        nisaAssets: Math.round(nisaBalance),
        idecoAssets: Math.round(idecoBalance),
      },
      eventNames,
    })
  }

  return rows
}

export function summarizeProjection(
  projection: ProjectionRow[],
  realReturn: number,
  realBorrowingRate: number,
): ProjectionSummary {
  const terminal = projection.at(-1)
  if (!terminal) {
    return {
      terminalYear: 0,
      terminalAge: 0,
      terminalAssets: 0,
      minimumAssets: 0,
      minimumYear: 0,
      firstNegativeYear: null,
      firstNegativeAge: null,
      status: '资金不足',
      realReturn,
      realBorrowingRate,
      requiredNominalReturn: null,
      retirementSpendingAdjustment: null,
      assumedNominalReturn: 0,
    }
  }

  let minimum = projection[0]
  let firstNegative: ProjectionRow | undefined
  for (const row of projection) {
    if (row.endAssets < minimum.endAssets) minimum = row
    if (!firstNegative && row.endAssets < 0) firstNegative = row
  }

  const status = terminal.endAssets < 0
    ? '资金不足'
    : terminal.endAssets <= terminal.totalExpense
      ? '接近 Die with Zero'
      : '结余偏高'

  return {
    terminalYear: terminal.year,
    terminalAge: terminal.primaryAge,
    terminalAssets: terminal.endAssets,
    minimumAssets: minimum.endAssets,
    minimumYear: minimum.year,
    firstNegativeYear: firstNegative?.year ?? null,
    firstNegativeAge: firstNegative?.primaryAge ?? null,
    status,
    realReturn,
    realBorrowingRate,
    requiredNominalReturn: null,
    retirementSpendingAdjustment: null,
    assumedNominalReturn: 0,
  }
}

export function buildPlanOutput(plan: PlannerV2): PlanOutput {
  const projection = generateProjection(plan)
  const realReturn = calculateRealReturn(
    plan.assumptions.nominalReturn,
    plan.assumptions.inflation,
  )
  const realBorrowingRate = calculateRealReturn(
    plan.assumptions.borrowingRate,
    plan.assumptions.inflation,
  )
  const summary = summarizeProjection(projection, realReturn, realBorrowingRate)
  const monteCarlo = runMonteCarloSimulation(plan, 300)

  return {
    projection,
    summary: {
      ...summary,
      requiredNominalReturn: findRequiredNominalReturn(plan),
      retirementSpendingAdjustment: findRetirementSpendingAdjustment(plan),
      assumedNominalReturn: plan.assumptions.nominalReturn,
      monteCarlo,
    },
  }
}

export const formatCurrency = (value: number) => {
  const sign = value < 0 ? '-' : ''
  const absolute = Math.abs(value)
  if (absolute >= 100_000_000) return `${sign}¥${(absolute / 100_000_000).toFixed(2)}亿`
  if (absolute >= 10_000) return `${sign}¥${Math.round(absolute / 10_000).toLocaleString('zh-CN')}万`
  return `${sign}¥${Math.round(absolute).toLocaleString('zh-CN')}`
}

export const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

