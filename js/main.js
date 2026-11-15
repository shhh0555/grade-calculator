// 進入點：管理全站狀態和路由（用網址 # 後面的文字切換步驟）
window.GC = window.GC || {};

(function () {
  const { storage, config } = GC;

  const app = {
    state: storage.load() || storage.newState(),
    ui: { itemsCourse: 0 },   // 只在這次瀏覽有效的畫面狀態，不存檔
    save() { storage.save(app.state); },
    go(route) { location.hash = `#/${route}`; },
    reset() {
      storage.clear();
      app.state = storage.newState();
      app.ui = { itemsCourse: 0 };
      app.save();
    },
  };
  GC.app = app;

  const routes = {
    '': GC.steps.welcome,
    setup: GC.steps.setup,
    courses: GC.steps.courses,
    items: GC.steps.items,
    result: GC.steps.result,
    about: GC.steps.about,
  };

  // 防止跳過必要步驟：沒有科目不能填項目，沒有項目不能看結果
  function guard(key) {
    const C = app.state.courses;
    if ((key === 'items' || key === 'result') && !C.length) return 'courses';
    if (key === 'result' && C.some((c) => !c.items.length)) return 'items';
    return null;
  }

  function render() {
    let key = location.hash.replace(/^#\/?/, '');
    if (!(key in routes)) key = '';

    const redirect = guard(key);
    if (redirect) {
      app.go(redirect);
      return;
    }

    const stepNo = config.STEPS.findIndex((s) => s.key === key) + 1;
    if (stepNo > app.state.progress.maxStep) {
      app.state.progress.maxStep = stepNo;
      app.save();
    }

    document.getElementById('progress').innerHTML =
      stepNo > 0 ? GC.components.progressBar(stepNo, app.state.progress.maxStep) : '';

    // 每次換一個新的容器，避免上一頁綁的事件殘留
    const old = document.getElementById('view');
    const view = document.createElement('div');
    view.id = 'view';
    old.replaceWith(view);
    routes[key].render(view, app);

    const titles = { '': '首頁', about: '使用說明' };
    document.title = `${stepNo ? config.STEPS[stepNo - 1].label : titles[key]}｜學期成績試算`;
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', render);
  render();
})();
