// 步驟 3：各科評分項目與成績
window.GC = window.GC || {};
GC.steps = GC.steps || {};

GC.steps.items = {
  render(view, app) {
    const { esc, num, uid, fmt1 } = GC.utils;
    const { config, calc } = GC;
    const s = app.state;
    if (app.ui.itemsCourse == null || app.ui.itemsCourse >= s.courses.length) app.ui.itemsCourse = 0;

    view.innerHTML = `
      <header class="step-head">
        <p class="step-head__eyebrow">步驟 3 / 4</p>
        <h1>評分項目與成績</h1>
        <p class="sub">照課綱填每科的評分項目和比重。已公布的填實際分數，還沒公布的填你預估會拿到的分數（之後在結果頁還能用拉桿調）。</p>
      </header>
      <div class="tabs" id="tabs" role="tablist" aria-label="切換科目"></div>
      <div id="panel"></div>
      <div id="err"></div>
      <div class="step-nav">
        <a class="btn" href="#/courses">上一步</a>
        <button class="btn btn--primary" type="button" data-act="next">下一步：看分析結果</button>
      </div>`;

    const tabs = view.querySelector('#tabs');
    const panel = view.querySelector('#panel');
    const current = () => s.courses[app.ui.itemsCourse];
    const sumOk = (c) => c.items.length > 0 && Math.abs(calc.weightSum(c) - 100) < 0.01;

    function renderTabs() {
      tabs.innerHTML = s.courses.map((c, i) => `
        <button class="tab ${i === app.ui.itemsCourse ? 'tab--active' : ''}" type="button" role="tab"
          aria-selected="${i === app.ui.itemsCourse}" data-tab="${i}">
          ${esc(c.name || `科目 ${i + 1}`)}<span class="tab__mark" aria-label="${sumOk(c) ? '比重已填滿' : '比重未滿 100%'}">${sumOk(c) ? '✓' : '·'}</span>
        </button>`).join('');
    }

    function row(it) {
      const types = Object.entries(config.ITEM_TYPES)
        .map(([k, v]) => `<option value="${k}" ${it.type === k ? 'selected' : ''}>${v}</option>`).join('');
      return `<div class="item-row ${it.released ? 'item-row--released' : ''}" data-id="${esc(it.id)}">
        <label class="cell cell--name"><span class="cell__label">項目名稱</span>
          <input class="input" data-f="name" type="text" placeholder="例如 期中考" value="${esc(it.name)}"></label>
        <label class="cell cell--weight"><span class="cell__label">比重 %</span>
          <input class="input" data-f="weight" type="number" min="0" max="100" step="0.5" value="${esc(it.weight ?? '')}"></label>
        <label class="cell cell--type"><span class="cell__label">類型</span>
          <select class="select" data-f="type">${types}</select></label>
        <label class="cell cell--status"><span class="cell__label">狀態</span>
          <select class="select" data-f="released">
            <option value="1" ${it.released ? 'selected' : ''}>已公布</option>
            <option value="0" ${!it.released ? 'selected' : ''}>未公布（預估）</option>
          </select></label>
        <label class="cell cell--score"><span class="cell__label">${it.released ? '實際分數' : '預估分數'}</span>
          <input class="input" data-f="score" type="number" min="0" max="100" step="0.5" value="${esc(it.score ?? '')}"></label>
        <div class="cell cell--del"><span class="cell__label">&nbsp;</span>
          <button class="btn btn--text btn--danger" type="button" data-act="del-item" aria-label="刪除這個項目">×</button></div>
      </div>`;
    }

    // 只更新會變動的數字，不重畫輸入框，避免打字時游標跳掉
    function refreshSummary() {
      const c = current();
      const sum = calc.weightSum(c);
      const diff = 100 - sum;
      const status = !c.items.length ? ''
        : Math.abs(diff) < 0.01 ? '<span class="good">剛好 100%</span>'
        : diff > 0 ? `<span class="warn">還差 ${fmt1(diff)}%</span>`
        : `<span class="bad">超過 ${fmt1(-diff)}%</span>`;
      view.querySelector('#wsum').innerHTML = `比重加總 <b class="num">${fmt1(sum)}%</b> ${status}`;
      view.querySelector('#live').textContent = c.items.length ? fmt1(calc.courseScore(c)) : '–';
      renderTabs();
    }

    function renderPanel() {
      const c = current();
      const i = app.ui.itemsCourse;
      const next = s.courses[i + 1];
      panel.innerHTML = `<div class="card">
        <div class="panel-head">
          <h2>${esc(c.name || `科目 ${i + 1}`)}</h2>
          <span class="sub">${esc(c.credits)} 學分</span>
          <span class="panel-head__score">目前試算 <b id="live">–</b> 分</span>
        </div>
        <div class="templates">
          <span class="hint">快速範本：</span>
          ${config.TEMPLATES.map((t, k) => `<button class="btn btn--small" type="button" data-tpl="${k}">${esc(t.label)}</button>`).join('')}
        </div>
        <div class="item-row item-row--head" aria-hidden="true">
          <span>項目名稱</span><span>比重 %</span><span>類型</span><span>狀態</span><span>分數</span><span></span>
        </div>
        <div id="rows">${c.items.map(row).join('')}</div>
        <button class="btn btn--ghost" type="button" data-act="add-item" style="width:100%;margin-top:8px">＋ 新增項目</button>
        <p class="weight-sum" id="wsum"></p>
        <p class="hint">比重：課綱上寫的百分比，加起來要 100%。類型選「考試」的項目，結果頁會一起算「還要考幾分」。</p>
        ${next ? `<div style="text-align:right;margin-top:12px"><button class="btn btn--small" type="button" data-act="next-course">下一科：${esc(next.name || `科目 ${i + 2}`)} →</button></div>` : ''}
      </div>`;
      refreshSummary();
    }

    renderPanel();

    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tab]');
      if (!b) return;
      app.ui.itemsCourse = Number(b.dataset.tab);
      renderPanel();
    });

    panel.addEventListener('input', (e) => {
      const t = e.target;
      const r = t.closest('.item-row[data-id]');
      if (!r || !t.dataset.f) return;
      const it = current().items.find((x) => x.id === r.dataset.id);
      const f = t.dataset.f;
      if (f === 'name') it.name = t.value.trim();
      if (f === 'weight') it.weight = num(t.value);
      if (f === 'type') it.type = t.value;
      if (f === 'score') it.score = num(t.value);
      if (f === 'released') {
        it.released = t.value === '1';
        r.classList.toggle('item-row--released', it.released);
        r.querySelector('.cell--score .cell__label').textContent = it.released ? '實際分數' : '預估分數';
      }
      app.save();
      refreshSummary();
    });

    panel.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const c = current();
      if (b.dataset.tpl != null) {
        if (c.items.length && !confirm('套用範本會取代這科目前的項目，確定嗎？')) return;
        c.items = config.TEMPLATES[b.dataset.tpl].items.map((t) => ({
          id: uid('i'), ...t, released: false, score: config.DEFAULT_ESTIMATE,
        }));
        app.save();
        renderPanel();
      }
      if (b.dataset.act === 'add-item') {
        const rest = Math.max(0, 100 - calc.weightSum(c));
        const it = { id: uid('i'), name: '', weight: rest || null, type: 'homework', released: false, score: config.DEFAULT_ESTIMATE };
        c.items.push(it);
        app.save();
        renderPanel();
        panel.querySelector(`.item-row[data-id="${CSS.escape(it.id)}"] [data-f="name"]`)?.focus();
      }
      if (b.dataset.act === 'del-item') {
        const id = b.closest('.item-row').dataset.id;
        c.items = c.items.filter((x) => x.id !== id);
        app.save();
        renderPanel();
      }
      if (b.dataset.act === 'next-course') {
        app.ui.itemsCourse += 1;
        renderPanel();
        window.scrollTo({ top: 0 });
      }
    });

    // 檢查：缺資料一定要補（hard），比重不是 100% 可以選擇略過（soft）
    view.querySelector('[data-act="next"]').addEventListener('click', () => {
      const hard = [];
      const soft = [];
      s.courses.forEach((c, i) => {
        const label = esc(c.name || `科目 ${i + 1}`);
        if (!c.items.length) {
          hard.push(`${label}：還沒有評分項目`);
          return;
        }
        if (c.items.some((it) => !it.name)) hard.push(`${label}：有項目沒填名稱`);
        if (c.items.some((it) => it.weight == null || it.weight < 0)) hard.push(`${label}：有項目沒填比重`);
        if (c.items.some((it) => it.score == null || it.score < 0 || it.score > 100)) hard.push(`${label}：有項目的分數沒填，或不在 0–100 之間`);
        const sum = calc.weightSum(c);
        if (Math.abs(sum - 100) >= 0.01) soft.push(`${label}：比重加總是 ${fmt1(sum)}%`);
      });

      const err = view.querySelector('#err');
      if (hard.length) {
        err.innerHTML = `<div class="alert" role="alert"><b>還有資料要補：</b><ul>${hard.map((m) => `<li>${m}</li>`).join('')}</ul></div>`;
        return;
      }
      if (soft.length) {
        err.innerHTML = `<div class="alert alert--warn" role="alert"><b>比重加起來不是 100%：</b>
          <ul>${soft.map((m) => `<li>${m}</li>`).join('')}</ul>
          <p class="hint">可能是漏填項目，或課綱本來就有加分項。照這樣算的話，分數會偏高或偏低。</p>
          <div class="alert__actions"><button class="btn btn--small" type="button" data-act="force">我確定，照這樣算</button></div></div>`;
        err.querySelector('[data-act="force"]').addEventListener('click', () => app.go('result'));
        return;
      }
      app.go('result');
    });
  },
};
