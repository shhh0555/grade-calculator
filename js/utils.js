// 共用小工具：跳脫 HTML、產生 id、數字格式
window.GC = window.GC || {};

GC.utils = {
  // 使用者輸入的文字一律經過這裡再放進 HTML，避免名稱裡的 < > 弄壞畫面
  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  },

  uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  },

  // 空字串回傳 null，讓「沒填」和「填 0」分得開
  num(v) {
    if (v === '' || v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  },

  fmt1(n) {
    if (n == null || !Number.isFinite(n)) return '–';
    const r = Math.round(n * 10) / 10;
    return (r === 0 ? 0 : r).toFixed(1);
  },

  // 需要的分數：超過 100 顯示「> 100」，低於 0 顯示「0」
  fmtNeed(x) {
    if (x == null || !Number.isFinite(x)) return '–';
    if (x > 100) return '> 100';
    if (x <= 0) return '0';
    return GC.utils.fmt1(x);
  },

  // 帶正負號的差距，例如 +0.6、−1.2
  fmtDelta(n) {
    if (n == null || !Number.isFinite(n)) return '–';
    const s = GC.utils.fmt1(Math.abs(n));
    if (s === '0.0') return '0.0';
    return (n > 0 ? '+' : '−') + s;
  },

  joinNames(list) {
    return list.map((c) => c.name || '未命名').join('、');
  },
};
