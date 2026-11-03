/* ── 績效線圖 ────────────────────────────────────────────────
   個股帳戶 以前每年寄的那份報酬對照大盤,自己做的版本。
   資料在 ASSET_DATA.perf,每條線起點都是 100,所以帳戶跟大盤可以直接疊著看。
   數字是時間加權報酬:入金那天不算成獲利(記在 asset-flows.json),
   不然薪水投進去會被誤算成賺到的。
   版面沿用資產分頁歷年線圖那一套(.tl-* 樣式),兩張圖看起來要像同一個東西。
   幾何(寬高、y 軸範圍)一律用「全部線」算,切圖例時畫面不會跳。 */
/* ── 報酬對照大盤(v3,2026-08-27 Claude Design 重做) ─────────────────
   上面一張卡把所有能比較的東西做成 chip:流動資產、兩個券商帳戶、每一檔有買點的 ETF。
   點一個,下面那張圖就換成「它 vs S&P 500」,並且給三個大數字:我的、大盤同期、差幾個百分點。
   資料全部沿用既有的 ASSET_DATA(帳戶報酬)、DATA(每日收盤)、WL(買點),不另外做資料檔。 */
const perfEsc = t => escH(t);
/* 每檔 ETF 該跟哪個指數比。用同幣別的 ETF 當代理。
   示範版的 watchlist 沒有買點,這張表用不到,留著只是跟正本版面骨架一致。 */
const PERF_BENCH_MAP={
  "00646.TW":{bench:"00646.TW", idx:"S&P 500"},
  "00713.TW":{bench:"00646.TW", idx:"S&P 500"},
  "2308.TW": {bench:"00646.TW", idx:"S&P 500"},
  "00670L.TW":{bench:"00670L.TW", idx:"NASDAQ 100"},
  "00878.TW": {bench:"00670L.TW", idx:"NASDAQ 100"},
  "0052.TW":{bench:"00670L.TW", idx:"NASDAQ 100（近似）"},
  "VWRL.AS":{bench:"00646.TW", idx:"美國 S&P 500"}
};
const perfBench=sym=>PERF_BENCH_MAP[sym]||{bench:"00646.TW", idx:"S&P 500"};
const PERF_SC={liq:"#2f6fed", ib:"#7b5cd6", yuanta:"#e08b2f",
  "0052.TW":"#1d6fd8","00670L.TW":"#d95f18","00646.TW":"#12a670","00878.TW":"#d16ba5",
  "2308.TW":"#7b5cd6","00713.TW":"#6d4bc4","VWRL.AS":"#0f9d8f","0056.TW":"#e0a132",
  "2412.TW":"#e08b2f","2881.TW":"#c2662f","2454.TW":"#b8433f"};
/* 四種狀態:
   灰 = 剛買不到 7 天,漲跌全是雜訊,先不評;
   紅 = 虧錢;琥珀 = 有賺但輸給大盤(錢放大盤還比較好);綠 = 有賺而且贏過大盤。
   「贏沒贏大盤」用 alpha 判斷:每一批買進的錢,各自跟它進場那天起的大盤比,按金額加權。
   這樣分批買的部位不會被「首買日起算」的長窗口冤枉。 */
const PERF_UP="#0b7a55", PERF_MID="#b5771c", PERF_DN="#c2373b",
      PERF_GRY="#6b7280", PERF_BENCH="#3f4652";
const PERF_UP_L="#8ee6c3", PERF_MID_L="#f4c98a", PERF_DN_L="#ffb3b5", PERF_GRY_L="#c3c9d2";
const perfTone = x => x.fresh ? PERF_GRY : (x.chg<0 ? PERF_DN : ((x.alpha??0)>=0 ? PERF_UP : PERF_MID));
const perfToneL= x => x.fresh ? PERF_GRY_L : (x.chg<0 ? PERF_DN_L : ((x.alpha??0)>=0 ? PERF_UP_L : PERF_MID_L));
let PERF_SUBJ="liq";       // 現在在看誰。預設是流動資產(兩帳戶合併),那是他真正在意的總表現
let PERF_X="day";          // 橫軸密度:day / week / month / year

/* 把 Compass 現有的三份資料湊成線圖要的樣子 */
function perfSrc(){
  const A=window.ASSET_DATA||{}, W=(typeof WL!=="undefined"&&WL)||{};
  const hist={};
  const mh=(W.market_holdings||[]);
  mh.forEach(h=>{
    const hh=(typeof DATA!=="undefined"&&DATA&&DATA[h.s]&&DATA[h.s].hist);
    if(hh&&hh.d&&hh.c) hist[h.s]=hh.d.map((d,k)=>({d,c:hh.c[k]}));
  });
  // 只有「知道成本又有買點」的才畫得出報酬,台股那幾檔沒有買點就先不列
  const buys=mh.filter(h=>h.cost&&h.buys&&h.buys.length&&hist[h.s]&&hist[h.s].length>1)
    .map(h=>({...h, lev:h.lev||1}));
  return {perf:A.perf||{}, names:A.perfNames||{}, hist, buys};
}

/* 線圖本體。o.timeX = 橫軸照真實日期拉開(ETF 檢視用),否則照資料點等距排 */
function perfChartSVG(series,o){
  // 手機把 viewBox 縮窄:圖被壓到 350px 寬的時候,同樣的 font-size 看起來會大一號
  const mob=(typeof window!=="undefined")&&window.innerWidth<720;
  const W=mob?540:920, H=300, L=mob?42:48, R=mob?14:18, T=16, B=30;
  const dom=series.filter(s=>s.pts.length);
  if(!dom.length) return "";
  let X, days=null, t0=0, t1=0;
  if(o.timeX){
    const ts=dom.flatMap(s=>s.pts.map(p=>Date.parse(p.d)));
    t0=Math.min(...ts); t1=Math.max(...ts);
    X=d=>L+((Date.parse(d)-t0)/((t1-t0)||1))*(W-L-R);
  }else{
    const set=new Set(); dom.forEach(s=>s.pts.forEach(p=>set.add(p.d)));
    days=[...set].sort(); const idx={}; days.forEach((d,i)=>idx[d]=i);
    X=d=>L+(days.length>1?idx[d]/(days.length-1):0.5)*(W-L-R);
  }
  const all=dom.flatMap(s=>s.pts.map(p=>p.v)); all.push(100);
  let lo=Math.min(...all), hi=Math.max(...all);
  const pad=Math.max((hi-lo)*0.16,0.8); lo-=pad; hi+=pad;
  const Y=v=>T+(1-(v-lo)/(hi-lo||1))*(H-T-B);
  let g="";
  // 橫格線挑一個好看的間距:2%、5%、10% 這種,不要冒出 3.7% 這種刻度
  const span=hi-lo, cand=[0.5,1,2,2.5,5,10,20,25,50];
  const step=[...cand].reverse().find(x=>span/x>=3.5)||cand[0];
  for(let k=Math.ceil((lo-100)/step);k<=Math.floor((hi-100)/step);k++){
    const pv=+(k*step).toFixed(4), y=Y(100+pv), zero=k===0;
    if(!zero) g+=`<line x1="${L}" x2="${W-R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#eef1f4"/>`;
    g+=`<text x="${L-8}" y="${(y+3.5).toFixed(1)}" text-anchor="end" font-size="10.5"
      fill="${zero?"#5f6673":"#676e79"}" font-family="Manrope,system-ui,sans-serif"
      font-weight="${zero?700:600}">${(pv>0?"+":pv<0?"−":"")+Math.abs(pv)}%</text>`;
  }
  g+=`<line x1="${L}" x2="${W-R}" y1="${Y(100).toFixed(1)}" y2="${Y(100).toFixed(1)}"
    stroke="#c9ced6" stroke-dasharray="4 4"/>`;
  const xt=[];
  if(o.timeX){
    const spanD=(t1-t0)/864e5;
    for(let i=0;i<=6;i++){ const t=t0+(t1-t0)*i/6, dt=new Date(t);
      xt.push([L+((t-t0)/((t1-t0)||1))*(W-L-R),
        spanD>320?(dt.getUTCFullYear()%100)+"/"+(dt.getUTCMonth()+1):(dt.getUTCMonth()+1)+"/"+dt.getUTCDate()]); }
  }else if(o.xmode==="day"||o.xmode==="week"){
    const ev=Math.max(1,Math.ceil(days.length/(mob?5:7)));
    days.forEach((d,i)=>{ if(i%ev===0||i===days.length-1) xt.push([X(d),(+d.slice(5,7))+"/"+(+d.slice(8,10))]); });
  }else{
    days.forEach(d=>xt.push([X(d), o.xmode==="month"?(+d.slice(5,7))+"月":d.slice(0,4)]));
  }
  xt.forEach(([x,t])=>{ g+=`<text x="${x.toFixed(1)}" y="${H-B+18}" text-anchor="middle" font-size="10.5"
    fill="#676e79" font-family="Manrope,system-ui,sans-serif" font-weight="600">${t}</text>`; });
  let lines="";
  series.forEach(s=>{
    if(!s.pts.length) return;
    const xy=s.pts.map(p=>[X(p.d),Y(p.v)]);
    if(s.area) lines+=`<path d="${perfPathD(xy,o.smooth)} L${xy[xy.length-1][0].toFixed(1)} ${H-B} L${xy[0][0].toFixed(1)} ${H-B} Z"
      fill="${s.color}" opacity=".05"/>`;
    lines+=`<path d="${perfPathD(xy,o.smooth)}" fill="none" stroke="${s.color}" stroke-width="${s.w||2}"
      stroke-linejoin="round" stroke-linecap="round"${s.dash?` stroke-dasharray="${s.dash}"`:""}/>`;
    const n=s.pts.length, ev=Math.max(1,Math.ceil(n/(mob?5:(o.dens||8))));
    s.pts.forEach((p,i)=>{
      const last=i===n-1, x=X(p.d), y=Y(p.v);
      if(s.dots||last) lines+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${last?4.5:3}"
        fill="${s.color}" stroke="#fff" stroke-width="1.4"><title>${p.d} ${perfEsc(s.label)} ${perfPct(p.v-100)}</title></circle>`;
      const want = s.labels==="last" ? last : (s.labels&&(last||i%ev===0));
      if(want) lines+=`<text x="${x.toFixed(1)}" y="${(s.lblBelow?y+16:y-9).toFixed(1)}" text-anchor="middle"
        font-size="${last?11:10}" font-weight="700" fill="${s.lblFill||s.color}"
        font-family="Manrope,system-ui,sans-serif" paint-order="stroke" stroke="#fff" stroke-width="3"
        stroke-linejoin="round" style="font-variant-numeric:tabular-nums">${(p.v-100>=0?"+":"")+(p.v-100).toFixed(1)}</text>`;
    });
  });
  // 加碼點:小三角形,滑過去看買了幾股、什麼價
  (o.marks||[]).forEach(m=>{
    const x=X(m.d), y=Y(m.v);
    lines+=`<path d="M${x.toFixed(1)} ${(y+7).toFixed(1)} l5 8 h-10 Z" fill="${m.color||"#101418"}"
      stroke="#fff" stroke-width="1"><title>${perfEsc(m.tip)}</title></path>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="對照 S&amp;P 500 線圖"
    style="width:100%;height:auto;aspect-ratio:${W}/${H};display:block;margin-top:6px">${g}${lines}</svg>`;
}

function bindPerf(el, redraw){
  el.querySelectorAll("[data-perfsubj]").forEach(b=>b.addEventListener("click",()=>{
    PERF_SUBJ=b.dataset.perfsubj; redraw();
  }));
  el.querySelectorAll("[data-perfx]").forEach(b=>b.addEventListener("click",()=>{
    PERF_X=b.dataset.perfx; redraw();
  }));
}

function perfCardHTML(){
  const CARD="background:#fff;border:1px solid var(--line);border-radius:16px;"
    +"box-shadow:0 1px 2px rgba(16,20,24,.05);";
  const D=perfSrc(), P=D.perf, nm=D.names;
  const wrap=inner=>`<div class="perfwrap" style="display:flex;flex-direction:column;gap:12px">${inner}</div>`;
  if(!P||!P.sp500||!P.sp500.length) return wrap(`<section class="perfcard" style="${CARD}padding:18px 20px">
    <h2 style="display:block;margin:0;font-size:16px;font-weight:700">報酬對照大盤</h2>
    <div style="font-size:12.5px;color:var(--faint);margin-top:8px;line-height:1.7">
      還沒有足夠的資料。每天自動存一筆,累積兩天以上就會開始畫線。</div></section>`);

  const chgOf=k=>P[k]&&P[k].length?P[k][P[k].length-1].v-100:null;
  // 流動資產 = 券商 A 與券商 B 兩條指數的等權平均,缺的那天用前一筆補
  const combo=(()=>{
    const a=P.ib||[], b=P.yuanta||[];
    if(a.length<2||b.length<2) return null;
    const ds=[...new Set([...a.map(p=>p.d),...b.map(p=>p.d)])].sort();
    const ff=arr=>{ const by={}; arr.forEach(p=>by[p.d]=p.v);
      const out={}; let last=null; ds.forEach(d=>{ if(by[d]!=null) last=by[d]; out[d]=last; }); return out; };
    const A=ff(a), Bv=ff(b);
    return ds.filter(d=>A[d]!=null&&Bv[d]!=null).map(d=>({d,v:(A[d]+Bv[d])/2}));
  })();
  const liqChg=combo?combo[combo.length-1].v-100:null;

  const spNow0=chgOf("sp500");
  const today=(P.sp500&&P.sp500.length)?P.sp500[P.sp500.length-1].d:"";
  const daysBetween=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/864e5);
  // 每一批買進的錢,各自跟「它進場那天起的大盤」比,按投入金額加權平均。
  // 分批買的部位才不會被「首買日起算」的長窗口冤枉:8/20 才進場的錢只跟 8/20 起的大盤比。
  const alphaOf=b=>{
    const hh=D.hist[b.s], lastC=hh[hh.length-1].c;
    const bh=D.hist[perfBench(b.s).bench]||[]; const bLast=bh.length?bh[bh.length-1].c:null;
    let wsum=0, asum=0;
    b.buys.forEach(l=>{
      const e=hh.find(p=>p.d>=l.d); if(!e) return;
      const eRet=lastC/e.c-1;
      const bs=bh.find(p=>p.d>=l.d);
      const bRet=(bs&&bLast)?bLast/bs.c-1:0;
      const w=l.q*l.p;
      if(!(w>0)) return;   // 缺價格或股數的那筆不能進加權,不然整個 alpha 變 NaN
      asum+=w*(eRet-bRet); wsum+=w;
    });
    return wsum?(asum/wsum)*100:null;
  };
  const items=[
    {k:"liq", t:"流動資產", chg:liqChg, alpha:liqChg-spNow0},
    {k:"ib", t:"券商 A", chg:chgOf("ib"), alpha:chgOf("ib")-spNow0},
    {k:"yuanta", t:"券商 B", chg:chgOf("yuanta"), alpha:chgOf("yuanta")-spNow0},
    ...D.buys.map(b=>{ const hh=D.hist[b.s], lastC=hh[hh.length-1].c;
      return {k:b.s, t:b.dn, chg:(lastC/b.cost-1)*100, buy:b, lev:b.lev,
              alpha:alphaOf(b), fresh:daysBetween(b.buys[0].d,today)<7}; })
  ].filter(x=>x.chg!=null);
  if(!items.some(x=>x.k===PERF_SUBJ)) PERF_SUBJ=items.length?items[0].k:"ib";

  const tile=x=>{
    const sel=PERF_SUBJ===x.k, col=sel?perfToneL(x):perfTone(x);
    return `<button data-perfsubj="${escH(x.k)}" aria-pressed="${sel}" style="display:flex;flex-direction:column;align-items:flex-start;gap:2px;
      min-width:96px;border:1px solid ${sel?"#101418":"var(--line)"};background:${sel?"#101418":"#fff"};
      border-radius:10px;padding:8px 12px;cursor:pointer;text-align:left">
      <span style="display:flex;align-items:center;gap:5px;font-size:10.5px;font-weight:600;
        color:${sel?"#c3c9d2":"var(--faint)"};white-space:nowrap">
        <i style="width:7px;height:7px;border-radius:50%;flex:none;background:${PERF_SC[x.k]||"#9aa1ab"}"></i>${perfEsc(x.t)}${
        x.lev>1?`<b style="font-size:9px;font-weight:800;padding:1px 4px;border-radius:4px;
          background:${sel?"#3a3f47":"#fde7d4"};color:${sel?"#f4c98a":"#b5771c"}">2x</b>`:""}</span>
      <b style="font-variant-numeric:tabular-nums;font-size:16px;font-weight:800;line-height:1.1;color:${col}">${perfPct(x.chg,1)}</b>
    </button>`;
  };
  const spNow=chgOf("sp500");
  const groups=[
    {label:"① 流動資產", sel:x=>x.k==="liq"},
    {label:"② 帳戶", sel:x=>x.k==="ib"||x.k==="yuanta"},
    {label:"③ ETF・個股", sel:x=>!!x.buy}
  ].map(g=>{
    const li=items.filter(g.sel); if(!li.length) return null;
    return {label:g.label, html:`<div style="display:flex;flex-wrap:wrap;gap:4px">${li.map(tile).join("")}</div>`};
  }).filter(Boolean);
  // 基準不是可以點的東西,是一條線。放右上角當這張卡的參考值就好。
  const benchBadge = spNow==null ? "" : `<div style="flex:none;text-align:right">
    <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;font-size:10.5px;
      font-weight:600;color:var(--faint);white-space:nowrap">
      <i style="width:7px;height:7px;border-radius:50%;flex:none;background:${PERF_BENCH}"></i>基準 · S&amp;P 500</div>
    <b style="display:block;font-variant-numeric:tabular-nums;font-size:20px;font-weight:800;
      line-height:1.15;color:var(--ink);margin-top:1px">${perfPct(spNow,1)}</b></div>`;
  const chips=`<section class="perfcard" style="${CARD}padding:14px 20px">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px">
      <div style="min-width:0">
        <h2 style="display:block;margin:0;font-size:17px;font-weight:700;color:var(--ink)">報酬表現</h2>
        <div style="font-size:11.5px;color:#676e79;margin-top:3px">點一項看線圖 ·
          <span style="color:${PERF_DN};font-weight:700">紅</span>虧 ·
          <span style="color:${PERF_MID};font-weight:700">琥珀</span>賺但輸大盤 ·
          <span style="color:${PERF_UP};font-weight:700">綠</span>賺又贏大盤 ·
          <span style="color:${PERF_GRY};font-weight:700">灰</span>剛買</div>
      </div>${benchBadge}
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:18px;margin-top:12px">
      ${groups.map(g=>`<div style="display:flex;flex-direction:column;gap:6px;flex:0 1 auto;min-width:0">
        <div style="font-size:10px;letter-spacing:.07em;font-weight:700;color:#676e79">${g.label}</div>${g.html}</div>`).join("")}
    </div></section>`;

  const segs=[["day","日"],["week","週"],["month","月"],["year","年"]].map(([k,t])=>
    `<button data-perfx="${k}" aria-pressed="${PERF_X===k}" style="height:26px;padding:0 14px;border:none;border-radius:7px;cursor:pointer;
      font-size:12px;line-height:1;background:${PERF_X===k?"#fff":"transparent"};
      box-shadow:${PERF_X===k?"0 1px 2px rgba(16,20,24,.12)":"none"};
      color:${PERF_X===k?"#101418":"var(--faint)"};font-weight:${PERF_X===k?700:600}">${t}</button>`).join("");

  const heroRow=list=>`<div style="display:flex;flex-wrap:wrap;gap:20px;padding:14px 2px 12px;
    border-bottom:1px solid #f4f6f8;margin-top:6px">${list.map(e=>`<div style="min-width:160px;flex:1">
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--faint);font-weight:600;white-space:nowrap">
        <i style="width:8px;height:8px;border-radius:50%;flex:none;background:${e.dot}"></i>${perfEsc(e.label)}</div>
      <div style="font-variant-numeric:tabular-nums;font-size:24px;font-weight:800;line-height:1.15;color:${e.bigC};margin-top:2px">${e.big}</div>
      <div style="font-size:11px;color:${e.subC};margin-top:1px;white-space:nowrap">${perfEsc(e.sub)}</div></div>`).join("")}</div>`;
  const trio=(name,dot,mine,mineSub,bChg,bSub,dd,ddSub,benchName)=>[
    {label:name,dot,big:perfPct(mine,1),bigC:perfTone({chg:mine,alpha:mine-bChg}),sub:mineSub,subC:"#676e79"},
    {label:(benchName||"S&P 500")+" 同期",dot:PERF_BENCH,big:perfPct(bChg,1),bigC:"var(--ink)",sub:bSub,subC:"#676e79"},
    {label:"相對大盤",dot:"transparent",
     big:(dd>=0?"+":"−")+Math.abs(dd).toFixed(1)+" pp",bigC:dd>=0?PERF_UP:PERF_DN,sub:ddSub,subC:dd>=0?PERF_UP:PERF_DN}];

  const shell=(title,sub,body)=>`<section class="perfcard" style="${CARD}padding:18px 20px 15px">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <div style="min-width:0">
        <h3 style="margin:0;font-size:15.5px;font-weight:700;color:var(--ink)">${perfEsc(title)}</h3>
        <div style="font-size:11.5px;color:#676e79;margin-top:4px">${perfEsc(sub)}</div></div>
      <div style="display:flex;gap:3px;padding:3px;background:#f4f6f8;border-radius:9px;flex:none">${segs}</div>
    </div>${body}</section>`;
  const footHTML=t=>`<div style="font-size:11px;color:var(--faint);line-height:1.6;margin-top:8px">${t}</div>`;

  const bChg=chgOf("sp500")||0;
  // ── 帳戶或流動資產:兩條時間加權指數疊在一起比 ──
  if(PERF_SUBJ==="ib"||PERF_SUBJ==="yuanta"||PERF_SUBJ==="liq"){
    const isLiq=PERF_SUBJ==="liq";
    const pts=isLiq?combo:P[PERF_SUBJ];
    const name=isLiq?"流動資產（券商 A+B）":(nm[PERF_SUBJ]||PERF_SUBJ);
    const col=PERF_SC[PERF_SUBJ];
    const series=[
      {k:"bench",label:"S&P 500",color:PERF_BENCH,pts:perfResample(P.sp500,PERF_X),w:2.8,dots:true,labels:true,lblBelow:true,lblFill:"#5a6472"},
      {k:"mine",label:name,color:col,pts:perfResample(pts,PERF_X),w:2.2,dots:true,labels:true,area:true}];
    const mine=isLiq?liqChg:chgOf(PERF_SUBJ), dd=mine-bChg;
    const body=heroRow(trio(name,col,mine,isLiq?"券商 A、B 合併表現":"時間加權，入金已扣",
        bChg,pts[0].d+" 起",dd,dd>=0?"贏大盤":"落後大盤"))
      +perfChartSVG(series,{xmode:PERF_X,smooth:false,dens:8})
      +footHTML(isLiq
        ?"合併線 = 券商 A 與券商 B 兩條指數的等權平均（缺日用前一筆補）。起點都設成 100，100 以上就是賺；入金已扣。"
        :"兩條線起點都設成 100，100 以上就是賺。入金記在 <b>asset-flows.json</b>，沒記的話薪水會被算成獲利。");
    return wrap(chips+shell(name+" vs S&P 500",
      pts[0].d+" 起 · "+(isLiq?"兩帳戶合併 · 已扣掉入金":"已扣掉入金 · 時間加權報酬"), body));
  }

  // ── 單一 ETF:從首買日那天的收盤設成 100 開始比 ──
  const it=items.find(x=>x.k===PERF_SUBJ);
  const B=it.buy, hh=D.hist[B.s], firstBuy=B.buys[0].d;
  const bm=perfBench(B.s);                    // 這檔該跟哪個指數比
  const idx=bm.idx, benchSym=bm.bench, isSelf=benchSym===B.s;
  const win=hh.filter(p=>p.d>=firstBuy);
  if(win.length<2) return wrap(chips+shell(B.dn+" vs "+idx,"資料不足",""));
  const c0=win[0].c;
  const ep=perfResample(win.map(p=>({d:p.d,v:100*p.c/c0})),PERF_X);
  const bh=(D.hist[benchSym]||[]).filter(p=>p.d>=firstBuy);
  const b0=bh.length?bh[0].c:1;
  const bp=perfResample(bh.map(p=>({d:p.d,v:100*p.c/b0})),PERF_X);
  const col=PERF_SC[B.s]||"#2f6fed";
  const series=[
    {k:"bench",label:idx,color:PERF_BENCH,pts:bp,w:2.8,labels:"last",lblFill:"#5a6472"},
    {k:"etf",label:B.dn,color:col,pts:ep,w:2.2,labels:"last"}];
  const marks=B.buys.map(b=>{ const q=win.find(p=>p.d>=b.d)||win[win.length-1];
    return {d:q.d,v:100*q.c/c0,color:col,tip:b.d+" 買 "+b.q+" 股 @ "+b.p}; });
  const lineEnd=ep[ep.length-1].v-100;
  const mine=(win[win.length-1].c/B.cost-1)*100;
  const bEnd=bp.length?bp[bp.length-1].v-100:0;
  const dd=lineEnd-bEnd;
  const ddSub=isSelf?"它本身就是這個指數":(dd>=0?"贏大盤":"輸大盤");
  const body=heroRow(trio(B.dn+" 報酬",col,mine,"現價 vs 加權成本 "+B.cost,
      bEnd,firstBuy+"（首買日）起",dd,ddSub,idx))
    +perfChartSVG(series,{timeX:true,smooth:true,dens:8,marks})
    +footHTML((isSelf?perfEsc(B.dn)+" 本身就追蹤"+idx+"，兩條線會重疊。"
      :"對照線是 "+idx+"（用 "+benchSym.replace(/\..*/,'')+" 這檔 ETF 當代理）。")
      +"起點 = 首買日收盤設 100，▲ 滑過看股數與價格。");
  const levTag=(B.lev||1)>1?" ·正二 2x":"";
  return wrap(chips+shell(B.dn+" vs "+idx+levTag,
    firstBuy+" 首買起 · 共 "+B.buys.length+" 筆買入 · ▲ 是加碼點", body));
}
