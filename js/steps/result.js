// 步驟 4：分析結果（版面參考 reference/成績分析.html）
// 結構：build() 只畫一次骨架和拉桿；update() 在每次調整後重算所有數字
window.GC = window.GC || {};
GC.steps = GC.steps || {};

GC.steps.result = {
  render(view, app) {
    const { esc, num, fmt1, fmtNeed, fmtDelta, joinNames } = GC.utils;
    const { config, calc } = GC;
    const { kpiCard, courseCard } = GC.components;
    const s = app.state;
    const C = s.courses;
    const hasThreshold = C.some((c) => c.threshold != null);

    // 章節編號依實際出現的區塊產生，沒設門檻就不會跳號
    let secNo = 0;
    const NUM = ['一', '二', '三', '四', '五', '六', '七'];
    const sec = (title) => `<h2>${NUM[secNo++]}、${title}</h2>`;

    view.innerHTML = `
      <header class="step-head">
        <p class="step-head__eyebrow">步驟 4 / 4</p>
        <h1>${esc(s.semester ? `${s.semester} ` : '')}學期成績試算</h1>
        <p class="sub">灰色數字＝已公布成績（固定）；拉桿＝還沒出來的項目，請拖成你心裡的預期。學分也可以直接改，所有數字會即時更新。</p>
      </header>

      <div class="kpis" id="kpis"></div>
      <div class="card verdict" id="verdict"></div>

      ${sec('還沒考的要考幾分？')}
      <div class="card">
        <div class="solver">
          目標學期平均
          <input class="input" type="number" id="target" min="0" max="100" step="0.5"
            value="${esc(s.goal.targetAverage ?? config.DEFAULT_TARGET_AVERAGE)}" aria-label="目標學期平均">
          分 → 假設所有未公布的「<span class="warn">考試</span>」項目都考同一個分數：
        </div>
        <div class="tbl-scroll"><table>
          <thead><tr><th>情境</th><th>每科考試需要</th><th>判讀</th></tr></thead>
          <tbody id="solve-body"></tbody>
        </table></div>
        <p class="note" id="solve-note"></p>
      </div>

      ${sec('各科試算')}
      <div class="courses" id="courses">${C.map(courseCard).join('')}</div>

      ${hasThreshold ? `${sec('單科門檻：剩下的考試要考幾分？')}<div class="stack" id="threshold-box"></div>` : ''}

      ${sec('停修比較')}
      <div class="card">
        <p class="sub" style="margin-top:0">勾選想停修的科目，上方的數字也會一起換成停修情境。</p>
        <div class="drop-picks" id="drop-picks">
          ${C.map((c) => `<label class="chk"><input type="checkbox" data-drop="${esc(c.id)}" ${c.considerDrop ? 'checked' : ''}> ${esc(c.name)}</label>`).join('')}
        </div>
        <div class="tbl-scroll"><table>
          <thead><tr><th>情境</th><th>學期平均</th><th>總學分</th><th>預估不及格學分</th><th>二一風險</th></tr></thead>
          <tbody id="drop-body"></tbody>
        </table></div>
        <h3 style="margin:20px 0 6px">每一科單獨停修的話</h3>
        <div class="tbl-scroll"><table>
          <thead><tr><th>科目</th><th>學分</th><th>預估分數</th><th>停修才划算的分數線</th><th>停修後平均變化</th><th>判讀</th></tr></thead>
          <tbody id="each-body"></tbody>
        </table></div>
        <p class="note">分數線＝其他科的學分加權平均。這科低於這條線，停修才會拉高平均；但停修也會少掉學分。${esc(config.DROP_NOTE)}</p>
      </div>

      ${sec('時間該花在哪？')}
      <div class="card">
        <p style="margin-top:0">學期平均是學分加權，所以每個還沒出來的項目，影響力＝<b>該項比重 × 該科學分 ÷ 總學分</b>。下表依「拉到 100 分，平均最多能 + 多少」排序，越上面越值得花時間。</p>
        <div class="tbl-scroll"><table>
          <thead><tr><th>#</th><th>項目</th><th>每多 1 分，平均 +</th><th>目前設定</th><th>拉到 100，平均最多 +</th></tr></thead>
          <tbody id="impact-body"></tbody>
        </table></div>
        <p class="note" id="impact-note"></p>
      </div>

      ${sec('假設與提醒')}
      <div class="card" id="assumptions"></div>

      <div class="step-nav">
        <a class="btn" href="#/items">回去修改</a>
        <div class="step-nav__group">
          <button class="btn" type="button" data-act="export">匯出 JSON</button>
          <button class="btn btn--text btn--danger" type="button" data-act="reset">重新開始</button>
        </div>
      </div>`;

    const $ = (sel) => view.querySelector(sel);
    const findCourse = (id) => C.find((c) => c.id === id);
    const scoreCls = (score) => (score < s.passScore ? 'bad' : '');

    function update() {
      const dropList = C.filter((c) => c.considerDrop);
      const dropIds = dropList.map((c) => c.id);
      const dropNames = joinNames(dropList);
      const all = calc.semesterAverage(C);
      const dropped = dropIds.length ? calc.semesterAverage(C, dropIds) : null;
      const target = s.goal.targetAverage;
      const risk = calc.failRisk(C, [], s.passScore);

      // ── KPI 卡片 ──
      const kpis = [];
      const avgCls = target == null || all == null ? ''
        : all >= target ? 'good' : all >= target - config.TARGET_WARN_MARGIN ? 'warn' : 'bad';
      kpis.push(kpiCard({ label: '預估學期平均（全部修完）', value: fmt1(all), cls: avgCls, hint: target != null ? `目標 ${target}` : '' }));
      if (dropped != null || dropIds.length) {
        const cls = dropped == null || all == null ? ''
          : dropped > all + config.DROP_DELTA_EPS ? 'good' : dropped < all - config.DROP_DELTA_EPS ? 'bad' : '';
        kpis.push(kpiCard({ label: `預估學期平均（停修${dropNames}）`, value: fmt1(dropped), cls, hint: `和全部修完相比 ${fmtDelta(dropped != null && all != null ? dropped - all : null)}` }));
      }
      C.filter((c) => c.threshold != null).forEach((c) => {
        const sc = calc.courseScore(c);
        const cls = sc >= c.threshold + config.THRESHOLD_SAFE_MARGIN ? 'good' : sc >= c.threshold ? 'warn' : 'bad';
        kpis.push(kpiCard({ label: `${c.name} 預估（門檻 ${c.threshold}）`, value: fmt1(sc), cls }));
      });
      dropList.forEach((c) => {
        const line = calc.breakEvenLine(C, c.id);
        kpis.push(kpiCard({ label: `${c.name}「停修才划算」的分數線`, value: line == null ? '–' : `< ${fmt1(line)}`, hint: `目前預估 ${fmt1(calc.courseScore(c))}` }));
      });
      if (risk.failed.length) {
        kpis.push(kpiCard({ label: '預估不及格', value: `${risk.failedCredits} 學分`, cls: 'bad', hint: joinNames(risk.failed) }));
      }
      $('#kpis').innerHTML = kpis.join('');

      // ── 各科卡片上的分數 ──
      C.forEach((c) => {
        const el = view.querySelector(`#sc-${CSS.escape(c.id)}`);
        const sc = calc.courseScore(c);
        el.textContent = fmt1(sc);
        el.className = `course__score ${scoreCls(sc)}`;
      });

      // ── 結論 ──
      const impacts = calc.itemImpacts(C, dropIds);
      const lines = [];
      if (s.goal.note) lines.push(`<p class="sub" style="margin-top:0">目標：${esc(s.goal.note)}</p>`);
      if (all != null) {
        if (target != null) {
          lines.push(all >= target
            ? `<p><b>預估學期平均 ${fmt1(all)}，已經達到目標 ${target}。</b>照目前的預估走就好，別讓還沒考的項目失手。</p>`
            : `<p><b>預估學期平均 ${fmt1(all)}，離目標 ${target} 還差 ${fmt1(target - all)} 分。</b>看下方第一區，還沒考的考試要拿幾分才補得回來。</p>`);
        } else {
          lines.push(`<p><b>預估學期平均 ${fmt1(all)}。</b></p>`);
        }
      }
      dropList.forEach((c) => {
        const sc = calc.courseScore(c);
        const others = calc.breakEvenLine(C, c.id);
        if (others == null) return;
        const d = calc.semesterAverage(C, [c.id]) - all;
        lines.push(sc >= others
          ? `<p>${esc(c.name)} 預估 ${fmt1(sc)} 分，其他科平均 ${fmt1(others)} 分：它<b>沒有</b>拉低平均，停修反而讓平均 ${fmtDelta(d)}，留著沒問題。</p>`
          : `<p>${esc(c.name)} 預估 ${fmt1(sc)} 分，低於其他科平均 ${fmt1(others)} 分：停修可讓平均 ${fmtDelta(d)}；要不拖累平均，它得拿到 ${fmt1(others)} 分以上。</p>`);
      });
      C.filter((c) => c.threshold != null).forEach((c) => {
        const sc = calc.courseScore(c);
        lines.push(sc >= c.threshold
          ? `<p>${esc(c.name)} 預估 ${fmt1(sc)}，有過門檻 ${c.threshold}。</p>`
          : `<p class="bad">${esc(c.name)} 預估 ${fmt1(sc)}，還沒過門檻 ${c.threshold}，看下方「單科門檻」那一區。</p>`);
      });
      if (risk.flunk) {
        lines.push(`<p class="bad"><b>注意：</b>預估不及格的學分已達總學分的一半，有二一風險，請盡快和導師或系辦討論。</p>`);
      } else if (risk.failed.length) {
        lines.push(`<p class="bad">${esc(joinNames(risk.failed))} 目前預估不及格（及格線 ${s.passScore}）。</p>`);
      }
      if (impacts.length && impacts[0].room > 0) {
        const t = impacts[0];
        lines.push(`<p>最值得拚的是 <b>${esc(t.courseName)}｜${esc(t.itemName)}</b>：拉到 100 分，平均最多能 +${t.room.toFixed(2)}。</p>`);
      }
      $('#verdict').innerHTML = lines.join('') || '<p>資料還不夠，回上一步補上學分和評分項目。</p>';

      // ── 一、考試求解 ──
      const t = num($('#target').value);
      const scenarios = [['全部修完', []]];
      if (dropIds.length) scenarios.push([`停修${dropNames}`, dropIds]);
      $('#solve-body').innerHTML = t == null ? '<tr><td colspan="3" class="sub">請先輸入目標學期平均</td></tr>'
        : scenarios.map(([name, ids]) => {
          const x = calc.solveExamScore(C, ids, t);
          const j = calc.judgeNeed(x);
          return `<tr><td>${esc(name)}</td><td class="${j.cls}">${fmtNeed(x)}</td><td>${j.text}</td></tr>`;
        }).join('');
      const exams = [];
      calc.activeCourses(C, []).forEach((c) => c.items.forEach((it) => {
        if (it.type === 'exam' && !it.released) exams.push(`${c.name} ${it.name}`);
      }));
      $('#solve-note').innerHTML = exams.length
        ? `會一起調整的考試：${esc(exams.join('、'))}。報告、作業、出席這類項目維持你在下方拉桿設定的值；把它們拉高，考試需要的分數就會下降。`
        : '目前沒有未公布的考試項目，只能靠調高報告、作業這類項目來影響平均。';

      // ── 單科門檻 ──
      if (hasThreshold) {
        $('#threshold-box').innerHTML = C.filter((c) => c.threshold != null).map((c) => {
          const goals = [...new Set([c.threshold, ...config.THRESHOLD_TARGETS])].sort((a, b) => a - b);
          const examNames = c.items.filter((it) => it.type === 'exam' && !it.released).map((it) => it.name);
          const body = !examNames.length
            ? `<p class="sub">這科沒有未公布的考試，目前預估 ${fmt1(calc.courseScore(c))} 分，只能靠調高其他項目。</p>`
            : `<div class="tbl-scroll"><table>
                <thead><tr><th>${esc(c.name)} 目標</th><th>${esc(examNames.join('＋'))} 需要</th><th>判讀</th></tr></thead>
                <tbody>${goals.map((g) => {
                  const x = calc.solveCourseTarget(c, g);
                  const j = calc.judgeNeed(x);
                  return `<tr><td>${g}${g === c.threshold ? '（門檻）' : ''}</td><td class="${j.cls}">${fmtNeed(x)}</td><td>${j.text}</td></tr>`;
                }).join('')}</tbody></table></div>`;
          return `<div class="card"><h3 style="margin-bottom:8px">${esc(c.name)}</h3>${body}
            <p class="note">用卡片裡其他項目的設定值計算；多個考試時假設考同一個分數。</p></div>`;
        }).join('');
      }

      // ── 停修比較 ──
      const riskRow = (name, ids) => {
        const r = calc.failRisk(C, ids, s.passScore);
        const avg = calc.semesterAverage(C, ids);
        const riskText = r.flunk ? '<span class="bad">達二一</span>'
          : r.failedCredits ? `<span class="warn">占 ${Math.round(r.ratio * 100)}%</span>` : '<span class="good">無</span>';
        return `<tr><td>${esc(name)}</td><td>${fmt1(avg)}</td><td>${r.totalCredits}</td><td>${r.failedCredits}</td><td>${riskText}</td></tr>`;
      };
      $('#drop-body').innerHTML = scenarios.map(([name, ids]) => riskRow(name, ids)).join('');

      $('#each-body').innerHTML = calc.activeCourses(C, []).map((c) => {
        const sc = calc.courseScore(c);
        const line = calc.breakEvenLine(C, c.id);
        if (line == null) {
          return `<tr><td>${esc(c.name)}</td><td>${esc(c.credits)}</td><td>${fmt1(sc)}</td><td colspan="3" class="sub">只有這一科，無法比較</td></tr>`;
        }
        const d = line - all;
        let judge = Math.abs(d) < config.DROP_DELTA_EPS ? '影響不大'
          : d > 0 ? `<span class="warn">停修可讓平均 ${fmtDelta(d)}</span>` : '<span class="good">留著比較好</span>';
        if (sc < s.passScore) judge += '，<span class="bad">預估不及格</span>';
        return `<tr><td>${esc(c.name)}</td><td>${esc(c.credits)}</td><td class="${scoreCls(sc)}">${fmt1(sc)}</td><td>&lt; ${fmt1(line)}</td><td>${fmtDelta(d)}</td><td>${judge}</td></tr>`;
      }).join('');

      // ── 影響力排行 ──
      $('#impact-body').innerHTML = impacts.length
        ? impacts.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.courseName)}｜${esc(r.itemName)}</td>
            <td>${r.per.toFixed(3)}</td><td>${r.value}</td>
            <td class="${r.room >= config.IMPACT_HIGHLIGHT ? 'good' : ''}">${r.room.toFixed(2)}</td></tr>`).join('')
        : '<tr><td colspan="5" class="sub">所有項目都已公布，沒有可以再拉的分數了。</td></tr>';
      $('#impact-note').textContent = `${dropIds.length ? `以停修${dropNames}的情境計算。` : ''}「拉到 100」是上限參考，用來看哪裡空間最大；表格會跟著拉桿和學分即時更新。`;

      // ── 假設與提醒 ──
      const est = C.map((c) => {
        const list = c.items.filter((it) => !it.released).map((it) => `${it.name} ${it.score}`);
        return list.length ? `<li>${esc(c.name)}：${esc(list.join('、'))}</li>` : '';
      }).join('');
      const weightIssues = C.filter((c) => Math.abs(calc.weightSum(c) - 100) >= 0.01)
        .map((c) => `<li>${esc(c.name)} 的比重加總是 ${fmt1(calc.weightSum(c))}%，分數可能偏高或偏低</li>`).join('');
      const zero = C.filter((c) => !(Number(c.credits) > 0)).map((c) => c.name);
      $('#assumptions').innerHTML = `
        ${est ? `<b>這些是你的預估值（可能不準）</b><ul class="plain">${est}</ul>` : '<p>所有項目都已公布，沒有預估值。</p>'}
        ${weightIssues || zero.length ? `<b>需要留意</b><ul class="plain">${weightIssues}${zero.length ? `<li>${esc(zero.join('、'))} 學分為 0，沒有列入平均</li>` : ''}</ul>` : ''}
        <b>請自行確認</b>
        <ul class="plain">
          <li>${esc(config.DROP_NOTE)}</li>
          <li>雙主修、輔系、轉系的門檻和名額，以各系當年度公告為準。</li>
          <li>二一的判定方式（是否含停修、是否連續學期）各校不同。</li>
          <li>${esc(config.DISCLAIMER)}</li>
        </ul>`;
    }

    // ── 事件 ──
    $('#courses').addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.credits) {
        findCourse(t.dataset.credits).credits = Math.max(0, num(t.value) ?? 0);
      }
      if (t.dataset.item) {
        const it = findCourse(t.dataset.course).items.find((x) => x.id === t.dataset.item);
        it.score = Number(t.value);
        view.querySelector(`#v-${CSS.escape(t.dataset.course)}-${CSS.escape(t.dataset.item)}`).textContent = t.value;
      }
      app.save();
      update();
    });

    $('#target').addEventListener('input', (e) => {
      const v = num(e.target.value);
      if (v != null) {
        s.goal.targetAverage = v;
        app.save();
      }
      update();
    });

    $('#drop-picks').addEventListener('change', (e) => {
      const id = e.target.dataset.drop;
      if (!id) return;
      findCourse(id).considerDrop = e.target.checked;
      app.save();
      update();
    });

    $('[data-act="export"]').addEventListener('click', () => GC.storage.exportJSON(s));
    $('[data-act="reset"]').addEventListener('click', () => {
      if (!confirm('這會清掉目前填的所有資料，確定要重新開始嗎？\n（建議先按「匯出 JSON」備份）')) return;
      app.reset();
      app.go('');
    });

    update();
  },
};
