import { Chart, registerables } from 'chart.js';
import { formatCurrency } from '../engine/calculator.js';

Chart.register(...registerables);

const COLORS = {
  asset: '#2563eb',
  cashFlow: '#059669',
  deficit: '#dc2626',
  grid: '#e2e8f0',
};

let assetChart = null;
let cashFlowChart = null;

function createCard(title, subtitle, id) {
  const card = document.createElement('div');
  card.className = 'card col-6';
  card.innerHTML = `
    <h3 class="card-title">${title} <span>${subtitle}</span></h3>
    <div class="chart-container" style="position: relative; height: 320px;">
      <canvas id="${id}"></canvas>
    </div>
  `;
  return card;
}

export function createChartsContainer() {
  const grid = document.createElement('div');
  grid.className = 'charts-grid charts-grid-two';
  grid.appendChild(createCard('资产余额曲线', 'Assets', 'assetChart'));
  grid.appendChild(createCard('年度净现金流', 'Net Cash Flow', 'cashFlowChart'));
  return grid;
}

export function updateCharts(projection) {
  renderAssetChart(projection);
  renderCashFlowChart(projection);
}

function renderAssetChart(projection) {
  const ctx = document.getElementById('assetChart')?.getContext('2d');
  if (!ctx) return;

  if (assetChart) assetChart.destroy();

  assetChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: projection.map((d) => d.year),
      datasets: [
        {
          label: 'Year-end Assets',
          data: projection.map((d) => d.endAssets),
          borderColor: COLORS.asset,
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          borderWidth: 2,
          tension: 0.2,
          fill: true,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          grid: { color: COLORS.grid },
          ticks: { callback: (val) => formatCurrency(val) },
        },
        x: { grid: { display: false } },
      },
    },
  });
}

function renderCashFlowChart(projection) {
  const ctx = document.getElementById('cashFlowChart')?.getContext('2d');
  if (!ctx) return;

  if (cashFlowChart) cashFlowChart.destroy();

  cashFlowChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: projection.map((d) => d.year),
      datasets: [
        {
          label: 'Net Cash Flow',
          data: projection.map((d) => d.cashFlow),
          backgroundColor: projection.map((d) => (d.cashFlow >= 0 ? COLORS.cashFlow : COLORS.deficit)),
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          grid: { color: COLORS.grid },
          ticks: { callback: (val) => formatCurrency(val) },
        },
        x: { grid: { display: false } },
      },
    },
  });
}
