import { defaultSetup } from './data/defaults.js';
import sampleCases from './data/cases.json';
import { createResultsPage } from './components/ResultsPage.js';
import { createEventsForm } from './components/EventsForm.js';
import { buildPlanOutput, formatCurrency } from './engine/calculator.js';
import { loadAppState, saveAppState, exportPlanJson, importPlanJson } from './storage/local.js';
import { cloneScenario, applyWhatIf, compareScenarioAtoB } from './engine/scenario.js';
import { parseTransactionsCsv, summarizeExpenses } from './parser/importCsv.js';

const state = {
  currentPlan: null,
  selectedCaseId: null,
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function materializeCase(caseData) {
  return {
    setup: { ...defaultSetup, ...deepClone(caseData.setup || {}) },
    events: deepClone(caseData.events || []),
    scenarioB: null,
    metadata: {
      sourceCaseId: caseData.id,
      quickStartComplete: false,
    },
  };
}

function ensurePlan() {
  if (state.currentPlan) return;
  const fallback = sampleCases[0];
  state.currentPlan = materializeCase(fallback);
  state.selectedCaseId = fallback.id;
}

function persistState() {
  saveAppState({
    currentPlan: state.currentPlan,
    selectedCaseId: state.selectedCaseId,
  });
}

function navigate(path) {
  if (window.location.pathname !== path) {
    history.pushState({}, '', path);
  }
  render();
}

function getRoute() {
  const path = window.location.pathname || '/';
  if (path.startsWith('/case/')) return { name: 'case', id: decodeURIComponent(path.replace('/case/', '')) };
  if (path === '/plan') return { name: 'plan' };
  if (path === '/import') return { name: 'import' };
  if (path === '/about') return { name: 'about' };
  return { name: 'home' };
}

function buildHeader(routeName) {
  const shell = document.createElement('div');
  shell.className = 'site-shell';
  shell.innerHTML = `
    <header class="site-header">
      <div class="site-brand" data-link="/">FIRE & Die-with-Zero Planner</div>
      <nav class="site-nav">
        <button class="nav-link ${routeName === 'home' ? 'active' : ''}" data-link="/">Samples</button>
        <button class="nav-link ${routeName === 'plan' ? 'active' : ''}" data-link="/plan">My Plan</button>
        <button class="nav-link ${routeName === 'import' ? 'active' : ''}" data-link="/import">Import</button>
        <button class="nav-link ${routeName === 'about' ? 'active' : ''}" data-link="/about">About</button>
      </nav>
    </header>
    <main id="route-view" class="route-view"></main>
  `;
  return shell;
}

function caseResultLine(plan) {
  const output = buildPlanOutput(plan.setup, plan.events);
  const retireAge = output.summary.recommendedRetireAge || output.summary.plannedRetireAge;
  return `预计 ${retireAge} 岁可退休 / 最低余额 ${output.summary.minAssetYear} / 95岁余额 ${formatCurrency(
    output.summary.terminalAsset
  )}`;
}

function renderHome(view) {
  const container = document.createElement('section');
  container.className = 'page page-home';

  container.innerHTML = `
    <div class="page-hero">
      <h1>先看案例，再做自己的 50 年 Lifetime Plan</h1>
      <p>默认展示 10 个样例，不用填表就能理解表格与结论。</p>
    </div>
    <div class="case-grid" id="case-grid"></div>
  `;

  const grid = container.querySelector('#case-grid');

  sampleCases.forEach((caseData) => {
    const card = document.createElement('article');
    card.className = 'case-card';

    const plan = materializeCase(caseData);
    const p1Age = plan.setup.Start_Year - plan.setup.Person1_Birth_Year;
    const annualIncome = plan.setup.Person1_Salary_Start + plan.setup.Person2_Salary_Start;
    const annualExpense = plan.setup.Living_Annual_Pre + plan.setup.Housing_Annual_Pre + plan.setup.Travel_Annual;

    card.innerHTML = `
      <div class="case-top">
        <h3>${caseData.name}</h3>
        <p>${caseData.headline || ''}</p>
      </div>
      <div class="case-tags">${(caseData.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join('')}</div>
      <div class="case-metrics">
        <div><span>年龄/结构</span><strong>${p1Age}岁 / ${caseData.household}</strong></div>
        <div><span>年收入</span><strong>${formatCurrency(annualIncome)}</strong></div>
        <div><span>年支出</span><strong>${formatCurrency(annualExpense)}</strong></div>
        <div><span>初始资产</span><strong>${formatCurrency(plan.setup.Initial_Asset)}</strong></div>
        <div><span>目标退休年龄</span><strong>${plan.setup.Person1_Retire_Age}岁</strong></div>
      </div>
      <p class="case-result">${caseResultLine(plan)}</p>
      <div class="case-actions">
        <button class="btn btn-primary" data-link="/case/${caseData.id}">查看详情</button>
      </div>
    `;

    grid.appendChild(card);
  });

  view.appendChild(container);
}

function renderCaseDetail(view, caseId) {
  const caseData = sampleCases.find((c) => c.id === caseId);
  if (!caseData) {
    view.innerHTML = `<section class="page"><h2>案例不存在</h2></section>`;
    return;
  }

  const plan = materializeCase(caseData);
  const section = document.createElement('section');
  section.className = 'page';

  section.innerHTML = `
    <div class="page-hero page-hero-compact">
      <h1>${caseData.name}</h1>
      <p>${caseData.headline}</p>
      <div class="hero-actions">
        <button class="btn" data-link="/">返回案例库</button>
        <button class="btn btn-primary" id="copy-case-btn">用这个案例开始（Copy & Edit）</button>
      </div>
    </div>
    <div id="case-results"></div>
  `;

  section.querySelector('#copy-case-btn').addEventListener('click', () => {
    state.currentPlan = materializeCase(caseData);
    state.selectedCaseId = caseData.id;
    persistState();
    navigate('/plan');
  });

  section.querySelector('#case-results').appendChild(createResultsPage(plan.setup, plan.events));
  view.appendChild(section);
}

function buildFieldRow(label, key, value, suffix = '') {
  return `
    <label class="field-row">
      <span>${label}</span>
      <input type="number" data-key="${key}" value="${Math.round(value)}" />
      <em>${suffix}</em>
    </label>
  `;
}

function renderScenarioSection(container, plan) {
  const section = document.createElement('section');
  section.className = 'plan-block';
  section.innerHTML = `
    <div class="block-header">
      <h3>Scenario A/B 对比</h3>
      <div class="inline-actions">
        <button class="btn" id="copy-sb">复制当前为 Scenario B</button>
      </div>
    </div>
    <div class="inline-actions wrap">
      <button class="btn btn-chip" data-action="retire+1">退休年龄 +1</button>
      <button class="btn btn-chip" data-action="retire-1">退休年龄 -1</button>
      <button class="btn btn-chip" data-action="expense-5">支出 -5%</button>
      <button class="btn btn-chip" data-action="expense+5">支出 +5%</button>
      <button class="btn btn-chip" data-action="save+5">收益率 +0.5%</button>
      <button class="btn btn-chip" data-action="delay-event-1">首个事件延后1年</button>
    </div>
    <div id="scenario-result" class="scenario-result">尚未创建 Scenario B。</div>
  `;

  const resultEl = section.querySelector('#scenario-result');

  function refreshScenarioResult() {
    if (!plan.scenarioB) {
      resultEl.textContent = '尚未创建 Scenario B。';
      return;
    }
    const compare = compareScenarioAtoB(plan, plan.scenarioB);
    resultEl.innerHTML = `
      <div>终点资产差异：<strong>${formatCurrency(compare.deltaTerminalAsset)}</strong></div>
      <div>最低资产差异：<strong>${formatCurrency(compare.deltaMinAsset)}</strong></div>
      <div>可退休年龄差异：<strong>${compare.deltaRetireAge >= 0 ? '+' : ''}${compare.deltaRetireAge} 岁</strong></div>
      <div>A: ${compare.summaryA.dieWithZeroStatus} / B: ${compare.summaryB.dieWithZeroStatus}</div>
    `;
  }

  section.querySelector('#copy-sb').addEventListener('click', () => {
    plan.scenarioB = cloneScenario({ setup: plan.setup, events: plan.events, metadata: plan.metadata });
    state.currentPlan = plan;
    persistState();
    refreshScenarioResult();
  });

  section.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!plan.scenarioB) return;
      plan.scenarioB = applyWhatIf(plan.scenarioB, btn.dataset.action);
      state.currentPlan = plan;
      persistState();
      refreshScenarioResult();
    });
  });

  refreshScenarioResult();
  container.appendChild(section);
}

function renderPlan(view) {
  ensurePlan();
  const plan = state.currentPlan;

  const page = document.createElement('section');
  page.className = 'page page-plan';
  page.innerHTML = `
    <div class="page-hero page-hero-compact">
      <h1>My Plan</h1>
      <p>先回答 3-5 个问题，再逐步补全；改参数会立刻重算。</p>
    </div>

    <section class="plan-block" id="quick-start-block">
      <div class="block-header"><h3>Quick Start（3-5问）</h3></div>
      <form id="quick-start-form" class="quick-grid">
        <label><span>当前年龄</span><input type="number" name="age" value="${plan.setup.Start_Year - plan.setup.Person1_Birth_Year}" /></label>
        <label>
          <span>家庭结构</span>
          <select name="familyType">
            <option value="single" ${plan.setup.Person2_Salary_Start > 0 ? '' : 'selected'}>单身</option>
            <option value="family" ${plan.setup.Person2_Salary_Start > 0 ? 'selected' : ''}>家庭</option>
          </select>
        </label>
        <label><span>年收入（税前）</span><input type="number" name="income" value="${plan.setup.Person1_Salary_Start + plan.setup.Person2_Salary_Start}" /></label>
        <label><span>年支出</span><input type="number" name="expense" value="${plan.setup.Living_Annual_Pre + plan.setup.Housing_Annual_Pre + plan.setup.Travel_Annual}" /></label>
        <label><span>当前可投资资产</span><input type="number" name="asset" value="${plan.setup.Initial_Asset}" /></label>
        <label><span>想几岁退休</span><input type="number" name="retireAge" value="${plan.setup.Person1_Retire_Age}" /></label>
        <label><span>退休后每年想花</span><input type="number" name="retireExpense" value="${plan.setup.Living_Annual_Post + plan.setup.Housing_Annual_Post + plan.setup.Travel_Annual}" /></label>
        <button class="btn btn-primary" type="submit">生成我的版本</button>
      </form>
    </section>

    <section class="plan-block">
      <div class="block-header"><h3>核心参数编辑</h3></div>
      <div class="edit-grid" id="edit-grid"></div>
    </section>

    <section class="plan-block">
      <div class="block-header"><h3>事件系统（Events）</h3></div>
      <div id="events-editor"></div>
    </section>

    <div id="scenario-wrap"></div>

    <section class="plan-block">
      <div class="block-header"><h3>Lifetime Plan 输出</h3></div>
      <div id="plan-results"></div>
    </section>
  `;

  const resultsHost = page.querySelector('#plan-results');
  const editGrid = page.querySelector('#edit-grid');

  function refreshResults() {
    resultsHost.innerHTML = '';
    resultsHost.appendChild(createResultsPage(plan.setup, plan.events));
  }

  function syncPlan() {
    state.currentPlan = plan;
    persistState();
    refreshResults();
  }

  page.querySelector('#quick-start-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const age = Number(fd.get('age') || 30);
    const familyType = String(fd.get('familyType') || 'single');
    const income = Number(fd.get('income') || 0);
    const expense = Number(fd.get('expense') || 0);
    const asset = Number(fd.get('asset') || 0);
    const retireAge = Number(fd.get('retireAge') || 65);
    const retireExpense = Number(fd.get('retireExpense') || 0);

    plan.setup.Person1_Birth_Year = plan.setup.Start_Year - age;
    plan.setup.Initial_Asset = asset;
    plan.setup.Person1_Retire_Age = retireAge;
    plan.setup.Person2_Retire_Age = retireAge;

    if (familyType === 'family') {
      plan.setup.Person1_Salary_Start = income * 0.6;
      plan.setup.Person2_Salary_Start = income * 0.4;
    } else {
      plan.setup.Person1_Salary_Start = income;
      plan.setup.Person2_Salary_Start = 0;
    }

    plan.setup.Living_Annual_Pre = expense * 0.7;
    plan.setup.Housing_Annual_Pre = expense * 0.25;
    plan.setup.Travel_Annual = expense * 0.05;

    plan.setup.Living_Annual_Post = retireExpense * 0.7;
    plan.setup.Housing_Annual_Post = retireExpense * 0.2;

    plan.metadata.quickStartComplete = true;
    syncPlan();
  });

  const editFields = [
    ['起始年份', 'Start_Year', plan.setup.Start_Year, 'year'],
    ['规划终点年龄', 'End_Age', plan.setup.End_Age || 95, 'age'],
    ['初始资产', 'Initial_Asset', plan.setup.Initial_Asset, '¥'],
    ['年化收益率(%)', 'Invest_Return', plan.setup.Invest_Return * 100, '%'],
    ['通胀率(%)', 'Inflation', plan.setup.Inflation * 100, '%'],
    ['税率(%)', 'Income_Tax_Rate', plan.setup.Income_Tax_Rate * 100, '%'],
    ['退休后P1年金', 'Person1_Pension_Income', plan.setup.Person1_Pension_Income, '¥'],
    ['退休后P2年金', 'Person2_Pension_Income', plan.setup.Person2_Pension_Income, '¥'],
    ['退休前住房支出', 'Housing_Annual_Pre', plan.setup.Housing_Annual_Pre, '¥'],
    ['退休后住房支出', 'Housing_Annual_Post', plan.setup.Housing_Annual_Post, '¥'],
  ];

  editGrid.innerHTML = editFields.map(([label, key, value, suffix]) => buildFieldRow(label, key, value, suffix)).join('');

  editGrid.querySelectorAll('input[data-key]').forEach((input) => {
    input.addEventListener('change', () => {
      const key = input.dataset.key;
      const raw = Number(input.value || 0);
      plan.setup[key] = ['Invest_Return', 'Inflation', 'Income_Tax_Rate'].includes(key) ? raw / 100 : raw;
      syncPlan();
    });
  });

  const eventsHost = page.querySelector('#events-editor');
  const eventsForm = createEventsForm(
    plan.events,
    (event) => {
      plan.events.push(event);
      syncPlan();
      render();
    },
    (index) => {
      plan.events.splice(index, 1);
      syncPlan();
      render();
    },
    () => {}
  );
  eventsHost.appendChild(eventsForm);

  renderScenarioSection(page.querySelector('#scenario-wrap'), plan);
  refreshResults();

  view.appendChild(page);
}

function downloadFile(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function renderImport(view) {
  ensurePlan();

  const page = document.createElement('section');
  page.className = 'page';
  page.innerHTML = `
    <div class="page-hero page-hero-compact">
      <h1>Import / Export</h1>
      <p>支持本地 CSV 支出导入、JSON 导出/导入，默认不上传到服务器。</p>
    </div>

    <section class="plan-block">
      <div class="block-header"><h3>导入 CSV（账单）</h3></div>
      <input type="file" id="csv-input" accept=".csv" />
      <div id="csv-result" class="scenario-result">上传 CSV 后会估算月均与年支出。</div>
      <button class="btn" id="apply-csv" disabled>应用到 My Plan 支出</button>
    </section>

    <section class="plan-block">
      <div class="block-header"><h3>导入 / 导出 JSON</h3></div>
      <div class="inline-actions">
        <button class="btn btn-primary" id="export-json">导出当前计划 JSON</button>
        <input type="file" id="json-input" accept=".json" />
      </div>
      <div id="json-result" class="scenario-result">可用于换设备恢复或分享。</div>
    </section>
  `;

  const csvResult = page.querySelector('#csv-result');
  const applyCsvBtn = page.querySelector('#apply-csv');
  let latestCsvSummary = null;

  page.querySelector('#csv-input').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const tx = parseTransactionsCsv(text);
      latestCsvSummary = summarizeExpenses(tx);
      csvResult.innerHTML = `
        <div>覆盖月份：${latestCsvSummary.monthsCovered}</div>
        <div>月均支出：${formatCurrency(latestCsvSummary.monthlyAverage)}</div>
        <div>估算年支出：${formatCurrency(latestCsvSummary.annualEstimate)}</div>
        <div>波动（标准差）：${formatCurrency(latestCsvSummary.volatility)}</div>
      `;
      applyCsvBtn.disabled = false;
    } catch (error) {
      csvResult.textContent = `CSV 解析失败：${error.message}`;
      applyCsvBtn.disabled = true;
    }
  });

  applyCsvBtn.addEventListener('click', () => {
    if (!latestCsvSummary || !state.currentPlan) return;
    state.currentPlan.setup.Living_Annual_Pre = latestCsvSummary.annualEstimate * 0.72;
    state.currentPlan.setup.Housing_Annual_Pre = latestCsvSummary.annualEstimate * 0.23;
    state.currentPlan.setup.Travel_Annual = latestCsvSummary.annualEstimate * 0.05;
    persistState();
    csvResult.innerHTML += '<div><strong>已回填到 My Plan 基础支出。</strong></div>';
  });

  page.querySelector('#export-json').addEventListener('click', () => {
    const payload = exportPlanJson(state.currentPlan);
    downloadFile('life-planner-plan.json', payload);
  });

  const jsonResult = page.querySelector('#json-result');
  page.querySelector('#json-input').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = importPlanJson(text);
      state.currentPlan = imported;
      persistState();
      jsonResult.innerHTML = '<strong>JSON 导入成功。</strong> 将跳转到 My Plan。';
      setTimeout(() => navigate('/plan'), 300);
    } catch (error) {
      jsonResult.textContent = `JSON 导入失败：${error.message}`;
    }
  });

  view.appendChild(page);
}

function renderAbout(view) {
  const page = document.createElement('section');
  page.className = 'page';
  page.innerHTML = `
    <div class="page-hero page-hero-compact">
      <h1>Method</h1>
      <p>采用年度现金流 + 资产滚动法（确定性路径），用于快速决策而非税务申报。</p>
    </div>

    <section class="plan-block">
      <ul class="about-list">
        <li>年度模型：税后收入、支出、净现金流、年末资产。</li>
        <li>退休后工资归零，可叠加养老金/年金。</li>
        <li>Die with Zero：终点资产在 0~1 年支出区间视为“接近 0”。</li>
        <li>风险提示：资产为负（红）/低于安全线（黄）。</li>
        <li>MVP 默认本地存储，不做账号系统与云端同步。</li>
      </ul>
    </section>
  `;

  view.appendChild(page);
}

function render() {
  const root = document.querySelector('.main .container');
  if (!root) return;

  ensurePlan();

  const route = getRoute();
  const shell = buildHeader(route.name);
  const view = shell.querySelector('#route-view');

  if (route.name === 'home') renderHome(view);
  else if (route.name === 'case') renderCaseDetail(view, route.id);
  else if (route.name === 'plan') renderPlan(view);
  else if (route.name === 'import') renderImport(view);
  else renderAbout(view);

  root.innerHTML = '';
  root.appendChild(shell);
}

function initRouter() {
  window.addEventListener('popstate', render);
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-link]');
    if (!target) return;
    event.preventDefault();
    navigate(target.dataset.link);
  });
}

function init() {
  const saved = loadAppState();
  state.currentPlan = saved.currentPlan;
  state.selectedCaseId = saved.selectedCaseId;

  ensurePlan();
  persistState();
  initRouter();
  render();
}

document.addEventListener('DOMContentLoaded', init);
