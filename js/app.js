/* 面板切換:股票面板 / 槓桿風險 / 資產 */
let PANEL="stock";
/* ══ 資產支出:桌面把「資產分析」與「支出」併成同一頁 ══════════════════
   (2026-08-20,Claude Design「Market Compass 桌面版 v2」第 9 項)
   上面四格總覽把兩邊重點拉到第一屏,中間一顆 sticky 切換鈕換明細。
   手機不動,底部還是四格分頁,afHead 在手機永遠 hidden。 */
function renderAF(){
  const el=document.getElementById("afHead");
  if(!el) return;
  const on=!isMobile() && (PANEL==="asset"||PANEL==="expense");
  el.hidden=!on;
  if(!on){ el.innerHTML=""; return; }
  const A=window.ASSET_DATA, E=(typeof exSummary==="function")?exSummary():null;
  const S=(A&&A.summary)||[];
  const kpi=(k,v,unit,sub,cls)=>`<div class="as-kpi"><div class="k">${k}</div>
    <div class="v num${cls?" "+cls:""}">${v}${unit?`<span class="u">${unit}</span>`:""}</div>
    <div class="d">${sub||""}</div></div>`;
  const eur=n=>"NT$"+Math.round(n).toLocaleString("en-US");
  // 順序刻意先支出再資產(使用者 2026-08-20):先看花掉多少,再看有多少
  const cells=[];
  if(E){
    cells.push(kpi(`${E.short}總支出`, eur(E.total), "", `目標 ${eur(E.base)}`));
    cells.push(kpi("超出目標", (E.over>=0?"+":"")+eur(Math.abs(E.over)), "",
      E.over>=0?"超過總支出目標":"在目標內", E.over>=0?"afdn":"afup"));
  }
  if(S[0]) cells.push(kpi(escH(S[0].label), escH(S[0].value), escH(S[0].unit),
    `<span class="${S[0].deltaDir==="down"?"afdn":"afup"}">${escH(S[0].delta||"")}</span> ${escH(S[0].sub||"")}`));
  if(S[1]) cells.push(kpi(escH(S[1].label), escH(S[1].value), escH(S[1].unit), escH(S[1].sub||"")));
  const seg=(k,t)=>`<button data-af="${k}" class="${PANEL===k?"on":""}" aria-pressed="${PANEL===k}">${t}</button>`;
  el.innerHTML=`<div class="as-kpis" id="afSummary">${cells.join("")}</div>
    <div id="afSeg">${seg("expense","支出")}${seg("asset","資產")}</div>`;
}

function switchPanel(p){
  if(p==="risk"&&!rkHas()) return;
  if(p==="asset"&&!window.ASSET_DATA) return;
  if(p==="expense"&&!window.EXPENSE_DATA) return;
  PANEL=p;
  // 桌面「資產支出」是一頁,asset 與 expense 都讓同一顆亮著(那顆的 data-panel 是 expense)
  const togKey=(!isMobile()&&p==="asset")?"expense":p;
  document.querySelectorAll("#panelToggle button").forEach(b=>{ const on=b.dataset.panel===togKey;
    b.classList.toggle("on",on); b.setAttribute("aria-pressed",on); });
  document.getElementById("stockPanel").hidden = p!=="stock";
  document.getElementById("stockChrome").hidden = p!=="stock";
  const rp=document.getElementById("riskPanel"); rp.hidden = p!=="risk";
  const ap=document.getElementById("assetPanel"); ap.hidden = p!=="asset";
  const ep=document.getElementById("expensePanel"); ep.hidden = p!=="expense";
  if(p==="risk") renderRisk();
  if(p==="asset") renderAsset();
  if(p==="expense") renderExpense();
  renderAF();
  syncHeader();
  syncTabbar();
  syncHash();
  try{ syncTodoBadge(); }catch(e){}
}

/* 手機版的頁首會跟著面板換標題(設計稿 1d:槓桿頁標題是「槓桿風險」) */
function syncHeader(){
  const h1=document.querySelector("header h1"), sub=document.getElementById("datadate");
  if(!h1||!sub) return;
  if(isMobile()&&PANEL==="asset"){
    h1.textContent="資產總覽";
    sub.parentElement.innerHTML=`<span id="datadate">${escH((window.ASSET_DATA&&ASSET_DATA.meta&&ASSET_DATA.meta.date)||"")}</span>`;
  }else if(isMobile()&&PANEL==="expense"){
    h1.textContent="每月支出";
    sub.parentElement.innerHTML=`<span id="datadate">${escH((window.EXPENSE_DATA&&EXPENSE_DATA.updated)||"")} 更新</span>`;
  }else if(isMobile()&&PANEL==="risk"){
    h1.textContent="槓桿風險";
    const t=rkSnaps().length?(rkSnaps()[0].updated_at||""):"";
    sub.parentElement.innerHTML=`<span id="datadate">示範讀值 · ${escH(rkRel(t))}</span>`;
  }else{
    h1.textContent="Compass (Beta)";
    // 有抓到即時報價就顯示報價時間,沒有就顯示資料檔的建置時間
    sub.parentElement.innerHTML=LIVE_AT
      ? `<span id="datadate">${LIVE_AT}</span> 即時報價`
      : `<span id="datadate">${escH(DATA_DATE||"-")}</span> 更新`;
  }
}
let DATA_DATE="";
// 最後一次抓到即時報價的時間,顯示在標題列。
// 一定要宣告在 syncHeader() 前面:那個函式載入時就會跑,宣告放後面會踩到暫時性死區。
let LIVE_AT=null;

/* 底部分頁列(手機):大盤屬股票面板,槓桿與資產是另外的面板。
   點哪一格就切到對應的面板與分頁,並把亮起來的那格同步。 */
function goNav(k){
  if(k==="risk"){ switchPanel("risk"); }
  else if(k==="asset"){ switchPanel("asset"); }
  else if(k==="expense"){ switchPanel("expense"); }
  else if(k==="stock"){ switchPanel("stock"); switchTab(CUR_TAB); }
  else{ switchPanel("stock"); switchTab(k); }
  window.scrollTo(0,0);
}
function syncTabbar(){
  let cur = (PANEL==="risk") ? "risk"
    : (PANEL==="asset") ? "asset"
    : (PANEL==="expense") ? "expense"
    : "stock";
  // 股票面板只剩大盤一頁,底部列對應「股票」那格
  if(!document.querySelector('#tabbar [data-go="'+cur+'"]')) cur="stock";
  document.querySelectorAll("#tabbar button").forEach(b=>{ const on=b.dataset.go===cur;
    b.classList.toggle("on", on); if(on) b.setAttribute("aria-current","page"); else b.removeAttribute("aria-current"); });
  // 槓桿那格的狀態點跟著借款比例的安全/注意/危險走(設計稿 1e)
  const dot=document.getElementById("tabbarRiskDot");
  if(dot && typeof rkSnaps==="function" && rkSnaps().length){
    const kind=rkBorrowKind(rkNorm(rkSnaps()[0]).borrowRatio);
    dot.className="tb-dot"+(kind==="watch"?" warn":kind==="danger"?" danger":"");
  }
}

/* 導覽只有一層:分頁列的四顆按鈕就是四段,選哪段就重畫大盤那個 pane。
   FILTER.macro 是唯一的狀態,分頁列的 active 樣式跟著它走。 */
const MACRO_SEGS=["all","eu","tw","stock"];
function syncSegTabs(){
  const cur=FILTER.macro||"all";
  document.querySelectorAll(".tabs button[data-seg]")
    .forEach(x=>{ const on=x.dataset.seg===cur; x.classList.toggle("active", on); x.setAttribute("aria-pressed",on); });
}
function setMacroSeg(k){
  FILTER.macro=MACRO_SEGS.includes(k)?k:"all";
  syncSegTabs();
  if(typeof DATA!=="undefined" && DATA && WL) renderMacro();
}
/* 股票面板只剩大盤一個 pane,這支留著是因為面板切換與 hash 都會呼叫它。 */
let CUR_TAB="macro";
function switchTab(){
  CUR_TAB="macro";
  document.getElementById("macro").hidden=false;
  // 頂部脈搏卡固定顯示,版型不跳動(2026-08-17 使用者要求)
  document.getElementById("topstrip").hidden = false;
  const rl=document.getElementById("rail");
  if(rl) rl.hidden = false;
  document.getElementById("stockPanel").classList.remove("norail");
  syncSegTabs();
  syncTabbar();
  syncHash();
}

/* ---------- interactions ---------- */
// 只掛分頁鈕;同一列裡的「規則 ↗」不是分頁,由下面的全域 click 處理
document.querySelectorAll(".tabs button[data-seg]").forEach(b=>{
  b.addEventListener("click",()=>setMacroSeg(b.dataset.seg));
});
document.addEventListener("click",e=>{
  // 面板切換(股票 / 槓桿)與槓桿詳細折疊
  const pt=e.target.closest("#panelToggle button"); if(pt){ switchPanel(pt.dataset.panel); return; }
  if(e.target.closest("[data-goasset2]")){ switchPanel("asset"); return; }
  if(e.target.closest("#rkStkMore")){ RK_STKOPEN=!RK_STKOPEN; renderRisk(); return; }
  const afb=e.target.closest("#afSeg button");
  if(afb){ switchPanel(afb.dataset.af); window.scrollTo({top:0,behavior:"instant"}); return; }
  const af=e.target.closest("[data-asfold]");
  if(af){ ASSET_OPEN[af.dataset.asfold]=!ASSET_OPEN[af.dataset.asfold]; renderAsset(); return; }
  const tm=e.target.closest("[data-tlmode]");
  if(tm){ TL_MODE=tm.dataset.tlmode; renderAsset(); return; }
  // 手機槓桿頁的帳戶明細展開區
  const rvb=e.target.closest("[data-riskview]");
  if(rvb){ RISK_VIEW=rvb.dataset.riskview; renderRisk(); window.scrollTo(0,0); return; }
  const asb=e.target.closest("[data-allocsort]");
  if(asb){ ALLOC_SORT=asb.dataset.allocsort; renderRisk(); return; }
  if(e.target.closest("#rkIbToggle")){ RK_IBOPEN=!RK_IBOPEN; renderRisk(); return; }

  // 手機資產頁的展開區(歷年線圖 / 資產結構明細 / 帳戶 / 持倉 / ETF / 風險提示)
  if(e.target.closest("#asTlToggle")){ AS_TLOPEN=!AS_TLOPEN; renderAsset(); return; }
  const hbtn=e.target.closest("button[id^='asHold']");
  if(hbtn){ const i=+hbtn.id.slice(6); AS_HOLDS[i]=!AS_HOLDS[i]; renderAsset(); return; }
  const sc=e.target.closest("[data-asstruct]");
  if(sc){ const i=+sc.dataset.asstruct; AS_STRUCT=(AS_STRUCT===i)?null:i; renderAsset(); return; }
  const ar=e.target.closest("[data-asrisk]");
  if(ar){ const i=+ar.dataset.asrisk; AS_RISKOPEN=(AS_RISKOPEN===i)?null:i; renderAsset(); return; }
  const tb=e.target.closest("#tabbar button"); if(tb){ goNav(tb.dataset.go); return; }
  // 訊號區展開/收合(在頂部訊號列,不在彈窗內)
  if(e.target.closest("#sigToggle")){ SIGOPEN=!SIGOPEN; renderTopStrip(); return; }
  if(e.target.closest("#todoBtn")){ openTodo(); return; }
  if(e.target.closest("#todoSheet")){
    if(e.target.closest("#todoClose")){ closeTodo(); return; }
    if(e.target.closest("#todoAdd")){ todoAddFromInput(); return; }
    if(e.target.closest("#todoDelDone")){
      const D=todoDone();
      todoDelete(Object.keys(D));
      renderTodoSheet(); syncTodoBadge(); return; }
    if(e.target.closest("#rkTodoClear")){ todoClear(); renderTodoSheet(); syncTodoBadge(); return; }
    const td=e.target.closest("[data-todo]");
    if(td){ todoToggle(decodeURIComponent(td.dataset.todo)); renderTodoSheet(); syncTodoBadge(); }
    return;
  }
  if(e.target.closest("#todoModal")){ closeTodo(); return; }
  if(e.target.closest("#rulesToggle")||e.target.closest("#rulesTop")){ openRules(); return; }
  // 規則彈窗:點 ✕ 或背景關閉,點內容不關
  if(e.target.closest("#rulesSheet")){ if(e.target.closest("#rulesClose")) closeRules(); return; }
  if(e.target.closest("#rulesModal")){ closeRules(); return; }
  // 彈窗內互動
  if(e.target.closest("#chartSheet")){
    if(e.target.closest("[data-goasset]")){ closeChart(); switchPanel("asset"); return; }
    const rb=e.target.closest("[data-range]"); if(rb){ CHART.range=rb.dataset.range; renderChart(); return; }
    if(e.target.closest("#chartClose")){ closeChart(); return; }
    return; // 點 sheet 內其他區域不關閉
  }
  if(e.target.closest("#chartModal")){ closeChart(); return; } // 點背景關閉
  // 有歷史序列的(股票列或大盤卡)開彈窗線圖,其餘股票列沿用行內展開
  const el=e.target.closest("[data-sym]");
  if(el){
    const sym=el.dataset.sym;
    if(DATA && DATA[sym] && DATA[sym].hist){ openChart(sym); return; }
    if(el.classList.contains("row")) el.classList.toggle("open");
  }
});
document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ closeChart(); closeRules(); closeTodo(); } });

/* ── 每個區塊各自防護 ────────────────────────────────────────
   某一份資料格式壞掉時,只有那一塊顯示提示,其他分頁照常可用,不會整頁白掉。 */
function guardRender(fn, target){
  return function(){
    try{ return fn.apply(this, arguments); }
    catch(err){
      console.warn("畫面更新失敗,資料格式可能有變:", err);
      const id=(typeof target==="function")?target():target;
      const el=id&&document.getElementById(id);
      if(el) el.innerHTML='<div class="rk-card" role="alert">這一區的資料格式有問題,暫時顯示不出來。其他分頁不受影響。</div>';
    }
  };
}
renderTopStrip=guardRender(renderTopStrip, ()=>isMobile()?"topstrip":"rail");
renderMacro=guardRender(renderMacro, "macro");
renderRisk=guardRender(renderRisk, "riskPanel");
renderAsset=guardRender(renderAsset, "assetPanel");
renderAF=guardRender(renderAF, "afHead");
renderChart=guardRender(renderChart, "chartSheet");
renderTodoSheet=guardRender(renderTodoSheet, "todoSheet");
if(typeof window.renderExpense==="function") window.renderExpense=guardRender(window.renderExpense, "expensePanel");

/* ── 鍵盤可操作(WCAG 2.1.1)──────────────────────────────────
   可點的列是 div / tr,滑鼠點得到但 Tab 走不到。畫面每次重畫後補上 tabindex 與 role,
   Enter / 空白鍵等同點擊,外觀完全不變。 */
const KB_SEL='[data-sym]:not(button),[data-todo],[data-asrisk],[data-asfold]';
function kbFix(root){
  (root||document).querySelectorAll(KB_SEL).forEach(el=>{
    if(el.hasAttribute("tabindex")) return;
    el.setAttribute("tabindex","0");
    if(el.tagName!=="TR") el.setAttribute("role","button");
  });
}
new MutationObserver(()=>kbFix()).observe(document.body,{childList:true,subtree:true});
document.addEventListener("keydown",e=>{
  if(e.key!=="Enter"&&e.key!==" ") return;
  const el=e.target;
  if(!el||!el.matches||!el.matches(KB_SEL)) return;
  e.preventDefault(); el.click();
});
/* 彈窗開啟時把焦點移進去,關閉時還給原本的按鈕(鍵盤與讀屏才不會迷路) */
let MODAL_RET=null;
function modalFocus(id){
  if(!MODAL_RET) MODAL_RET=document.activeElement;
  const m=document.getElementById(id);
  const f=m&&m.querySelector(".sclose,.td-x,button");
  if(f) f.focus({preventScroll:true});
}
function modalBlur(id){
  const m=document.getElementById(id);
  if(!m||!m.classList.contains("show")) return false;
  m.classList.remove("show");
  if(!document.querySelector(".modal.show")&&MODAL_RET&&MODAL_RET.focus){
    try{ MODAL_RET.focus({preventScroll:true}); }catch(e){}
    MODAL_RET=null;
  }
  return true;
}

/* 有本機槓桿資料(leverage-data.js 有載到)才顯示面板切換鈕。
   線上公開版讀不到那個檔,切換鈕整組隱藏,只剩股票面板,帳戶數字永遠不外流。 */
if(rkHas()){
  document.getElementById("panelToggle").hidden=false;
  document.getElementById("tabbarRisk").hidden=false;   // 手機底部列的槓桿格
}
if(window.ASSET_DATA){
  document.getElementById("panelToggle").hidden=false;
  document.getElementById("assetTogBtn").hidden=false;
  document.getElementById("tabbarAsset").hidden=false;
}
if(window.EXPENSE_DATA){
  document.getElementById("panelToggle").hidden=false;
  document.getElementById("expenseTogBtn").hidden=false;
  document.getElementById("tabbarExpense").hidden=false;
}

/* 分頁寫進 URL hash(#macro/#risk/#asset/#expense):
   重新整理、加書籤、PWA 冷啟動都停在原分頁。用 replaceState,不塞瀏覽歷史。 */
const NAV_KEYS=["macro","risk","asset","expense"];
function syncHash(){
  const key=(PANEL==="risk")?"risk":(PANEL==="asset")?"asset":(PANEL==="expense")?"expense":"macro";
  if(location.hash.slice(1)!==key) history.replaceState(null,"","#"+key);
}
(function(){
  const k=location.hash.slice(1);
  if(NAV_KEYS.includes(k)&&k!=="macro") goNav(k);
  /* #macro 跟面板的 id 同名,瀏覽器會把它當成錨點捲下去。
     手機的頁首吸頂、脈搏卡跟著捲,一開啟就會停在清單中段,所以載入後拉回頂端。
     桌面維持原本的行為,不動。 */
  if(isMobile()) window.addEventListener("load",function(){ window.scrollTo(0,0); });
})();
window.addEventListener("hashchange",function(){
  const k=location.hash.slice(1);
  if(NAV_KEYS.includes(k)) goNav(k);
});

/* ---------- load（讀取 watchlist.json / data.json,refresh 按鈕重抓同一流程） ---------- */
const refreshBtn=document.getElementById("refreshBtn");
function dataUrlsForProtocol(protocol){
  if(protocol==="file:"){
    const base="./";
    return [base+"watchlist.json", base+"data.json"];
  }
  return ["watchlist.json", "data.json"];
}
/* 重新載入 asset-data.js / leverage-data.js 這類「設定 window 全域」的資料腳本。
   加時間戳避開快取,載完把暫時的 script 標籤移掉。失敗不擋整個流程(回 false)。 */
function reloadScript(src){
  return new Promise(res=>{
    const el=document.createElement("script");
    el.src=src+"?t="+Date.now();
    el.onload=()=>{ el.remove(); res(true); };
    el.onerror=()=>{ el.remove(); res(false); };
    document.head.appendChild(el);
  });
}
function toast(msg){
  let t=document.getElementById("toast");
  if(!t){ t=document.createElement("div"); t.id="toast"; t.setAttribute("role","status"); document.body.appendChild(t); }
  t.textContent=msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove("show"),2800);
}
let FIRST_LOAD=true;

/* ── 即時報價 ─────────────────────────────────────────────────────
   data.json 一天只重建一次(美股收盤後),盤中按更新看到的是昨天的收盤。
   這段去打 /api/prices(Cloudflare Function,伺服器端抓 Yahoo),把當下價格
   併回 DATA,均線值不重算(240 日均線盤中幾乎不動),只用新價格重算
   「站上/跌破」與「差幾 %」,這樣點點、判讀句、加碼訊號才會跟價格一致。
   歐洲交易所多數延遲約 15 分鐘,美股接近即時。抓不到就靜靜跳過,不擋畫面。 */
const LIVE_CHUNK=25;       // Workers 免費方案一個請求最多 50 個 subrequest

function mergeLive(sym,q){
  const r=DATA[sym];
  if(!r||r.error||q.p==null) return false;
  r.price=q.p;
  // 歷史序列補上今天這一根,今日漲跌與線圖最後一點才會跟著動
  if(r.hist&&Array.isArray(r.hist.c)&&r.hist.c.length){
    const d=r.hist.d, c=r.hist.c, last=d.length-1;
    if(q.d&&d[last]===q.d) c[last]=q.p;
    else if(q.d&&q.d>d[last]){ d.push(q.d); c.push(q.p); }
    else c[last]=q.p;
  }
  // 用新價格重算均線的上下與差距(均線值本身沿用早上算好的)
  let score=0, valid=0;
  (r.mas||[]).forEach(m=>{
    if(m.v==null) return;
    valid++;
    m.above=q.p>=m.v;
    m.diff=(q.p/m.v-1)*100;
    if(m.above) score++;
  });
  r.score=score; r.valid=valid;
  r.live=true;
  return true;
}

function fetchLive(){
  // 示範版沒有報價 API,價格直接用 data.json 裡的收盤
  return Promise.resolve(0);
  const syms=Object.keys(DATA||{}).filter(k=>k[0]!=="_"&&DATA[k]&&!DATA[k].error);
  if(!syms.length) return Promise.resolve(0);
  const jobs=[];
  for(let i=0;i<syms.length;i+=LIVE_CHUNK){
    const part=syms.slice(i,i+LIVE_CHUNK).map(encodeURIComponent).join(",");
    jobs.push(fetch("/api/prices?syms="+part).then(r=>r.ok?r.json():{}).catch(()=>({})));
  }
  return Promise.all(jobs).then(res=>{
    let n=0;
    res.forEach(o=>Object.keys(o||{}).forEach(k=>{ if(mergeLive(k,o[k])) n++; }));
    if(n){
      const t=new Date(), p=x=>String(x).padStart(2,"0");
      LIVE_AT=`${p(t.getHours())}:${p(t.getMinutes())}`;
    }
    return n;
  });
}

/* 讀資料一律加逾時。沒有這個的話,網路卡住(或 cookie 過期卡在轉圈)會永遠停在
   「讀取資料中…」,使用者只看到一個不會動的畫面,分不出是慢還是壞了。 */
function fetchJSON(url,ms){
  const ctl=("AbortController" in window)?new AbortController():null;
  const t=setTimeout(()=>{ if(ctl) ctl.abort(); }, ms||15000);
  return fetch(url, ctl?{signal:ctl.signal}:undefined).then(r=>{
    if(!r.ok) throw new Error(r.status===401?"登入過期":("HTTP "+r.status));
    return r.json();
  }).finally(()=>clearTimeout(t));
}
function loadData(){
  refreshBtn.classList.add("spinning");
  const prevStamp=DATA&&DATA._updated;
  const [watchlistUrl,dataUrl]=dataUrlsForProtocol(location.protocol);
  // 三個面板的資料一次全更新:股票(watchlist+data)、資產(asset-data)、槓桿(leverage-data)
  /* 第一次載入時這兩個檔剛被 <script> 讀過,不用再抓一次(省一倍流量)。按重新整理才重抓 */
  const staticScripts=(location.protocol==="file:"||FIRST_LOAD)?[]:[reloadScript("asset-data.js"),reloadScript("leverage-data.js")];
  return Promise.all([
    fetchJSON(watchlistUrl+"?t="+Date.now()),
    fetchJSON(dataUrl+"?t="+Date.now(),25000),   // data.json 快 1MB,給久一點
    ...staticScripts,
  ]).then(([wl,data])=>{
    const nWL=normWL(wl), nData=normData(data);   // 格式不對就丟錯,走下面「讀不到資料」那條路,舊畫面不會被洗掉
    WL=nWL; DATA=nData;
    normGlobals();
    buildHoldMaps();
    DATA_DATE=(function(u){
      if(!u) return "-";
      const d=new Date(u); if(isNaN(d)) return String(u).slice(0,10);
      const p=n=>String(n).padStart(2,"0");
      return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    })(DATA._updated);
    syncHeader();
    try{ syncTodoBadge(); }catch(e){}   // 資料到了,自動待辦才算得出來,徽章要重數一次
    document.getElementById("status").style.display="none";
    renderTopStrip();
    renderMacro();
    switchTab(CUR_TAB);   // 同步分頁顯示與選中狀態
    // 人在哪個面板就重畫哪個,槓桿狀態點也同步
    if(PANEL==="risk") renderRisk();
    if(PANEL==="asset") renderAsset();
    syncTabbar();
    // 檔案讀完先畫一次(不要等報價),再去抓即時價格,回來重畫
    const wasFirst=FIRST_LOAD;
    if(FIRST_LOAD) FIRST_LOAD=false;
    return fetchLive().then(n=>{
      if(n){
        syncHeader();
        renderTopStrip(); renderMacro();
        switchTab(CUR_TAB);
        if(PANEL==="risk") renderRisk();
        if(PANEL==="asset") renderAsset();
      }
      if(wasFirst) return;
      if(n) toast(`即時報價已更新 · ${LIVE_AT}(${n} 檔)`);
      else toast(prevStamp===DATA._updated ? `已經是最新的 · 資料 ${DATA_DATE}` : `已更新 · ${DATA_DATE}`);
    });
  }).catch(e=>{
    const why=(e&&e.name==="AbortError")?"太久沒回應":((e&&e.message)||"未知錯誤");
    if(!FIRST_LOAD) toast("讀不到資料:"+why);
    if(!DATA){
      const st=document.getElementById("status");
      st.style.display="";
      st.innerHTML=`<span class="nd">讀不到資料(${escH(why)})。</span>
        <button id="retryBtn" style="margin-left:8px;border:1px solid var(--line2);background:var(--card);
          border-radius:8px;padding:5px 12px;font-size:12.5px;cursor:pointer">重試</button>`;
      const rb=document.getElementById("retryBtn");
      if(rb) rb.onclick=()=>{ st.innerHTML='<span class="nd">讀取中…</span>'; loadData(); };
    }
  }).finally(()=>{
    refreshBtn.classList.remove("spinning");
  });
}
refreshBtn.addEventListener("click",loadData);
loadData();

/* 手機與桌面的清單結構不同(手機是 56px 的列,桌面是三欄卡),
   所以跨越 720px 這條線的時候要整個重畫,不能只靠 CSS。 */
/* iOS 13 / Safari 13 的 MediaQueryList 沒有 addEventListener,只有舊的 addListener。
   直接呼叫會丟例外,後面的 service worker 也就註冊不到。 */
(function(mq,fn){ if(mq.addEventListener) mq.addEventListener("change",fn); else if(mq.addListener) mq.addListener(fn); })(
window.matchMedia("(max-width:720px)"),function(){
  switchTab(CUR_TAB);
  if(PANEL==="asset") renderAsset();
  if(!DATA||!WL) return;
  renderTopStrip(); renderMacro();
  if(PANEL==="risk") renderRisk();
});

/* 註冊 service worker:讓主畫面 app 沒網路時還打得開(顯示上一次的資料)。
   只在 https 或 localhost 有效,file:// 直接跳過。 */
if("serviceWorker" in navigator && location.protocol!=="file:"){
  window.addEventListener("load",function(){
    navigator.serviceWorker.register("sw.js").catch(function(){});
  });
}
