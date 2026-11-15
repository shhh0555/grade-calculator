// 步驟 2：新增科目
window.GC = window.GC || {};
GC.steps = GC.steps || {};

GC.steps.courses = {
  render(view, app) {
    const { esc, num, uid } = GC.utils;
    const { config } = GC;
    const s = app.state;

    view.innerHTML = `
      <header class="step-head">
        <p class="step-head__eyebrow">步驟 2 / 4</p>
        <h1>新增科目</h1>
        <p class="sub">把這學期修的課都加進來，通識和外系課也算，它們同樣會列入平均。</p>
      </header>
      <div class="stack" id="list"></div>
      <button class="btn btn--ghost" type="button" data-act="add" style="margin-top:12px;width:100%">＋ 新增科目</button>
      <div id="err"></div>
      <div class="step-nav">
        <a class="btn" href="#/setup">上一步</a>
        <button class="btn btn--primary" type="button" data-act="next">下一步：輸入評分項目</button>
      </div>`;

    const list = view.querySelector('#list');

    function newCourse() {
      return {
        id: uid('c'), name: '', credits: config.DEFAULT_CREDITS, category: 'required',
        considerDrop: false, threshold: null, items: [],
      };
    }

    function card(c, i) {
      const showThreshold = s.goal.useThreshold || c.threshold != null;
      const cats = Object.entries(config.CATEGORIES)
        .map(([k, v]) => `<option value="${k}" ${c.category === k ? 'selected' : ''}>${v}</option>`).join('');
      return `<div class="card" data-id="${esc(c.id)}">
        <div class="course-form__head">
          <span class="course-form__no">科目 ${i + 1}</span>
          <div class="course-form__tools">
            <button class="btn btn--text" type="button" data-act="up" aria-label="上移" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn btn--text" type="button" data-act="down" aria-label="下移" ${i === s.courses.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="btn btn--text btn--danger" type="button" data-act="del">刪除</button>
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label for="name-${esc(c.id)}">科目名稱</label>
            <input class="input" id="name-${esc(c.id)}" data-f="name" type="text" placeholder="例如 微積分" value="${esc(c.name)}">
          </div>
          <div class="field">
            <label for="cr-${esc(c.id)}">學分</label>
            <input class="input" id="cr-${esc(c.id)}" data-f="credits" type="number" min="0" max="${config.MAX_CREDITS}" step="1" value="${esc(c.credits)}">
            <p class="hint">不計學分的課填 0，不會列入平均。</p>
          </div>
          <div class="field">
            <label for="cat-${esc(c.id)}">類別</label>
            <select class="select" id="cat-${esc(c.id)}" data-f="category">${cats}</select>
          </div>
          ${showThreshold ? `<div class="field">
            <label for="th-${esc(c.id)}">單科門檻（選填）</label>
            <input class="input" id="th-${esc(c.id)}" data-f="threshold" type="number" min="0" max="100" step="1" placeholder="例如 70" value="${esc(c.threshold ?? '')}">
            <p class="hint">這科至少要拿到的分數，結果頁會反推剩下要考幾分。</p>
          </div>` : ''}
        </div>
        <label class="chk" style="margin-top:8px"><input type="checkbox" data-f="considerDrop" ${c.considerDrop ? 'checked' : ''}>
          考慮停修這科 <span class="hint">結果頁會幫你比較停修前後的平均</span></label>
      </div>`;
    }

    function renderList(focusId) {
      list.innerHTML = s.courses.length
        ? s.courses.map(card).join('')
        : '<div class="card sub">還沒有科目，按下方「新增科目」開始。</div>';
      if (focusId) view.querySelector(`#name-${CSS.escape(focusId)}`)?.focus();
    }

    // 第一次進來直接給一張空白卡片，少按一次
    if (!s.courses.length) {
      s.courses.push(newCourse());
      app.save();
    }
    renderList();

    list.addEventListener('input', (e) => {
      const t = e.target;
      const box = t.closest('[data-id]');
      if (!box || !t.dataset.f) return;
      const c = s.courses.find((x) => x.id === box.dataset.id);
      const f = t.dataset.f;
      if (f === 'name') c.name = t.value.trim();
      if (f === 'credits') c.credits = num(t.value);
      if (f === 'category') c.category = t.value;
      if (f === 'threshold') c.threshold = num(t.value);
      if (f === 'considerDrop') c.considerDrop = t.checked;
      app.save();
    });

    list.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const i = s.courses.findIndex((x) => x.id === btn.closest('[data-id]').dataset.id);
      const c = s.courses[i];
      if (btn.dataset.act === 'del') {
        if (c.items.length && !confirm(`「${c.name || '未命名'}」已經填了評分項目，確定要刪除嗎？`)) return;
        s.courses.splice(i, 1);
      }
      if (btn.dataset.act === 'up' && i > 0) [s.courses[i - 1], s.courses[i]] = [s.courses[i], s.courses[i - 1]];
      if (btn.dataset.act === 'down' && i < s.courses.length - 1) [s.courses[i + 1], s.courses[i]] = [s.courses[i], s.courses[i + 1]];
      app.save();
      renderList();
    });

    view.querySelector('[data-act="add"]').addEventListener('click', () => {
      const c = newCourse();
      s.courses.push(c);
      app.save();
      renderList(c.id);
    });

    view.querySelector('[data-act="next"]').addEventListener('click', () => {
      const errors = [];
      if (!s.courses.length) errors.push('至少要新增一個科目');
      s.courses.forEach((c, i) => {
        const label = c.name || `科目 ${i + 1}`;
        if (!c.name) errors.push(`科目 ${i + 1} 還沒填名稱`);
        if (c.credits == null || c.credits < 0 || c.credits > config.MAX_CREDITS) errors.push(`${esc(label)} 的學分請填 0–${config.MAX_CREDITS}`);
        if (c.threshold != null && (c.threshold < 0 || c.threshold > 100)) errors.push(`${esc(label)} 的門檻請填 0–100`);
      });
      if (errors.length) {
        view.querySelector('#err').innerHTML = `<div class="alert" role="alert"><ul>${errors.map((m) => `<li>${m}</li>`).join('')}</ul></div>`;
        return;
      }
      app.ui.itemsCourse = 0;
      app.go('items');
    });
  },
};
