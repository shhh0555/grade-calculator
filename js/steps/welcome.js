// 歡迎頁：開始新的試算、繼續上次、匯入 JSON
window.GC = window.GC || {};
GC.steps = GC.steps || {};

GC.steps.welcome = {
  render(view, app) {
    const { config } = GC;
    const s = app.state;
    const hasData = s.courses.length > 0 || !!s.semester;
    const resumeKey = config.STEPS[Math.max(1, s.progress.maxStep) - 1].key;

    view.innerHTML = `
      <section class="hero">
        <h1 class="hero__title">這學期，還來得及嗎？</h1>
        <p class="hero__lead">輸入各科的評分比例和已公布成績，算出預估平均、還沒考的要考幾分，以及哪一科停修才划算。</p>
        <ul class="hero__points">
          <li>適合要申請雙主修、輔系、轉系，或只想安全過關的人</li>
          <li>資料只存在你的瀏覽器，不會上傳到任何地方</li>
          <li>準備好各科課綱的評分比例，大約 5 分鐘填完</li>
        </ul>
        <div class="step-nav__group">
          ${hasData
            ? `<a class="btn btn--primary" href="#/${resumeKey}">繼續上次的試算</a>
               <button class="btn" type="button" data-act="new">開始新的試算</button>`
            : '<a class="btn btn--primary" href="#/setup">開始試算</a>'}
          <label class="btn btn--ghost">匯入 JSON<input type="file" accept="application/json,.json" hidden data-act="import"></label>
        </div>
        <p class="note" id="msg" role="status"></p>
      </section>`;

    view.querySelector('[data-act="new"]')?.addEventListener('click', () => {
      if (!confirm('這會清掉目前填的所有資料，確定要重新開始嗎？\n（想保留的話，先到結果頁匯出 JSON）')) return;
      app.reset();
      app.go('setup');
    });

    view.querySelector('[data-act="import"]').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      GC.storage.importJSON(file)
        .then((state) => {
          app.state = state;
          app.save();
          app.go(config.STEPS[Math.max(1, state.progress.maxStep) - 1].key);
        })
        .catch((err) => {
          view.querySelector('#msg').innerHTML = `<span class="bad">匯入失敗：${GC.utils.esc(err.message)}</span>`;
        });
    });
  },
};
