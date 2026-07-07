import type { LifeEvent, PlanOutput, PlannerV2, ProjectionRow, ProjectionSummary } from '../types'

const activeEvent = (event: LifeEvent, year: number) =>
  year >= event.startYear && year < event.startYear + Math.max(1, event.duration)

export const calculateRealReturn = (nominalReturn: number, inflation: number) =>
  (1 + nominalReturn) / (1 + inflation) - 1

const householdRetirementOffset = (plan: PlannerV2) => Math.max(
  ...plan.adults.map((adult) => adult.retireAge - adult.currentAge),
)

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

    const tax =
      salaryIncome * plan.assumptions.salaryTaxRate +
      pensionIncome * plan.assumptions.pensionTaxRate +
      taxableEventIncome * plan.assumptions.eventTaxRate
    const totalIncome = salaryIncome + pensionIncome + eventIncome - tax
    const retiredHousehold = offset >= retirementOffset
    const baseExpense =
      (retiredHousehold
        ? plan.expenses.housingAfterRetirement + plan.expenses.livingAfterRetirement
        : plan.expenses.housingBeforeRetirement + plan.expenses.livingBeforeRetirement) +
      plan.expenses.annualTravel
    const totalExpense = baseExpense + medicalExpense + eventExpense
    const netCashFlow = totalIncome - totalExpense
    const startAssets = assets
    const investmentGain = startAssets * (startAssets >= 0 ? realReturn : realBorrowingRate)
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
      totalIncome,
      baseExpense,
      medicalExpense,
      eventExpense,
      totalExpense,
      netCashFlow,
      endAssets,
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
  return {
    projection,
    summary: {
      ...summary,
      requiredNominalReturn: findRequiredNominalReturn(plan),
      retirementSpendingAdjustment: findRetirementSpendingAdjustment(plan),
      assumedNominalReturn: plan.assumptions.nominalReturn,
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
