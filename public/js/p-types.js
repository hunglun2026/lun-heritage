/* 看建築認類型：看照片選類型（只考外觀認得出來的類型，SITE.TYPES 的 game）。
   另一個玩法「哪個時代蓋的」：照片＋名字選時代（只出原文有建造年份的）。都用 core/quiz.js 出題。
   幼兒園：聽類型名稱，從 3 張照片找出來。 */
App.boot(function (data) {
  const { esc, el, shuffle } = App;
  const S = App.SITE;
  const root = document.getElementById("root");
  const GAME = Object.keys(S.TYPES).filter((t) => S.TYPES[t].game);
  // 只出單一類型、有照片、有分級介紹的，免得一處同時是兩種類型答案不唯一
  const pool = data.items.filter((a) => a.hasPhoto && a.done && a.types.length === 1 && GAME.includes(a.type));
  const typesInPool = GAME.filter((t) => pool.some((a) => a.type === t));
  const eraPool = data.items.filter((a) => a.hasPhoto && a.done && a.eraInfo);

  function typeRounds(n) {
    const choices = App.LEVELS[App.level()].choices;
    return shuffle(pool).slice(0, n).map((a) => {
      const others = shuffle(typesInPool.filter((t) => t !== a.type)).slice(0, choices - 1);
      return {
        item: a, prompt: "這處古蹟是哪一種？",
        options: shuffle([a.type].concat(others)).map((t) => ({ id: t, label: S.TYPES[t].emoji + " " + t })),
        answer: a.type,
        explain: "這是<b>" + esc(a.name) + "</b>（" + esc(a.place) + "）。" + esc(S.TYPES[a.type].hint) + "。",
      };
    });
  }
  function kidRounds(n) {
    // 每題挑一個類型，正確照片 1 張＋其他類型 2 張
    return shuffle(typesInPool).slice(0, n).map((t) => {
      const a = shuffle(pool.filter((x) => x.type === t))[0];
      const others = shuffle(pool.filter((x) => x.type !== t)).slice(0, 2);
      return {
        item: a, noPic: true, prompt: "哪一個是 <b>" + esc(t) + "</b>？", say: "哪一個是" + t + "？",
        options: shuffle([a].concat(others)).map((x) => ({ id: x.id, label: x.name, pic: x })),
        answer: a.id, explain: esc(S.TYPES[t].hint) + "。",
      };
    });
  }
  function eraRounds(n) {
    const choices = App.LEVELS[App.level()].choices;
    const eras = S.ERAS.map((e) => e.id);
    return shuffle(eraPool).slice(0, n).map((a) => {
      const others = shuffle(eras.filter((e) => e !== a.eraInfo.id)).slice(0, choices - 1);
      return {
        item: a, prompt: "<b>" + esc(a.name) + "</b> 是哪個時期蓋的？",
        options: shuffle([a.eraInfo.id].concat(others)).map((id) => ({ id, label: S.ERA[id].name, sub: S.ERA[id].range })),
        answer: a.eraInfo.id,
        explain: "原文寫：「" + esc(a.attrs.year_src) + "」，所以是" + esc(a.eraInfo.name) + "。",
      };
    });
  }

  function menu() {
    if (App.level() === "k") {
      root.replaceChildren(el('<div class="panel"><p class="lead" style="margin-top:0">聽聽看是哪一種古蹟，再從照片裡找出來！</p>' +
        '<p><button class="btn primary big" id="kid">開始（6 題）🔈</button></p></div>'));
      root.querySelector("#kid").onclick = () => Quiz.run(root, { key: "types", title: "找找看是哪一種", rounds: kidRounds(6), onAgain: menu });
      return;
    }
    root.replaceChildren(el(
      '<div class="panel"><p class="lead" style="margin-top:0">目前可以出題的類型：' + typesInPool.map((t) => S.TYPES[t].emoji + esc(t)).join("、") + "。</p>" +
      '<p><button class="btn primary big" id="std">看照片認類型（10 題）</button></p>' +
      '<p><button class="btn big" id="timed">60 秒挑戰</button></p>' +
      (eraPool.length >= 4 ? '<p><button class="btn big" id="era">哪個時代蓋的（' + Math.min(10, eraPool.length) + " 題）</button></p>" : "") + "</div>"));
    root.querySelector("#std").onclick = () => Quiz.run(root, { key: "types", title: "看建築認類型", rounds: typeRounds(10), onAgain: menu });
    root.querySelector("#timed").onclick = () => Quiz.run(root, { key: "types-timed", title: "60 秒挑戰", rounds: typeRounds(60), timed: 60, onAgain: menu });
    const era = root.querySelector("#era");
    if (era) era.onclick = () => Quiz.run(root, { key: "era", title: "哪個時代蓋的", rounds: eraRounds(10), onAgain: menu });
  }
  document.addEventListener("app-level", menu);
  menu();
});
