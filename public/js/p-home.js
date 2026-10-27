/* 首頁：引導入口（身分 → 程度 → 推薦 3 個工具）、數字跳動、捲到才浮現、今天的古蹟。
   引導入口沿用故宮與海洋探險家；樣式在 /css/base.css 的「首頁」段。捲動放大切換的導覽等精選照片齊了再加。 */
(function () {
  "use strict";
  const { esc } = App;
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- 引導入口：身分記在這台裝置，程度就是全站程度（App.setLevel） ----
  const R = (href, ico, name, why) => ({ href, ico, name, why });
  const RECS = {
    student: {
      k: [R("/guess", "🔍", "找找看", "聽名字，從照片裡找出古蹟"), R("/types", "🧩", "這是哪一種", "聽到「寺廟」，找出寺廟的照片")],
      e: [R("/map", "🗺️", "我家附近的古蹟", "先找找自己住的地方有哪些古蹟"), R("/sites", "📖", "古蹟圖鑑", "有白話介紹，挑一處最喜歡的"), R("/types", "🧩", "看建築認類型", "寺廟、教堂、車站，看照片分一分")],
      j: [R("/timeline", "⏳", "時代排排看", "誰最早蓋好？從荷西排到戰後"), R("/guess", "🔍", "猜猜我是誰", "線索越少猜中，分數越高"), R("/sites", "📖", "古蹟圖鑑", "可以展開讀文資局原文")],
      s: [R("/sites", "📖", "古蹟圖鑑", "直接讀文資局原文，看探究題"), R("/timeline", "⏳", "時代排排看", "看原文寫的建造年代排順序"), R("/map", "🗺️", "我家附近的古蹟", "看古蹟分布，想想為什麼集中在那裡")],
    },
    teacher: {
      k: [R("/types", "🧩", "這是哪一種", "投影出來，全班一起指出照片"), R("/help", "📘", "使用說明", "幼兒園模式怎麼用、語音怎麼開")],
      e: [R("/teacher", "📝", "學習單", "選你們學校所在的縣市，一鍵產生"), R("/guess", "🔍", "猜猜我是誰", "投影全班搶答，不用每人一台"), R("/map", "🗺️", "我家附近的古蹟", "鄉土課從學校附近的古蹟開始")],
      j: [R("/timeline", "⏳", "時代排排看", "歷史課認識五個時期"), R("/teacher", "📝", "學習單", "依類型或縣市產生學習單"), R("/sites", "📖", "古蹟圖鑑", "挑兩處比一比，印成比較表")],
      s: [R("/sites", "📖", "古蹟圖鑑", "每處都有探究題，可以當報告題目"), R("/teacher", "📝", "學習單", "原文閱讀加探究題"), R("/timeline", "⏳", "時代排排看", "用原文年代做時序練習")],
    },
  };
  const WHO = { student: "學生", teacher: "老師" };
  const guide = document.getElementById("start");
  const steps = [...guide.querySelectorAll(".g-step")];
  let who = App.store.get("guide", null);
  if (!WHO[who]) who = null;
  const show = (name) => steps.forEach((s) => (s.hidden = s.dataset.step !== name));
  function done() {
    const lv = App.level();
    document.getElementById("g-who").textContent = WHO[who] + "・" + App.LEVELS[lv].name;
    document.getElementById("g-recs").innerHTML = RECS[who][lv].map((r) =>
      '<a class="tool" href="' + r.href + '"><div class="ico">' + r.ico + "</div><h3>" + esc(r.name) + '</h3><span class="why">' + esc(r.why) + "</span></a>").join("");
    show("done");
  }
  guide.querySelectorAll("[data-who]").forEach((b) => (b.onclick = () => {
    who = b.dataset.who;
    App.store.set("guide", who);
    document.getElementById("g-lvq").textContent = who === "teacher" ? "你教哪個程度？" : "你幾年級？";
    guide.querySelectorAll("[data-lv]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.lv === App.level())));
    show("lv");
  }));
  guide.querySelectorAll("[data-lv]").forEach((b) => (b.onclick = () => {
    App.setLevel(b.dataset.lv);
    const sel = document.getElementById("lvl");
    if (sel) sel.value = b.dataset.lv; // 頁首的程度選單跟著換
    done();
  }));
  guide.querySelector("[data-back]").onclick = () => show("who");
  guide.querySelector("[data-reset]").onclick = () => { who = null; App.store.set("guide", null); show("who"); };
  document.addEventListener("app-level", () => { if (who && !guide.querySelector('[data-step="done"]').hidden) done(); });
  if (who) done();

  // ---- 捲到才浮現 ----
  const io = "IntersectionObserver" in window && !reduce
    ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); } }), { threshold: 0.15 })
    : null;
  document.querySelectorAll(".w-reveal").forEach((x) => (io ? io.observe(x) : x.classList.add("in-view")));

  // ---- 數字跳動＋今天的古蹟（要等資料）----
  function countUp(elm, to) {
    if (reduce) { elm.textContent = to.toLocaleString(); return; }
    const t0 = performance.now(), dur = 900;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      elm.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  App.boot(function (data) {
    const items = data.items;
    const nums = { count: items.length, national: items.filter((a) => a.cls === "國定").length,
      cities: new Set(items.map((a) => a.city).filter(Boolean)).size, rewritten: data.meta.rewritten };
    document.querySelectorAll("[data-w]").forEach((e) => countUp(e, nums[e.dataset.w] || 0));
    const pool = items.filter((a) => a.done && a.hasPhoto);
    const today = App.shuffle(pool).slice(0, 8);
    document.getElementById("today").replaceChildren(...today.map((a) => {
      const c = App.el('<a class="acard" href="/sites#' + encodeURIComponent(a.id) + '"><div class="info"><b>' + esc(a.name) + "</b><small>" +
        esc(a.place) + "・" + a.typeInfo.emoji + " " + esc(a.type) + "</small></div></a>");
      c.prepend(App.photo(a));
      return c;
    }));
  });
})();
