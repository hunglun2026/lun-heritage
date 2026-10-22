/* 時代排排看：每回合 4 處古蹟，依建造年代從早到晚點。5 回合，算全部排對幾回合。
   年份來自轉接器從原文抽的建造年（抓不到的不出題）；揭曉時附原文那一句，學生看得到根據。 */
App.boot(function (data) {
  const { esc, el, shuffle } = App;
  const S = App.SITE;
  const root = document.getElementById("root");
  const pool = data.items.filter((a) => a.year && a.done);
  const ROUNDS = 5, PER = 4, GAP = 5; // 四處年份至少差 5 年，太接近分不出來

  function pickFour() {
    for (let t = 0; t < 50; t++) {
      const picked = [];
      for (const a of shuffle(pool)) {
        if (picked.every((b) => Math.abs(b.year - a.year) >= GAP)) picked.push(a);
        if (picked.length === PER) return picked;
      }
    }
    return null;
  }

  function eraBar() {
    return '<div class="tl-line">' + S.ERAS.map((e) => '<span style="background:' + e.color + '">' + esc(e.short) + " " + esc(e.range) + "</span>").join("") + "</div>";
  }

  function play() {
    let round = 0, right = 0;
    const wrongs = [];
    function next() {
      if (round >= ROUNDS) return done();
      const four = pickFour();
      if (!four) return root.replaceChildren(el('<p class="lead">有年代的古蹟還不夠多，等分級介紹多寫一些再來玩。</p>'));
      const order = [];
      root.replaceChildren(el(
        '<div class="stage"><div class="bar"><i style="width:' + (round / ROUNDS) * 100 + '%"></i></div>' +
        "<p>第 " + (round + 1) + " / " + ROUNDS + " 回　排對 " + right + " 回</p>" + eraBar() +
        "<h2 style=\"margin:.4em 0\">誰最早蓋好？依建造年代從早到晚點一點</h2>" +
        '<div class="tl-cards" id="cards"></div><div class="feedback" id="fb" role="status" aria-live="polite"></div>' +
        '<p><button class="btn" id="undo">重新點</button></p><div id="nx"></div></div>'));
      const box = root.querySelector("#cards");
      const cards = four.map((a) => {
        const c = el('<button class="tl-card"><b>' + esc(a.name) + "</b></button>");
        c.prepend(App.photo(a));
        c.onclick = () => {
          if (order.includes(a) || order.length === PER) return;
          order.push(a);
          c.classList.add("picked");
          c.appendChild(el('<span class="ord">' + order.length + "</span>"));
          if (order.length === PER) check();
        };
        box.appendChild(c);
        return [a, c];
      });
      root.querySelector("#undo").onclick = () => {
        order.length = 0;
        cards.forEach(([, c]) => { c.classList.remove("picked"); const o = c.querySelector(".ord"); if (o) o.remove(); });
      };
      function check() {
        const sorted = four.slice().sort((p, q) => p.year - q.year);
        const ok = order.every((a, i) => a === sorted[i]);
        if (ok) { right++; Fx.right(); } else { Fx.wrong(); wrongs.push({ item: sorted[0], answer: "最早的是 " + sorted[0].name + "（" + sorted[0].year + " 年）" }); }
        cards.forEach(([a, c]) => {
          c.classList.add(order.indexOf(a) === sorted.indexOf(a) ? "right" : "wrong");
          c.appendChild(el('<span class="yr">' + a.year + " 年・" + esc(a.eraInfo.short) + "<br>原文：" + esc(a.attrs.year_src) + "</span>"));
        });
        root.querySelector("#undo").remove();
        const fb = root.querySelector("#fb");
        fb.className = "feedback " + (ok ? "ok" : "no");
        fb.textContent = ok ? "全部排對了！🎉" : "正確順序是：" + sorted.map((a) => a.name).join(" → ");
        const b = el('<button class="btn primary big">' + (round === ROUNDS - 1 ? "看成績 🏆" : "下一回 ➜") + "</button>");
        b.onclick = () => { round++; next(); };
        root.querySelector("#nx").appendChild(b);
        b.focus();
      }
    }
    function done() {
      Quiz.result(root, {
        key: "timeline", title: "時代排排看 完成！", stars: right >= 5 ? 3 : right >= 3 ? 2 : right > 0 ? 1 : 0,
        score: right + " / " + ROUNDS + " 回", wrongs, onAgain: menu,
      });
    }
    next();
  }

  function menu() {
    root.replaceChildren(el('<div class="panel"><p class="lead" style="margin-top:0">目前有 ' + pool.length +
      " 處古蹟的原文寫了建造年代，每回挑 4 處讓你排。</p>" + eraBar() +
      '<p><button class="btn primary big" id="go">開始（' + ROUNDS + " 回）</button></p></div>"));
    root.querySelector("#go").onclick = play;
  }
  menu();
});
