/* 猜猜我是誰：線索由模糊到明確（哪一種 → 哪個時代 → 在哪個縣市 → 三條特徵 → 照片）。
   單人挑戰：越早猜中分數越高。全班搶答：老師投影、控制線索。幼兒園：聽名字，從 3 張照片找出來。
   線索 c 由改寫提供，已經查核過不含名稱；這裡再用 App.mask 遮一次（含去掉縣市前綴的名稱）。 */
App.boot(function (data) {
  const { esc, el, shuffle } = App;
  const S = App.SITE;
  const root = document.getElementById("root");
  const pool = data.items.filter((a) => a.done && a.c && a.c.length === 3);

  function clues(a) {
    return [
      { label: "我是哪一種", text: "我是" + a.typeInfo.emoji + a.type + "。" },
      a.eraInfo && { label: "我是哪個時代蓋的", text: "我是" + a.eraInfo.name + "蓋的。" },
      { label: "我在哪裡", text: "我在" + a.city + "。" },
      { label: "我的特徵", text: App.mask(a, a.c[0]) },
      { label: "我的特徵", text: App.mask(a, a.c[1]) },
      { label: "我的特徵", text: App.mask(a, a.c[2]) },
      a.hasPhoto && { label: "我的照片", text: "", photo: true },
    ].filter(Boolean);
  }

  function kidPlay() {
    const list = shuffle(pool.filter((a) => a.hasPhoto)).slice(0, 8);
    const rounds = list.map((a) => {
      const others = shuffle(pool.filter((x) => x.hasPhoto && x !== a && x.type !== a.type)).slice(0, 2);
      return {
        item: a, noPic: true, prompt: "哪一個是 <b>" + esc(a.name) + "</b>？", say: "哪一個是" + a.name + "？",
        options: shuffle([a].concat(others)).map((x) => ({ id: x.id, label: x.name, pic: x })),
        answer: a.id, explain: "這是" + esc(a.name) + "。" + esc(a.k),
      };
    });
    Quiz.run(root, { key: "guess-kid", title: "找找看", rounds, onAgain: menu });
  }

  function menu() {
    if (App.level() === "k") {
      root.replaceChildren(el('<div class="panel"><p class="lead" style="margin-top:0">聽聽看是哪一處古蹟，再從照片裡找出來！</p>' +
        '<p><button class="btn primary big" id="kid">開始（8 題）🔈</button></p></div>'));
      root.querySelector("#kid").onclick = kidPlay;
      return;
    }
    root.replaceChildren(el(
      '<div class="panel"><p class="lead" style="margin-top:0">線索會一個一個出現：哪一種、哪個時代、在哪裡、三個特徵，最後看照片。越早猜中，分數越高。</p>' +
      '<p><button class="btn primary big" id="solo">單人挑戰（8 題）</button></p>' +
      '<p><button class="btn big" id="class">全班搶答（老師投影）</button></p></div>'));
    root.querySelector("#solo").onclick = () => solo();
    root.querySelector("#class").onclick = classMode;
  }

  function clueBox(a, cs, shown) {
    const box = el("<div></div>");
    cs.slice(0, shown).forEach((c, i) => {
      box.appendChild(c.photo ? App.photo(a) : el('<div class="clue"><small>線索 ' + (i + 1) + "・" + c.label + "</small><br>" + esc(c.text) + "</div>"));
    });
    return box;
  }

  // ---- 單人（list：「只練錯的」時傳入上一輪答錯的）----
  function solo(list) {
    const picked = list ? shuffle(list) : shuffle(pool).slice(0, 8);
    let idx = 0, score = 0, combo = 0;
    const wrongs = [];
    const next = () => (idx >= picked.length ? done() : round(picked[idx]));
    function round(a) {
      const cs = clues(a);
      let shown = 1, over = false, missed = false;
      // 干擾選項同類型優先（不然一看類型就知道），選項數依程度
      const same = shuffle(pool.filter((x) => x.type === a.type && x !== a));
      const distract = same.concat(shuffle(pool.filter((x) => x.type !== a.type))).slice(0, App.LEVELS[App.level()].choices - 1);
      root.replaceChildren(el(
        '<div class="stage"><div class="bar"><i style="width:' + (idx / picked.length) * 100 + '%"></i></div>' +
        "<p>第 " + (idx + 1) + " / " + picked.length + " 題　⭐ " + score + " 分</p>" +
        (combo >= 2 ? '<p class="combo">🔥 連續答對 ' + combo + " 題！</p>" : "") + '<div id="clues"></div>' +
        '<div class="opts" id="opts"></div><p><button class="btn" id="more">再給我一個線索（-1 分）</button></p>' +
        '<div class="feedback" id="fb" role="status" aria-live="polite"></div><div id="nx"></div></div>'));
      const clueEl = root.querySelector("#clues"), opts = root.querySelector("#opts"), more = root.querySelector("#more"), fb = root.querySelector("#fb");
      const draw = () => { clueEl.replaceChildren(clueBox(a, cs, shown)); more.disabled = shown >= cs.length; };
      const finishRound = (ok) => {
        over = true;
        const pts = ok ? Math.max(1, cs.length + 1 - shown) : 0;
        score += pts;
        combo = ok ? combo + 1 : 0;
        if (ok) Fx.right();
        if (!ok || missed) wrongs.push({ item: a, answer: a.name });
        shown = cs.length; draw(); more.remove();
        opts.querySelectorAll(".opt").forEach((b) => { b.disabled = true; if (b.dataset.id === a.id) b.classList.add("right"); });
        fb.className = "feedback " + (ok ? "ok" : "no");
        fb.innerHTML = (ok ? "答對了！🎉 +" + pts + " 分。" : "答案是 <b>" + esc(a.name) + "</b>。") + ' <a href="' + S.detailUrl + encodeURIComponent(a.id) + '" target="_blank" rel="noopener">看介紹</a>';
        const b = el('<button class="btn primary big">' + (idx === picked.length - 1 ? "看成績 🏆" : "下一題 ➜") + "</button>");
        b.onclick = () => { idx++; next(); };
        root.querySelector("#nx").appendChild(b); b.focus();
      };
      shuffle([a].concat(distract)).forEach((o) => {
        const b = el('<button class="opt">' + esc(o.name) + "</button>");
        b.dataset.id = o.id;
        b.onclick = () => {
          if (over) return;
          if (o.id === a.id) return finishRound(true);
          b.disabled = true; b.classList.add("wrong"); Fx.wrong(); missed = true;
          if (shown < cs.length) { shown++; draw(); fb.className = "feedback no"; fb.textContent = "不是喔，再給你一個線索！"; } else finishRound(false);
        };
        opts.appendChild(b);
      });
      more.onclick = () => { if (shown < cs.length) { shown++; draw(); } };
      draw();
    }
    function done() {
      const total = picked.length * 7; // 每題最多約 7 分（第一個線索就猜中）
      const stars = score >= total * 0.6 ? 3 : score >= total * 0.35 ? 2 : score > 0 ? 1 : 0;
      const prev = Quiz.best("guess");
      if (!list) Quiz.saveBest("guess", score); // 「只練錯的」是複習，不記最佳分數與護照星數
      Quiz.result(root, {
        key: list ? null : "guess", title: "猜謎完成！", stars, score: score + " / " + total,
        extra: prev ? "<p>最佳紀錄：" + Math.max(prev, score) + " 分</p>" : "", wrongs, onAgain: menu,
        onRedo: () => solo(wrongs.map((w) => w.item)),
      });
    }
    next();
  }

  // ---- 全班搶答 ----
  function classMode() {
    const order = shuffle(pool);
    let idx = 0, shown = 1, revealed = false, a = order[0], cs = clues(a);
    root.replaceChildren(el(
      '<div class="stage"><p id="info" class="lead" style="margin-top:0"></p><div id="clues"></div>' +
      '<div id="ans" style="font-size:2.4rem;font-weight:800;color:var(--green-d)"></div>' +
      '<p style="margin-top:16px"><button class="btn primary big" id="more">下一個線索（空白鍵）</button> ' +
      '<button class="btn big" id="rev">揭曉答案</button> <button class="btn big" id="nxt">換下一處 ➜</button></p>' +
      '<p style="font-size:.85rem;color:var(--ink2)">提醒：老師用「教師專區」的搶答計分板記分。</p></div>'));
    const clueEl = root.querySelector("#clues"), ans = root.querySelector("#ans");
    const draw = () => {
      root.querySelector("#info").textContent = "第 " + (idx + 1) + " 處　線索 " + shown + " / " + cs.length;
      clueEl.replaceChildren(clueBox(a, cs, shown));
      ans.textContent = revealed ? a.name : "";
      root.querySelector("#more").disabled = shown >= cs.length || revealed;
    };
    const moreClue = () => { if (!revealed && shown < cs.length) { shown++; draw(); } };
    root.querySelector("#more").onclick = moreClue;
    root.querySelector("#rev").onclick = () => { revealed = true; shown = cs.length; draw(); };
    root.querySelector("#nxt").onclick = () => { idx = (idx + 1) % order.length; a = order[idx]; cs = clues(a); shown = 1; revealed = false; draw(); };
    const key = (e) => {
      if (!document.body.contains(root.querySelector("#more"))) return document.removeEventListener("keydown", key);
      if (e.code === "Space" && e.target === document.body) { e.preventDefault(); moreClue(); }
    };
    document.addEventListener("keydown", key);
    draw();
  }
  document.addEventListener("app-level", menu);
  menu();
});
