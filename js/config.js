// 可調整的設定：門檻、判讀文字、範本、預設值都放這裡，其他檔案不要寫死數值
window.GC = window.GC || {};

GC.config = {
  STORAGE_KEY: 'gradeCalc.v1',
  DATA_VERSION: 1,

  DEFAULT_PASS_SCORE: 60,
  DEFAULT_ESTIMATE: 80,        // 新增未公布項目時的預估分數
  DEFAULT_TARGET_AVERAGE: 80,
  DEFAULT_CREDITS: 3,
  MAX_CREDITS: 6,

  // 二一：不及格學分占總學分的比例達到這個值就算危險（各校規定不同，請自行確認）
  FLUNK_RATIO: 0.5,

  // 「需要考幾分」的判讀，max 為含上限，由小到大比對
  NEED_RULES: [
    { max: 0, cls: 'good', text: '考 0 分也達標' },
    { max: 60, cls: 'good', text: '很輕鬆' },
    { max: 90, cls: 'good', text: '可達成' },
    { max: 100, cls: 'warn', text: '很吃力' },
    { max: Infinity, cls: 'bad', text: '這組設定下做不到，要靠報告／作業補，或考慮停修' },
  ],
  NO_EXAM_TEXT: '沒有未公布的考試項目',

  THRESHOLD_TARGETS: [70, 75, 80, 85, 90],
  THRESHOLD_SAFE_MARGIN: 5,    // 預估分數高於門檻這麼多才算安全
  TARGET_WARN_MARGIN: 3,       // 平均低於目標在這個範圍內顯示「注意」
  DROP_DELTA_EPS: 0.05,        // 停修前後平均差距小於這個值，視為影響不大
  IMPACT_HIGHLIGHT: 0.4,       // 影響力排行中，最大空間超過這個值會標示

  ITEM_TYPES: {
    exam: '考試',
    homework: '作業',
    report: '報告',
    attendance: '出席',
    other: '其他',
  },

  CATEGORIES: {
    required: '必修',
    elective: '選修',
    general: '通識',
  },

  TEMPLATES: [
    {
      label: '期中＋期末＋平時',
      items: [
        { name: '期中考', weight: 30, type: 'exam' },
        { name: '期末考', weight: 40, type: 'exam' },
        { name: '平時成績', weight: 30, type: 'homework' },
      ],
    },
    {
      label: '期中＋期末＋作業＋出席',
      items: [
        { name: '期中考', weight: 30, type: 'exam' },
        { name: '期末考', weight: 30, type: 'exam' },
        { name: '作業', weight: 30, type: 'homework' },
        { name: '出席', weight: 10, type: 'attendance' },
      ],
    },
    {
      label: '只有總成績估計',
      items: [{ name: '總成績估計', weight: 100, type: 'other' }],
    },
  ],

  STEPS: [
    { key: 'setup', label: '學期與目標' },
    { key: 'courses', label: '新增科目' },
    { key: 'items', label: '評分項目' },
    { key: 'result', label: '分析結果' },
  ],

  DISCLAIMER: '本站試算結果僅供參考，請以學校規定和授課老師說明為準。',
  DROP_NOTE: '停修期限與規定依各校公告為準；停修後的總學分也不能低於學校規定的下限。',
};
