/* 我家附近的古蹟：臺灣輪廓 SVG 上打點（顏色＝類型），選縣市、鄉鎮篩選，或用裝置定位找最近的 10 處。
   投影參數來自 /data/taiwan.json（工具 core/geo.py 產生，公式兩邊要一樣）。位置只在這台裝置上計算，不送出去。
   網址 #古蹟id：從圖鑑「在地圖上看」點進來，直接標出那一處。 */
App.boot(async function (data) {
  const { esc, el, photo } = App;
  const S = App.SITE;
  const all = data.items.filter((a) => a.lat != null && a.lng != null);
  const geo = await (await fetch("/data/taiwan.json?v=" + encodeURIComponent(data.version))).json();
  const [x0, , , y1] = geo.bbox;
  const sx = geo.w / ((geo.bbox[2] - x0) * geo.k);
  const proj = (lng, lat) => [(lng - x0) * geo.k * sx, (y1 - lat) * sx];

  // ---- 地圖 ----
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 " + geo.w + " " + geo.h);
  svg.setAttribute("class", "map");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "臺灣古蹟分布地圖");
  const land = document.createElementNS(NS, "path");
  land.setAttribute("d", geo.path);
  land.setAttribute("class", "land");
  svg.appendChild(land);
  const dots = new Map();
  all.forEach((a) => {
    const [x, y] = proj(a.lng, a.lat);
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", x.toFixed(1));
    c.setAttribute("cy", y.toFixed(1));
    c.setAttribute("r", 3.6);
    c.setAttribute("fill", a.typeInfo.color);
    c.setAttribute("class", "dot");
    const t = document.createElementNS(NS, "title");
    t.textContent = a.name;
    c.appendChild(t);
    c.addEventListener("click", () => focusOn(a));
    svg.appendChild(c);
    dots.set(a.id, c);
  });
  document.getElementById("mapbox").appendChild(svg);

  // ---- 縣市、鄉鎮選單 ----
  const citySel = document.getElementById("city");
  const distSel = document.getElementById("dist");
  const n = (f) => all.filter(f).length;
  [...new Set(all.map((a) => a.city))].sort((p, q) => n((a) => a.city === q) - n((a) => a.city === p))
    .forEach((c) => citySel.appendChild(el('<option value="' + esc(c) + '">' + esc(c) + "（" + n((a) => a.city === c) + "）</option>")));
  citySel.onchange = () => {
    const c = citySel.value;
    distSel.replaceChildren(el('<option value="">全部</option>'));
    [...new Set(all.filter((a) => a.city === c).map((a) => a.dist))].sort()
      .forEach((d) => distSel.appendChild(el('<option value="' + esc(d) + '">' + esc(d) + "（" + n((a) => a.city === c && a.dist === d) + "）</option>")));
    show(filtered(), c ? c + "的古蹟" : "");
  };
  distSel.onchange = () => show(filtered(), citySel.value + (distSel.value || "") + "的古蹟");
  const filtered = () => all.filter((a) => (!citySel.value || a.city === citySel.value) && (!distSel.value || a.dist === distSel.value));

  // ---- 清單：有分級介紹、有照片的排前面，最多列 30 處 ----
  const list = document.getElementById("list");
  const MAX = 30;
  function row(a, extra) {
    const r = el('<a class="nrow" href="/sites#' + encodeURIComponent(a.id) + '"><span class="pic"></span><span><b>' + esc(a.name) + "</b><br><small>" +
      esc(a.place) + "・" + a.typeInfo.emoji + " " + esc(a.type) + (extra ? "・" + extra : "") + "</small>" +
      (a.k ? '<br><small>' + esc(a.k) + "</small>" : "") + "</span></a>");
    r.querySelector(".pic").replaceWith(photo(a));
    return r;
  }
  function show(items, title, extras) {
    const on = new Set(items.map((a) => a.id));
    dots.forEach((c, id) => { c.classList.toggle("dim", items.length < all.length && !on.has(id)); c.classList.remove("on"); });
    const sorted = extras ? items : items.slice().sort((p, q) => (q.done - p.done) || (q.hasPhoto - p.hasPhoto));
    document.getElementById("count").textContent = title ? title + "：共 " + items.length + " 處" : "全臺灣共 " + all.length + " 處古蹟有位置資料，選縣市看看你家附近有哪些。";
    list.replaceChildren(...sorted.slice(0, MAX).map((a, i) => row(a, extras && extras[i])));
    if (items.length > MAX && citySel.value) {
      list.appendChild(el('<p><a class="btn" href="/sites?city=' + encodeURIComponent(citySel.value) + '">在圖鑑看' + esc(citySel.value) + "全部 " + items.length + " 處 ➜</a></p>"));
    }
  }
  function focusOn(a) {
    dots.forEach((c) => c.classList.remove("on"));
    const d = dots.get(a.id);
    if (d) { d.classList.add("on"); svg.appendChild(d); } // 移到最上層，不被別的點蓋住
    list.prepend(row(a, "你點的這一處"));
    list.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // ---- 找我附近的：只在這台裝置上算距離 ----
  const km = (a, lat, lng) => {
    const r = Math.PI / 180, dLat = (a.lat - lat) * r, dLng = (a.lng - lng) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat * r) * Math.cos(a.lat * r) * Math.sin(dLng / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(h));
  };
  document.getElementById("locate").onclick = () => {
    if (!navigator.geolocation) return App.dialog("這台裝置不能定位，請改用上面的縣市選單。");
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const near = all.map((a) => [a, km(a, lat, lng)]).sort((p, q) => p[1] - q[1]).slice(0, 10);
      const old = svg.querySelector(".me");
      if (old) old.remove();
      const [x, y] = proj(lng, lat);
      if (x >= 0 && y >= 0 && x <= geo.w && y <= geo.h) {
        const me = document.createElementNS(NS, "circle");
        me.setAttribute("cx", x); me.setAttribute("cy", y); me.setAttribute("r", 6); me.setAttribute("class", "me");
        svg.appendChild(me);
      }
      show(near.map((p) => p[0]), "離你最近的 10 處", near.map((p) => "約 " + (p[1] < 10 ? p[1].toFixed(1) : Math.round(p[1])) + " 公里"));
    }, () => App.dialog("沒有拿到位置（可能沒有允許定位）。請改用上面的縣市選單。"), { timeout: 15000 });
  };

  show(all, "");
  const fromHash = () => {
    const want = decodeURIComponent(location.hash.slice(1));
    const hit = want && all.find((a) => a.id === want);
    if (hit) { citySel.value = hit.city; citySel.onchange(); focusOn(hit); }
  };
  addEventListener("hashchange", fromHash); // 同一頁只改 # 不會重新載入，要自己接
  fromHash();
});
