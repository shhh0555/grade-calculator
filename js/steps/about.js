// 使用說明：計算公式、判讀標準、免責聲明（判讀表從 config 產生，改門檻時這裡會自動同步）
window.GC = window.GC || {};
GC.steps = GC.steps || {};

GC.steps.about = {
  render(view) {
    const { config } = GC;
    const rules = config.NEED_RULES;
    const range = (i) => {
      const lo = i === 0 ? null : rules[i - 1].max;
      const hi = rules[i].max;
      if (lo == null) return `≤ ${hi}`;
      if (hi === Infinity) return `> ${lo}`;
      return `${lo} – ${hi}`;
    };

    view.innerHTML = `
      <header class="step-head">
        <h1>使用說明</h1>
        <p class="sub">這個網站怎麼算、數字怎麼看。</p>
      </header>

      <div class="stack">
        <div class="card">
          <h2 class="card__title">計算方式</h2>
          <div class="tbl-scroll"><table>
            <thead><tr><th>名稱</th><th>算法</th></tr></thead>
            <tbody>
              <tr><td>單科分數</td><td>每個項目的「比重 × 分數」加總。已公布用實際分數，未公布用你的預估分數。</td></tr>
              <tr><td>學期平均</td><td>每科「分數 × 學分」加總 ÷ 總學分。停修和 0 學分的科目不列入。</td></tr>
              <tr><td>還沒考的要考幾分</td><td>假設所有未公布的考試考同一個分數，反推剛好達到目標平均的那個分數。</td></tr>
              <tr><td>單科門檻反推</td><td>其他項目維持你的設定，這科剩下的考試要考幾分才會過門檻。</td></tr>
              <tr><td>停修才划算的分數線</td><td>不含這科時，其他科的學分加權平均。這科低於這條線，停修才會拉高平均。</td></tr>
              <tr><td>項目影響力</td><td>比重 × 該科學分 ÷ 總學分＝這個項目每多 1 分，學期平均會增加多少。</td></tr>
              <tr><td>二一風險</td><td>預估不及格的學分 ÷ 總學分，達到 ${Math.round(config.FLUNK_RATIO * 100)}% 就標示。</td></tr>
            </tbody>
          </table></div>
        </div>

        <div class="card">
          <h2 class="card__title">「需要考幾分」怎麼判讀</h2>
          <div class="tbl-scroll"><table>
            <thead><tr><th>需要的分數</th><th>判讀</th></tr></thead>
            <tbody>${rules.map((r, i) => `<tr><td>${range(i)}</td><td class="${r.cls}">${r.text}</td></tr>`).join('')}</tbody>
          </table></div>
        </div>

        <div class="card">
          <h2 class="card__title">資料與隱私</h2>
          <ul class="plain">
            <li>資料只存在你這台裝置的瀏覽器裡，不會上傳到任何地方。</li>
            <li>換瀏覽器、清除網站資料或用私密視窗，資料就會不見；重要的話記得在結果頁「匯出 JSON」備份。</li>
          </ul>
        </div>

        <div class="card">
          <h2 class="card__title">免責聲明</h2>
          <ul class="plain">
            <li>${config.DISCLAIMER}</li>
            <li>${config.DROP_NOTE}</li>
            <li>雙主修、輔系、轉系的門檻和二一規定各校不同，本站不代替學校公告。</li>
          </ul>
        </div>
      </div>

      <div class="step-nav"><a class="btn" href="javascript:history.back()">返回</a></div>`;
  },
};
