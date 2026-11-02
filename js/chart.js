/* ---------- 點擊彈窗:走勢線圖 ---------- */
const RANGE_PTS={ "1D":2, "1W":5, "1M":21, "3M":63, "6M":126, "1Y":252, "3Y":756, "ALL":1e9 };
const RANGE_LBL={ "1D":"1日", "1W":"1週", "1M":"1月", "3M":"3月", "6M":"6月", "1Y":"1年", "ALL":"全部" };
// 手機只留中長天期(1月起),1日與1週在手機上看不出東西
const RANGE_LBL_M={ "1M":"1月", "3M":"3月", "6M":"6月", "1Y":"1年", "3Y":"3年" };
let CHART={ sym:null, range:"6M" };

// 從 watchlist 找顯示名 / 說明
function wlEntry(sym){
  return [...(WL.market_holdings||[]), ...(WL.holdings||[])].find(h=>h.s===sym) || {s:sym};
}
// 依選定區間取歷史資料尾段
function slice(hist){
  const n=hist.c.length, k=Math.min(n, RANGE_PTS[CHART.range]);
  return {d:hist.d.slice(n-k), c:hist.c.slice(n-k)};
}
function fmtDate(iso){ const p=iso.split("-"); return `${p[0]}/${p[1]}/${p[2]}`; }
function num(v,dp){ return v.toLocaleString(undefined,{minimumFractionDigits:dp,maximumFractionDigits:dp}); }

// avgLine=true 時,除了買點紅點,再畫一條「均價」水平虛線(手機版設計稿 1c)
// 桌面彈窗變寬(設計稿 E:viewBox 760x270),手機維持 680x250,所以尺寸改成參數
function chartSVG(d,c,cost,buys,avgLine,w,h){
  const W=w||680,H=h||250,pT=18,pB=16,pL=6,pR=6;
  const n=c.length;
  if(n<2) return `<div class="cnodata">此區間資料不足</div>`;
  const lo=Math.min(...c), hi=Math.max(...c);
  const minI=c.indexOf(lo), maxI=c.indexOf(hi);
  // 買點在此區間內的話,擴大 y 軸讓紅點永遠畫得進來
  let min=lo, max=hi;
  if(avgLine&&cost!=null){ min=Math.min(min,cost); max=Math.max(max,cost); }
  const inBuys=(buys||[]).map(b=>{
    let i=d.indexOf(b.d);
    if(i<0) i=d.findIndex(x=>x>=b.d);           // 買進日若非交易日,取其後第一個交易日
    if(i<0||!d.length||b.d<d[0]) return null;    // 不在目前顯示區間
    return {i, d:b.d, q:b.q, p:(b.p!=null?Number(b.p):c[i])};
  }).filter(Boolean).sort((a,b)=>a.i-b.i);
  inBuys.forEach(b=>{ min=Math.min(min,b.p); max=Math.max(max,b.p); });
  if(cost!=null&&!(buys&&buys.length)){ min=Math.min(min,cost); max=Math.max(max,cost); }
  const span=(max-min)||1;
  const X=i=> pL + i*(W-pL-pR)/(n-1);
  const Y=v=> pT + (1-(v-min)/span)*(H-pT-pB);
  const pts=c.map((v,i)=>`${X(i).toFixed(1)} ${Y(v).toFixed(1)}`);
  const line="M"+pts.join(" L");
  const area=`M${X(0).toFixed(1)} ${(H-pB).toFixed(1)} L`+pts.join(" L")+` L${X(n-1).toFixed(1)} ${(H-pB).toFixed(1)} Z`;
  const anchor=x=> x<70?"start":(x>W-70?"end":"middle");
  const lbl=(i,v,below)=>{
    const x=X(i), y=Y(v);
    const last=(i===n-1);                      // 最後一點有光暈圓點,標籤要多讓開一點
    let ty=below? y+(last?17:13) : y-(last?11:6);
    if(ty<9) ty=y+13;                 // 太貼上緣就翻到線的下面
    if(ty>H-3) ty=y-6;                // 太貼下緣就翻上去
    return `<text class="clabel" x="${x.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anchor(x)}">${num(v,2)}</text>`;
  };
  /* 轉折點標價:不只標最高最低,明顯的波段轉折也寫上數字。
     顯著度 = 該點高過(低於)左右兩側最近反向轉折的幅度;
     短區間(1日/1週/1月)門檻放寬看得細,長區間收緊免得糊成一片。
     最後照 x 座標貪婪去重,重要度高的先佔位,買點位置優先讓給買點標籤。 */
  function priceLabels(){
    const SHORT=n<=40;
    const TH=span*(SHORT?0.05:0.13);
    const cand=[];
    for(let i=1;i<n-1;i++){
      const pk=c[i]>=c[i-1]&&c[i]>=c[i+1]&&(c[i]>c[i-1]||c[i]>c[i+1]);
      const tr=c[i]<=c[i-1]&&c[i]<=c[i+1]&&(c[i]<c[i-1]||c[i]<c[i+1]);
      if(!pk&&!tr) continue;
      let l=i,r=i;
      while(l>0&&(pk? c[l-1]<=c[l] : c[l-1]>=c[l])) l--;
      while(r<n-1&&(pk? c[r+1]<=c[r] : c[r+1]>=c[r])) r++;
      const prom=pk? c[i]-Math.max(c[l],c[r]) : Math.min(c[l],c[r])-c[i];
      if(prom>=TH) cand.push({i, peak:pk, w:prom/span});
    }
    const items=[{i:maxI,peak:true,w:9},{i:minI,peak:false,w:9},
                 {i:n-1,peak:c[n-1]>=c[0],w:8},{i:0,peak:c[0]>c[n-1],w:7}]
                .concat(cand).sort((a,b)=>b.w-a.w);
    // 買點只擋住正下方一小段(BGAP),不要整個 GAP 都吃掉,否則最高最低會被連帶消失
    const GAP=SHORT?W/17:W/13, BGAP=30, MAX=SHORT?10:8;
    // 高點標在線上方、低點標在線下方,兩排各自算間距,
    // 連續的高低轉折就不會互相擋住,短區間才標得密。
    const lane={up:[], dn:[]}, buyX=inBuys.map(b=>X(b.i)), out=[];
    items.forEach(it=>{
      if(out.length>=MAX) return;
      const x=X(it.i), row=it.peak?lane.up:lane.dn;
      if(buyX.some(t=>Math.abs(t-x)<BGAP)) return;
      if(row.some(t=>Math.abs(t-x)<GAP)) return;
      row.push(x); out.push(lbl(it.i, c[it.i], !it.peak));
    });
    return out.join("");
  }
  // 買點:紅點標在買進那天的位置(watchlist 的 buys:[{d,p}])。
  // 尚未提供日期的標的退回舊的平均成本橫線(cost)。
  let costHtml="";
  // 均價水平虛線(手機):買點紅點之外再給一條參考線,一眼看出現價在成本上面還下面
  let avgHtml="";
  if(avgLine&&cost!=null){
    const ay=Y(cost);
    avgHtml=`<line class="bline" x1="${pL}" x2="${W-pR}" y1="${ay.toFixed(1)}" y2="${ay.toFixed(1)}"/>
      <text class="blabel" x="${W-pR-4}" y="${(ay-5).toFixed(1)}" text-anchor="end">均價 ${num(cost,2)}</text>`;
  }
  if(inBuys.length){
    // 分批買進的點會擠在一起,標籤只給前後都夠空的孤立買點,其餘靠 hover 的 title
    const GAP=58;
    costHtml=inBuys.map((b,k)=>{
      const bx=X(b.i), by=Y(b.p);
      const ty=by<pT+16 ? by+16 : by-9;
      const tip=escH(`${fmtDate(b.d)} 買${b.q?" "+b.q+" 股":""} @ ${num(b.p,2)}`);
      const prevFar=k===0||bx-X(inBuys[k-1].i)>=GAP;
      const nextFar=k===inBuys.length-1||X(inBuys[k+1].i)-bx>=GAP;
      const text=(prevFar&&nextFar)
        ? `<text class="blabel" x="${bx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anchor(bx)}">買 ${num(b.p,2)}</text>`
        : "";
      return `<circle class="bdot" cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="4.4"><title>${tip}</title></circle>${text}`;
    }).join("");
  }else if(cost!=null){
    const cy=Y(cost).toFixed(1);
    const ty=Y(cost)<pT+16 ? (+cy+14).toFixed(1) : (+cy-5).toFixed(1);
    costHtml=`<line class="bline" x1="${pL}" x2="${W-pR}" y1="${cy}" y2="${cy}"/>
      <circle class="bdot" cx="${pL+3}" cy="${cy}" r="3.4"/>
      <circle class="bdot" cx="${W-pR-3}" cy="${cy}" r="3.4"/>
      <text class="blabel" x="${pL+11}" y="${ty}">買點 ${num(cost,2)}</text>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="收盤價走勢 ${num(c[0],2)} 到 ${num(c[n-1],2)}">
    <defs><linearGradient id="cgrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--cline)" stop-opacity="0.16"/>
      <stop offset="1" stop-color="var(--cline)" stop-opacity="0"/></linearGradient></defs>
    <path class="carea" d="${area}"/>
    <path class="cline" d="${line}"/>
    ${avgHtml}${costHtml}
    <circle class="cglow" cx="${X(n-1).toFixed(1)}" cy="${Y(c[n-1]).toFixed(1)}" r="7"/>
    <circle class="cdot" cx="${X(n-1).toFixed(1)}" cy="${Y(c[n-1]).toFixed(1)}" r="3.6"/>
    ${priceLabels()}
  </svg>`;
}

// 買進紀錄:把 watchlist 的 buys:[{d,q,p}] 列成清單,和線圖上的紅點一一對應。
// cost 用已解出的持倉均價(有含手續費的 e.cost 優先),last 拿來算每筆的浮動損益。
function buyHistoryHTML(e,last,cost){
  const buys=Array.isArray(e.buys)?e.buys.slice():null;
  if(!buys||!buys.length) return "";
  buys.sort((a,b)=> a.d<b.d?-1 : a.d>b.d?1 : 0);
  const qFmt=q=> q%1===0? String(q) : q.toFixed(2);
  let totQ=0;
  const rows=buys.map(b=>{
    const q=Number(b.q||0), p=Number(b.p||0); totQ+=q;
    const pl=(last!=null&&p)?(last/p-1)*100:null;
    const plHtml=pl!=null?`<span class="bh-pl ${pl>=0?'up':'dn'}">${pl>=0?'+':''}${pl.toFixed(1)}%</span>`:`<span class="bh-pl"></span>`;
    return `<div class="bh-row">
      <span class="bh-d num"><span class="bh-dot"></span>${escH(fmtDate(b.d))}</span>
      <span class="bh-q num">${qFmt(q)} 股</span>
      <span class="bh-p num">@ ${num(p,2)}</span>
      ${plHtml}</div>`;
  }).join("");
  const avg=cost!=null?cost:(totQ?buys.reduce((a,b)=>a+Number(b.q||0)*Number(b.p||0),0)/totQ:0);
  return `<div class="bhist">
    <div class="bh-head"><span class="bh-t">我的買進紀錄</span>
      <span class="bh-sum">${buys.length} 筆 · 共 ${qFmt(totQ)} 股 · 均價 ${num(avg,2)}</span></div>
    ${rows}</div>`;
}
/* ══════ 手機版走勢彈窗的零件(設計稿 1c) ══════ */
// 均線格改成顯示「均線價格」+ 站上/跌破小籤,不再是乖離百分比
function mMaCards(r){
  const lab={5:"MA5",20:"MA20",60:"MA60",120:"MA120",240:"MA240"};
  return `<div class="mmacards">`+[5,20,60,120,240].map(k=>{
    const m=maByK(r,k);
    if(!m||m.v==null)
      return `<div class="mmac"><span class="l">${lab[k]}</span><span class="v na">-</span><span class="s na">-</span></div>`;
    const cls=m.above?"up":"dn";
    return `<div class="mmac"><span class="l">${lab[k]}</span>
      <span class="v ${cls}">${m.v.toLocaleString(undefined,{maximumFractionDigits:1})}</span>
      <span class="s ${cls}">${m.above?"站上":"跌破"}</span></div>`;
  }).join("")+`</div>`;
}
// 買進摘要 chip + 每一筆明細(日期 / 成交價 / 股數)
function mBuyBlock(e,last,cost){
  const buys=Array.isArray(e.buys)?e.buys.slice():null;
  if(!buys||!buys.length) return "";
  buys.sort((a,b)=> a.d<b.d?-1 : a.d>b.d?1 : 0);
  const totQ=buys.reduce((a,b)=>a+Number(b.q||0),0);
  const avg=(cost!=null)?cost:(totQ?buys.reduce((a,b)=>a+Number(b.q||0)*Number(b.p||0),0)/totQ:0);
  const pl=avg?(last/avg-1)*100:null;
  const qf=q=> q%1===0?String(q):q.toFixed(2);
  const rows=buys.map(b=>`<div class="mbrow"><i></i>
    <span class="d">${escH(b.d)}</span>
    <span class="p">${num(Number(b.p||0),2)}</span>
    <span class="q">× ${qf(Number(b.q||0))}</span></div>`).join("");
  const plHtml=(pl!=null)
    ? ` · 現價 <b class="${pl>=0?"up":"dn"}">${pl>=0?"+":"−"}${Math.abs(pl).toFixed(1)}%</b>` : "";
  return `<div class="mbuy-sum"><i></i>買進 ${buys.length} 筆 · 均價 <b>${num(avg,2)}</b>${plHtml}</div>
    <div class="mbuy-list">${rows}</div>`;
}

function maCardsHTML(r){
  const lab={5:"週 5MA",20:"月 20MA",60:"季 60MA",120:"半年 120MA",240:"年 240MA"};
  // 完稿:格子白底細框,顏色只落在數值;狀態(站上/跌破/今日穿越)用格底小標籤
  return `<div class="macards">`+[5,20,60,120,240].map(k=>{
    const m=maByK(r,k);
    if(!m||m.v==null) return `<div class="mac"><div class="macv na num">-</div><div class="macl">${lab[k]}</div><div class="macs muted">-</div></div>`;
    const cls=m.above?"up":"dn", s=m.diff>=0?"+":"";
    const crossed=m.cross==="bull"||m.cross==="bear";
    const st=m.cross==="bull"?`<span class="macs on up">今日站上</span>`
            :m.cross==="bear"?`<span class="macs on dn">今日跌破</span>`
            :`<span class="macs muted">${m.above?"站上":"跌破"}</span>`;
    return `<div class="mac${crossed?" crossed":""}"><div class="macv ${cls} num">${s}${m.diff.toFixed(1)}%</div>
      <div class="macl">${lab[k]}</div>${st}</div>`;
  }).join("")+`</div>`;
}

function renderChart(){
  const sym=CHART.sym, r=DATA[sym]; if(!r||!r.hist) return;
  const e=wlEntry(sym);
  const title=escH(e.dn||sym);
  const sub=escH([sym.replace(/\.(TW|TWO)$/,""), e.note].filter(Boolean).join(" · "));
  const {d,c}=slice(r.hist);
  const last=c[c.length-1], prev=c.length>1?c[c.length-2]:last;
  const chg=(last/prev-1)*100, cCls=chg>=0?"up":"dn", cS=chg>=0?"+":"";
  const seg=(group,val,map)=>`<div class="segrow">`+Object.keys(map).map(kk=>
      `<button data-${group}="${kk}" class="${CHART.range===kk?'on':''}">${map[kk]}</button>`).join("")+`</div>`;
  const segs=`<div class="segs">
      ${seg("range",CHART.range,RANGE_LBL)}
    </div>`;
  const ip=interpret(r);   // 站上 n/5 改放右下的 sscore,解讀句不再重複帶分數
  // 持倉成本:彈窗頭顯示現價 vs 買點(cost,或 buys 的平均價)
  const buys=Array.isArray(e.buys)?e.buys:null;
  let cost=(e.cost!=null)?Number(e.cost):null;
  if(cost==null&&buys&&buys.length) cost=buys.reduce((a,b)=>a+Number(b.p||0),0)/buys.length;
  // 買點與 vs 買點收成一個 chip
  let costLine="";
  if(cost!=null){
    const cp=(last/cost-1)*100;
    costLine=`<div class="costchip num"><span class="bq"></span>買點 ${num(cost,2)}
      <span>vs 買點 <b>${cp>=0?"+":""}${cp.toFixed(1)}%</b></span></div>`;
  }
  // 卡片上的槓桿/加碼/減碼標記,彈窗標題也帶著
  const tags=(function(){
    const lev=Number(e.lev||1);
    // 排列狀態標籤(完稿):站上全部=多頭排列(綠),全部跌破=空頭排列
    let trend="";
    if(r.valid>0&&r.score===r.valid) trend=`<span class="trendtag up">多頭排列</span>`;
    else if(r.valid>0&&r.score===0) trend=`<span class="trendtag dn">空頭排列</span>`;
    return trend+(lev>1?`<span class="levtag">${lev>=3?"正三":"正二"} ${lev}x</span>`:"")
      +addBadgeFor(sym)+cutBadgeFor(sym);
  })();
  // ── 手機版彈窗(設計稿 1c):抓握條、價格靠右、均價虛線、買進明細、均線價格格 ──
  if(isMobile()){
    let trend="";
    if(r.valid>0&&r.score===r.valid) trend=`<span class="mtrend up">多頭</span>`;
    else if(r.valid>0&&r.score===0) trend=`<span class="mtrend dn">空頭</span>`;
    const lev=Number(e.lev||1);
    const mtags=trend+(lev>1?`<span class="mtag lev">${lev>=3?"正三":"正二"} ${lev}x</span>`:"")
      +mSignalTags(sym);
    // 標題已經印了代號,副標只留說明文字(設計稿 1c)
    const msub=escH(e.note||e.group||sym);
    const msegs=`<div class="segs"><div class="segrow">`+Object.keys(RANGE_LBL_M).map(kk=>
        `<button data-range="${kk}" class="${CHART.range===kk?'on':''}">${RANGE_LBL_M[kk]}</button>`
      ).join("")+`</div></div>`;
    document.getElementById("chartSheet").innerHTML=
      `<div class="grab"></div>
       <div class="mshead">
         <div><div class="t"><b>${title}</b>${mtags}</div><div class="sub">${msub}</div></div>
         <div class="rt"><div style="text-align:right">
           <div class="px">${num(last,2)}</div>
           <div class="chg ${cCls}">${cS}${chg.toFixed(2)}% 今日</div>
         </div><button class="sclose" id="chartClose" aria-label="關閉">✕</button></div>
       </div>
       <div class="chartbox">${chartSVG(d,c,cost,buys,true)}</div>
       <div class="cdates"><span>${d.length?fmtDate(d[0]):""}</span><span>${d.length?fmtDate(d[d.length-1]):""}</span></div>
       ${mBuyBlock(e,last,cost)}
       ${assetLineHTML(sym)}
       ${msegs}
       ${mMaCards(r)}
       <div class="msfoot">${ip?`<span class="ip">${ip}</span>`:`<span class="ip"></span>`}
         <span class="sc5">站上 ${r.score}/${r.valid}</span></div>`;
    return;
  }
  document.getElementById("chartSheet").innerHTML=
    `<div class="shead">
       <div><div class="stitle">${title}${tags}</div><div class="ssub">${sub}</div></div>
       <div class="rt"><div>
         <div class="sprice">${num(last,2)}</div>
         <div class="schg ${cCls}">${cS}${chg.toFixed(2)}%</div>
         ${costLine}
       </div><button class="sclose" id="chartClose" aria-label="關閉">✕</button></div>
     </div>
     <div class="chartbox">${chartSVG(d,c,cost,buys,false,760,270)}</div>
     <div class="cdates"><span>${d.length?fmtDate(d[0]):""}</span><span>${d.length?fmtDate(d[d.length-1]):""}</span></div>
     ${segs}
     ${maCardsHTML(r)}
     <div class="sfoot">${ip?`<div class="sinterp">↳ ${ip}</div>`:`<div class="sinterp"></div>`}
       <span class="sscore">站上 ${r.score}/${r.valid} 均線</span></div>
     ${assetLineHTML(sym)}${buyHistoryHTML(e,last,cost)}`;
}
function openChart(sym){
  // 手機只有 1月/3月/6月/1年/3年,若沿用桌面選過的區間會對不上,直接回到預設
  CHART={ sym, range:(isMobile()&&!RANGE_LBL_M[CHART.range])?"6M":(CHART.range||"6M") };
  renderChart();
  document.getElementById("chartModal").classList.add("show");
  modalFocus("chartModal");
}
function closeChart(){ modalBlur("chartModal"); }
