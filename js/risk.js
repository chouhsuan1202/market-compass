/* 手機槓桿頁的展開狀態(設計稿 2026-08-17):券商 帳戶明細,預設收起 */
let RK_IBOPEN=false;
/* 槓桿頁的兩個檢視:risk = 風險儀表,perf = 報酬線圖。
   跟資產支出那頁的「支出/資產」同一個做法:同一顆分頁,頂上切換。 */
let RISK_VIEW="risk";
const riskSegHTML=()=>`<div class="tl-seg" style="margin-left:auto;align-self:center">
  ${[["risk","風險"],["perf","線圖"]].map(([k,t])=>
    `<button data-riskview="${k}" class="${RISK_VIEW===k?"on":""}" aria-pressed="${RISK_VIEW===k}">${t}</button>`).join("")}</div>`;
/* 桌面版仿資產支出那頁:四格總覽把兩個檢視的重點拉到第一屏,切換鈕置中吸頂。
   左二講風險(曝險倍數、借款成數),右二講報酬(流動資產、相對大盤),
   這樣不管停在哪個檢視,另一邊的重點都看得到。 */
function riskHeadHTML(){
  const snaps=rkSnaps();
  const s0=snaps.length?rkNorm(snaps[0]):null;
  const ex=s0?rkExpo(s0):null;
  const P=(window.ASSET_DATA&&ASSET_DATA.perf)||{};
  const last=a=>a&&a.length?a[a.length-1].v-100:null;
  const sp=last(P.sp500);
  const ib=last(P.ib), yu=last(P.yuanta);
  const liq=(ib!=null&&yu!=null)?(ib+yu)/2:null;   // 跟合併線同口徑:兩條指數等權
  const dd=(liq!=null&&sp!=null)?liq-sp:null;
  const kpi=(k,v,unit,sub,col)=>`<div class="as-kpi"><div class="k">${k}</div>
    <div class="v num"${col?` style="color:${col}"`:""}>${v}${unit?`<span class="u">${unit}</span>`:""}</div>
    <div class="d" style="font-weight:400;color:var(--muted)">${sub||""}</div></div>`;
  const cells=[];
  if(ex&&ex.effRatio!=null) cells.push(kpi("券商 A 曝險", ex.effRatio.toFixed(2),"x",
    `帳面 ${ex.bookRatio!=null?ex.bookRatio.toFixed(2):"-"}x · 正二額外 ${rkPct(ex.boostRatio)}`));
  if(s0) cells.push(kpi("借款成數", rkPct(s0.borrowRatio),"",
    "安全區 0-40%", (s0.borrowRatio||0)>0.4?"var(--dn)":undefined));
  if(liq!=null) cells.push(kpi("流動資產報酬", perfPct(liq,1),"",
    `S&P 500 同期 ${perfPct(sp,1)}`, perfTone({chg:liq,alpha:dd})));
  if(dd!=null) cells.push(kpi("相對大盤", (dd>=0?"+":"−")+Math.abs(dd).toFixed(1),"pp",
    dd>=0?"贏大盤":"落後大盤", dd>=0?PERF_UP:PERF_DN));
  const seg=[["risk","風險"],["perf","線圖"]].map(([k,t])=>
    `<button data-riskview="${k}" class="${RISK_VIEW===k?"on":""}" aria-pressed="${RISK_VIEW===k}">${t}</button>`).join("");
  return `<div class="as-kpis" style="margin-bottom:14px">${cells.join("")}</div>
    <div id="rkSeg">${seg}</div>`;
}
/* 持倉曝險表的排法:risk = 照等效曝險由大到小(預設,看風險);
   lev  = 正二全部集中在上面,下面才是一倍的(看槓桿集中在哪) */
let ALLOC_SORT="risk";

/* NDX 距高點回落 %:高點取歷史序列裡的最高收盤。序列只回看約兩年,
   所以嚴格說是「資料窗內高點」,不是歷史最高點。
   指數本身沒有 hist 時(舊 data.json)退回全球型 ETF 的序列,並標明來源。 */
const NDX_HIST_PROXY = "IWDA.AS";
function ndxDrawdown(){
  // DATA 是 let 宣告的,不能用 window.DATA 判斷(永遠 undefined,檔位會整組失效)
  if(typeof DATA==="undefined"||!DATA) return null;
  const pick=s=>{ const r=DATA[s];
    return (r&&!r.error&&r.price!=null&&r.hist&&r.hist.c&&r.hist.c.length)?r:null; };
  const own=pick("^NDX"), use=own||pick(NDX_HIST_PROXY);
  if(!use) return null;
  const hi=Math.max(...use.hist.c, use.price);
  if(!(hi>0)) return null;
  return { dd:(1-use.price/hi)*100, hi, proxy:!own };
}
/* 全帳戶槓桿口徑(asset_build.py 算好放在 ASSET_DATA.leverage):
   所有帳戶加起來算,股數沒更新就視為不變,價格每天自動重抓。沒有就回 null。 */
function hhLev(){
  // 示範版只有一個帳戶,沒有「全帳戶」這個口徑,所以一律回 null。
  // 呼叫端都有 null 的分支:占比改成看帳戶內,總曝險那格也不會畫出來。
  return null;
}
/* 目前實際倍率:優先用全帳戶口徑;沒有資產資料才退回 券商 帳戶的敞口(rkNorm + rkExpo)。 */
function actualLeverage(){
  const hh=hhLev(); if(hh) return hh.lev;
  const s=rkSnaps()[0]; if(!s) return null;
  const e=rkExpo(rkNorm(s));
  return (e.effRatio!=null&&isFinite(e.effRatio))?e.effRatio:null;
}
/* 檔位卡要顯示的東西整包算好:沒有槓桿資料時 act / gapTxt 為空,卡片自動少一段 */
function ladderState(){
  const d=ndxDrawdown(); if(!d) return null;
  const target=ladderTarget(d.dd);
  const act=actualLeverage();
  let gap=null, gapTxt="", kind="up";
  if(act!=null){
    gap=target-act;
    if(act<0.995){ gapTxt="先補到 1.0"; kind="warn"; }   // 階段一:滿倉之前不談 1.3 目標
    else if(Math.abs(gap)<=LADDER_EPS){ gapTxt="到位"; kind="up"; }
    else if(gap>0){ gapTxt=`可補 +${gap.toFixed(2)}`; kind="warn"; }
    else { gapTxt=`超出 +${(-gap).toFixed(2)}`; kind="dn"; }
  }
  return {dd:d.dd, proxy:d.proxy, target, act, gap, gapTxt, kind};
}
/* ==========================================================
   槓桿風險面板:資料來自本機 leverage-data.js(window.MANUAL_SNAPSHOTS)。
   計算式移植自 ib-leverage-dashboard/public/app.js,單一真相同一套。
   ========================================================== */
const RK_SEG={"0056":"#12a670","00878":"#1d6fd8","00646":"#e0a132","0052":"#d16ba5","00713":"#7c5cd6","00670L":"#d95f18"};
/* 券商 B持倉:資料來自 ASSET_DATA(每天自動重算),整理成跟 券商 快照一樣的欄位,
   兩張卡才能共用同一個渲染函式。券商 B目前全是原型(1x),沒有融資。 */
const IB_SYM={};
const YUANTA_META={};
/* 個股(2026-08-20 定案):
   個股卡從資產分析搬到槓桿風險最下面。放在有融資那個帳戶裡的個股也算在這張,
   不算進「持倉曝險配置 · IB」,因為那張卡是拿來看 ETF 的。 */
function stockBlock(){
  const A=window.ASSET_DATA;
  return (A&&A.holdings&&A.holdings.find(h=>h.title.indexOf("個股")>=0))||null;
}
function stockSymSet(){
  const b=stockBlock();
  return new Set(b?b.rows.map(r=>r.sym).filter(Boolean):[]);
}
/* 一筆券商持倉是不是個股。快照只有簡稱(IWDA / VWRL),先用 IB_SYM 對回 Yahoo 代號 */
function isStockHold(h,set){
  const nm=String(h.name||"").toUpperCase();
  const sym=h.sym||IB_SYM[nm]||nm;
  return set.has(sym);
}
function yuantaHoldings(){
  const A=window.ASSET_DATA; if(!A||!A.holdings) return [];
  const out=[];
  A.holdings.forEach(b=>b.rows.forEach(r=>{
    const m=YUANTA_META[r.sym]; if(!m) return;
    out.push({name:m.name, ticker:m.ticker, sym:r.sym, market_value:r.value, leverage:m.lev||1});
  }));
  return out.sort((a,b)=>b.market_value-a.market_value);
}
const RK_FB=["#8b5cf6","#0891b2","#65a30d","#db2777","#ea580c"];
function rkSnaps(){ return Array.isArray(window.MANUAL_SNAPSHOTS)?window.MANUAL_SNAPSHOTS:[]; }
function rkHas(){ return rkSnaps().length>0; }
/* 持倉明細的來源快照。最新一筆有時只填帳戶層級的數字(券商 連線讀值不一定帶持倉明細),
   這時往回找最近一筆有持倉的快照來畫「持倉曝險配置 · IB」,並回報那筆的時間,
   卡片會把日期標出來。不這樣做的話整張卡會直接消失(2026-08-25 修)。 */
function rkHoldSnap(){
  const snaps=rkSnaps();
  for(let i=0;i<snaps.length;i++){
    const hs=(snaps[i].holdings||[]).filter(h=>(+h.market_value||0)>0);
    if(hs.length) return {list:hs, from:snaps[i].updated_at||"", stale:i>0};
  }
  return {list:[], from:"", stale:false};
}
function rkRel(t){
  const d=new Date((t||"").replace(" ","T")); if(isNaN(d)) return t||"";
  const min=Math.max(Math.floor((Date.now()-d.getTime())/6e4),0);
  if(min<1) return "剛剛"; if(min<60) return min+" 分鐘前";
  const h=Math.floor(min/60); if(h<24) return h+" 小時前"; return Math.floor(h/24)+" 天前";
}
function levMixHtml(list, empty){
  const m=levMix(list);
  if(!m.two) return `正二占原型 <b>0%</b><span class="nt">${empty||"上限 100%"}</span>`;
  const col=m.two<=m.one?"#0b7a55":"#c2373b";
  return `正二占原型 <b style="color:${col}">${m.pct.toFixed(0)}%</b><span class="nt">上限 100%</span>`;
}
function rkBadge(kind){ return {safe:"rk-safe",watch:"rk-watch",danger:"rk-danger"}[kind]||"rk-safe"; }

/* 個股卡:資料直接用 ASSET_DATA 的個股區塊(涵蓋 個股帳戶、IB、券商 B三邊),
   占比是佔全帳戶流動資產。桌面分兩欄,手機單欄只列前幾檔可展開。 */
let RK_STKOPEN=false;
function stockCardHTML(mob){
  const b=stockBlock(); if(!b||!b.rows.length) return "";
  const hh=hhLev();
  const base=(hh&&hh.liquid)?hh.liquid:b.rows.reduce((a,r)=>a+r.value,0)||1;
  const tot=b.rows.reduce((a,r)=>a+r.value,0);
  const fmtN=n=>Math.round(n).toLocaleString("en-US");
  const row=r=>{
    const link=!!(typeof DATA!=="undefined"&&DATA&&DATA[r.sym]&&DATA[r.sym].hist);
    return `<div class="as-row notag${link?" link":""}"${link?` data-sym="${escH(r.sym)}"`:""}>
      <span class="nm">${escH(r.name)}</span>
      <span class="vv num">${fmtN(r.value)}</span>
      <span class="pp num">${(r.value/base*100).toFixed(1)}%</span>
      <span class="ar">${link?"\u203a":""}</span></div>`;
  };
  const sub=`${b.rows.length} 筆 · ${fmtN(tot)} TWD`;
  if(mob){
    const n=RK_STKOPEN?b.rows.length:6;
    return `<div class="dm-card c2">
      <div class="dm-hd bl"><span class="dm-t">個股</span><span class="dm-hint">${sub}</span></div>
      ${b.rows.slice(0,n).map(row).join("")}
      ${b.rows.length>6?`<button class="dm-btn" id="rkStkMore">${RK_STKOPEN?"收起 ▲":`展開全部 ${b.rows.length} 檔 ▾`}</button>`:""}
    </div>`;
  }
  return `<div class="rk-card">
    <div class="rk-h"><h2 style="font-size:15px">個股</h2><span class="rk-sub">${sub}</span></div>
    <div class="as-rows" style="margin-top:6px">${b.rows.map(row).join("")}</div>
    <div class="rk-foot2">列可點開線圖。</div>
  </div>`;
}
function renderRisk(){
  const el=document.getElementById("riskPanel");
  if(RISK_VIEW==="perf"){
    const head=isMobile()
      ? `<div style="display:flex;justify-content:flex-end;margin:0 2px 8px">${riskSegHTML()}</div>`
      : riskHeadHTML();
    el.innerHTML=head+perfCardHTML();
    bindPerf(el, renderRisk);
    return;
  }
  const snaps=rkSnaps();
  if(!snaps.length){ el.innerHTML=`<div class="rk-card">無槓桿資料(本機檔未載入)。</div>`; return; }
  const s=rkNorm(snaps[0]);
  const cur=escH(s.currency||"TWD");
  const expo=rkExpo(s), st=rkStress(s);
  const bk=rkBorrowKind(s.borrowRatio);
  const bLbl={safe:"安全",watch:"注意",danger:"危險"}[bk];
  // 借款量表:0 ~ 50%(gaugeMax)為滿刻度,安全線 40%
  // IB 真正的追繳線:再借滿超額流動性就碰到。換算成借款比例常常超過 100%,
  // 所以刻度上限跟著它走,兩條線才畫得進同一條 bar。
  const ibLoanMax=Math.max(s.loan,0)+(+s.excess_liquidity||0);
  const ibRatio=s.gross>0?ibLoanMax/s.gross:null;
  const gMax=Math.max(RK_LIMIT.watchMax, (ibRatio||0)*1.12);
  const fillPct=Math.min((s.borrowRatio||0)/gMax*100,100);
  const safeStop=RK_LIMIT.safeMax/gMax*100;
  const watchStop=RK_LIMIT.watchMax/gMax*100;
  const ibStop=ibRatio!=null?Math.min(ibRatio/gMax*100,100):null;
  const safeAmt=s.gross*RK_LIMIT.safeMax, safeRoom=safeAmt-Math.max(s.loan,0);
  // 持倉曝險配置:各持倉市值占持倉總市值。最新快照沒帶持倉明細時退回上一筆有的
  const HSNAP=rkHoldSnap();
  const H=HSNAP.list;
  // 明細不是這一筆快照的就在卡上標來源時間,不要讓人以為是最新的組成
  const holdSub=HSNAP.stale?` · 持倉明細取自 ${escH(HSNAP.from)}`:"";
  // 兩張券商卡只看 ETF,個股統一在最下面那張(2026-08-20 定案)
  const STKSET=stockSymSet();
  const H_ETF=H.filter(h=>!isStockHold(h,STKSET));
  const YT_ETF=yuantaHoldings().filter(h=>!isStockHold(h,STKSET));
  const totMv=H.reduce((a,h)=>a+(+h.market_value||0),0)||1;
  const segColor=(name,i)=>RK_SEG[String(name||"").toUpperCase()]||RK_FB[i%RK_FB.length];   // 只回固定色票,不會吐資料字串
  const segs=H.map((h,i)=>{ const mv=+h.market_value||0, w=mv/totMv*100;
    const lbl=w>=9?`${escH(h.name)} ${Math.round(w)}%`:"";
    return `<div class="seg" style="width:${w}%;background:${segColor(h.name,i)};color:${inkOn(segColor(h.name,i))}">${lbl}</div>`; }).join("");
  // ── 全帳戶總敞口:資料來自 ASSET_DATA.leverage ──
  const hh=hhLev();
  const hhL=ladderState();
  /* ══ 手機版 v3(2026-08-17 設計稿):
     ①總敞口 hero ②券商 敞口(含借款比例與帳戶明細) ③離警戒多遠
     ④持倉曝險配置 ⑤我的 To-Do。數字全部沿用同一套函式。
     檔位表規則不放在這裡,規則類內容集中在股票面板的規則彈窗(openRules)。 ══ */
  if(isMobile()){
    const barCol={safe:"var(--up2)",watch:"var(--yellow)",danger:"var(--red)"};
    const kindOf=(v,good,warn)=> v==null?"safe":(v>=good?"safe":v>=warn?"watch":"danger");
    const mcKind=kindOf(st.marginCallDrop,.5,.25);
    const bcKind=kindOf(st.breachDrop,.5,.25);
    const pctW=v=>Math.max(Math.min((v||0)*100,100),0);
    const pillKind={safe:"up",watch:"warn",danger:"dn"};

    // ① 全帳戶總敞口:量表刻度 0.5x 到 2.5x,黑刻度線畫在基準倍率
    const SC_MIN=.5, SC_MAX=2.5;
    const scPx=v=>Math.max(Math.min((v-SC_MIN)/(SC_MAX-SC_MIN)*100,100),0);
    const basePct=scPx(LADDER_BASE);
    const heroCard=hh?`
      <div class="dm-card">
        <div class="dm-hd"><span class="dm-t">總曝險</span>
          ${hhL&&hhL.gapTxt?`<span class="dm-pill ${hhL.kind}">${hhL.gapTxt}</span>`:""}</div>
        <div class="dm-hero"><span class="n">${hh.lev.toFixed(2)}</span><span class="x">x</span>
          <span class="side">1.0x = 曝險等於我的錢</span></div>
        <div class="dm-g">
          <span class="z1" style="width:${basePct}%"></span>
          <span class="z2" style="width:${Math.max(scPx(2)-basePct,0)}%"></span><span class="z3"></span>
          <span class="fill" style="width:${scPx(hh.lev)}%"></span>
        </div>
        <div class="dm-gl"><span class="tick" style="left:${basePct}%"></span>
          <span class="lo">${SC_MIN}x</span>
          <span class="mid" style="left:${basePct}%">${fmtLev(LADDER_BASE)}x</span>
          <span class="hi">${SC_MAX}x</span></div>
        <div class="dm-stats">
          <div><span class="k">總曝險</span><span class="v">${rkMoney(hh.exposure,"")}</span></div>
          <div><span class="k">全部資金</span><span class="v">${rkMoney(hh.liquid,"")}</span></div>
          <div><span class="k">現金</span><span class="v">${hh.cashPct!=null?hh.cashPct.toFixed(0)+"%":"-"}</span></div>
        </div>
        <div class="rkm-src">借款佔總資產 ${(Math.max(s.loan,0)/hh.liquid*100).toFixed(1)}% · 上限 20%</div>
      </div>`:"";

    // ② 券商 敞口:量表刻度 1.0x 到 3.0x(安全 1.0 到 2.0、注意 2.0 到 2.5、危險 2.5 以上)
    const EXPO_MIN=1, EXPO_MAX=3;
    const expoPct=(expo.effRatio!=null)
      ? Math.max(Math.min((expo.effRatio-EXPO_MIN)/(EXPO_MAX-EXPO_MIN)*100,100),0) : 0;
    const effTxt=(expo.effRatio!=null)?expo.effRatio.toFixed(2):"-";
    const ibKv=[
      {k:"持倉市值", v:rkMoney(s.gross,""), c:"var(--ink)"},
      {k:"帳戶淨值", v:rkMoney(s.net,""), c:"var(--ink)"},
      {k:"質押借款", v:"−"+rkMoney(Math.max(s.loan,0),""), c:"var(--dn)"},
      {k:"利率 · 月利息", c:"var(--ink)",
       v:`${(RK_MARGIN_RATE*100).toFixed(2)}% · ${rkMoney(Math.max(s.loan,0)*RK_MARGIN_RATE/12,"")}/月`},
    ].map(x=>`<div class="dm-kv"><span class="k">${x.k}</span>
      <span class="v" style="color:${x.c}">${x.v}</span></div>`).join("");
    const ibLine=(+s.excess_liquidity||0);
    const ibLoanMax=Math.max(s.loan,0)+ibLine;
    const ibNote=hh?`<div class="dm-foot">上面的 <b>40%</b> 線是質押成數線(借款 ÷ 持倉市值),只算 IB 帳戶內。
      <b>IB 真正的追繳線</b>在借款 ${rkMoney(ibLoanMax,cur)}(${s.gross>0?(ibLoanMax/s.gross*100).toFixed(0):"-"}%,超出這個刻度),
      現在還可以再借 <b>${rkMoney(ibLine,cur)}</b> 才碰到。</div>`:"";

    // ③ 離警戒多遠:現金緩衝沒有條,只有數字與說明
    const stressRows=[
      {k:"碰到 40% 成數線", v:rkPct(st.breachDrop), col:barCol[bcKind],
       w:pctW(st.breachDrop), note:"實際要盯的線", bar:true},
      {k:"距券商追繳", v:rkPct(st.marginCallDrop), col:barCol[mcKind],
       w:pctW(st.marginCallDrop), note:"市場再跌這麼多", bar:true},
      {k:"現金緩衝", v:rkPct(st.cashBuffer), col:(st.cashBuffer||0)<0?"var(--dn)":"var(--up)",
       w:0, note:"現金 ÷ 帳戶淨值", bar:false},
    ].map(x=>`<div class="dm-st">
      <div class="h"><span class="k">${x.k}</span><span class="v" style="color:${x.col}">${x.v}</span></div>
      <div class="b">${x.bar?`<span class="bar"><i style="width:${x.w}%;background:${x.col}"></i></span>`:""}
        <span class="n">${x.note}</span></div></div>`).join("");

    // ④ 持倉曝險配置:分段條與列表都按市值由大到小,顏色沿用原本的索引
    const holdSorted=H_ETF.map((h,i)=>({h,i,mv:+h.market_value||0}))
      .sort((a,b)=>b.mv-a.mv);
    const holdSeg=holdSorted.map(x=>
      `<i style="width:${(x.mv/totMv*100).toFixed(2)}%;background:${segColor(x.h.name,x.i)}"></i>`).join("");
    const holdRows=holdSorted.map(x=>{ const lev=+x.h.leverage||1;
      return `<div class="dm-hold"><i class="d" style="background:${segColor(x.h.name,x.i)}"></i>
        <span class="n">${escH(x.h.name)}</span>
        ${lev>1?`<span class="dm-tag lev">槓桿 ${lev}x</span>`:""}
        <span class="p">${(x.mv/totMv*100).toFixed(0)}%</span>
        <span class="m">${rkMoney(x.mv*lev,"")}</span></div>`; }).join("");

    el.innerHTML=`
      <div style="display:flex;justify-content:flex-end;margin:0 2px 8px">${riskSegHTML()}</div>
      ${heroCard}

      <div class="dm-card">
        <div class="dm-hd"><span class="dm-t">曝險</span>
          <span class="dm-pill ${pillKind[bk]}">${bLbl}</span></div>
        <div class="dm-hero sm"><span class="n">${effTxt}</span><span class="x">x</span>
          <span class="side">帳面 ${expo.bookRatio!=null?expo.bookRatio.toFixed(2):"-"}x + 正二額外 ${rkPct(expo.boostRatio)} · 上限 2.0x</span></div>
        <div class="dm-g thin">
          <span class="z1" style="width:50%"></span><span class="z2" style="width:25%"></span><span class="z3"></span>
          <span class="fill" style="width:${expoPct}%"></span>
        </div>
        <div class="dm-brw"><span class="l">借款成數 <b>${rkPct(s.borrowRatio)}</b></span>
          <span class="r" style="color:${safeRoom>=0?"var(--up)":"var(--dn)"}">離安全線 ${rkMoney(Math.abs(safeRoom),cur)}</span></div>
        <!-- 借款量表 0 到 50%:40% 安全線落在 80% 的位置 -->
        <div class="dm-bbar">
          <span class="z1" style="width:${safeStop}%"></span><span class="z2"></span>
          <span class="fill" style="width:${fillPct}%"></span>
          <span class="tick" style="left:${safeStop}%"></span>
          ${ibStop!=null?`<span class="tick ib" style="left:${ibStop}%"></span>`:""}
        </div>
        <div class="dm-blbl"><span><b>40%</b> 線 · ${rkMoney(safeAmt,"")}</span>
          ${ibStop!=null?`<span style="color:#c2373b"><b>券商追繳</b> ${rkMoney(ibLoanMax,"")}</span>`:""}</div>
        <button class="dm-btn" id="rkIbToggle">${RK_IBOPEN?"收起帳戶明細 ▲":"帳戶明細:市值 · 淨值 · 借款 · 利率 ▾"}</button>
        ${RK_IBOPEN?`<div class="dm-open">${ibKv}${ibNote}</div>`:""}
      </div>

      <div class="dm-card c3">
        <div class="dm-t" style="margin-bottom:4px">離警戒多遠</div>
        ${stressRows}
      </div>

      <div class="dm-card c2">
        <div class="dm-hd bl"><span class="dm-t">持倉曝險配置</span>
          <span class="dm-hint">等效市場曝險 · ${cur}${holdSub}</span></div>
        <div class="dm-mix">${levMixHtml(H)}</div>
        <div class="dm-seg" style="margin:10px 0 4px">${holdSeg}</div>
        ${holdRows}
        <div class="dm-foot">融資借款 −${rkMoney(Math.max(s.loan,0),cur)} · 所有金額單位 ${cur}</div>
      </div>

      ${stockCardHTML(true)}
      <div class="dm-disc">40% 規則是風險緩衝,不是保證不會被追繳。這是公開示範版,所有數字都是編的。</div>`;
    return;
  }
  // 持倉表格
  const rows=H.map((h,i)=>{ const mv=+h.market_value||0, lev=+h.leverage||1;
    const share=mv/totMv, eff=mv*lev;
    const levTag=lev>1?`<span class="rk-lev">槓桿 ${lev}x</span>`:"";
    return `<tr>
      <td><span class="tname"><i style="background:${segColor(h.name,i)}"></i>
        <span><span class="tn">${escH(h.name)}</span> ${levTag}<br><span class="tg">${escH(h.ticker||"")}</span></span></span></td>
      <td>${rkMoney(mv,"")}</td>
      <td class="dim">${(share*100).toFixed(0)}%</td>
      <td class="dim">${lev}x</td>
      <td class="dim">${rkMoney(eff,"")}</td>
    </tr>`; }).join("");
  // 承受力 bar 顏色
  const mcKind=st.marginCallDrop==null?"safe":st.marginCallDrop>=.5?"safe":st.marginCallDrop>=.25?"watch":"danger";
  const bcKind=st.breachDrop==null?"safe":st.breachDrop>=.2?"safe":st.breachDrop>0?"watch":"danger";
  const barCol={safe:"#0e9f6e",watch:"#e0a132",danger:"#e5484d"};
  // 持倉曝險配置的表頭(設計稿 C4:標的 / 市值 / 占比 / 槓桿 / 等效曝險)
  const allocTbl=`<table class="rk-tbl alloc">
    <thead><tr><th>標的</th><th>市值</th><th>占比</th><th>槓桿</th><th>等效曝險</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
  /* 持倉卡(桌面):IB 與券商 B共用同一個版型。unit 是金額單位,foot 是卡片底部那行字。 */
  function allocCard(title,sub,list,unit,foot,mix){
    // 依「等效曝險」由大到小排(市值 x 槓桿),正二會被放大,所以排序跟市值不一定一樣。
    // 上面的色條與下面的表用同一份順序,兩者才對得起來。
    const expo=h=>(+h.market_value||0)*(+h.leverage||1);
    const HH=(list||[]).filter(h=>(+h.market_value||0)>0).sort((a,b)=>
      ALLOC_SORT==="lev"
        // 正二先排在上面,同一群裡面再照等效曝險由大到小
        ? (((+b.leverage||1)>1)-((+a.leverage||1)>1)) || (expo(b)-expo(a))
        : expo(b)-expo(a));
    if(!HH.length) return "";
    const nLev=HH.filter(h=>(+h.leverage||1)>1).length;
    const tot=HH.reduce((a,h)=>a+(+h.market_value||0),0)||1;
    // 占比要看「佔全帳戶流動資產」,不是佔這個券商帳戶。分母抓 ASSET_DATA 的流動資產,
    // 沒有資產資料就退回帳戶內占比(至少不會空白)。上面的色條維持帳戶內組成,那是這張卡的結構。
    const _hh=hhLev();
    const base=(_hh&&_hh.liquid)?_hh.liquid:tot;
    const baseAll=!!(_hh&&_hh.liquid);
    const sg=HH.map((h,i)=>{ const mv=+h.market_value||0, w=mv/tot*100;
      const lbl=w>=9?`${escH(h.name)} ${Math.round(w)}%`:"";
      return `<div class="seg" style="width:${w}%;background:${segColor(h.name,i)};color:${inkOn(segColor(h.name,i))}">${lbl}</div>`; }).join("");
    // 分組模式下,正二那一群結束後插一列小計,一眼看到槓桿部位有多大
    const subtotal=(sel,label)=>{
      const g=HH.filter(sel); if(!g.length) return "";
      const mv=g.reduce((a,h)=>a+(+h.market_value||0),0), ex=g.reduce((a,h)=>a+expo(h),0);
      return `<tr class="alloc-sum"><td>${label} · ${g.length} 檔</td>
        <td>${rkMoney(mv,"")}</td><td class="dim">${(mv/base*100).toFixed(1)}%</td>
        <td class="dim"></td><td class="dim">${rkMoney(ex,"")}</td></tr>`;
    };
    const tr=HH.map((h,i)=>{ const mv=+h.market_value||0, lev=+h.leverage||1;
      const levTag=lev>1?`<span class="rk-lev">槓桿 ${lev}x</span>`:"";
      const sym=h.sym||IB_SYM[String(h.name||"").toUpperCase()]||"";
      const link=!!(typeof DATA!=="undefined"&&DATA&&DATA[sym]&&DATA[sym].hist);
      return `<tr${link?` class="link" data-sym="${escH(sym)}"`:""}>
        <td><span class="tname"><i style="background:${segColor(h.name,i)}"></i>
          <span><span class="tn">${escH(h.name)}</span> ${levTag}<br><span class="tg">${escH(h.ticker||"")}</span></span></span></td>
        <td>${rkMoney(mv,"")}</td>
        <td class="dim">${(mv/base*100).toFixed(1)}%</td>
        <td class="dim">${lev}x</td>
        <td class="dim">${rkMoney(mv*lev,"")}</td>
      </tr>` + (ALLOC_SORT==="lev"&&i===nLev-1
        ? subtotal(h=>(+h.leverage||1)>1,"槓桿部位小計") : ""); }).join("")
      + (ALLOC_SORT==="lev"&&nLev<HH.length
        ? subtotal(h=>(+h.leverage||1)<=1,"一倍部位小計") : "");
    const seg=[["risk","風險排序"],["lev","槓桿分組"]].map(([k,t])=>
      `<button data-allocsort="${k}" class="${ALLOC_SORT===k?"on":""}">${t}</button>`).join("");
    return `<div class="rk-card">
      <div class="rk-h"><h2 style="font-size:15px">${title}</h2><span class="rk-sub">${sub}</span>
        <div class="tl-seg alloc-seg">${seg}</div></div>
      ${mix?`<div class="rk-mix">${mix}</div>`:""}
      <div class="rk-alloc">${sg}</div>
      <table class="rk-tbl alloc">
        <thead><tr><th>標的</th><th>市值 ${unit}</th><th>${baseAll?"占全帳戶":"占比"}</th><th>槓桿</th><th>等效曝險</th></tr></thead>
        <tbody>${tr}</tbody></table>
      <div class="rk-foot2">${foot}</div>
    </div>`;
  }
  el.innerHTML=riskHeadHTML()+`
    <div class="rk-h" style="padding:0 2px">
      <h2>槓桿風險</h2><span class="rk-sub">示範讀值 · ${escH(rkRel(s.updated_at))}</span></div>

    <div class="rk-strip">
      <span class="k">風險狀態</span><span class="rk-pill ${rkBadge(bk)}">${bLbl}</span>
      <span class="sep"></span>
      <span class="k">借款成數</span><b>${rkPct(s.borrowRatio)}</b><span class="note">安全區 0-40%</span>
      <span class="sep"></span>
      <span class="k">距追繳</span><b>${rkPct(st.marginCallDrop)}</b><span class="note">市場需再跌這麼多才觸發</span>
    </div>

    <div class="rk-card rk-main">
      <div class="rk-main-left">
        <div class="rk-hero-row">
          <div><div class="k" style="font-size:11.5px;color:var(--faint)">曝險</div>
            <div class="rk-expo" style="margin-top:8px">${expo.effRatio!=null?expo.effRatio.toFixed(2)+"x":"-"}</div>
            <div class="rk-expo-note">帳面 <b>${expo.bookRatio!=null?expo.bookRatio.toFixed(2)+"x":"-"}</b>　正二額外 <b>${rkPct(expo.boostRatio)}</b></div></div>
          ${hh?`<div><div class="k" style="font-size:11.5px;color:var(--faint)">全帳戶總曝險</div>
            <div class="rk-expo" style="margin-top:8px">${hh.lev.toFixed(2)}x</div>
            <div class="rk-expo-note">借款佔總資產 <b>${(Math.max(s.loan,0)/hh.liquid*100).toFixed(1)}%</b> · 上限 20%</div></div>`:""}
        </div>
        <div class="rk-kv">
          <div><div class="kk">持倉市值</div><div class="vv">${rkMoney(s.gross,"")}</div></div>
          <div><div class="kk">帳戶淨值</div><div class="vv">${rkMoney(s.net,"")}</div></div>
          <div><div class="kk">質押借款</div><div class="vv">${rkMoney(Math.max(s.loan,0),"")}</div></div>
          <div><div class="kk">利率 · 月利息</div><div class="vv">${(RK_MARGIN_RATE*100).toFixed(2)}% · ${rkMoney(Math.max(s.loan,0)*RK_MARGIN_RATE/12,"")}/月</div></div>
        </div>
        <div class="rk-gauge-wrap">
          <div class="rk-gauge-top">
            <div class="g-l"><span style="font-size:14px;font-weight:700">借款成數</span><b>${rkPct(s.borrowRatio)}</b><span style="font-size:12px;color:var(--faint)">借款 ÷ 持倉市值;上面那個是佔全帳戶</span></div>
            <div class="g-r">離 40% 安全線${safeRoom>=0?"還有":"已超出"} <b>${rkMoney(Math.abs(safeRoom),cur)}</b></div>
          </div>
          <div class="rk-mark"><div class="m" style="left:${Math.min(fillPct,100)}%;color:#0b7a55">
            <span>目前 ${rkPct(s.borrowRatio)}</span><span style="font-size:8px">▼</span></div></div>
          <div class="rk-bar">
            <div class="z1" style="width:${safeStop}%"></div>
            <div class="z2" style="width:${watchStop-safeStop}%"></div>
            <div class="z3" style="flex:1"></div>
            <div class="fill" style="width:${fillPct}%"></div>
            <div class="safe-line" style="left:${safeStop}%"></div>
            ${ibStop!=null?`<div class="ib-line" style="left:${ibStop}%"></div>`:""}
          </div>
          <div class="rk-mark lo">
            <div class="m" style="left:${safeStop}%;color:#3f4652">
              <span style="font-size:8px">▲</span><span>40% 線 · ${rkMoney(safeAmt,cur)}</span></div>
            ${ibStop!=null?`<div class="m" style="left:${ibStop}%;color:#c2373b">
              <span style="font-size:8px">▲</span><span>券商追繳 ${(ibRatio*100).toFixed(0)}% · ${rkMoney(ibLoanMax,cur)}</span></div>`:""}
          </div>
          <div class="rk-zones">
            <span class="zt rk-safe">安全區 0-40%</span>
            <span class="zt rk-watch">注意區 40-50%</span>
            <span class="zt rk-danger">危險區 50%↑</span>
            <span class="zmax">刻度到 ${(gMax*100).toFixed(0)}% · ${rkMoney(s.gross*gMax,cur)}</span>
          </div>
          ${hh?`<div style="margin-top:10px;font-size:11.5px;color:var(--muted)">40% 是質押成數線（借款 ÷ 持倉市值），券商那條才是真的會被強平的。</div>`:""}
        </div>
      </div>
      <div class="rk-main-right">
        <div class="rk-h"><h2 style="font-size:13px">下跌承受力</h2></div>
        <div class="rk-stress" style="margin-top:16px">
          <div class="srow"><div class="st"><span class="sl">距券商追繳</span>
            <span class="sv" style="color:${barCol[mcKind]}">${rkPct(st.marginCallDrop)}</span></div>
            <div class="sbar"><i style="width:${Math.min((st.marginCallDrop||0)*100,100)}%;background:${barCol[mcKind]}"></i></div>
            </div>
          <div class="srow"><div class="st"><span class="sl">碰到 40% 成數線</span>
            <span class="sv" style="color:${barCol[bcKind]}">${rkPct(st.breachDrop)}</span></div>
            <div class="sbar"><i style="width:${Math.min((st.breachDrop||0)*100,100)}%;background:${barCol[bcKind]}"></i></div>
            </div>
          <div class="rk-mini">
            <div class="mr"><div class="ml">強平安全墊<span>緩衝充足</span></div>
              <div class="mv" style="color:#0b7a55">${rkPct(st.cushionRatio)}</div></div>
            <div class="mr"><div class="ml">現金緩衝<span>現金 / 帳戶淨值</span></div>
              <div class="mv" style="color:${(st.cashBuffer||0)<0?'#c2373b':'#0b7a55'}">${rkPct(st.cashBuffer)}</div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="rk-holds">
      ${allocCard("ETF",cur+holdSub,H_ETF,cur,
        `融資借款 <b>−${rkMoney(Math.max(s.loan,0),cur)}</b> · 個股列在下面那張卡`,
        levMixHtml(H_ETF))}
    </div>

    ${stockCardHTML(false)}

    <div class="rk-note">所有數字都是這個帳戶內的。金額單位 ${cur}。</div>
  `;
}
