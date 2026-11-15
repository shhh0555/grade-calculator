// 步驟 1：學期與目標
window.GC = window.GC || {};
GC.steps = GC.steps || {};

GC.steps.setup = {
  render(view, app) {
    const { esc, num } = GC.utils;
    const { config } = GC;
    const s = app.state;
    const g = s.goal;

    view.innerHTML = `
      <header class="step-head">
        <p class="step-head__eyebrow">步驟 1 / 4</p>
        <h1>學期與目標</h1>
        <p class="sub">先設定這學期的基本資料和你想達成的目標，之後隨時能回來改。</p>
      </header>

      <div class="stack">
        <div class="card grid-2">
          <div class="field">
            <label for="semester">學期名稱</label>
            <input class="input" id="semester" type="text" placeholder="例如 115-1" value="${esc(s.semester)}">
            <p class="hint">民國年 - 學期，只用來命名，不影響計算。</p>
          </div>
          <div class="field">
            <label for="pass">及格線</label>
            <input class="input" id="pass" type="number" min="0" max="100" step="1" value="${esc(s.passScore)}">
            <p class="hint">大學部通常是 60 分，研究所通常是 70 分。</p>
          </div>
        </div>

        <div class="card">
          <h2 class="card__title">我的目標（可複選）</h2>
          <label class="chk"><input type="checkbox" id="g-pass" ${g.passOnly ? 'checked' : ''}>
            只求及格 <span class="hint">每科都要顧到及格線以上</span></label>
          <label class="chk"><input type="checkbox" id="g-avg" ${g.targetAverage != null ? 'checked' : ''}>
            目標學期平均
            <input class="input input--short" id="g-avg-val" type="number" min="0" max="100" step="0.5"
              value="${esc(g.targetAverage ?? config.DEFAULT_TARGET_AVERAGE)}" ${g.targetAverage == null ? 'disabled' : ''} aria-label="目標學期平均">
            分 <span class="hint">例如雙主修、輔系、書卷獎的平均門檻</span></label>
          <label class="chk"><input type="checkbox" id="g-th" ${g.useThreshold ? 'checked' : ''}>
            某科要達到門檻 <span class="hint">例如雙主修要求程式設計 ≥ 70，下一步新增科目時設定</span></label>
          <div class="field" style="margin-top:8px">
            <label for="g-note">目標說明（選填）</label>
            <input class="input" id="g-note" type="text" placeholder="例如：申請資管雙主修" value="${esc(g.note)}">
            <p class="hint">會顯示在結果頁的結論裡，提醒自己為什麼要拚。</p>
          </div>
        </div>
      </div>

      <div id="err"></div>

      <div class="step-nav">
        <a class="btn" href="#/">上一步</a>
        <button class="btn btn--primary" type="button" data-act="next">下一步：新增科目</button>
      </div>`;

    const $ = (sel) => view.querySelector(sel);
    const avgInput = $('#g-avg-val');

    // 每次輸入都直接寫回 state 並存檔
    view.addEventListener('input', (e) => {
      const t = e.target;
      if (t.id === 'semester') s.semester = t.value.trim();
      if (t.id === 'pass') s.passScore = num(t.value);
      if (t.id === 'g-pass') g.passOnly = t.checked;
      if (t.id === 'g-avg') {
        avgInput.disabled = !t.checked;
        g.targetAverage = t.checked ? num(avgInput.value) ?? config.DEFAULT_TARGET_AVERAGE : null;
      }
      if (t.id === 'g-avg-val') g.targetAverage = num(t.value);
      if (t.id === 'g-th') g.useThreshold = t.checked;
      if (t.id === 'g-note') g.note = t.value.trim();
      app.save();
    });

    $('[data-act="next"]').addEventListener('click', () => {
      const errors = [];
      if (s.passScore == null || s.passScore < 0 || s.passScore > 100) errors.push('及格線請填 0–100 的數字');
      if ($('#g-avg').checked && (g.targetAverage == null || g.targetAverage < 0 || g.targetAverage > 100)) {
        errors.push('目標學期平均請填 0–100 的數字');
      }
      if (errors.length) {
        $('#err').innerHTML = `<div class="alert" role="alert"><ul>${errors.map((m) => `<li>${m}</li>`).join('')}</ul></div>`;
        return;
      }
      app.go('courses');
    });
  },
};
