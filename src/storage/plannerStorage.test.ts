import { beforeEach, describe, expect, it } from 'vitest'
import { clonePlan, defaultPlan } from '../data/defaultPlan'
import { exportPlan, importPlan, loadPlan, migrateLegacyPlan } from './plannerStorage'

const legacy = {
  currentPlan: {
    setup: {
      Start_Year: 2025,
      End_Age: 95,
      Initial_Asset: 10_000_000,
      Invest_Return: 0.05,
      Inflation: 0.02,
      Person1_Birth_Year: 1985,
      Person1_Salary_Start: 6_000_000,
      Person1_Retire_Age: 65,
      Person1_Pension_Start_Age: 65,
      Person1_Pension_Income: 1_500_000,
      Person1_Medical_Start_Age: 70,
      Person1_Medical_Annual: 900_000,
      Child1_Birth_Year: 2020,
      Housing_Annual_Pre: 1_200_000,
      Housing_Annual_Post: 800_000,
      Living_Annual_Pre: 3_000_000,
      Living_Annual_Post: 2_400_000,
      Travel_Annual: 500_000,
      Income_Tax_Rate: 0.2,
      Pension_Tax_Rate: 0.1,
      Events_Tax_Rate: 0.3,
    },
    events: [{ year: 2030, amount: -2_000_000, duration: 2, note: '教育' }],
  },
}

describe('planner storage', () => {
  beforeEach(() => localStorage.clear())

  it('migrates v1 fixed fields and signed events to v2', () => {
    const plan = migrateLegacyPlan(legacy)
    expect(plan?.version).toBe(2)
    expect(plan?.adults[0].currentAge).toBe(40)
    expect(plan?.children[0].currentAge).toBe(5)
    expect(plan?.events[0]).toMatchObject({ type: 'expense', annualAmount: 2_000_000 })
  })

  it('loads the legacy local state when no v2 state exists', () => {
    localStorage.setItem('life-planner-v1', JSON.stringify(legacy))
    expect(loadPlan().assumptions.initialAssets).toBe(10_000_000)
  })

  it('round-trips v2 JSON exports', () => {
    const plan = migrateLegacyPlan(legacy)!
    expect(importPlan(exportPlan(plan))).toEqual(plan)
  })

  it('upgrades the previous untouched example to the new standard family', () => {
    const previous = clonePlan(defaultPlan)
    previous.adults[0].currentAge = 45
    previous.adults[1].currentAge = 40
    previous.children = [{ id: 'child-1', name: '子ども1', currentAge: 7 }]
    previous.events = [
      { id: 'school-primary', name: '国际学校学费', memberId: 'child-1', type: 'expense', startYear: 2026, duration: 6, annualAmount: 5_000_000, taxable: false },
      { id: 'home-purchase', name: '购置住房', memberId: null, type: 'expense', startYear: 2036, duration: 1, annualAmount: 40_000_000, taxable: false },
    ]
    localStorage.setItem('life-planner-v2', JSON.stringify(previous))
    const upgraded = loadPlan()
    expect(upgraded.adults[0].currentAge).toBe(35)
    expect(upgraded.children.map((child) => child.currentAge)).toEqual([6, 2])
  })
})
