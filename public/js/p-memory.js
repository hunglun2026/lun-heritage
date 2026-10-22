/* 翻牌配對：照片牌對名字牌。入門 6 對、挑戰 8 對，記翻牌次數與秒數。
   幼兒園不識字：改成「照片配照片」，翻開時唸出名字。 */
App.boot(function (data) {
  const { esc, el, shuffle } = App;
  const S = App.SITE;
  const root = document.getElementById("root");
  // 有照片、有分級介紹的才出；名字太長的牌面放不下
  const pool = data.items.filter((a) => a.hasPhoto && a.done && a.name.length <= 9);
  const MODES = { easy: { name: "入門", pairs: 6 }, hard: { name: "挑戰", pairs: 8 } };

  function menu() {
    root.replaceChildren(el(
      '<div class="panel"><p class="lead" style="margin-top:0">把古蹟的照片和名字配成一對（幼兒園是兩張一樣的照片配一對）。一次翻兩張，一樣的就留著，不一樣的會蓋回去。</p>' +
      '<p><button class="btn primary big" data-m="easy">入門（6 對）</button></p>' +
      '<p><button class="btn big" data-m="hard">挑戰（8 對）</button></p></div>'));
    root.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => play(b.dataset.m)));
  }

  function play(mode) {
    const n = Math.min(MODES[mode].pairs, pool.length);
    // 盡量每一類都有，畫面比較熱鬧，也不會整盤都是長得很像的廟
    const byType = [...new Set(pool.map((a) => a.type))].map((t) => shuffle(pool.filter((a) => a.type === t)));
    const picked = [];
    for (let k = 0; picked.length < n && k < 30; k++) byType.forEach((l) => { if (l[k] && picked.length < n) picked.push(l[k]); });
    const kid = App.level() === "k";
    const cards = shuffle(picked.flatMap((a) => [{ a, kind: "pic" }, { a, kind: kid ? "pic" : "name" }]));
    let first = null, lock = false, flips = 0, found = 0;
    const t0 = Date.now();
    const head = el('<p class="lead" style="text-align:center">翻牌 <b id="flips">0</b> 次　配對 <b id="found">0</b> / ' + n + "</p>");
    const board = el('<div class="memory' + (n > 6 ? " m8" : "") + '"></div>');
    root.replaceChildren(head, board);

    cards.forEach((c) => {
      const b = el('<button class="mcard" aria-label="蓋著的牌"><span class="back" aria-hidden="true">🏯</span><span class="front"></span></button>');
      const front = b.querySelector(".front");
      if (c.kind === "pic") {
        const p = App.photo(c.a);
        p.loading = "eager"; // 牌蓋著時也先載好，翻開才不會空白
        front.appendChild(p);
      } else front.innerHTML = "<b>" + esc(c.a.name) + "</b>";
      c.btn = b;
      b.onclick = () => flip(c);
      board.appendChild(b);
    });
    function open(c, show) {
      c.btn.classList.toggle("up", show);
      c.btn.setAttribute("aria-label", show ? (c.kind === "pic" ? "照片：" : "名字：") + c.a.name : "蓋著的牌");
    }
    function flip(c) {
      if (lock || c.done || c === first) return;
      open(c, true);
      if (kid) App.say(c.a.name);
      flips++;
      head.querySelector("#flips").textContent = flips;
      if (!first) { first = c; return; }
      const a = first;
      first = null;
      if (a.a === c.a) {
        a.done = c.done = true;
        a.btn.classList.add("ok"); c.btn.classList.add("ok");
        found++;
        head.querySelector("#found").textContent = found;
        Fx.right();
        if (found === picked.length) setTimeout(done, 600);
      } else {
        lock = true;
        setTimeout(() => { open(a, false); open(c, false); lock = false; }, 1000);
      }
    }
    function done() {
      const sec = Math.round((Date.now() - t0) / 1000);
      const key = "memory-" + mode + (kid ? "-kid" : "");
      const prev = Quiz.best(key);
      Quiz.saveBest(key, flips, true); // 翻牌次數越少越好
      Quiz.result(root, {
        key: "memory-" + mode, title: "全部配對完成！", stars: flips <= n * 2 + 4 ? 3 : flips <= n * 2 + 12 ? 2 : 1,
        score: "翻了 " + flips + " 次，花了 " + sec + " 秒",
        extra: (prev && flips < prev ? "<p>🎊 打破紀錄！（上次 " + prev + " 次）</p>" : prev ? "<p>最佳紀錄：" + Math.min(prev, flips) + " 次</p>" : "") +
          '<h3>這次認識的古蹟</h3><div class="chips" style="justify-content:center">' +
          picked.map((a) => '<a class="chip" style="text-decoration:none;color:inherit" href="' + S.detailUrl + encodeURIComponent(a.id) + '" target="_blank" rel="noopener">' +
            a.typeInfo.emoji + " " + esc(a.name) + "</a>").join("") + "</div>",
        onAgain: menu,
      });
    }
  }
  menu();
});
