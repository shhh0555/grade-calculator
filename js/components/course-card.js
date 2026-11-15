// 結果頁的單科卡片：已公布灰色固定，未公布用拉桿調整（版面沿用參考檔）
window.GC = window.GC || {};
GC.components = GC.components || {};

GC.components.courseCard = function (course) {
  const { esc } = GC.utils;
  const { statusTag } = GC.components;
  const { ITEM_TYPES, CATEGORIES } = GC.config;

  const rows = course.items.map((it) => {
    const tags = [
      it.type === 'exam' ? statusTag(ITEM_TYPES.exam, 'exam') : '',
      it.released ? statusTag('已公布') : statusTag('預估'),
    ].join(' ');
    const val = Number(it.score) || 0;
    const control = it.released
      ? ''
      : `<input type="range" min="0" max="100" step="1" value="${Math.min(100, Math.max(0, val))}"
           data-course="${esc(course.id)}" data-item="${esc(it.id)}" aria-label="${esc(it.name)} 預估分數">`;
    return `<div class="row ${it.released ? 'row--fixed' : ''}">
      <div>${esc(it.name || '未命名項目')} <span class="row__weight">${esc(it.weight)}%</span> ${tags}</div>
      <div>${control}</div>
      <div class="row__val" id="v-${esc(course.id)}-${esc(it.id)}">${val}</div>
    </div>`;
  }).join('');

  const meta = [
    `學分 <input class="input" type="number" min="0" max="${GC.config.MAX_CREDITS}" step="1" value="${esc(course.credits)}" data-credits="${esc(course.id)}" aria-label="${esc(course.name)} 學分">`,
    statusTag(CATEGORIES[course.category] || '其他'),
    course.threshold != null ? statusTag(`門檻 ${course.threshold}`) : '',
  ].join(' ');

  return `<div class="card course">
    <h3 class="course__head"><span>${esc(course.name)}</span><span class="course__score" id="sc-${esc(course.id)}"></span></h3>
    <div class="course__meta">${meta}</div>
    ${rows}
  </div>`;
};
