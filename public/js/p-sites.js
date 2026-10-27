/* 古蹟圖鑑：搜尋、篩選（類型、等級、縣市、時代）、詳細介紹對話框（網址 #古蹟id 可直接開啟）、比一比。
   介紹文字依程度（App.level）切換；打開詳細介紹＝在探險護照蓋章（progress.js）。
   還沒改寫的標「整理中」先給原文；原文太少（short）或 skip 的只列基本資料，標「資料較少」。 */
App.boot(function (data) {
  const { esc, el, photo } = App;
  const S = App.SITE;
  const all = data.items;
  const PAGE = 60; // 一次畫幾張卡片（1,000 多張一次畫完，手機會卡）
  const state = { q: "", type: "", cls: "", city: "", era: "", done: false, shown: PAGE };
  const grid = document.getElementById("grid");
  const dlg = document.getElementById("dlg");
  const body = document.getElementById("dlg-body");

  // ---- 篩選 ----
  const count = (f) => all.filter(f).length;
  const typeOpts = Object.keys(S.TYPES).filter((t) => all.some((a) => a.types.includes(t)))
    .sort((x, y) => count((a) => a.types.includes(y)) - count((a) => a.types.includes(x)));
  const defs = [
    ["type", "類型", typeOpts.map((t) => [t, S.TYPES[t].emoji + " " + t]), true],
    ["cls", "等級", S.CLASSES.map((c) => [c, c + "古蹟"]), false],
    ["era", "時代", S.ERAS.map((e) => [e.id, e.short]), false],
  ];
  const filters = document.getElementById("filters");
  defs.forEach(([key, label, opts, kid]) => {
    const row = el('<div class="chips' + (kid ? "" : " nokid") + '"><span class="lab">' + label + "</span></div>");
    opts.forEach(([val, text]) => {
      const b = el('<button class="chip" aria-pressed="false">' + esc(text) + "</button>");
      b.dataset.v = val;
      b.onclick = () => {
        state[key] = state[key] === val ? "" : val;
        row.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.v === state[key])));
        reset();
      };
      row.appendChild(b);
    });
    filters.appendChild(row);
  });
  const cities = [...new Set(all.map((a) => a.city).filter(Boolean))].sort((x, y) => count((a) => a.city === y) - count((a) => a.city === x));
  const crow = el('<div class="chips"><span class="lab">縣市</span><select class="inline" id="city" aria-label="選縣市"><option value="">全部縣市</option>' +
    cities.map((c) => '<option value="' + esc(c) + '">' + esc(c) + "（" + count((a) => a.city === c) + "）</option>").join("") + "</select>" +
    '<label class="nokid" style="margin-left:12px"><input type="checkbox" id="done"> 只看有分級介紹的</label></div>');
  filters.appendChild(crow);
  crow.querySelector("#city").onchange = (e) => { state.city = e.target.value; reset(); };
  crow.querySelector("#done").onchange = (e) => { state.done = e.target.checked; reset(); };
  document.getElementById("q").addEventListener("input", (e) => { state.q = e.target.value.trim(); reset(); });
  // 從地圖或其他頁點進來：/sites?city=臺南市&type=寺廟
  const qs = new URLSearchParams(location.search);
  if (qs.get("city")) { state.city = qs.get("city"); crow.querySelector("#city").value = state.city; }
  ["type", "cls", "era"].forEach((k) => {
    if (!qs.get(k)) return;
    state[k] = qs.get(k);
    filters.querySelectorAll(".chip").forEach((c) => { if (c.dataset.v === state[k]) c.setAttribute("aria-pressed", "true"); });
  });

  function match(a) {
    if (state.type && !a.types.includes(state.type)) return false;
    if (state.cls && a.cls !== state.cls) return false;
    if (state.city && a.city !== state.city) return false;
    if (state.era && (!a.eraInfo || a.eraInfo.id !== state.era)) return false;
    if (state.done && !a.done) return false;
    if (state.q && !(a.name + a.alt + a.place).includes(state.q)) return false;
    return true;
  }
  const reset = () => { state.shown = PAGE; render(); };
  function render() {
    // 幼兒園只看有照片、有幼兒園一句話的
    const list = all.filter((a) => match(a) && (App.level() !== "k" || (a.hasPhoto && a.done)))
      // 有分級介紹、有照片的排前面
      .sort((x, y) => (y.done - x.done) || (y.hasPhoto - x.hasPhoto));
    document.getElementById("count").textContent = list.length ? "找到 " + list.length + " 處古蹟" : "找不到，換個條件試試看。";
    grid.replaceChildren(...list.slice(0, state.shown).map(card));
    const more = document.getElementById("more");
    more.hidden = list.length <= state.shown;
    more.querySelector("button").textContent = "再看 " + Math.min(PAGE, list.length - state.shown) + " 處（還有 " + (list.length - state.shown) + " 處）";
  }
  document.getElementById("more").querySelector("button").onclick = () => { state.shown += PAGE; render(); };
  document.addEventListener("app-level", render);

  const typeBadge = (t) => '<span class="tbadge" style="background:' + S.typeOf(t).color + '">' + S.typeOf(t).emoji + " " + esc(t) + "</span>";
  function card(a) {
    const c = el('<button class="acard' + (a.done ? "" : " thin") + '"><div class="info"><b>' + esc(a.name) + "</b><small>" + esc(a.place) + "</small>" +
      '<div class="meta">' + typeBadge(a.type) + (a.cls === "國定" ? ' <span class="clsbadge">國定</span>' : "") + "</div></div></button>");
    c.prepend(photo(a));
    c.onclick = () => open(a);
    return c;
  }

  // ---- 詳細介紹 ----
  const fact = (title, html) => (html ? '<div class="fact"><h4>' + title + "</h4><p>" + html + "</p></div>" : "");
  const NONE = "（資料沒有寫）";
  const credit = (a) => (a.photo ? "照片：" + esc(a.photo.by) + "（文化部文化資產局「文資局古蹟」資料集附圖）。" : "這處古蹟目前沒有照片。");
  const source = (a) => '原始介紹：<a href="' + esc(a.src) + '" target="_blank" rel="noopener">國家文化資產網</a>（文化部文化資產局，政府資料開放授權）。' +
    (a.done ? "分級介紹由 AI 依原文改寫並經程式查核，有錯請按頁尾「回報內容錯誤」。" : "");
  function badges(a) {
    return '<span class="clsbadge">' + esc(a.cls) + "古蹟</span> " + a.types.map(typeBadge).join(" ") +
      (a.eraInfo ? ' <span class="tbadge" style="background:' + a.eraInfo.color + '">' + esc(a.eraInfo.short) + "</span>" : "");
  }
  async function open(a) {
    history.replaceState(null, "", location.pathname + location.search + "#" + a.id);
    Progress.seen(a.id);
    const lv = App.level();
    const kid = lv === "k";
    const thin = !a.done;
    body.innerHTML =
      '<div class="dlg-bar">' + (kid ? "" : '<button class="btn" id="add">' + (cmp.includes(a) ? "✔ 已加入比一比" : "➕ 加入比一比") + "</button>") +
      '<button class="btn" id="x">關閉 ✕</button></div>' +
      "<h2 style='margin-top:0'>" + esc(a.name) + ' <span id="say1"></span></h2>' +
      (kid ? "" : "<p>" + badges(a) + "</p>") +
      '<div class="gallery big" id="gal"></div><p class="credit">' + credit(a) + "</p>" +
      (thin ? '<p class="note">' + (a.skip || a.short ? "這處古蹟的原始資料比較少，只能先列出基本資料。" : "這處古蹟的分級介紹還在整理中，先看文資局的原文。") + "</p>" : "") +
      (a.done ? '<div class="fact intro"><h4>' + (kid ? "認識我" : "認識這處古蹟") + '</h4><p id="introtext"></p></div>' : "") +
      (kid ? "" : '<div class="facts">' +
        fact("所在地", esc(a.place) + (a.lat != null ? '　<a href="/map#' + a.id + '">在地圖上看</a>' : "")) +
        fact("建造年代（原文）", a.attrs.year_src ? esc(a.attrs.year_src) : NONE) +
        fact("開放參觀", esc(a.attrs.open || NONE)) + "</div>") +
      (a.done && lv === "__off__" && a.q ? '<div class="fact"><h4>探究題</h4><p>' + esc(a.q) + "</p></div>" : "") +
      (!kid && (lv === "j" || thin) ? '<details class="orig"' + (thin ? " open" : "") + '><summary>看原始資料（文資局原文）</summary><p id="origtext">載入中…</p></details>' : "") +
      (kid ? "" : '<p class="credit">' + source(a) + "</p>");
    if (a.done) body.querySelector("#introtext").textContent = App.intro(a, lv);
    body.querySelector("#say1").appendChild(App.sayBtn(a.name + "。" + (a.k || ""), "唸出" + a.name));
    body.querySelector("#gal").appendChild(photo(a, true, "xl"));
    body.querySelector("#x").onclick = () => dlg.close();
    const add = body.querySelector("#add");
    if (add) add.onclick = (e) => { addCmp(a); e.target.textContent = "✔ 已加入比一比"; };
    if (!dlg.open) dlg.showModal();
    body.parentElement.scrollTop = 0;
    if (kid) App.say(a.name);
    // 原文分檔載入：高中看原文、國中與整理中的展開原文
    if (lv === "__off__" || body.querySelector("#origtext")) {
      const orig = await App.loadOrig(a);
      const o = body.querySelector("#origtext");
      if (o) o.textContent = orig || NONE;
      if (a.done && lv === "__off__") body.querySelector("#introtext").textContent = App.intro(a, lv);
    }
  }
  dlg.addEventListener("close", () => history.replaceState(null, "", location.pathname + location.search));
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

  // ---- 比一比：選兩處並排比較 ----
  const cmp = [];
  const bar = document.getElementById("cmpbar");
  const cmpBox = document.getElementById("cmp");
  function addCmp(a) {
    if (cmp.includes(a)) return;
    if (cmp.length >= 2) cmp.shift(); // 只比兩處，加第三處就換掉最早的
    cmp.push(a);
    drawBar();
  }
  function drawBar() {
    bar.hidden = !cmp.length;
    document.body.classList.toggle("has-cmpbar", cmp.length > 0);
    bar.replaceChildren(el("<div><b>比一比：</b>" + cmp.map((a, i) => '<button class="chip" data-i="' + i + '" aria-label="移除 ' + esc(a.name) + '">' + esc(a.name) + " ✕</button>").join(" ") +
      (cmp.length < 2 ? " <small>再選一處古蹟</small>" : ' <button class="btn primary" id="go-cmp">開始比較 ➜</button>') + "</div>"));
    bar.querySelectorAll("[data-i]").forEach((b) => (b.onclick = () => { cmp.splice(+b.dataset.i, 1); drawBar(); }));
    const go = bar.querySelector("#go-cmp");
    if (go) go.onclick = () => { dlg.close(); compare(cmp[0], cmp[1]); };
  }
  const ROWS = [
    ["類型", (a) => a.types.join("、")],
    ["等級", (a) => a.cls + "古蹟"],
    ["時代", (a) => (a.eraInfo ? a.eraInfo.name : NONE)],
    ["建造年代", (a) => a.attrs.year_src || NONE],
    ["所在地", (a) => a.place],
    ["開放參觀", (a) => a.attrs.open || NONE],
    ["一句話介紹", (a) => a.k || NONE],
  ];
  function compare(a, b) {
    cmpBox.hidden = false;
    cmpBox.replaceChildren(el(
      '<div class="sheet"><h2>🔍 比一比：' + esc(a.name) + " 和 " + esc(b.name) + "</h2>" +
      '<div class="tablewrap"><table class="cmp"><thead><tr><th></th><th scope="col">' + esc(a.name) + '</th><th scope="col">' + esc(b.name) + "</th></tr></thead><tbody>" +
      '<tr><th scope="row">照片</th><td class="p0"></td><td class="p1"></td></tr>' +
      ROWS.map(([label, f]) => {
        const x = f(a), y = f(b);
        return '<tr><th scope="row">' + label + (x === y && x !== NONE ? ' <span class="same">一樣</span>' : "") + "</th><td>" + esc(x) + "</td><td>" + esc(y) + "</td></tr>";
      }).join("") + "</tbody></table></div>" +
      "<p><b>想一想：</b>這兩處古蹟還有哪裡一樣？哪裡不一樣？</p><p class=\"lines\"></p>" +
      '<p class="noprint"><button class="btn primary" id="cmp-print">列印</button> <button class="btn" id="cmp-close">關閉比較</button></p></div>'
    ));
    cmpBox.querySelector(".p0").appendChild(photo(a));
    cmpBox.querySelector(".p1").appendChild(photo(b));
    cmpBox.querySelector("#cmp-close").onclick = () => { cmpBox.hidden = true; };
    cmpBox.querySelector("#cmp-print").onclick = () => { document.body.classList.add("pcmp"); window.print(); };
    cmpBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  addEventListener("afterprint", () => document.body.classList.remove("pcmp"));

  render();
  const want = decodeURIComponent(location.hash.slice(1));
  const hit = want && all.find((a) => a.id === want);
  if (hit) open(hit);
});
