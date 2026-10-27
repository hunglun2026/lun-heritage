/* 教師專區：學習單（範圍＝縣市或類型，依程度出題，可顯示答案）＋搶答計分板（core/board.js）。
   題目只用改寫與原文已有的事實：類型、時代來自轉接器抽的資料，介紹與探究題來自查核過的改寫。 */
App.boot(function (data) {
  const { esc, el, shuffle } = App;
  const S = App.SITE;
  const done = data.items.filter((a) => a.done);

  // ---- 分頁 ----
  document.querySelectorAll(".tab").forEach((t) => (t.onclick = () => {
    document.querySelectorAll(".tab").forEach((x) => x.setAttribute("aria-selected", String(x === t)));
    document.getElementById("tab-sheet").hidden = t.dataset.tab !== "sheet";
    document.getElementById("tab-board").hidden = t.dataset.tab !== "board";
  }));
  Board.init(document.getElementById("tab-board"));

  // ---- 範圍選單：縣市、類型（只列有分級介紹的）----
  const scope = document.getElementById("scope");
  const cnt = (f) => done.filter(f).length;
  scope.appendChild(el('<option value="all:">全部（' + done.length + "）</option>"));
  const cities = [...new Set(done.map((a) => a.city))].sort((x, y) => cnt((a) => a.city === y) - cnt((a) => a.city === x));
  const og1 = el('<optgroup label="縣市"></optgroup>');
  cities.forEach((c) => og1.appendChild(el('<option value="city:' + esc(c) + '">' + esc(c) + "（" + cnt((a) => a.city === c) + "）</option>")));
  const types = [...new Set(done.map((a) => a.type))].sort((x, y) => cnt((a) => a.type === y) - cnt((a) => a.type === x));
  const og2 = el('<optgroup label="類型"></optgroup>');
  types.forEach((t) => og2.appendChild(el('<option value="type:' + esc(t) + '">' + S.typeOf(t).emoji + " " + esc(t) + "（" + cnt((a) => a.type === t) + "）</option>")));
  scope.append(og1, og2);

  // ---- 出題：依程度 ----
  function questions(a, lv) {
    if (lv === "k") return [["圈圈看：這是不是" + a.type + "？　是　／　不是", "是"]];
    const qs = [["這處古蹟是哪一種？＿＿＿＿＿＿", a.type], ["用一句話說說它特別的地方：", a.c ? a.c[0] : ""]];
    if (lv !== "e" && a.eraInfo) qs.push(["它是哪個時期蓋的？＿＿＿＿＿＿", a.eraInfo.name + "（原文：" + a.attrs.year_src + "）"]);
    if (lv === "s" && a.q) qs.push(["探究題：" + a.q, "（開放作答）"]);
    return qs;
  }
  const sheet = document.getElementById("sheet");
  function make() {
    const [kind, val] = scope.value.split(/:(.*)/s);
    const pool = done.filter((a) => kind === "all" || (kind === "city" ? a.city === val : a.type === val));
    const pick = shuffle(pool).slice(0, +document.getElementById("n").value);
    const lv = App.level();
    const title = kind === "all" ? "認識臺灣的古蹟" : kind === "city" ? "認識" + val + "的古蹟" : "認識古蹟：" + val;
    sheet.hidden = false;
    sheet.replaceChildren(el('<div><h2 style="margin-top:0">🏯 ' + esc(title) + "（" + App.LEVELS[lv].name + "）</h2>" +
      '<p class="head"><span>班級：</span><span>座號：</span><span>姓名：</span></p></div>'));
    pick.forEach((a, i) => {
      const q = el('<div class="q"><div class="pic"></div><div><p><b>' + (i + 1) + ". " + esc(a.name) + "</b>（" + esc(a.place) + "）</p>" +
        "<p>" + esc(lv === "k" ? a.k : a.e) + "</p>" +
        questions(a, lv).map(([text, ans]) => "<p>" + esc(text) + '<br><span class="ans" hidden>答：' + esc(ans) + "</span></p>").join("") +
        "</div></div>");
      q.querySelector(".pic").replaceWith(App.photo(a, false));
      sheet.appendChild(q);
    });
    sheet.appendChild(el('<p class="credit">資料來源：文化部文化資產局「文資局古蹟」（政府資料開放授權條款第1版）；照片為同一份資料的附圖。古蹟探險家 heritage.hunglun.com</p>'));
    showKey();
    document.getElementById("print").hidden = false;
  }
  const showKey = () => sheet.querySelectorAll(".ans").forEach((x) => (x.hidden = !document.getElementById("key").checked));
  document.getElementById("make").onclick = make;
  document.getElementById("key").onchange = showKey;
  document.getElementById("print").onclick = () => window.print();
});
