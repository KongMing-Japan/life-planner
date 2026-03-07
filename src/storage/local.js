const STORAGE_KEY = 'life-planner-v1';

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizePlan(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (!payload.setup || !Array.isArray(payload.events)) return null;
  return {
    setup: payload.setup,
    events: payload.events,
    scenarioB: payload.scenarioB || null,
    metadata: payload.metadata || {},
  };
}

export function loadAppState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = safeParse(raw);
  if (!parsed) return { version: 1, currentPlan: null, selectedCaseId: null };

  // Backward compatibility: old state only stored setup/events.
  if (parsed.setup && parsed.events) {
    const normalized = normalizePlan(parsed);
    return { version: 1, currentPlan: normalized, selectedCaseId: null };
  }

  return {
    version: 1,
    currentPlan: normalizePlan(parsed.currentPlan),
    selectedCaseId: parsed.selectedCaseId || null,
  };
}

export function saveAppState(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      currentPlan: state.currentPlan || null,
      selectedCaseId: state.selectedCaseId || null,
    })
  );
}

export function savePlan(plan) {
  const state = loadAppState();
  state.currentPlan = normalizePlan(plan);
  saveAppState(state);
}

export function loadPlan() {
  return loadAppState().currentPlan;
}

export function exportPlanJson(plan) {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      plan,
    },
    null,
    2
  );
}

export function importPlanJson(text) {
  const parsed = safeParse(text);
  if (!parsed) throw new Error('Invalid JSON file.');
  const candidate = parsed.plan || parsed;
  const normalized = normalizePlan(candidate);
  if (!normalized) throw new Error('Invalid plan payload: setup/events missing.');
  return normalized;
}
