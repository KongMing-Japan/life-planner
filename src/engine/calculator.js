/**
 * Deterministic yearly planning engine for FIRE + Die With Zero.
 * All functions are pure and side-effect free.
 */

function activeEventAmount(event, year) {
  return year >= event.year && year < event.year + (event.duration || 1) ? event.amount : 0;
}

function getCurrentYear() {
  return new Date().getFullYear();
}

export function calculateIncome(year, setup, events) {
  const p1RetireYear = setup.Person1_Birth_Year + setup.Person1_Retire_Age;
  const p2RetireYear = setup.Person2_Birth_Year + setup.Person2_Retire_Age;

  let salaryIncome = 0;
  if (year < p1RetireYear) salaryIncome += setup.Person1_Salary_Start || 0;
  if (year < p2RetireYear) salaryIncome += setup.Person2_Salary_Start || 0;

  let pensionIncome = 0;
  const p1Age = year - setup.Person1_Birth_Year;
  const p2Age = year - setup.Person2_Birth_Year;
  if (p1Age >= (setup.Person1_Pension_Start_Age || setup.Person1_Retire_Age || 65)) {
    pensionIncome += setup.Person1_Pension_Income || 0;
  }
  if (p2Age >= (setup.Person2_Pension_Start_Age || setup.Person2_Retire_Age || 65)) {
    pensionIncome += setup.Person2_Pension_Income || 0;
  }

  let eventIncome = 0;
  for (const event of events) {
    const amount = activeEventAmount(event, year);
    if (amount > 0) eventIncome += amount;
  }

  return salaryIncome + pensionIncome + eventIncome;
}

function calculateBaseExpense(year, setup) {
  const startYear = setup.Start_Year || getCurrentYear();
  const inflation = setup.Inflation || 0;
  const yearsFromStart = Math.max(0, year - startYear);
  const inflator = (1 + inflation) ** yearsFromStart;

  const householdRetireYear = Math.min(
    setup.Person1_Birth_Year + setup.Person1_Retire_Age,
    setup.Person2_Birth_Year + setup.Person2_Retire_Age
  );

  const living = year < householdRetireYear ? (setup.Living_Annual_Pre || 0) : (setup.Living_Annual_Post || 0);
  const housing = year < householdRetireYear ? (setup.Housing_Annual_Pre || 0) : (setup.Housing_Annual_Post || 0);
  const travel = setup.Travel_Annual || 0;

  let medical = 0;
  const p1Age = year - setup.Person1_Birth_Year;
  const p2Age = year - setup.Person2_Birth_Year;
  if (p1Age >= (setup.Person1_Medical_Start_Age || 70)) medical += setup.Person1_Medical_Annual || 0;
  if (p2Age >= (setup.Person2_Medical_Start_Age || 70)) medical += setup.Person2_Medical_Annual || 0;

  return (living + housing + travel + medical) * inflator;
}

export function calculateExpense(year, setup, events) {
  let eventExpense = 0;
  for (const event of events) {
    const amount = activeEventAmount(event, year);
    if (amount < 0) eventExpense += Math.abs(amount);
  }

  return calculateBaseExpense(year, setup) + eventExpense;
}

export function calculateTax(year, setup, events) {
  if (setup.Income_Is_After_Tax) return 0;
  const effectiveRate = setup.Income_Tax_Rate || 0;
  return calculateIncome(year, setup, events) * effectiveRate;
}

export function calculateNetCashFlow(year, setup, events) {
  const grossIncome = calculateIncome(year, setup, events);
  const tax = calculateTax(year, setup, events);
  const expense = calculateExpense(year, setup, events);
  return grossIncome - tax - expense;
}

export function calculateProjectionYears(setup) {
  const startYear = setup.Start_Year || getCurrentYear();
  const endAge = setup.End_Age || 95;
  const p1Years = endAge - (startYear - setup.Person1_Birth_Year);
  const p2Years = endAge - (startYear - setup.Person2_Birth_Year);
  const minYears = Math.max(1, Math.max(p1Years, p2Years));
  return Math.max(setup.Years || 0, minYears);
}

export function generateProjection(setup, events) {
  const projection = [];
  const years = calculateProjectionYears(setup);
  const startYear = setup.Start_Year || getCurrentYear();
  const returnRate = setup.Invest_Return || 0;
  const safetyBufferYears = setup.Safety_Buffer_Years || 1;

  let assets = setup.Initial_Asset || 0;

  for (let i = 0; i < years; i++) {
    const year = startYear + i;
    const age1 = year - setup.Person1_Birth_Year;
    const age2 = year - setup.Person2_Birth_Year;

    const grossIncome = calculateIncome(year, setup, events);
    const tax = calculateTax(year, setup, events);
    const totalIncome = grossIncome - tax;
    const totalExpense = calculateExpense(year, setup, events);
    const cashFlow = totalIncome - totalExpense;

    const startAssets = assets;
    const investmentGain = (startAssets + cashFlow) * returnRate;
    const endAssets = startAssets + cashFlow + investmentGain;
    assets = endAssets;

    const eventNotes = events
      .filter((event) => activeEventAmount(event, year) !== 0)
      .map((event) => event.note || 'Event');

    const safetyLine = totalExpense * safetyBufferYears;
    const risk = endAssets < 0 ? 'red' : endAssets < safetyLine ? 'yellow' : 'green';

    projection.push({
      year,
      person1Age: age1,
      person2Age: age2,
      childAge: year - (setup.Child1_Birth_Year || year),
      grossIncome,
      tax,
      totalIncome,
      income: totalIncome,
      totalExpense,
      expense: totalExpense,
      cashFlow,
      netCashFlow: cashFlow,
      startAssets,
      investmentGain,
      endAssets,
      asset: endAssets,
      age1,
      age2,
      events: eventNotes,
      risk,
    });
  }

  return projection;
}

function findRetireAsset(projection, retireYear) {
  const row = projection.find((p) => p.year === retireYear);
  return row ? row.endAssets : null;
}

function recommendRetireAge(setup, events) {
  const currentAge = (setup.Start_Year || getCurrentYear()) - setup.Person1_Birth_Year;
  const maxAge = 75;

  for (let age = Math.max(currentAge, 45); age <= maxAge; age++) {
    const candidate = {
      ...setup,
      Person1_Retire_Age: age,
      Person2_Retire_Age: Math.max(45, age - (setup.Person1_Birth_Year - setup.Person2_Birth_Year)),
    };
    const projection = generateProjection(candidate, events);
    const bankrupt = projection.some((p) => p.endAssets < 0);
    if (!bankrupt) return age;
  }

  return null;
}

export function summarizeProjection(projection, setup, events) {
  if (!projection.length) {
    return {
      plannedRetireAge: setup.Person1_Retire_Age,
      recommendedRetireAge: null,
      retireYear: null,
      retireAsset: 0,
      minAssetYear: null,
      minAsset: 0,
      terminalAsset: 0,
      maxDeficitYear: null,
      maxDeficitAmount: 0,
      dieWithZeroStatus: '偏低(破产)',
      hasBankruptcy: true,
    };
  }

  const plannedRetireAge = setup.Person1_Retire_Age;
  const retireYear = setup.Person1_Birth_Year + plannedRetireAge;
  const retireAsset = findRetireAsset(projection, retireYear);

  const minRow = projection.reduce((acc, row) => (row.endAssets < acc.endAssets ? row : acc), projection[0]);
  const deficitRow = projection.reduce((acc, row) => (row.cashFlow < acc.cashFlow ? row : acc), projection[0]);
  const terminalRow = projection[projection.length - 1];
  const hasBankruptcy = projection.some((row) => row.endAssets < 0);

  const annualExpenseAtEnd = terminalRow.totalExpense || 1;
  let dieWithZeroStatus = '偏高';
  if (terminalRow.endAssets < 0) dieWithZeroStatus = '偏低(破产)';
  else if (terminalRow.endAssets <= annualExpenseAtEnd) dieWithZeroStatus = '接近0';

  return {
    plannedRetireAge,
    recommendedRetireAge: recommendRetireAge(setup, events),
    retireYear,
    retireAsset: retireAsset ?? terminalRow.endAssets,
    minAssetYear: minRow.year,
    minAsset: minRow.endAssets,
    terminalYear: terminalRow.year,
    terminalAsset: terminalRow.endAssets,
    maxDeficitYear: deficitRow.year,
    maxDeficitAmount: deficitRow.cashFlow,
    dieWithZeroStatus,
    hasBankruptcy,
  };
}

export function buildPlanOutput(setup, events) {
  const projection = generateProjection(setup, events);
  const summary = summarizeProjection(projection, setup, events);
  return { projection, summary };
}

export function formatCurrency(value) {
  const num = Number(value || 0);
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 100000000) return `${sign}¥${(abs / 100000000).toFixed(2)}億`;
  if (abs >= 10000) return `${sign}¥${(abs / 10000).toFixed(0)}万`;
  return `${sign}¥${Math.round(abs).toLocaleString('ja-JP')}`;
}

export function formatPercent(value) {
  return `${((value || 0) * 100).toFixed(1)}%`;
}
