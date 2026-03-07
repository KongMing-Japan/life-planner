import { buildPlanOutput } from './calculator.js';

export function cloneScenario(plan) {
  return JSON.parse(JSON.stringify(plan));
}

export function applyWhatIf(plan, action) {
  const next = cloneScenario(plan);
  const { setup, events } = next;

  switch (action) {
    case 'retire+1':
      setup.Person1_Retire_Age += 1;
      setup.Person2_Retire_Age += 1;
      break;
    case 'retire-1':
      setup.Person1_Retire_Age = Math.max(45, setup.Person1_Retire_Age - 1);
      setup.Person2_Retire_Age = Math.max(45, setup.Person2_Retire_Age - 1);
      break;
    case 'expense-5':
      setup.Living_Annual_Pre *= 0.95;
      setup.Living_Annual_Post *= 0.95;
      break;
    case 'expense+5':
      setup.Living_Annual_Pre *= 1.05;
      setup.Living_Annual_Post *= 1.05;
      break;
    case 'save+5':
      setup.Invest_Return += 0.005;
      break;
    case 'delay-event-1':
      if (events.length) events[0].year += 1;
      break;
    default:
      break;
  }

  return next;
}

export function compareScenarioAtoB(planA, planB) {
  const outputA = buildPlanOutput(planA.setup, planA.events);
  const outputB = buildPlanOutput(planB.setup, planB.events);

  return {
    summaryA: outputA.summary,
    summaryB: outputB.summary,
    deltaTerminalAsset: outputB.summary.terminalAsset - outputA.summary.terminalAsset,
    deltaMinAsset: outputB.summary.minAsset - outputA.summary.minAsset,
    deltaRetireAge:
      (outputB.summary.recommendedRetireAge || outputB.summary.plannedRetireAge) -
      (outputA.summary.recommendedRetireAge || outputA.summary.plannedRetireAge),
  };
}
