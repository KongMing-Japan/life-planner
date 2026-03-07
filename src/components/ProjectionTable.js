import { formatCurrency } from '../engine/calculator.js';

function riskCell(risk) {
  if (risk === 'red') return '<span class="risk-badge risk-red">资产<0</span>';
  if (risk === 'yellow') return '<span class="risk-badge risk-yellow">低于安全线</span>';
  return '<span class="risk-badge risk-green">正常</span>';
}

export function createProjectionTable(projection) {
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';

  table.innerHTML = `
    <thead>
      <tr>
        <th>年份</th>
        <th>年龄(主/配)</th>
        <th>年初资产</th>
        <th>收入(税后)</th>
        <th>支出</th>
        <th>净现金流</th>
        <th>投资收益</th>
        <th>年末资产</th>
        <th>事件</th>
        <th>风险</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');

  projection.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.year}</td>
      <td>${row.person1Age} / ${row.person2Age}</td>
      <td>${formatCurrency(row.startAssets)}</td>
      <td>${formatCurrency(row.totalIncome)}</td>
      <td>${formatCurrency(row.totalExpense)}</td>
      <td style="color: ${row.cashFlow >= 0 ? '#059669' : '#dc2626'}">${formatCurrency(row.cashFlow)}</td>
      <td>${formatCurrency(row.investmentGain)}</td>
      <td style="font-weight:700; color:${row.endAssets < 0 ? '#dc2626' : '#0f172a'}">${formatCurrency(row.endAssets)}</td>
      <td>${row.events.length ? row.events.join(' / ') : '-'}</td>
      <td>${riskCell(row.risk)}</td>
    `;
    tbody.appendChild(tr);
  });

  return table;
}
