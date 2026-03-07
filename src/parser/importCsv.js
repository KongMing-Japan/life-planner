function parseNumber(raw) {
  if (raw == null) return NaN;
  const cleaned = String(raw).replace(/[^0-9.-]/g, '');
  return Number(cleaned);
}

function parseDate(raw) {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function parseTransactionsCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV must contain header + at least 1 row.');

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const amountIndex = headers.findIndex((h) => ['amount', '金額', 'value'].includes(h));
  const dateIndex = headers.findIndex((h) => ['date', '日付', 'transaction_date'].includes(h));
  const categoryIndex = headers.findIndex((h) => ['category', 'カテゴリ'].includes(h));

  if (amountIndex < 0 || dateIndex < 0) {
    throw new Error('CSV header must include date and amount columns.');
  }

  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    return {
      date: parseDate(cols[dateIndex]),
      amount: parseNumber(cols[amountIndex]),
      category: categoryIndex >= 0 ? cols[categoryIndex] : 'uncategorized',
    };
  }).filter((t) => t.date && Number.isFinite(t.amount));
}

export function summarizeExpenses(transactions) {
  const expenses = transactions.filter((t) => t.amount < 0).map((t) => Math.abs(t.amount));
  if (!expenses.length) {
    return { monthlyAverage: 0, annualEstimate: 0, monthsCovered: 0, volatility: 0 };
  }

  const monthMap = new Map();
  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, (monthMap.get(key) || 0) + Math.abs(tx.amount));
  }

  const monthlyTotals = [...monthMap.values()];
  const monthsCovered = monthlyTotals.length;
  const monthlyAverage = monthlyTotals.reduce((a, b) => a + b, 0) / monthsCovered;
  const annualEstimate = monthlyAverage * 12;
  const mean = monthlyAverage;
  const variance = monthlyTotals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / monthsCovered;

  return {
    monthlyAverage,
    annualEstimate,
    monthsCovered,
    volatility: Math.sqrt(variance),
  };
}
