"""產生端對端流程步驟檔 scripts/e2e/site.json，給 sg browse --steps 跑（照海洋探險家的做法）。
每段 eval 回傳一行「做了什麼＝結果」，跑完看輸出就知道每條路徑有沒有走通；截圖存到 D:\\claude測試資料\\lun-heritage\\<日期>\\。
用法：先 python oe_cli.py serve --project <網站資料夾>，再 python scripts/e2e/make_flows.py && sg browse --steps scripts/e2e/site.json
"""
import datetime as dt
import json
import sys
from pathlib import Path

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8830"
SHOTS = Path(r"D:\claude測試資料\lun-heritage") / dt.date.today().isoformat()
# 共用小工具：等待、等元素出現、等頁面 ready（App.boot 跑完會設 data-ready）
H = ("const w=ms=>new Promise(r=>setTimeout(r,ms));"
     "const wf=async q=>{for(let i=0;i<100&&!document.querySelector(q);i++)await w(100);return document.querySelector(q)};"
     "const rd=async()=>{for(let i=0;i<150&&!document.documentElement.dataset.ready;i++)await w(100)};await rd();"
     "const $=q=>document.querySelector(q),$$=q=>[...document.querySelectorAll(q)];")


def ev(body: str) -> dict:
    return {"do": "eval", "expr": "(async()=>{" + H + body + "})()"}


def go(path: str) -> dict:
    return {"do": "goto", "url": BASE + path}


def shot(name: str) -> dict:
    return {"do": "shot", "path": str(SHOTS / f"{name}.png"), "full": True}


def level(lv: str) -> list:
    # 程度存純文字（core/app.js 的 level()），不是 JSON
    return [go("/"), ev(f"localStorage.setItem('heritage-level','{lv}');return '程度={lv}'")]


# 遊戲通用：一直按第一個選項（或正確答案）＋下一題，直到出現成績畫面
PLAY = ("for(let i=0;i<80&&!$('#again');i++){const o=$('.opt:not([disabled])');if(o)o.click();await w(150);"
        "const n=$('#nx button');if(n)n.click();await w(150);}")

STEPS = [
    *level("e"), go("/"), {"do": "assert_text", "text": "八個學習工具"},
    ev("const t=$$('#today .acard').length;$('[data-who=student]').click();await w(100);$('[data-lv=e]').click();await w(100);"
       "return '首頁：今天卡片='+t+' 推薦='+$$('#g-recs .tool').length+' 有分級介紹數字='+$('[data-w=rewritten]').textContent"),
    shot("01-home"),
    go("/sites"),
    ev("const n=$$('#grid .acard').length;$('#grid .acard').click();await wf('#introtext');"
       "return '圖鑑：卡片='+n+' 詳情標題='+$('#dlg h2').textContent.trim()+' 介紹字數='+$('#introtext').textContent.length+' 照片出處='+($('.credit').textContent.slice(0,20))"),
    shot("02-sites-detail"),
    ev("$('#x').click();const c=[...$$('.chip')].find(b=>b.textContent.includes('寺廟'));c.click();await w(200);const a=$('#count').textContent;"
       "c.click();const q=$('#q');q.value='仁武';q.dispatchEvent(new Event('input'));await w(200);return '篩選寺廟：'+a+'；搜尋仁武：'+$('#count').textContent"),
    ev("const q=$('#q');q.value='';q.dispatchEvent(new Event('input'));$('#done').click();await w(200);const a=$('#count').textContent;"
       "const t=[...$$('#grid .acard')].find(x=>x.classList.contains('thin'));return '只看有分級介紹：'+a+' 還有整理中的卡片='+!!t"),
    ev("$('#done').click();await w(200);const t=[...$$('#grid .acard')].find(x=>x.classList.contains('thin'));t.click();await wf('#origtext');"
       "for(let i=0;i<50&&$('#origtext').textContent==='載入中…';i++)await w(100);return '整理中的古蹟：提示='+$('.note').textContent.slice(0,16)+' 原文字數='+$('#origtext').textContent.length"),
    ev("$('#x').click();const cs=$$('#grid .acard');cs[0].click();await wf('#add');$('#add').click();$('#x').click();cs[1].click();await wf('#add');$('#add').click();"
       "$('#go-cmp').click();await wf('table.cmp');return '比一比：表格列數='+$$('table.cmp tbody tr').length"),
    shot("03-sites-compare"),
    *level("s"), go("/sites#19980430000001"),
    ev("await wf('#introtext');for(let i=0;i<50&&$('#introtext').textContent.length<200;i++)await w(100);"
       "return '高中：介紹（原文）字數='+$('#introtext').textContent.length+' 探究題='+!![...$$('.fact h4')].find(h=>h.textContent==='探究題')"),
    *level("k"), go("/sites"),
    ev("const n=$$('#grid .acard').length;$('#grid .acard').click();await wf('#introtext');"
       "return '幼兒園：卡片='+n+' 介紹='+$('#introtext').textContent+' 喇叭鈕顯示='+!$('#say1 .say').hidden"),
    *level("e"), go("/map"),
    ev("const d=$$('.map .dot').length;const s=$('#city');s.value='臺北市';s.onchange();await w(200);"
       "return '地圖：點='+d+' 選臺北市：'+$('#count').textContent+' 清單='+$$('#list .nrow').length+' 變淡的點='+$$('.map .dot.dim').length"),
    shot("04-map"),
    go("/"), go("/map#19980430000001"),  # 先離開地圖頁，不然只換 # 不會重新載入
    ev("await w(300);return '從圖鑑點進地圖：標出的點='+$$('.map .dot.on').length+' 清單第一筆='+$('#list .nrow b').textContent"),
    go("/types"),
    ev("$('#std').click();await w(200);" + PLAY + "return '認類型：成績='+($('.score')||{}).textContent+' 星數畫面='+!!$('.stars')"),
    shot("05-types-result"),
    ev("$('#again').click();await w(200);const e=$('#era');if(!e)return '哪個時代蓋的：題目不夠，按鈕沒出現';e.click();await w(200);"
       "$('.opt').click();await w(200);return '哪個時代蓋的：解說='+$('#fb').textContent.slice(0,40)"),
    go("/timeline"),
    ev("$('#go').click();await w(200);for(let r=0;r<5;r++){const cs=$$('.tl-card');if(!cs.length)break;for(const c of cs){c.click();await w(80);}"
       "await w(150);const n=$('#nx button');if(n)n.click();await w(200);}return '時代排排看：'+(($('.score')||{}).textContent||$('#root').textContent.slice(0,40))"),
    shot("06-timeline-result"),
    # 照正確順序點：用頁面已載入的資料查每張卡片的年份，從早到晚點，應該 5 回全對
    go("/timeline"),
    ev("const d=await App.load();const y=n=>d.items.find(a=>a.name===n).year;$('#go').click();await w(200);"
       "for(let r=0;r<5;r++){const cs=$$('.tl-card');if(!cs.length)break;cs.sort((p,q)=>y(p.querySelector('b').textContent)-y(q.querySelector('b').textContent));"
       "for(const c of cs){c.click();await w(60);}await w(150);const n=$('#nx button');if(n)n.click();await w(200);}"
       "return '時代排排看（照年代點）：'+(($('.score')||{}).textContent)+' 星='+$('.stars').getAttribute('aria-label')"),
    go("/guess"),
    ev("$('#solo').click();await w(200);" + PLAY + "return '猜謎：成績='+($('.score')||{}).textContent"),
    go("/guess"),
    ev("$('#class').click();await w(200);$('#more').click();$('#more').click();await w(100);const n=$$('.clue').length;$('#rev').click();await w(100);"
       "return '全班搶答：線索='+n+' 揭曉='+$('#ans').textContent"),
    go("/memory"),
    ev("$('[data-m=easy]').click();await w(300);return '翻牌：牌數='+$$('.mcard').length"),
    shot("07-memory"),
    go("/passport"),
    ev("return '護照：看過='+$$('.w-num')[0].textContent+' 拿到徽章='+$$('.bdg.got').length+' 遊戲紀錄有星='+$$('.gtable td').filter(t=>t.textContent.includes('⭐')).length"),
    shot("08-passport"),
    go("/teacher"),
    ev("$('#make').click();await w(300);const n=$$('#sheet .q').length;$('#key').click();await w(100);"
       "return '學習單：題目='+n+' 顯示答案='+$$('#sheet .ans:not([hidden])').length+' 列印鈕='+!$('#print').hidden"),
    shot("09-teacher-sheet"),
    ev("$$('.tab')[1].click();await w(100);return '計分板：組數='+$$('.team').length"),
    go("/help"),
    ev("$('#report').click();await w(200);$('#rp').value='測試回報：第一批改寫抽查';$('dialog [data-v=\"1\"]').click();await w(500);"
       "return '回報錯誤：'+(($('dialog.zdlg p')||{}).textContent||'沒有感謝訊息')"),
]

if __name__ == "__main__":
    out = Path(__file__).with_name("site.json")
    out.write_text(json.dumps(STEPS, ensure_ascii=False, indent=1), "utf-8")
    SHOTS.mkdir(parents=True, exist_ok=True)
    print(f"{len(STEPS)} 步，寫在 {out}，截圖存 {SHOTS}")
