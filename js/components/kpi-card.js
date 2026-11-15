// KPI 卡片：小標＋大數字＋選填說明
window.GC = window.GC || {};
GC.components = GC.components || {};

GC.components.kpiCard = function ({ label, value, cls = '', hint = '' }) {
  const { esc } = GC.utils;
  return `<div class="card kpi">
    <div class="kpi__label">${esc(label)}</div>
    <div class="kpi__value ${cls}">${esc(value)}</div>
    ${hint ? `<div class="kpi__hint">${esc(hint)}</div>` : ''}
  </div>`;
};
