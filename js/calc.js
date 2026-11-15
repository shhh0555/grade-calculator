// 純計算函式：只吃參數、只回傳結果，不碰畫面和 localStorage
// 公式與 reference/成績分析.html 一致
window.GC = window.GC || {};

(function () {
  const pct = (w) => (Number(w) || 0) / 100;
  const credits = (c) => Number(c.credits) || 0;

  // 項目用來計算的分數；求解時，未公布的考試會被統一代換成 examOverride
  function itemValue(item, examOverride) {
    if (examOverride != null && item.type === 'exam' && !item.released) return examOverride;
    return Number(item.score) || 0;
  }

  function courseScore(course, examOverride = null) {
    return course.items.reduce((s, it) => s + pct(it.weight) * itemValue(it, examOverride), 0);
  }

  function weightSum(course) {
    return course.items.reduce((s, it) => s + (Number(it.weight) || 0), 0);
  }

  // 學分 0 的科目（例如不計學分的課）不列入平均
  function activeCourses(courses, dropIds = []) {
    return courses.filter((c) => !dropIds.includes(c.id) && credits(c) > 0);
  }

  function totalCredits(courses, dropIds = []) {
    return activeCourses(courses, dropIds).reduce((s, c) => s + credits(c), 0);
  }

  function semesterAverage(courses, dropIds = [], examOverride = null) {
    const list = activeCourses(courses, dropIds);
    const cr = list.reduce((s, c) => s + credits(c), 0);
    if (!cr) return null;
    return list.reduce((s, c) => s + courseScore(c, examOverride) * credits(c), 0) / cr;
  }

  // 平均對「所有未公布考試的分數 x」是線性的，所以用 x=0 和 x=100 兩點就能反推
  function solveExamScore(courses, dropIds, target) {
    const a = semesterAverage(courses, dropIds, 0);
    const b = semesterAverage(courses, dropIds, 100);
    if (a == null || Math.abs(b - a) < 1e-9) return null;
    return (target - a) / ((b - a) / 100);
  }

  function unreleasedExamWeight(course) {
    return course.items
      .filter((it) => it.type === 'exam' && !it.released)
      .reduce((s, it) => s + pct(it.weight), 0);
  }

  // 單科門檻反推：其他項目維持設定值，剩下的考試要考幾分
  function solveCourseTarget(course, target) {
    const w = unreleasedExamWeight(course);
    if (w <= 0) return null;
    return (target - courseScore(course, 0)) / w;
  }

  // 停修划算線＝不含這科的學分加權平均；這科低於它，停修才會拉高平均
  function breakEvenLine(courses, courseId) {
    return semesterAverage(courses, [courseId]);
  }

  // 每個未公布項目對學期平均的影響力
  function itemImpacts(courses, dropIds = []) {
    const list = activeCourses(courses, dropIds);
    const cr = list.reduce((s, c) => s + credits(c), 0);
    if (!cr) return [];
    const out = [];
    list.forEach((c) => {
      c.items.forEach((it) => {
        if (it.released) return;
        const per = (pct(it.weight) * credits(c)) / cr;
        const value = Number(it.score) || 0;
        out.push({
          courseId: c.id,
          itemId: it.id,
          courseName: c.name,
          itemName: it.name,
          per,
          value,
          room: per * Math.max(0, 100 - value),
        });
      });
    });
    out.sort((x, y) => y.room - x.room || y.per - x.per);
    return out;
  }

  function failRisk(courses, dropIds, passScore, flunkRatio = GC.config.FLUNK_RATIO) {
    const list = activeCourses(courses, dropIds);
    const total = list.reduce((s, c) => s + credits(c), 0);
    const failed = list.filter((c) => courseScore(c) < passScore);
    const failedCredits = failed.reduce((s, c) => s + credits(c), 0);
    const ratio = total ? failedCredits / total : 0;
    return { failed, failedCredits, totalCredits: total, ratio, flunk: total > 0 && ratio >= flunkRatio };
  }

  function judgeNeed(x, rules = GC.config.NEED_RULES) {
    if (x == null || !Number.isFinite(x)) return { cls: '', text: GC.config.NO_EXAM_TEXT };
    return rules.find((r) => x <= r.max) || rules[rules.length - 1];
  }

  GC.calc = {
    itemValue,
    courseScore,
    weightSum,
    activeCourses,
    totalCredits,
    semesterAverage,
    solveExamScore,
    unreleasedExamWeight,
    solveCourseTarget,
    breakEvenLine,
    itemImpacts,
    failRisk,
    judgeNeed,
  };
})();
