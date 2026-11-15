// 資料存取：localStorage 讀寫、匯入匯出、版本遷移
window.GC = window.GC || {};

GC.storage = (function () {
  const { STORAGE_KEY, DATA_VERSION, DEFAULT_PASS_SCORE } = GC.config;

  function newState() {
    return {
      version: DATA_VERSION,
      semester: '',
      passScore: DEFAULT_PASS_SCORE,
      goal: { passOnly: true, targetAverage: null, useThreshold: false, note: '' },
      courses: [],
      progress: { maxStep: 0 },
    };
  }

  // 把舊版或不完整的資料補成目前的格式；之後版本升級時在這裡逐版轉換
  function migrate(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.courses)) {
      throw new Error('檔案格式不符，請確認是從本站匯出的 JSON');
    }
    if ((data.version || 1) > DATA_VERSION) {
      throw new Error('這份資料來自較新的版本，請更新網站後再匯入');
    }
    const base = newState();
    const courses = data.courses.map((c) => ({
      id: c.id || GC.utils.uid('c'),
      name: c.name || '',
      credits: c.credits ?? 0,
      category: c.category || 'required',
      considerDrop: !!c.considerDrop,
      threshold: c.threshold ?? null,
      items: Array.isArray(c.items)
        ? c.items.map((it) => ({
          id: it.id || GC.utils.uid('i'),
          name: it.name || '',
          weight: it.weight ?? 0,
          type: it.type || 'other',
          released: !!it.released,
          score: it.score ?? null,
        }))
        : [],
    }));
    return {
      ...base,
      ...data,
      version: DATA_VERSION,
      goal: { ...base.goal, ...(data.goal || {}) },
      progress: { ...base.progress, ...(data.progress || {}) },
      courses,
    };
  }

  // 私密視窗或封鎖網站資料時 localStorage 可能丟錯，所以都包 try/catch
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? migrate(JSON.parse(raw)) : null;
    } catch (e) {
      return null;
    }
  }

  function save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* 無法清除就算了，畫面上的狀態已重設 */ }
  }

  function exportJSON(state) {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `成績試算-${state.semester || '未命名'}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function importJSON(file) {
    return file.text().then((text) => migrate(JSON.parse(text)));
  }

  return { newState, migrate, load, save, clear, exportJSON, importJSON };
})();
