const IDX_META = {
  "^GSPC": {short:"SPX", full:"S&P 500"},
  "^NDX":  {short:"NDX", full:"Nasdaq 100"},
  "^SOX":  {short:"SOX", full:"費城半導體"},
  "^VIX":  {short:"VIX", full:"恐慌溫度計"},
};

let WL=null, DATA=null;

/* data 檔(asset / expense / leverage)是 <script> 直接載進來的,載入後與每次重抓後都整理一次 */
function normGlobals(){
  try{ window.ASSET_DATA=normAsset(window.ASSET_DATA); }catch(e){ window.ASSET_DATA=undefined; }
  try{ window.EXPENSE_DATA=normExpense(window.EXPENSE_DATA); }catch(e){ window.EXPENSE_DATA=undefined; }
  try{ window.MANUAL_SNAPSHOTS=normSnaps(window.MANUAL_SNAPSHOTS); }catch(e){ window.MANUAL_SNAPSHOTS=[]; }
}
normGlobals();

/* ---------- helpers ---------- */
function dotCls(m){ if(!m||m.v==null) return "na"; return m.above?"up":"dn"; }
function dotsHtml(r){
  return [5,20,60,120,240].map(k=>{
    const m=maByK(r,k); const lbl=({5:"5",20:"20",60:"60",120:"120",240:"240"})[k];
    return `<span class="dot ${dotCls(m)}"><i></i>${lbl}</span>`;
  }).join("");
}
function yrHtml(r){
  const m=maByK(r,240);
  if(!m||m.v==null) return `<span class="yr na">-</span>`;
  const cls=m.above?"up":"dn", s=m.diff>=0?"+":"";
  return `<span class="yr ${cls}">${s}${m.diff.toFixed(1)}%</span>`;
}

/* ---------- macro tab ---------- */
// 大盤分頁最頂的「持有大卡」（全寬,可點開彈窗）。歐元 ETF 都用這個。
const BIG_HOLD_CARDS = ["IWDA.AS", "VWRL.AS", "EMIM.AS", "XDWT.DE"];   // 依序渲染在大盤分頁最頂
function bigHoldCard(sym){
  const r=DATA[sym];
  const e=(typeof wlEntry==="function")?wlEntry(sym):{s:sym};
  const short=escH(e.dn||sym);
  const cur=(r&&r.currency)||"";
  // 右上小字:備註或分類 + P/E(有才顯示),清單資訊不因改大卡而流失
  const full=escH([e.note||e.group||"", (r&&r.pe!=null)?`P/E ${r.pe}`:""].filter(Boolean).join(" · "));
  // 內建槓桿產品(正二/正三)標記:每日重設,長抱有耗損,均線訊號要比原型更嚴格看待
  const lev=Number(e.lev||1);
  const levLbl=lev>=3?"正三":"正二";
  const levTag=lev>1?`<span class="levtag">${levLbl} ${lev}x</span>`:"";
  // 跌破季線/半年線/年線的加碼標記(只給持有部位)
  const addTag=addBadgeFor(sym)+cutBadgeFor(sym);
  if(!r||r.error){
    return `<div class="icard span2">
      <div class="top"><span class="short">${short}${levTag}</span><span class="full">${full}</span></div>
      <div class="naidx">${escH((r&&r.error)||"無資料")}</div></div>`;
  }
  const px=r.price!=null?r.price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):"-";
  const m240=maByK(r,240);
  const yr=(m240&&m240.v!=null)?`<span class="yr ${m240.above?'up':'dn'}"><span class="lbl">vs 年線 </span>${m240.diff>=0?'+':''}${m240.diff.toFixed(1)}%</span>`
                               :`<span class="yr"><span class="lbl">vs 年線 </span>-</span>`;
  const ip=interpret(r);
  const ipHtml=ip?`<div class="interp">↳ ${ip}</div>`:"";
  const X=r.score, Y=r.valid;
  const pillBg=(X===Y)?"var(--green-t)":(X===0)?"var(--red-t)":"var(--yellow-t)";
  const pillHtml=`<span class="mapill" style="background:${pillBg}">站上 ${X}/${Y} 均線</span>`;
  // 分隔線列版型(完稿):左=代號+價格+解讀,中=P/E+5均線點,右=站上 X/5
  const note=escH(e.note||e.group||"");
  const peHtml=(r&&r.pe!=null)?`<div class="brow-pe num">P/E ${r.pe}</div>`:`<div class="brow-pe"></div>`;
  // 當日漲跌(hist 末兩筆)
  let dayHtml="";
  if(r.hist&&r.hist.c&&r.hist.c.length>1){
    const c=r.hist.c, dc=(c[c.length-1]/c[c.length-2]-1)*100;
    dayHtml=`<span class="brow-day num ${dc>=0?'up':'dn'}">${dc>=0?'+':''}${dc.toFixed(2)}%</span>`;
  }
  const yr2=(m240&&m240.v!=null)
    ? `<span class="brow-yr">vs 年線 <b class="num ${m240.above?'up':'dn'}">${m240.diff>=0?'+':''}${m240.diff.toFixed(1)}%</b></span>`
    : `<span class="brow-yr">vs 年線 -</span>`;
  const badgeFull=(X===Y&&Y>0);
  const badge=`<span class="brow-badge${badgeFull?' full':''}">站上 ${X}/${Y}</span>`;
  const clickable=(r.hist)?` clickable" data-sym="${escH(sym)}`:'';
  return `<div class="brow${clickable}">
    <div class="brow-id">
      <div class="brow-h"><span class="brow-t num">${short}</span>${levTag}${addTag}${note?`<span class="brow-note">${note}</span>`:""}</div>
      <div class="brow-p"><span class="px num">${px}</span>${dayHtml}${yr2}</div>
      ${ip?`<div class="brow-interp">${ip}</div>`:""}
    </div>
    <div class="brow-ma">
      ${peHtml}
      <div class="dots">${dotsHtml(r)}</div>
    </div>
    <div class="brow-st">${badge}</div>
  </div>`;
}
/* ══════ 手機版清單(依設計稿 1b) ══════
   一列 56px:左=代號+小籤/全名 與 價格+今日漲跌,中=五顆均線點,右=vs 年線。
   5/20/60/120/240 的標籤移到表頭只印一次,每列因此省下一整行。
   判讀句、站上 n/5、P/E 都不在列上,點開走勢彈窗才看。 */
function isMobile(){ return window.matchMedia("(max-width:720px)").matches; }

// 手機列上的說明字要短,砍掉發行商前綴與幣別後綴(iShares Core S&P 500 · 歐元 → S&P 500)
function shortNote(txt){
  if(!txt) return "";
  let s=String(txt).split(" · ")[0].trim();
  s=s.replace(/^(iShares|Amundi|Xtrackers|Vanguard)\s+/i,"").replace(/^Core\s+/i,"");
  return s;
}
// 加碼/減碼在手機上收成小籤;兩級以上才標數字(加碼 2)
function mSignalTags(sym){
  const a=addLevelOf(sym), c=cutLevelOf(sym);
  let out="";
  if(a) out+=`<span class="mtag add">加碼${a.lv>1?" "+a.lv:""}</span>`;
  if(c) out+=`<span class="mtag cut">減碼${c.lv>1?" "+c.lv:""}</span>`;
  return out;
}
/* 手機清單列 v3:第一行 名稱 + 小籤 + 灰註記 + 右側五顆均線點,
   第二行 價格 + 當日漲跌 + 右側 vs 年線大字。點列開走勢彈窗。 */
function mRow(sym){
  const r=DATA[sym], e=wlEntry(sym);
  const name=escH(e.dn||sym);
  if(!r||r.error){
    return `<div class="dm-row"><div class="dm-r1"><b>${name}</b>
      <span class="dm-note">${escH((r&&r.error)||"無資料")}</span></div></div>`;
  }
  const lev=Number(e.lev||1);
  const a=addLevelOf(sym), c=cutLevelOf(sym);
  const tags=(lev>1?`<span class="dm-tag lev">${lev>=3?"正三":"正二"} ${lev}x</span>`:"")
    +(a?`<span class="dm-tag add">加碼${a.lv>1?" "+a.lv:""}</span>`:"")
    +(c?`<span class="dm-tag cut">減碼${c.lv>1?" "+c.lv:""}</span>`:"");
  const note=escH(shortNote(e.note||e.group||""));
  const px=r.price!=null?r.price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):"-";
  let chg="";
  if(r.hist&&r.hist.c&&r.hist.c.length>1){
    const cc=r.hist.c, d=(cc[cc.length-1]/cc[cc.length-2]-1)*100;
    chg=`<span class="chg ${d>=0?"up":"dn"}">${d>=0?"+":"−"}${Math.abs(d).toFixed(2)}%</span>`;
  }
  const m=maByK(r,240);
  const yr=(m&&m.v!=null)
    ? `<div class="dm-yr ${m.above?"up":"dn"}">${m.diff>=0?"+":"−"}${Math.abs(m.diff).toFixed(1)}%</div>`
    : `<div class="dm-yr na">-</div>`;
  const dots=[5,20,60,120,240].map(k=>`<i class="${dotCls(maByK(r,k))}"></i>`).join("");
  return `<div class="dm-row" data-sym="${escH(sym)}">
    <div class="dm-r1"><b>${name}</b>${tags}${note?`<span class="dm-note">${note}</span>`:""}</div>
    <div class="dm-dots">${dots}</div>
    <div class="dm-r2"><span class="px">${px}</span>${chg}</div>
    ${yr}
  </div>`;
}
// 把幾組(分區標題 + 標的清單)各包成一張清單卡,卡尾附均線點的說明
const M_LIST_FOOT="點列開走勢圖 · 圓點為 5 / 20 / 60 / 120 / 240 均線,實心站上、空心跌破,右側為 vs 年線";
function mListHtml(groups){
  const body=groups.map(g=>{
    const rows=g.list.filter(h=>DATA[h.s]).map(h=>mRow(h.s)).join("");
    if(!rows) return "";
    return (g.label?`<div class="dm-grp">${g.label}</div>`:"")
      +`<div class="dm-card dm-list">${rows}<div class="dm-foot">${M_LIST_FOOT}</div></div>`;
  }).join("");
  if(!body) return `<div class="dm-card dm-list"><div class="mempty">這個篩選條件下沒有標的</div></div>`;
  return body;
}

// 分隔線列表容器:欄位標頭 + 各列(完稿)
function blistHtml(rowsHtml){
  return `<div class="blist">
    <div class="bhead"><span class="c1">TICKER · 價格</span>
      <span class="c2">均線位置　5 · 20 · 60 · 120 · 240　●站上 ○跌破</span>
      <span class="c3">狀態</span></div>
    ${rowsHtml}
  </div>`;
}
function indexCard(sym){
  const meta=IDX_META[sym]||{short:escH(sym),full:""};
  const r=DATA[sym];
  if(!r||r.error){
    return `<div class="icard"><div class="top"><span class="short">${meta.short}</span><span class="full">${meta.full}</span></div>
      <div class="naidx">${escH((r&&r.error)||"無資料")}</div></div>`;
  }
  const px=r.price!=null?r.price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):"-";
  if(sym==="^VIX"){
    const v=r.price;
    let txt,col;
    if(v>30){txt="高波動";col="var(--red-t)";}
    else if(v>=20){txt="偏高";col="var(--yellow-t)";}
    else {txt="平靜";col="var(--green-t)";}
    return `<div class="icard">
      <div class="top"><span class="short">${meta.short}</span><span class="full">${meta.full}</span></div>
      <div class="px">${px}</div>
      <div><span style="display:inline-block;margin-top:4px;font-size:13px;font-weight:800;color:#fff;padding:4px 12px;border-radius:8px;background:${col}">${txt}</span></div>
    </div>`;
  }
  const m240=maByK(r,240);
  const yr=(m240&&m240.v!=null)?`<span class="yr ${m240.above?'up':'dn'}"><span class="lbl">vs 年線 </span>${m240.diff>=0?'+':''}${m240.diff.toFixed(1)}%</span>`
                               :`<span class="yr"><span class="lbl">vs 年線 </span>-</span>`;
  const fb=r.fallback?`<span class="fb">指數免費方案未支援,以 ${escH(r.src)} 代替</span>`:"";
  const ip=interpret(r);
  const ipHtml=ip?`<div class="interp">↳ ${ip}</div>`:"";
  const X=r.score, Y=r.valid;
  const pillBg = (X===Y)?"var(--green-t)":(X===0)?"var(--red-t)":"var(--yellow-t)";
  const pillHtml=`<span class="mapill" style="background:${pillBg}">站上 ${X}/${Y} 均線</span>`;
  return `<div class="icard">
    <div class="top"><span class="short">${meta.short}</span><span class="full">${meta.full}</span></div>
    <div class="px">${px}</div>
    <div>${yr}</div>
    <div class="dots">${dotsHtml(r)}</div>
    <div class="foot">${pillHtml}</div>
    ${fb}
    ${ipHtml}
  </div>`;
}
function renderMacro(){
  // 報酬線圖 2026-08-27 搬到槓桿風險頁(RISK_VIEW="perf"):
  // 股票面板講市場、要不要買;線圖講自己做得怎樣,跟槓桿風險同一件事。
  const mh=(WL.market_holdings||[]);
  // 依帳戶分區:.TW 結尾歸台灣,其餘歸 IB(歐股)。
  // 個股(holdings)2026-08-25 起併進同一個分頁,靠篩選列第四段切換,不再是獨立分頁。
  // 這個分頁「每張卡片一律用大卡」:同樣式、同互動(可點開走勢圖),不再有精簡列。
  // BIG_HOLD_CARDS 只決定排序優先(不在清單內的排後面,維持 watchlist 原順序)。
  const isTW=s=>s.endsWith(".TW");
  const rank=h=>{ const i=BIG_HOLD_CARDS.indexOf(h.s); return i<0?99:i; };
  const cardsOf=list=>list.filter(h=>DATA[h.s])
    .map((h,i)=>({h,i}))
    .sort((a,b)=>(rank(a.h)-rank(b.h))||(a.i-b.i))
    .map(x=>bigHoldCard(x.h.s)).join("");
  const eu=mh, tw=[];        // 示範版不分區
  const st=(WL.holdings||[]);   // 個股維持 watchlist 的權重順序
  // 分頁列選中的那一段(全部 / 歐洲大盤 / 台灣大盤 / 個股),「全部」等於三段相加
  const cur=FILTER.macro||"all";
  const segs=[
    {k:"eu",    label:"大盤 ETF", list:eu},
    {k:"tw",    label:"台灣大盤", list:tw},
    {k:"stock", label:"個股",     list:st},
  ];
  const shown=segs.filter(g=>(cur==="all"||cur===g.k)&&g.list.length);
  // 手機版:各分區收在同一張清單卡裡,分區標題印在卡內(設計稿 1a)
  if(isMobile()){
    const sortByRank=list=>list.map((h,i)=>({h,i}))
      .sort((a,b)=>(rank(a.h)-rank(b.h))||(a.i-b.i)).map(x=>x.h);
    const groups=shown.map(g=>({label:g.label, list:sortByRank(g.list)}));
    document.getElementById("macro").innerHTML = mListHtml(groups);
    return;
  }
  // NDX 檔位已整合進頂部訊號卡(vixNdxLine / mPulseTop);指數卡不顯示,NDX/VIX 數據仍供檔位判斷用
  const blk=g=>{
    const cards=cardsOf(g.list);
    const body=cards?blistHtml(cards)
      :`<div class="row err"><div class="head"><span class="nd">這一段目前沒有標的</span></div></div>`;
    return `<div class="blk"><h2>${g.label}</h2>${body}</div>`;
  };
  document.getElementById("macro").innerHTML = shown.map(blk).join("");
}

/* ---------- 訊號（統計 market_holdings + holdings） ---------- */
// 「(持)」與 dn 顯示涵蓋 market_holdings + holdings（兩清單合併建 SET / DN Map）
let HOLD_SET = new Set(), HOLD_DN = new Map();
function buildHoldMaps(){
  const held = [...(((WL&&WL.market_holdings)||[])), ...(((WL&&WL.holdings)||[]))];
  HOLD_SET = new Set(held.map(h=>h.s));
  HOLD_DN  = new Map(held.map(h=>[h.s, h.dn||h.s]));
}
function allTracked(){ return [...(WL.market_holdings||[]), ...(WL.holdings||[])]; }
function symLabel(s){ return HOLD_SET.has(s) ? `${HOLD_DN.get(s)}(持)` : s; }

function crossSignals(){
  const bull=[], bear=[];
  allTracked().forEach(h=>{
    const r=DATA[h.s]; if(!r||r.error||!r.mas) return;
    r.mas.forEach(m=>{ if(m.cross==="bull") bull.push({s:h.s,l:m.label});
                       else if(m.cross==="bear") bear.push({s:h.s,l:m.label}); });
  });
  return {bull,bear};
}
function nearSignals(){
  const arr=[];
  const NM={60:"季",120:"半年",240:"年"};
  allTracked().forEach(h=>{
    const r=DATA[h.s]; if(!r||r.error||!r.mas) return;
    r.mas.forEach(m=>{ if(m.near===true && m.cross==null && NM[m.k])
      arr.push({s:h.s,lbl:NM[m.k]}); });
  });
  return arr;
}
// 訊號區的標的名:清單只剩持有部位,省略「(持)」文字,滑過有 title
function symPlain(s){
  const e=(typeof wlEntry==="function")?wlEntry(s):{};
  const name=HOLD_DN.get(s)||e.dn||s;
  return `<span class="sy" title="持有">${escH(name)}</span>`;
}
// 合併同一標的的多條均線,並省略重複的「線」字(週線+月線 → 週/月)
function mergeSym(arr){
  const map=new Map();
  arr.forEach(x=>{ if(!map.has(x.s)) map.set(x.s,[]); map.get(x.s).push(escH(String(x.l).replace("線",""))); });
  return [...map.entries()].map(([s,ls])=>`${symPlain(s)} ${ls.join("/")}`);
}
function mergeNear(arr){
  const map=new Map();
  arr.forEach(x=>{ if(!map.has(x.s)) map.set(x.s,[]); map.get(x.s).push(x.lbl); });
  return [...map.entries()].map(([s,ls])=>`${symPlain(s)} ${ls.join("/")}`);
}
function vixNoteHtml(){
  const v=DATA["^VIX"];
  let val="無資料", txt="", col="var(--faint)";
  if(v&&!v.error&&v.price!=null){
    const p=v.price; val=p.toFixed(1);
    if(p>30){txt="高波動";col="var(--red-t)";}
    else if(p>=20){txt="偏高";col="var(--yellow-t)";}
    else {txt="平靜";col="var(--green-t)";}
  }
  const tag=txt?`<span class="vixtag" style="background:${col}">${txt}</span>`:"";
  return `<div class="vixnote"><span class="vixk">◷ VIX 恐慌溫度計</span><b>${val}</b>${tag}</div>`;
}
/* VIX 與 NDX 檔位併成一行,兩者中間用細分隔。VIX 只是參考數字,不進檔位判斷 */
function vixNdxLine(){
  const v=DATA["^VIX"];
  let val="無資料", txt="", col="var(--faint)";
  if(v&&!v.error&&v.price!=null){
    const p=v.price; val=p.toFixed(1);
    if(p>30){txt="高波動";col="var(--red-t)";}
    else if(p>=20){txt="偏高";col="var(--yellow-t)";}
    else {txt="平靜";col="var(--green-t)";}
  }
  const L=ladderState();
  const gcol=({up:"var(--green-t)",warn:"var(--yellow-t)",dn:"var(--red-t)"})[L&&L.kind]||"var(--dot-na)";
  const ldr = L
    ? `<span class="mk">NDX 距高點</span><b>-${L.dd.toFixed(1)}%</b>
       <span class="msep"></span>
       <span class="mk">目標水位</span><b>${fmtLev(L.target)} 倍</b>
       ${L.act!=null?`<span class="vixtag" style="background:${gcol}">實際 ${fmtLev(L.act)} 倍 · ${L.gapTxt}</span>`:""}
       ${L.proxy?`<span class="mwhy">高點取自 ${NDX_HIST_PROXY} 序列</span>`:""}`
    : `<span class="mk">NDX 距高點</span><b>-</b><span class="mwhy">歷史序列尚未產生</span>`;
  return `<div class="metaline">
    <span class="mk">VIX</span><b>${val}</b>${txt?`<span class="vixtag" style="background:${col}">${txt}</span>`:""}
    <span class="msep"></span>
    ${ldr}
  </div>`;
}
/* 加碼訊號:持有部位跌破季線/半年線/年線就是加碼點,跌得越深訊號越強。
   只看持有的部位(大盤 + 個股)。 */
// 單一標的的加碼判定,給卡片標記用(未持有回傳 null)
function addLevelOf(sym){
  const held=(WL.market_holdings||[]).some(h=>h.s===sym);   // 加減碼只看大盤,個股不算
  if(!held) return null;
  const r=DATA[sym];
  if(!r||r.error||!r.mas) return null;
  let best=null;
  [60,120,240].forEach(k=>{
    const m=maByK(r,k);
    if(!m||m.v==null||m.above) return;
    if(!best||ADD_LV[k].n>best.lv) best={k,lv:ADD_LV[k].n,lbl:ADD_LV[k].lbl,diff:m.diff};
  });
  return best;
}
function addBadgeFor(sym){
  const a=addLevelOf(sym);
  return a?`<span class="addbadge" title="跌破${a.lbl} ${a.diff.toFixed(1)}%">加碼 ${"●".repeat(a.lv)}</span>`:"";
}

function cutLevelOf(sym){
  const held=(WL.market_holdings||[]).some(h=>h.s===sym);   // 加減碼只看大盤,個股不算
  if(!held) return null;
  const r=DATA[sym];
  if(!r||r.error||!r.mas||r.valid===0) return null;
  if(r.score!==r.valid) return null;                 // 沒站上全部均線就不是減碼點
  const m=maByK(r,240);
  if(!m||m.v==null) return null;
  const hit=CUT_TH.find(t=>m.diff>=t.d);
  return hit?{lv:hit.n,diff:m.diff,th:hit.d}:null;
}
function cutBadgeFor(sym){
  const c=cutLevelOf(sym);
  return c?`<span class="cutbadge" title="站上所有均線,年線乖離 +${c.diff.toFixed(1)}%">減碼 ${"●".repeat(c.lv)}</span>`:"";
}
function cutSignals(){
  const held=(WL.market_holdings||[]);   // 加減碼只看大盤,個股不算
  return held.map(h=>{
    const c=cutLevelOf(h.s);
    return c?{s:h.s,dn:h.dn||h.s,...c}:null;
  }).filter(Boolean).sort((a,b)=>b.lv-a.lv||b.diff-a.diff);
}
function cutSignalsHtml(){
  const list=cutSignals();
  if(!list.length) return "";
  const txt=list.map(x=>
    `<span class="cutit"><b>${escH(x.dn)}</b> 年線 +${x.diff.toFixed(0)}%<span class="lv">${"●".repeat(x.lv)}</span></span>`
  ).join("");
  return `<div class="sigrow addrow"><span class="tag c">減碼 ⤒</span><span class="sigtxt">${txt}</span></div>`;
}
function addSignals(){
  const held=(WL.market_holdings||[]);   // 加減碼只看大盤,個股不算
  const out=[];
  held.forEach(h=>{
    const r=DATA[h.s];
    if(!r||r.error||!r.mas) return;
    let best=null;
    [60,120,240].forEach(k=>{
      const m=maByK(r,k);
      if(!m||m.v==null||m.above) return;              // 站上就不是加碼點
      if(!best||ADD_LV[k].n>best.lv) best={k,lv:ADD_LV[k].n,lbl:ADD_LV[k].lbl,diff:m.diff};
    });
    if(best) out.push({s:h.s,dn:h.dn||h.s,...best});
  });
  return out.sort((a,b)=>b.lv-a.lv||a.diff-b.diff);   // 訊號強的在前,同級跌最深的在前
}
function addSignalsHtml(){
  const list=addSignals();
  if(!list.length) return "";
  const txt=list.map(x=>
    `<span class="addit"><b>${escH(x.dn)}</b> 跌破${x.lbl}<span class="lv">${"●".repeat(x.lv)}</span></span>`
  ).join("");
  return `<div class="sigrow addrow"><span class="tag a">加碼 ⤓</span><span class="sigtxt">${txt}</span></div>`;
}

/* 訊號區:預設壓成一條摘要(筆數 + 最強兩筆),點「展開全部訊號」才看細節,
   讓標的清單成為畫面主體。VIX 與 NDX 併成同一行。 */
let SIGOPEN=false;

/* 這個看板的遊戲規則,全部寫在一起,免得日後自己忘記某個判斷是怎麼來的 */
function rulesHtml(){
  const r=(k,v)=>`<tr><td>${k}</td><td>${v}</td></tr>`;
  // 檔位表的列直接由 LADDER 常數長出來,改常數規則說明就跟著改
  // 金額按今日流動資產換算(讀 ASSET_DATA),沒有資產資料就只顯示倍率
  const _hh=hhLev(), _L=_hh?_hh.liquid:0;
  const amtTxt=lev=>_L?` · 要換約 <b>${Math.round((lev-LADDER_BASE)*_L/1000)}K</b>`:"";
  const ladderRows=[r(`跌不到 ${LADDER[LADDER.length-1].dd}%`,`站 <b>${fmtLev(LADDER_BASE)} 倍</b>(平常的位置),不動`)]
    .concat(LADDER.slice().reverse().map(x=>r(`跌 ${x.dd}% 以上`,`站 <b>${fmtLev(x.lev)} 倍</b>${amtTxt(x.lev)}`)))
    .concat([r("漲回高點",`回到 <b>${fmtLev(LADDER_BASE)} 倍</b>,多出來的正二賣回原型`)])
    .join("");
  return `<div class="rules">
    <div class="rh">一、什麼時候加碼</div>
    <table>
      ${r(`<b class="rt-a">加碼 ●</b>`,"跌破<b>季線</b>(60 日均線)")}
      ${r(`<b class="rt-a">加碼 ●●</b>`,"跌破<b>半年線</b>(120 日)")}
      ${r(`<b class="rt-a">加碼 ●●●</b>`,"跌破<b>年線</b>(240 日),跌越深越該買")}
      ${r(`<b class="rt-c">減碼</b>`,"站上五條均線,而且比年線高 <b>40% 以上</b>。漲太多才減,回檔跌破不算")}
    </table>
    <div class="rh">二、大盤跌多深,槓桿站多高</div>
    <table>
      ${ladderRows}
      ${r("怎麼換",`賣掉原型 ETF 換成兩倍 ETF。要換多少 =(目標倍率 − 現在倍率)× 流動資產;用新現金買則減半`)}
      ${r("錢從哪來",`先賣大盤原型,再賣個股,最後才動融資借款`)}
    </table>
    <div class="rh">三、看板上的字</div>
    <table>
      ${r("站上 ↑ / 跌破 ↓","<b>今天剛穿過</b>某條均線,不是「現在在上面」")}
      ${r("接近 ≈","離均線 <b>0.8% 以內</b>,隨時可能穿過")}
      ${r("站上 n/5","現在站在幾條均線之上")}
      ${r("正二 2x","每天重設的槓桿產品,長抱會有耗損,訊號要看得比原型嚴")}
      ${r("線圖紅點","你的實際買進點,滑過去看日期與價格")}
      ${r("VIX","20 以下平靜 · 20 到 30 偏高 · 30 以上高波動。只是參考,不改檔位")}
    </table>
    <div class="rnote">一句話:<b>跌越深買越多</b>。加碼訊號與檔位表同一個方向。</div>
  </div>`;
}

/* 手機脈搏卡上半段:VIX / NDX 距高點 / 目標檔位 / 現金,收成 2x2 格 */
function mPulseCells(){
  const v=DATA["^VIX"];
  let val="-", vtag="", vcol="var(--faint)";
  if(v&&!v.error&&v.price!=null){
    const p=v.price; val=p.toFixed(1);
    if(p>30){vtag="高波動";vcol="var(--dn)";}
    else if(p>=20){vtag="偏高";vcol="var(--nearink)";}
    else {vtag="平靜";vcol="var(--up)";}
  }
  const L=ladderState(), hh=hhLev();
  const cells=[
    {k:"VIX 恐慌指數", v:val, tag:vtag, tagColor:vcol, sub:"< 20 平靜 · > 30 高波動"},
    {k:"NDX 距高點", v:L?`-${L.dd.toFixed(1)}%`:"-", tag:"", tagColor:"",
      sub:L?(L.proxy?`高點取自 ${NDX_HIST_PROXY} 序列`:"資料窗內高點"):"歷史序列尚未產生"},
    {k:"目標檔位", v:L?`${fmtLev(L.target)}x`:"-", tag:"", tagColor:"",
      sub:(L&&L.act!=null)?`實際 ${fmtLev(L.act)}x · ${L.gapTxt}`:"依檔位表"},
    {k:"現金", v:(hh&&hh.cashPct!=null)?`${hh.cashPct.toFixed(0)}%`:"-", tag:"", tagColor:"",
      sub:"還沒進場的錢"},
  ];
  return `<div class="dm-cells">`+cells.map((c,i)=>
    `<div class="dm-cell ${i%2===0?"l":"r"}">
      <div class="k">${c.k}</div>
      <div class="vv"><b>${c.v}</b>${c.tag?`<em style="color:${c.tagColor}">${c.tag}</em>`:""}</div>
      <div class="s">${c.sub}</div>
    </div>`).join("")+`</div>`;
}
/* 手機脈搏卡:2x2 格 + 今日訊號 chips + 一句摘要,展開才列分組明細 */
function mPulseCard(){
  const {bull,bear}=crossSignals();
  const near=nearSignals();
  const add=addSignals(), cut=cutSignals();
  const bullM=mergeSym(bull), bearM=mergeSym(bear), nearM=mergeNear(near);
  const chip=(lbl,n,on)=>n?`<span class="dm-chip${on?" on":""}">${lbl} ${n}</span>`:"";
  const chips=chip("加碼",add.length,1)+chip("減碼",cut.length)+chip("站上",bullM.length)
    +chip("跌破",bearM.length)+chip("接近",nearM.length);
  const groups=[
    {label:"加碼", color:"var(--add)", txt:add.map(x=>`${escH(x.dn)} 跌破${x.lbl}`).join("、")},
    {label:"減碼", color:"var(--dn)", txt:cut.map(x=>`${escH(x.dn)} 年線 +${x.diff.toFixed(0)}%`).join("、")},
    {label:"站上", color:"var(--up)", txt:bullM.join("、")},
    {label:"跌破", color:"var(--dn)", txt:bearM.join("、")},
    {label:"接近", color:"var(--nearink)", txt:nearM.join("、")},
  ].filter(g=>g.txt);
  const full=groups.length
    ? groups.map(g=>`<div class="dm-sgrp"><span class="g" style="color:${g.color}">${g.label}</span>
        <div class="x">${g.txt}</div></div>`).join("")
    : `<div class="dm-none">今日無訊號</div>`;
  const parts=[];
  if(add.length) parts.push("加碼最強："+add.slice(0,2).map(x=>
    `<b>${escH(x.dn)}</b> 跌破${x.lbl} ${x.diff.toFixed(1)}%`).join("、"));
  if(cut.length) parts.push("減碼："+cut.slice(0,1).map(x=>
    `<b>${escH(x.dn)}</b> 高於年線 +${x.diff.toFixed(0)}%`).join("、"));
  const headline=parts.length?`<div class="dm-hl">${parts.join("　·　")}</div>`:"";
  return `<div class="dm-card dm-pulse">
    ${mPulseCells()}
    <div class="dm-sig"><span class="lbl">今日訊號</span>${chips}
      <span class="dm-acts">
        <button id="rulesToggle">規則</button>
        <button id="sigToggle" aria-expanded="${SIGOPEN}">${SIGOPEN?"收起 ▲":"展開 ▾"}</button>
      </span>
    </div>
    ${SIGOPEN?"":headline}
    ${SIGOPEN?`<div class="dm-open" style="margin-top:9px;padding-top:4px">${full}</div>`:""}
  </div>`;
}

function signalsHtml(){
  // 手機:整張脈搏卡換成 2x2 格版本(設計稿 2026-08-17),桌面維持原本的訊號卡
  if(isMobile()) return mPulseCard();
  const {bull,bear}=crossSignals();
  const near=nearSignals();
  const add=addSignals(), cut=cutSignals();
  const bullM=mergeSym(bull), bearM=mergeSym(bear), nearM=mergeNear(near);

  const chip=(lbl,n,strong)=>n?`<span class="sc${strong?" on":""}">${lbl} ${n}</span>`:"";
  const chips=chip("加碼",add.length,1)+chip("減碼",cut.length,1)
    +chip("站上",bullM.length)+chip("跌破",bearM.length)+chip("接近",nearM.length);

  // 摘要句:加碼最強兩筆 + 減碼最強一筆
  const parts=[];
  if(add.length){
    parts.push("加碼最強："+add.slice(0,2).map(x=>
      `<b>${escH(x.dn)}</b> 跌破${x.lbl} ${x.diff.toFixed(1)}%`).join("、"));
  }
  if(cut.length){
    parts.push("減碼："+cut.slice(0,1).map(x=>`<b>${escH(x.dn)}</b> 高於年線 +${x.diff.toFixed(0)}%`).join("、"));
  }
  const headline=parts.length?`<div class="sighl">${parts.join("　·　")}</div>`:"";
  const none=(!add.length&&!cut.length&&!bullM.length&&!bearM.length&&!nearM.length);

  const row=(cls,lbl,txt)=>txt?`<div class="sigrow"><span class="tag ${cls}">${lbl}</span><span class="sigtxt">${txt}</span></div>`:"";
  const full=none?`<div class="noneline">今日無訊號</div>`:
      addSignalsHtml()+cutSignalsHtml()
      +((add.length||cut.length)&&(bullM.length||bearM.length||nearM.length)?`<div class="sigdiv"></div>`:"")
      +row("b","站上 ↑",bullM.join("、"))
      +row("s","跌破 ↓",bearM.join("、"))
      +row("n","接近 ≈",nearM.join("、"));

  return `<div class="sig">
    ${vixNdxLine()}
    <div class="sigsum">
      <span class="sigt">今日訊號</span><span class="sigchips">${chips}</span>
      <span class="sigacts">
        <button class="sigmore" id="rulesToggle">規則 ↗</button>
        <button class="sigmore" id="sigToggle" aria-expanded="${SIGOPEN}">${
          SIGOPEN?"收合 ▴":"展開全部訊號 ▾"}</button>
      </span>
    </div>
    ${SIGOPEN?"":headline}
    <div class="sigfull"${SIGOPEN?"":" hidden"}>${full}</div>
  </div>`;
}

/* ---------- 清單 ---------- */
// 目前的篩選狀態(只剩大盤分頁在用):all=全部,其餘是 eu / tw / stock
const FILTER={ macro:"all" };
/* 舊的精簡列 stockRow / 行內展開 detailHtml 隨個股分頁一起移除(2026-08-25),
   現在所有標的一律用 bigHoldCard(桌面)與 mListHtml(手機),點卡開線圖彈窗。 */
/* ══════ 桌面右欄(設計稿 B):脈搏卡 + 今日訊號 ══════
   資料來源與手機完全相同(ladderState / hhLev / addSignals / crossSignals…),
   只是版型換成 352px 的側欄,而且訊號永遠全部展開,不需要展開/收合。 */
/* 現在該做什麼:檔位表 + 今日訊號合成一句行動。跌到檔位就報要換多少錢,
   沒到就報離下一檔還有多遠。加碼訊號另外列。 */
/* 自動待辦:檔位表 + 今日加碼,算成 {title, body} 陣列,接在 To-Do 卡最上面 */
function autoTodos(){
  const L=ladderState(), hh=hhLev();
  if(!L||!hh) return [];
  const liq=hh.liquid;
  const nextStep=LADDER.slice().reverse().find(x=>x.dd>L.dd);
  const add=addSignals();
  let head="", body="";
  if(L.act!=null&&L.act<0.995){
    // 階段一:全資產曝險先補滿 100%,基準 1.3 是滿倉之後的事(使用者 2026-08-17 定案)
    const money=Math.round((1-L.act)*liq/1000);
    head=`先把曝險補到 1.0 倍`;
    body=`全資產口徑,現在 ${fmtLev(L.act)} 倍,差約 <b>${money}K</b> 曝險。`
      +`路線:用融資買兩倍 ETF(每 1 塊算 2 塊,約需 <b>${(money/2).toFixed(1)}K</b>)。`
      +`借款成數(借款 ÷ 持倉市值)守在 40% 以內。`
      +`滿倉之後才用小回檔往基準 ${fmtLev(LADDER_BASE)} 爬,大跌照檔位表。`;
  }else if(L.gap>0.02){
    // 檔位未到位:要補倉
    const money=Math.round(L.gap*liq/1000);
    head=`把槓桿補到 ${fmtLev(L.target)} 倍`;
    body=`大盤距高點 -${L.dd.toFixed(1)}%,目標 ${fmtLev(L.target)} 倍,現在 ${fmtLev(L.act)} 倍。`
      +`買 <b>約 ${money}K</b> 的兩倍 ETF,或等值原型換過去。`;
  }else if(L.gap<-0.02){
    head=`收回到基準 ${fmtLev(LADDER_BASE)} 倍`;
    body=`現在 ${fmtLev(L.act)} 倍,超出基準。把超出的兩倍 ETF 賣回原型。`;
  }else{
    head=`維持現在的 ${fmtLev(L.act)} 倍`;
    body=nextStep
      ? `大盤距高點 -${L.dd.toFixed(1)}%,再跌到 <b>-${nextStep.dd}%</b> 才升到 ${fmtLev(nextStep.lev)} 倍(屆時約換 ${Math.round((nextStep.lev-LADDER_BASE)*liq/1000)}K)。`
      : `大盤距高點 -${L.dd.toFixed(1)}%,已在最高檔。`;
  }
  /* 「今日可加碼 N 檔」那條拿掉了(2026-08-21):他說今天要加碼什麼他自己判斷,
     to-do 永遠不要寫這種。addSignals 還留著給其他卡用 */
  return [{title:head, body:body}];
}
function railPulseHtml(){
  const v=DATA["^VIX"];
  let val="-", txt="", col="var(--dot-na)";
  if(v&&!v.error&&v.price!=null){
    const p=v.price; val=p.toFixed(1);
    if(p>30){txt="高波動";col="var(--red-t)";}
    else if(p>=20){txt="偏高";col="var(--yellow-t)";}
    else {txt="平靜";col="var(--green-t)";}
  }
  const L=ladderState();
  const gcol=({up:"var(--green-t)",warn:"var(--yellow-t)",dn:"var(--red-t)"})[L&&L.kind]||"var(--dot-na)";
  const chips=[
    (L&&L.act!=null)?`<span class="rl-chip" style="background:${gcol}">實際 ${fmtLev(L.act)} 倍 · ${L.gapTxt}</span>`:"",
  ].join("");
  return `<div class="rl-card rl-pulse">
    <div class="rl-top">
      <div class="rl-l">
        <div class="rl-lbl">VIX 恐慌指數</div>
        <div class="rl-v"><b class="num">${val}</b>${txt?`<span class="rl-tag" style="background:${col}">${txt}</span>`:""}</div>
      </div>
      <div class="rl-div"></div>
      <div class="rl-r">
        <div class="rl-lbl">NDX 距高點</div>
        <div class="rl-v2"><b class="num">${L?`-${L.dd.toFixed(1)}%`:"-"}</b>
          ${L?`<span class="rl-side">目標水位 <b>${fmtLev(L.target)} 倍</b></span>`
             :`<span class="rl-side">歷史序列尚未產生</span>`}</div>
      </div>
    </div>
    ${chips?`<div class="rl-chips">${chips}</div>`:""}
    ${(L&&L.proxy)?``:""}
  </div>`;
}
function railSigHtml(){
  const {bull,bear}=crossSignals();
  const near=nearSignals();
  const add=addSignals(), cut=cutSignals();
  const bullM=mergeSym(bull), bearM=mergeSym(bear), nearM=mergeNear(near);
  const chip=(lbl,n,strong)=>n?`<span class="rl-sc${strong?" on":""}">${lbl} ${n}</span>`:"";
  const chips=chip("加碼",add.length,1)+chip("減碼",cut.length,1)
    +chip("站上",bullM.length)+chip("跌破",bearM.length)+chip("接近",nearM.length);
  const none=(!add.length&&!cut.length&&!bullM.length&&!bearM.length&&!nearM.length);
  const itemRow=(cls,lbl,items)=>items?`<div class="rl-row"><span class="rl-t ${cls}">${lbl}</span>
      <span class="rl-items">${items}</span></div>`:"";
  const addRow=itemRow("a","加碼 ⤓",add.map(x=>
    `<span class="rl-it a"><b>${escH(x.dn)}</b> 跌破${x.lbl}<span class="lv">${"●".repeat(x.lv)}</span></span>`).join(""));
  const cutRow=itemRow("c","減碼 ⤒",cut.map(x=>
    `<span class="rl-it c"><b>${escH(x.dn)}</b> 年線 +${x.diff.toFixed(0)}%<span class="lv">${"●".repeat(x.lv)}</span></span>`).join(""));
  const moveRow=(cls,lbl,arr)=>arr.length?`<div class="rl-mrow"><span class="rl-t ${cls}">${lbl}</span>
      <span class="rl-moves">${arr.map(t=>`<span class="mv">${t}</span>`).join("")}</span></div>`:"";
  const hasMoves=bullM.length||bearM.length||nearM.length;
  const moves=hasMoves
    ? ((add.length||cut.length)?`<div class="rl-divline"></div>`:"")
      +moveRow("b","站上 ↑",bullM)+moveRow("s","跌破 ↓",bearM)+moveRow("n","接近 ≈",nearM)
    : "";
  const parts=[];
  if(add.length) parts.push("加碼最強："+add.slice(0,2).map(x=>
    `<b>${escH(x.dn)}</b> 跌破${x.lbl} ${x.diff.toFixed(1)}%`).join("、"));
  if(cut.length) parts.push("減碼："+cut.slice(0,1).map(x=>
    `<b>${escH(x.dn)}</b> 高於年線 +${x.diff.toFixed(0)}%`).join("、"));
  const headline=parts.length?`<div class="rl-hl">${parts.join("　·　")}</div>`:"";
  return `<div class="rl-card rl-sig">
    <div class="rl-sh"><span class="rl-st">今日訊號</span>${chips}</div>
    ${none?`<div class="rl-none">今日無訊號</div>`:addRow+cutRow+moves}
    ${headline}
  </div>`;
}

/* ---------- 頂部訊息列（今日均線訊號） ---------- */
/* 手機:訊號收在頂部的脈搏卡(#topstrip)。桌面:搬到右欄(#rail),頂部不再出現。 */
function renderTopStrip(){
  const ts=document.getElementById("topstrip"), rl=document.getElementById("rail");
  if(isMobile()){
    ts.innerHTML = signalsHtml();
    if(rl) rl.innerHTML="";
    return;
  }
  ts.innerHTML="";
  if(rl) rl.innerHTML = railPulseHtml()+railSigHtml()
    ;
}

/* ---------- 規則彈窗:把看板規則從訊號卡搬進獨立 pop-up ---------- */
function renderRules(){
  document.getElementById("rulesSheet").innerHTML=
    `<div class="shead">
       <div><div class="stitle">看板規則</div>
         <div class="ssub">什麼時候買、買多少</div></div>
       <button class="sclose" id="rulesClose" aria-label="關閉">✕</button>
     </div>`+rulesHtml();
}
function openRules(){ renderRules(); document.getElementById("rulesModal").classList.add("show"); modalFocus("rulesModal"); }
function closeRules(){ modalBlur("rulesModal"); }
