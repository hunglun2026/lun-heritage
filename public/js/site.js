/* 古蹟探險家：這一站的設定（window.SITE）。所有頁面最先載入這支，再載入 /js/core/*（通用核心，工具產生，不要手改）。
   負責：站名、導覽列、頁尾來源、古蹟類型與時代的圖示顏色、線索遮名、護照的遊戲與徽章。 */
(function () {
  "use strict";
  // 古蹟類型（文資局 assetsTypes）：圖示、顏色、給小朋友的一句提示。game＝「看建築認類型」會考（外觀認得出來的才考）
  const TYPES = {
    寺廟: { emoji: "🛕", color: "#c0392b", hint: "拜神明的地方，屋頂常有翹起來的燕尾和彩色剪黏", game: true },
    教堂: { emoji: "⛪", color: "#5b6abf", hint: "基督教或天主教做禮拜的地方，常有十字架和尖拱窗", game: true },
    宅第: { emoji: "🏠", color: "#a0703a", hint: "以前的人住的房子，像三合院或洋樓", game: true },
    祠堂: { emoji: "🏮", color: "#b5523b", hint: "家族祭拜祖先的地方", game: false },
    牌坊: { emoji: "⛩️", color: "#8e6c3a", hint: "用石頭做的大門形狀建築，用來表揚好人好事", game: true },
    車站: { emoji: "🚉", color: "#2e86ab", hint: "火車停靠、旅客上下車的地方", game: true },
    橋樑: { emoji: "🌉", color: "#4a7c59", hint: "讓人或車子跨過河流、山谷的建築", game: true },
    城郭: { emoji: "🏯", color: "#7d5a50", hint: "以前保護城市的城牆和城門", game: true },
    燈塔: { emoji: "🗼", color: "#d68c1f", hint: "在海邊發光，幫船隻指引方向", game: true },
    學校: { emoji: "🏫", color: "#3a7ca5", hint: "以前的學校校舍", game: true },
    墓葬: { emoji: "🪦", color: "#6d6d6d", hint: "以前的人的墳墓", game: false },
    碑碣: { emoji: "🗿", color: "#7a7a5a", hint: "刻著文字的石碑", game: true },
    書院: { emoji: "📜", color: "#8a5a44", hint: "清代讀書人念書、考科舉的地方", game: false },
    衙署: { emoji: "🏛️", color: "#5d4e75", hint: "政府辦公的地方", game: false },
    關塞: { emoji: "🛡️", color: "#5a6b3a", hint: "軍隊防守用的砲台、碉堡", game: true },
    產業: { emoji: "🏭", color: "#6a7f8a", hint: "以前工作生產的地方，像糖廠、酒廠、礦場", game: false },
    機關: { emoji: "🏢", color: "#5d4e75", hint: "政府機關辦公的地方", game: false },
    辦公廳舍: { emoji: "🏢", color: "#5d4e75", hint: "辦公用的建築", game: false },
    官邸: { emoji: "🏡", color: "#8a6a4a", hint: "官員住的房子", game: false },
    集會堂: { emoji: "🎪", color: "#7a5a8a", hint: "大家聚會、開會的地方", game: false },
    醫院: { emoji: "🏥", color: "#3a8a7a", hint: "以前看病的地方", game: false },
    銀行: { emoji: "🏦", color: "#4a6a8a", hint: "以前存錢、借錢的地方", game: false },
    商店: { emoji: "🏪", color: "#a8742a", hint: "以前做生意的店鋪", game: false },
    市場: { emoji: "🧺", color: "#a8742a", hint: "買賣東西的市場", game: false },
    堤閘: { emoji: "🌊", color: "#2e6b8a", hint: "擋水、控制水流的水利設施", game: false },
    其他設施: { emoji: "📍", color: "#8a8f98", hint: "其他各式各樣的古蹟", game: false },
  };
  const typeOf = (name) => TYPES[name] || TYPES["其他設施"];
  // 時代：轉接器從原文抽建造年份換算（抓不到就沒有，不猜）
  const ERAS = [
    { id: "荷西", name: "荷蘭與西班牙時期", short: "荷西", color: "#3d6b8a", range: "1662 年以前" },
    { id: "明鄭", name: "明鄭時期", short: "明鄭", color: "#8a3d3d", range: "1662～1683 年" },
    { id: "清領", name: "清領時期", short: "清領", color: "#a8742a", range: "1683～1895 年" },
    { id: "日治", name: "日治時期", short: "日治", color: "#5a7a3a", range: "1895～1945 年" },
    { id: "戰後", name: "戰後", short: "戰後", color: "#4a5a8a", range: "1945 年以後" },
  ];
  const ERA = Object.fromEntries(ERAS.map((e) => [e.id, e]));
  const CLASSES = ["國定", "直轄市定", "縣市定"];

  window.SITE = {
    key: "heritage",
    name: "古蹟探險家",
    logo: "🏯 古蹟探險家",
    noun: "古蹟", unit: "處",
    detailUrl: "/sites#",
    dataFile: "/data/site.json",
    loading: "古蹟資料載入中…🏯",
    champion: "古蹟小博士",
    maker: "本站非文化部文化資產局製作。鴻綸科技 製作",
    confetti: ["#c0392b", "#d68c1f", "#a0703a", "#2e86ab", "#4a7c59", "#ffd166"],
    TYPES, ERAS, ERA, CLASSES, typeOf,
    // [頁面代號, 名稱, 網址, 幼兒園也顯示嗎]
    nav: [
      ["sites", "古蹟圖鑑", "/sites", true],
      ["types", "看建築認類型", "/types", true],
      ["timeline", "時代排排看", "/timeline", false],
      ["guess", "猜猜我是誰", "/guess", true],
      ["passport", "探險護照", "/passport", true],
      ["teacher", "教師專區", "/teacher", false],
    ],
    footer:
      "<p>古蹟資料來自" +
      '<a href="https://data.gov.tw/dataset/6246" target="_blank" rel="noopener">政府資料開放平臺「文資局古蹟」</a>' +
      "（文化部文化資產局，政府資料開放授權條款第1版），照片來自同一份資料的附圖，作者標在每處古蹟的介紹頁；" +
      '原始介紹可在<a href="https://nchdb.boch.gov.tw/" target="_blank" rel="noopener">國家文化資產網</a>查詢。' +
      "分級介紹由 AI 依原文改寫，只用原文寫到的事實，並經程式查核數字、年代與用字。</p>",
    stamp: (m) => "目前收錄 " + m.count + " 處古蹟，其中 " + m.rewritten + " 處已完成分級介紹。資料整理日期：" + m.version + "。",
    enrich(a) {
      const at = a.attrs || {};
      a.types = at.types && at.types.length ? at.types : ["其他設施"];
      a.type = a.types[0];
      a.typeInfo = typeOf(a.type);
      a.eraInfo = at.era ? ERA[at.era] : null;
      a.year = at.year || null;
      a.cls = at.class || "";
      a.place = a.city + a.dist;
    },
    icon: (a) => a.typeInfo.emoji,
    color: (a) => a.typeInfo.color,
    // 線索遮名：名稱、去掉縣市鄉鎮前綴的名稱、括號裡的舊名（跟查核程式 names_of 同一套）
    maskNames(a) {
      const bare = a.name.replace(/[（(].*?[）)]/g, "").trim();
      const out = [bare].concat((a.alt || "").split(/[、,，]/));
      [a.city, a.city.slice(0, -1), a.dist, a.dist.slice(0, -1)].forEach((p) => {
        [p, p.replace(/臺/g, "台"), p.replace(/台/g, "臺")].forEach((q) => { if (q && bare.startsWith(q)) out.push(bare.slice(q.length)); });
      });
      return out;
    },
    games: [
      ["types", "看建築認類型"], ["types-timed", "看建築認類型・60 秒"], ["era", "哪個時代蓋的"],
      ["timeline", "時代排排看"], ["guess", "猜猜我是誰"], ["guess-kid", "找找看（幼兒園）"],
    ],
    badges(seen, st) {
      const cities = new Set(seen.map((a) => a.city));
      const typesSeen = new Set(seen.map((a) => a.type));
      return [
        ["👣", "第一步", "在圖鑑看第 1 處古蹟", seen.length >= 1],
        ["📖", "古蹟百科通", "在圖鑑看過 50 處古蹟", seen.length >= 50],
        ["🏛️", "國寶巡禮", "看過 10 處國定古蹟", seen.filter((a) => a.cls === "國定").length >= 10],
        ["🗺️", "環島達人", "看過 10 個縣市的古蹟", cities.size >= 10],
        ["🧩", "建築分類家", "看過 8 種不同類型的古蹟", typesSeen.size >= 8],
        ["🏆", "類型高手", "看建築認類型拿到三顆星", st("types") >= 3],
        ["⏳", "時光旅人", "時代排排看拿到三顆星", st("timeline") >= 3],
        ["🕵️", "觀察小偵探", "猜猜我是誰（或找找看）拿到三顆星", st("guess") >= 3 || st("guess-kid") >= 3],
        ["⚡", "閃電快手", "60 秒挑戰拿到三顆星", st("types-timed") >= 3],
      ];
    },
  };
})();
