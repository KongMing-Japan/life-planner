import { describe, expect, it } from 'vitest'
import { clonePlan, defaultPlan } from '../data/defaultPlan'
import type { PlannerV2 } from '../types'
import { buildPlanOutput, calculateRealReturn, findRequiredNominalReturn, findRetirementSpendingAdjustment, generateProjection } from './planner'

const simplePlan = (): PlannerV2 => ({
  version: 2,
  assumptions: {
    startYear: 2025,
    endAge: 66,
    initialAssets: 100,
    nominalReturn: 0,
    inflation: 0,
    salaryTaxRate: 0,
    pensionTaxRate: 0,
    eventTaxRate: 0.3,
    borrowingRate: 0,
  },
  adults: [{
    id: 'primary', role: 'primary', name: '本人', currentAge: 64,
    annualSalary: 20, annualSalaryGrowth: 0, retireAge: 65, pensionStartAge: 65, annualPension: 10,
    medicalStartAge: 66, annualMedicalExpense: 2,
  }],
  children: [],
  expenses: {
    housingBeforeRetirement: 2, housingAfterRetirement: 1,
    livingBeforeRetirement: 3, livingAfterRetirement: 2, annualTravel: 0,
  },
  events: [],
})

describe('planner engine', () => {
  it('calculates the real return from nominal return and inflation', () => {
    expect(calculateRealReturn(0.05, 0.02)).toBeCloseTo(0.0294117647, 10)
  })

  it('handles retirement, pension, medical costs and real asset roll-forward', () => {
    const rows = generateProjection(simplePlan())
    expect(rows.map((row) => row.endAssets)).toEqual([115, 122, 127])
    expect(rows[1].salaryIncome).toBe(0)
    expect(rows[1].pensionIncome).toBe(10)
    expect(rows[2].medicalExpense).toBe(2)
  })

  it('switches household expenses only after the last adult retires', () => {
    const plan = simplePlan()
    plan.assumptions.endAge = 71
    plan.adults.push({
      id: 'spouse', role: 'spouse', name: '配偶', currentAge: 60,
      annualSalary: 0, annualSalaryGrowth: 0, retireAge: 67, pensionStartAge: 99, annualPension: 0,
      medicalStartAge: 99, annualMedicalExpense: 0,
    })
    const rows = generateProjection(plan)
    expect(rows[1].baseExpense).toBe(5)
    expect(rows[6].baseExpense).toBe(5)
    expect(rows[7].baseExpense).toBe(3)
  })

  it('taxes taxable event income and keeps expense events untaxed', () => {
    const plan = simplePlan()
    plan.assumptions.endAge = 64
    plan.adults[0].annualSalary = 0
    plan.expenses = {
      housingBeforeRetirement: 0, housingAfterRetirement: 0,
      livingBeforeRetirement: 0, livingAfterRetirement: 0, annualTravel: 0,
    }
    plan.events = [
      { id: 'income', name: '副业', memberId: null, type: 'income', startYear: 2025, duration: 1, annualAmount: 100, taxable: true },
      { id: 'expense', name: '购车', memberId: null, type: 'expense', startYear: 2025, duration: 1, annualAmount: 20, taxable: false },
    ]
    const row = generateProjection(plan)[0]
    expect(row.tax).toBe(30)
    expect(row.endAssets).toBe(150)
  })

  it('continues projecting after assets become negative', () => {
    const plan = simplePlan()
    plan.assumptions.initialAssets = 0
    plan.adults[0].annualSalary = 0
    plan.adults[0].annualPension = 0
    plan.adults[0].medicalStartAge = 99
    plan.expenses = {
      housingBeforeRetirement: 10, housingAfterRetirement: 10,
      livingBeforeRetirement: 0, livingAfterRetirement: 0, annualTravel: 0,
    }
    expect(generateProjection(plan).map((row) => row.endAssets)).toEqual([-10, -20, -30])
    expect(buildPlanOutput(plan).summary.firstNegativeAge).toBe(64)
  })

  it('applies real salary growth while an adult is working', () => {
    const plan = simplePlan()
    plan.adults[0].annualSalary = 100
    plan.adults[0].annualSalaryGrowth = 0.1
    plan.adults[0].retireAge = 99
    plan.adults[0].annualPension = 0
    plan.expenses = { housingBeforeRetirement: 0, housingAfterRetirement: 0, livingBeforeRetirement: 0, livingAfterRetirement: 0, annualTravel: 0 }
    const salaries = generateProjection(plan).map((row) => row.salaryIncome)
    expect(salaries[0]).toBeCloseTo(100)
    expect(salaries[1]).toBeCloseTo(110)
    expect(salaries[2]).toBeCloseTo(121)
  })

  it('uses the borrowing rate instead of the investment return for negative starting assets', () => {
    const plan = simplePlan()
    plan.assumptions.initialAssets = -100
    plan.assumptions.nominalReturn = 0.1
    plan.assumptions.inflation = 0.02
    plan.assumptions.borrowingRate = 0.06
    plan.adults[0].annualSalary = 0
    plan.adults[0].annualPension = 0
    plan.adults[0].medicalStartAge = 99
    plan.expenses = { housingBeforeRetirement: 0, housingAfterRetirement: 0, livingBeforeRetirement: 0, livingAfterRetirement: 0, annualTravel: 0 }
    const row = generateProjection(plan)[0]
    expect(row.investmentGain).toBeCloseTo(-3.9215686, 6)
    expect(row.endAssets).toBeCloseTo(-103.9215686, 6)
  })

  it('finds the minimum return needed to keep retirement assets non-negative', () => {
    const plan = simplePlan()
    plan.assumptions.initialAssets = 100
    plan.adults[0].annualSalary = 0
    plan.adults[0].annualPension = 0
    plan.adults[0].retireAge = 64
    plan.adults[0].medicalStartAge = 99
    plan.expenses = { housingBeforeRetirement: 45, housingAfterRetirement: 45, livingBeforeRetirement: 0, livingAfterRetirement: 0, annualTravel: 0 }
    const required = findRequiredNominalReturn(plan)
    expect(required).not.toBeNull()
    expect(required!).toBeGreaterThan(0)
    expect(required!).toBeLessThan(0.3)
    plan.assumptions.nominalReturn = required!
    expect(Math.min(...generateProjection(plan).map((row) => row.endAssets))).toBeGreaterThanOrEqual(-0.01)
  })

  it('finds the annual retirement spending adjustment that uses available assets', () => {
    const plan = simplePlan()
    plan.assumptions.initialAssets = 100
    plan.adults[0].annualSalary = 0
    plan.adults[0].annualPension = 0
    plan.adults[0].medicalStartAge = 99
    plan.expenses = { housingBeforeRetirement: 10, housingAfterRetirement: 10, livingBeforeRetirement: 0, livingAfterRetirement: 0, annualTravel: 0 }
    expect(findRetirementSpendingAdjustment(plan)).toBeCloseTo(35, 6)
  })

  it('matches the standard-family first-year result using the real-return convention', () => {
    const plan = clonePlan(defaultPlan)
    plan.assumptions.startYear = 2025
    plan.assumptions.endAge = plan.adults[0].currentAge
    plan.assumptions.nominalReturn = 0.05
    plan.events = []
    const row = generateProjection(plan)[0]
    expect(row.endAssets).toBeCloseTo(19_741_176.47, 2)
  })

  it('reconciles the standard four-person household at major life stages', () => {
    const rows = generateProjection(clonePlan(defaultPlan))
    const age35 = rows.find((row) => row.primaryAge === 35)!
    expect(age35.salaryIncome).toBe(13_000_000)
    expect(age35.tax).toBe(3_900_000)
    expect(age35.baseExpense).toBe(4_800_000)
    expect(age35.eventExpense).toBe(1_440_000)
    expect(age35.endAssets).toBeCloseTo(18_154_117.65, 2)

    const age38 = rows.find((row) => row.primaryAge === 38)!
    expect(age38.eventExpense).toBe(7_800_000)
    expect(age38.eventNames).toEqual(expect.arrayContaining(['住宅購入・頭金', '住宅ローン返済']))

    const age65 = rows.find((row) => row.primaryAge === 65)!
    expect(age65.salaryIncome).toBe(0)
    expect(age65.pensionIncome).toBe(3_200_000)
    expect(age65.baseExpense).toBe(3_600_000)
    expect(age65.eventExpense).toBe(1_800_000)

    const age70 = rows.find((row) => row.primaryAge === 70)!
    expect(age70.eventExpense).toBe(0)
    expect(age70.medicalExpense).toBe(1_600_000)
    expect(age70.totalExpense).toBe(5_200_000)
  })
})
