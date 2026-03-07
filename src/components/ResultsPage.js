import { formatCurrency, buildPlanOutput } from '../engine/calculator.js';
import { createChartsContainer, updateCharts } from './Charts.js';
import { createProjectionTable } from './ProjectionTable.js';

function buildSummaryCards(summary) {
  const retireAgeText = summary.recommendedRetireAge
    ? `${summary.recommendedRetireAge} 岁（建议）`
    : `${summary.plannedRetireAge} 岁（计划）`;

  return `
    <div class="kpi-row kpi-row-5">
      <div class="kpi-card">
        <p class="kpi-label">可退休年龄</p>
        <h2 class="kpi-value">${retireAgeText}</h2>
      </div>
      <div class="kpi-card">
        <p class="kpi-label">退休时资产</p>
        <h2 class="kpi-value">${formatCurrency(summary.retireAsset)}</h2>
      </div>
      <div class="kpi-card">
        <p class="kpi-label">退休后最低资产</p>
        <h2 class="kpi-value">${summary.minAssetYear} / ${formatCurrency(summary.minAsset)}</h2>
      </div>
      <div class="kpi-card">
        <p class="kpi-label">终点余额（95岁）</p>
        <h2 class="kpi-value">${formatCurrency(summary.terminalAsset)}</h2>
      </div>
      <div class="kpi-card">
        <p class="kpi-label">Die with Zero</p>
        <h2 class="kpi-value">${summary.dieWithZeroStatus}</h2>
      </div>
    </div>
  `;
}

export function createResultsPage(setup, events) {
  const container = document.createElement('div');
  container.className = 'assets-layout';

  const output = buildPlanOutput(setup, events);

  container.innerHTML = `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-title">Lifetime Plan <span>Yearly Table + Charts</span></h1>
          <p style="color:#64748b; font-size:0.9rem; margin-top:6px;">核心问题：什么时候能退休、退休后是否安全、终点是否接近 0。</p>
        </div>
      </div>
      ${buildSummaryCards(output.summary)}
      <div id="charts-main-container"></div>
      <div class="table-section">
        <div class="table-header">
          <h3>50年 Lifetime Plan 年度表</h3>
        </div>
        <div id="data-table-wrapper" class="table-wrapper"></div>
      </div>
    </div>
  `;

  const chartsWrapper = container.querySelector('#charts-main-container');
  chartsWrapper.appendChild(createChartsContainer());
  updateCharts(output.projection);

  const tableWrapper = container.querySelector('#data-table-wrapper');
  tableWrapper.appendChild(createProjectionTable(output.projection));

  return container;
}
