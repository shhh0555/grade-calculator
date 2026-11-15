// 膠囊標籤：已公布、預估、考試、狀態等
window.GC = window.GC || {};
GC.components = GC.components || {};

GC.components.statusTag = function (text, mod = '') {
  return `<span class="tag ${mod ? `tag--${mod}` : ''}">${GC.utils.esc(text)}</span>`;
};
