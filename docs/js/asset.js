/* ══ 資產面板:資料來自 asset-data.js(window.ASSET_DATA),make_asset_data.py 產生 ══ */
function assetPos(sym){
  const A=window.ASSET_DATA; if(!A||!sym) return null;
  for(const b of A.holdings) for(const r of b.rows) if(r.sym===sym) return r;
  return null;
}
/* 線圖彈窗裡的「持有市值 / 佔股票部位」一列,只有資產面板有這支才出現 */
function assetLineHTML(sym){
  const r=assetPos(sym); if(!r) return "";
  return `<div class="apos num">持有市值 ${r.value.toLocaleString("en-US")} TWD · 佔股票部位 ${escH(r.pctAll)}%
    <button class="aposlink" data-goasset>資產面板 ↗</button></div>`;
}
/* 桌面資產頁:持倉兩卡的收合狀態,預設收起(2026-08-16 使用者要求) */
let ASSET_OPEN={};
let TL_MODE="year";   // 歷年線圖:year=歷年 / month=最近幾個月
/* 手機資產頁的展開狀態(設計稿 2026-08-17),切面板不重置。
   AS_STRUCT / AS_RISKOPEN 存的是列的序號,null 代表整組收起。 */
let AS_TLOPEN=false, AS_STRUCT=null,
    AS_HOLDS={}, AS_RISKOPEN=null;   // AS_HOLDS:手機持倉卡的展開狀態,key 是 holdings 索引
function renderAsset(){
  const A=window.ASSET_DATA, el=document.getElementById("assetPanel");
  if(!A){ el.innerHTML=""; return; }
  const fmt=n=>Math.round(n).toLocaleString("en-US");
  const mob=isMobile();
  // 桌面把 delta(▲▼ vs 上次)接在 sub 後面同一行,手機維持獨立一行(設計稿 D1)
  const kpis=A.summary.map(k=>`
    <div class="as-kpi">
      <div class="k">${escH(k.label)}</div>
      <div class="v num">${escH(k.value)}${k.unit?`<span class="u">${escH(k.unit)}</span>`:""}</div>
      <div class="s num">${escH(k.sub)}${(!mob&&k.delta)?` · ${escH(k.delta)}`:""}</div>
      ${(mob&&k.delta)?`<div class="d ${escH(k.deltaDir||"")} num">${escH(k.delta)}</div>`:""}
    </div>`).join("");
  // 甜甜圈:SVG 弧線,邏輯搬自 asset-dashboard,不用外部圖表庫
  function arc(cx,cy,r,a0,a1){const p=a=>[cx+r*Math.cos(a),cy+r*Math.sin(a)];
    const[x0,y0]=p(a0),[x1,y1]=p(a1);return{x0,y0,x1,y1,big:a1-a0>Math.PI?1:0};}
  // size 只改畫面上的尺寸(viewBox 不動),手機的資產結構卡用 112px 的小甜甜圈
  function donutSVG(slices,size){
    const S=190,cx=S/2,cy=S/2,R=78,r=48,px=size||S;
    const total=slices.reduce((s,x)=>s+x.value,0);let a=-Math.PI/2;
    // 金額全是 0 時不畫扇形(除以 0 會讓路徑變 NaN,瀏覽器會報錯)
    const paths=(total>0?slices.filter(sl=>sl.value>0):[]).map(sl=>{const sweep=sl.value/total*Math.PI*2;
      const o=arc(cx,cy,R,a,a+sweep-0.012),i=arc(cx,cy,r,a+sweep-0.012,a);a+=sweep;
      return `<path class="sl" data-n="${escH(sl.name)}" data-v="${fmt(sl.value)}" data-p="${(sl.value/total*100).toFixed(1)}" d="M${o.x0} ${o.y0} A${R} ${R} 0 ${o.big} 1 ${o.x1} ${o.y1} L${i.x0} ${i.y0} A${r} ${r} 0 ${o.big} 0 ${i.x1} ${i.y1} Z" fill="${sl.color}"></path>`;
    }).join("");
    // 縮小版(手機)中間不放字,字級跟著縮會糊掉
    const mid=size?"":`<text class="as-cv" x="${cx}" y="${cy-1}">${fmt(total)}</text>
      <text class="as-cl" x="${cx}" y="${cy+14}">TWD</text>`;
    const lbl=slices.map(x=>`${x.name} ${total?Math.round(x.value/total*100):0}%`).join("、");
    return `<svg viewBox="0 0 ${S} ${S}" width="${px}" height="${px}" role="img" aria-label="${escH(lbl)}">${paths}${mid}</svg>`;
  }
  /* 甜甜圈卡:游標移到扇形,下面那行就顯示名稱與金額。帳戶那張是用 A.accounts 現場組的,
     組出來之後桌面版就不再另外畫「帳戶明細」表格(使用者 2026-08-19 定案)。 */
  function donutCard(d){
    const tot=d.slices.reduce((s,x)=>s+x.value,0)||1;
    const lg=d.slices.map(sl=>`<span data-n="${escH(sl.name)}"><i style="background:${sl.color}"></i>${escH(sl.name)} ${Math.round(sl.value/tot*100)}%</span>`).join("");
    return `<div class="as-card as-donut"><h3>${escH(d.title)}</h3>
      <div class="db">${donutSVG(d.slices)}</div>
      <div class="lg">${lg}</div>
      <div class="as-hv">游標移到色塊看金額</div></div>`;
  }
  const acctDonut={title:"帳戶分佈", slices:A.accounts.map(a=>({name:a.name,value:a.value,color:a.color}))};
  const donuts=[...A.donuts,acctDonut].map(donutCard).join("");
  function bindDonutHover(root){
    root.querySelectorAll(".as-donut").forEach(card=>{
      const hv=card.querySelector(".as-hv"); if(!hv) return;
      const def=hv.textContent;
      const paths=[...card.querySelectorAll("path.sl")];
      const lgs=[...card.querySelectorAll(".lg span")];
      paths.forEach(pa=>pa.addEventListener("mouseenter",()=>{
        hv.innerHTML=`${escH(pa.dataset.n)} · <b>${escH(pa.dataset.v)}</b> TWD · ${escH(pa.dataset.p)}%`;
        hv.classList.add("on");
        paths.forEach(q=>q.style.opacity=(q===pa?"1":".25"));
        lgs.forEach(sp=>sp.style.opacity=(sp.dataset.n===pa.dataset.n?"1":".3"));
      }));
      card.addEventListener("mouseleave",()=>{
        hv.textContent=def; hv.classList.remove("on");
        paths.forEach(q=>q.style.opacity="1");
        lgs.forEach(sp=>sp.style.opacity="1");
      });
    });
  }
  // 持倉表:Compass 有線圖資料的列可以點,點了直接開走勢彈窗(聯動)
  const tagCls={"台股":"tw","台股ETF":"twetf","黃金":"gold"};
  const rowHtml=r=>{
        const link=!!(typeof DATA!=="undefined"&&DATA&&DATA[r.sym]&&DATA[r.sym].hist);
        return `<div class="as-row${link?" link":""}"${link?` data-sym="${escH(r.sym)}"`:""}>
          <span class="tg ${tagCls[r.tag]||""}">${escH(r.tag)}</span><span class="nm">${escH(r.name)}</span>
          <span class="vv num">${fmt(r.value)}</span><span class="pp num">${escH(r.pct)}%</span>
          <span class="ar">${link?"\u203a":""}</span></div>`;
      };
  // 桌面:持倉卡可收合,標頭給筆數與合計,點了展開
  /* 持倉清單全部搬到槓桿風險那頁(2026-08-19 ETF、2026-08-20 個股),
     資產分析只留總覽、甜甜圈與歷年線圖,不再重複列持倉。 */
  const HOLD=[];
  const tblD=HOLD.map((h,i)=>{
    const open=!!ASSET_OPEN[i];
    const tot=h.rows.reduce((a,r)=>a+r.value,0);
    return `<div class="as-card as-hold${open?"":" folded"}">
      <div class="as-fold" data-asfold="${i}">
        <h3>${escH(h.title)}</h3>
        <span class="fs num">${h.rows.length} 筆 · ${fmt(tot)} TWD<i>${open?"\u25be":"\u25b8"}</i></span>
      </div>
      ${open?`<div class="as-rows">${h.rows.map(rowHtml).join("")}</div>`:""}
    </div>`;
  }).join("");
  const ICO={warn:"!",info:"i",ok:"\u2713"};
  // \u6b77\u5e74\u6d41\u52d5\u8cc7\u7522(\u842c\u53f0\u5e63):x \u8ef8\u6309\u300c\u771f\u5be6\u65e5\u671f\u300d\u7b49\u6bd4\u6392,9 \u500b\u6708\u5c31\u662f 9 \u500b\u6708\u7684\u5bec,
  // 18 \u5929\u5c31\u662f 18 \u5929\u7684\u5bec,\u4e0d\u7528\u985e\u5225\u8ef8,\u907f\u514d\u9b06\u6563\u7d00\u9304\u9020\u6210\u7684\u8996\u89ba\u8aa4\u5c0e\u3002
  /* 年模式:同一年的紀錄併成一個點,值取平均。x 軸改成等距,一年一格。 */
  function yearlyAvg(pts){
    const g={};
    pts.forEach(p=>{ const y=p.d.slice(0,4); (g[y]=g[y]||[]).push(p.v); });
    return Object.keys(g).sort().map(y=>({
      yr:y, n:g[y].length,
      v:Math.round(g[y].reduce((a,b)=>a+b,0)/g[y].length*10)/10,
      d:`${y}-07-01`,
      note:`${g[y].length} 筆平均`,
    }));
  }
  function timelineSVG(pts,monthly){
    if(!pts||pts.length<2) return "";
    const W=920,H=300,L=46,R=14,T=18,B=(!monthly&&pts.length&&pts[0].yr!=null)?48:34;
    const t=s=>new Date(s+"T00:00:00Z").getTime();
    const yearly=!monthly&&pts.length&&pts[0].yr!=null;   // 年平均模式:x 等距
    const t0=t(pts[0].d),t1=t(pts[pts.length-1].d);
    const vmax=Math.max(...pts.map(p=>p.v)), vlo=Math.min(...pts.map(p=>p.v));
    // 月模式:區間短、值域窄,y 軸不從 0 起,刻度 50;年模式維持從 0 起、刻度 200
    // 值是負的時候 y 軸往下延伸;全部是 0 或同一天時不能除以 0(路徑會變 NaN)
    const step=monthly?50:200;
    const vmin=vlo<0?Math.floor(vlo/step)*step-(monthly?step:0)
      :(monthly?Math.max(0,Math.floor(vlo/step)*step-step):0);
    const yn=Math.max(Math.ceil(vmax/step)*step, vmin+step);
    const XI={}; pts.forEach((p,i)=>{ XI[p.d]=pts.length<2?L:L+i*(W-L-R)/(pts.length-1); });
    const X=d=>yearly?XI[d]:(L+(t(d)-t0)/((t1-t0)||1)*(W-L-R));
    const Y=v=>T+(1-(v-vmin)/(yn-vmin))*(H-T-B);
    // \u5e74\u4efd\u683c\u7dda:\u6bcf\u5e74 1/1 \u4e00\u689d,\u5bec\u5ea6\u4e0d\u5747\u5c31\u662f\u91cd\u9ede
    let grid="";
    if(monthly){
      // 每月 1 日一條格線,標「n月」(跨年時標「y/n」)
      let d=new Date(t0); d=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1));
      for(;d.getTime()<=t1;d=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1))){
        const x=X(d.toISOString().slice(0,10));
        const lbl=d.getUTCMonth()===0?`${d.getUTCFullYear()}/1`:`${d.getUTCMonth()+1}月`;
        grid+=`<line class="tl-g" x1="${x}" y1="${T}" x2="${x}" y2="${H-B}"/>
               <text class="tl-t" x="${x}" y="${H-B+16}" text-anchor="middle">${lbl}</text>`;
      }
    }else if(yearly){
      // 一年一個點,年份標在點的正下方,再接一行跟前一年比的年增率
      pts.forEach((p,i)=>{ const x=X(p.d);
        const prev=i>0?pts[i-1].v:null;
        const g=(prev&&prev>0)?(p.v/prev-1)*100:null;
        grid+=`<line class="tl-g" x1="${x}" y1="${T}" x2="${x}" y2="${H-B}"/>
               <text class="tl-t" x="${x}" y="${H-B+16}" text-anchor="middle">${p.yr}</text>`
            + (g!=null?`<text class="tl-p ${g>=0?"up":"dn"}" x="${x}" y="${H-B+30}" text-anchor="middle">${g>=0?"+":""}${g.toFixed(0)}%</text>`:"");
      });
    }else{
      let yr0=new Date(t0).getUTCFullYear()+1,yr1=new Date(t1).getUTCFullYear();
      for(let y=yr0;y<=yr1;y++){const x=X(`${y}-01-01`);
        grid+=`<line class="tl-g" x1="${x}" y1="${T}" x2="${x}" y2="${H-B}"/>
               <text class="tl-t" x="${x}" y="${H-B+16}" text-anchor="middle">${y}</text>`;}
    }
    let hg="";
    for(let v=vmin+step;v<=yn;v+=step){hg+=`<line class="tl-g" x1="${L}" y1="${Y(v)}" x2="${W-R}" y2="${Y(v)}"/>
      <text class="tl-t" x="${L-6}" y="${Y(v)+4}" text-anchor="end">${v}</text>`;}
    const line=pts.map((p,i)=>`${i?"L":"M"}${X(p.d).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(" ");
    const area=`${line} L${X(pts[pts.length-1].d).toFixed(1)} ${Y(vmin)} L${X(pts[0].d).toFixed(1)} ${Y(vmin)} Z`;
    // \u6bcf\u500b\u9ede\u6a19\u4e00\u500b\u77ed\u6578\u5b57(\u6574\u6578,\u4e0d\u5beb\u300c\u842c\u300d)\u3002\u5bc6\u96c6\u8655\u81ea\u52d5\u627e\u7a7a\u4f4d:
    // \u4f9d\u5e8f\u8a66 \u4e0a/\u4e0b/\u66f4\u4e0a/\u66f4\u4e0b,\u653e\u5f97\u4e0b\u624d\u653e;\u771f\u7684\u6c92\u4f4d\u5b50\u5c31\u53ea\u7559\u9ede\u8207\u6ed1\u9f20\u63d0\u793a\u3002
    let dots="",labels="";const placed=[];
    pts.forEach(p=>{
      const x=X(p.d),y=Y(p.v),d=p.yr?`${p.yr} 平均`:p.d.slice(0,7).replace("-","/");
      dots+=`<circle class="tl-d" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4">
        <title>${d}:${p.v} \u842c\u53f0\u5e63${p.note?"\u3000"+escH(p.note):""}</title></circle>`;
    });
    // \u300c\u4eca\u5929\u300d\u5148\u5361\u4f4d(\u5b83\u6700\u91cd\u8981),\u5176\u4ed6\u9ede\u518d\u627e\u7a7a\u4f4d
    const order=[pts.length-1,...pts.keys()].filter((v,i,a)=>a.indexOf(v)===i);
    order.forEach(i=>{
      const p=pts[i],x=X(p.d),y=Y(p.v);
      const txt=String(Math.round(p.v)),w=txt.length*7+6,h=15;
      for(const dy of [-11,20,-24,33,-37,46]){
        const ly=y+dy,box={x0:x-w/2,x1:x+w/2,y0:ly-h,y1:ly+3};
        if(box.y0<T||box.y1>H-B) continue;
        if(placed.some(b=>box.x0<b.x1&&b.x0<box.x1&&box.y0<b.y1&&b.y0<box.y1)) continue;
        placed.push(box);
        labels+=`<text class="tl-n${i===pts.length-1?" tl-v":""}" x="${x.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle">${txt}</text>`;
        break;
      }
    });
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="\u6b77\u5e74\u6d41\u52d5\u8cc7\u7522\u8d70\u52e2,\u842c\u53f0\u5e63" style="width:100%;height:auto;display:block">
      ${hg}${grid}
      <path class="tl-a" d="${area}"/><path class="tl-l" d="${line}"/>${dots}${labels}
    </svg>`;
  }
  const tl=timelineSVG(yearlyAvg(A.timeline));
  // 桌面版:年/月兩個檢視。月=只取最後一筆往回六個月內的點(以前沒按月登記,舊月份不畫);
  // 並附今年的總結(筆數/平均/起訖)。
  let tlCardD="";
  if(tl){
    const T_=A.timeline, lastD=new Date(T_[T_.length-1].d+"T00:00:00Z");
    const cut=new Date(lastD); cut.setUTCMonth(cut.getUTCMonth()-6);
    const mPts=T_.filter(p=>new Date(p.d+"T00:00:00Z")>=cut);
    const yr=String(lastD.getUTCFullYear());
    const yrPts=T_.filter(p=>p.d.startsWith(yr));
    let sum="";
    if(yrPts.length){
      const avg=Math.round(yrPts.reduce((a,p)=>a+p.v,0)/yrPts.length);
      const v0=yrPts[0], v1=yrPts[yrPts.length-1], df=Math.round(v1.v-v0.v);
      sum=`<div class="tl-sum num">${yr} 年至今共 ${yrPts.length} 筆 · 平均 ${avg} 萬 ·
        ${Number(v0.d.slice(5,7))}/${Number(v0.d.slice(8,10))} 的 ${Math.round(v0.v)} 萬 → 最新 ${Math.round(v1.v)} 萬
        <b class="${df>=0?"up":"dn"}">(${df>=0?"+":""}${df} 萬)</b></div>`;
    }
    const seg=`<div class="tl-seg">
      <button data-tlmode="year" class="${TL_MODE==="year"?"on":""}">年</button>
      <button data-tlmode="month" class="${TL_MODE==="month"?"on":""}">月</button></div>`;
    const body=TL_MODE==="month"
      ?(mPts.length>=2?timelineSVG(mPts,true):`<div class="tl-empty">最近六個月的紀錄不足兩筆,畫不成線。</div>`)
      :tl;
    const note=TL_MODE==="month"?"只顯示最近六個月有登記的點。":"";
    tlCardD=`<div class="as-card">
      <div class="tl-head"><h3>歷年流動資產(萬台幣,不含房產)</h3>${seg}</div>
      ${note?`<div class="as-note2">${note}</div>`:""}
      ${TL_MODE==="month"?sum:""}
      ${body}</div>`;
  }
  /* 桌面 v2(2026-08-20,Claude Design b2b18b95 的 Market Compass Assets):
     淨資產 hero + 流動資產配置(三條橫條)+ 類別/帳戶並排 + 歷年線圖。
     資料一樣來自 ASSET_DATA,只是版面重排;顏色沿用資料本身帶的色票。 */
  if(!mob){
    const S=A.summary||[], D=A.donuts||[], L=A.leverage||{};
    const pick=t=>D.find(d=>d.title.indexOf(t)>=0);
    const net=S[0]||{}, liq=S[1]||{};
    const netVal=Number(String(net.value||"0").replace(/,/g,""));
    const liqVal=Number(String(liq.value||"0").replace(/,/g,""))||L.liquid||0;
    const prop=Math.max(netVal-liqVal,0);
    const pctOf=(v,b)=>b?(v/b*100):0;
    const legend=(name,v,base,color)=>
      `<span><i style="background:${color}"></i>${escH(name)} ${pctOf(v,base).toFixed(0)}% · ${fmt(v)} TWD</span>`;
    const barOf=segs=>`<div class="ax-bar">${segs.map(x=>
      `<i style="width:${x.w.toFixed(2)}%;background:${x.color}" title="${escH(x.tip)}"></i>`).join("")}</div>`;

    // 淨資產組成(流動 vs 房產)也做成圓餅,跟下面三張排在一起。
    // 原本那張只有一條長條的 hero 卡拿掉,大數字上面的總覽四格已經有了。
    const heroCard="";

    // ② 流動資產配置:海外 vs 台灣、現金 vs 股票、投資工具
    const nlTw=pick("ETF vs"), tool=pick("資產類型");
    const cash=L.cash!=null?L.cash:0, stock=Math.max(liqVal-cash,0);
    const rows=[];
    rows.push({t:"淨資產組成", segs:[
      {name:"流動資產", value:liqVal, color:"#2f6fed"},
      {name:"房產淨值", value:prop,   color:"#d9682f"}]});
    if(nlTw) rows.push({t:"ETF vs 個股", segs:nlTw.slices});
    rows.push({t:"現金 vs 股票", segs:[
      {name:"現金", value:cash, color:"#8f97a3"},
      {name:"股票", value:stock, color:"#2f6fed"}]});
    if(tool) rows.push({t:"資產類型", segs:tool.slices.slice().sort((a,b)=>b.value-a.value)});
    const miniDonut=r=>{
      const base=r.segs.reduce((a,x)=>a+x.value,0)||1;
      // 比例是這張卡的重點,做成大字放在圓餅上面,數字顏色對應扇形顏色。
      // 兩塊的寫成「54 : 46」;三塊以上寫成比例會變成 70:14:14:2,那不是人在讀的東西,
      // 改成只放最大那一塊的百分比,後面接它的名字。
      let ratio;
      if(r.segs.length<=2){
        ratio=r.segs.map(x=>
          `<span style="color:${readableOn(x.color,3)}">${Math.round(pctOf(x.value,base))}</span>`).join('<em>:</em>');
      }else{
        const top=r.segs.slice().sort((a,b)=>b.value-a.value)[0];
        ratio=`<span style="color:${readableOn(top.color,3)}">${Math.round(pctOf(top.value,base))}%</span>`
             +`<em class="who">${escH(top.name)}</em>`;
      }
      const lg=r.segs.map(x=>`<span data-n="${escH(x.name)}"><i style="background:${x.color}"></i>${escH(x.name)} ${Math.round(pctOf(x.value,base))}%</span>`).join("");
      return `<div class="as-donut"><div class="dt">${r.t}</div>
        <div class="rt">${ratio}</div>
        <div class="db">${donutSVG(r.segs,170)}</div>
        <div class="lg">${lg}</div>
        <div class="as-hv">游標移到色塊看金額</div></div>`;
    };
    const splitCard=`<div class="as-card">
      <div class="ax-hd"><h3>資產配置</h3>
        <span class="ax-sub">淨資產 ${fmt(netVal)} TWD · 流動資產 ${fmt(liqVal)} TWD(不含房產)</span></div>
      <div class="ax-dn">${rows.map(miniDonut).join("")}</div>
      <div class="ax-sub" style="margin-top:10px">${escH(A.accountsNote||"")}</div>
    </div>`;

    // ③ 類別與帳戶:兩張長條清單並排
    const barList=(title,sub,items,base)=>{
      const max=Math.max(...items.map(x=>x.value))||1;
      return `<div class="as-card">
        <div class="ax-hd"><h3>${title}</h3></div>
        <div class="ax-sub" style="margin-top:2px">${sub}</div>
        <div style="margin-top:12px">${items.map(x=>{
          const p=pctOf(x.value,base);
          return `<div class="ax-brow" title="${escH(x.name)} ${fmt(x.value)} TWD">
            <span class="n"><i style="background:${x.color}"></i><span>${escH(x.name)}</span></span>
            <span class="t"><i style="width:${Math.max(x.value/max*100,p>0?2:0).toFixed(1)}%;background:${x.color}"></i></span>
            <span class="p">${p<1&&p>0?p.toFixed(1):Math.round(p)}%</span></div>`;}).join("")}</div>
      </div>`;
    };
    const cls=pick("淨資產類別");
    const twoCards=`<div class="ax-two">
      ${cls?barList("淨資產類別",`佔淨資產 ${fmt(netVal)} TWD 的比例`,cls.slices,netVal):""}
      ${barList("帳戶分佈","依金額排序 · 佔淨資產比例",A.accounts||[],netVal)}
    </div>`;

    el.innerHTML=heroCard+splitCard+twoCards+tlCardD;
    bindDonutHover(el);
    el.querySelectorAll("[data-perf]").forEach(b=>b.addEventListener("click",()=>{
      PERF_ON = PERF_ON===b.dataset.perf ? null : b.dataset.perf; renderAsset();
    }));
    return;
  }
  /* ══ 手機版 v3(2026-08-17 設計稿):
     ①流動資產 hero + 迷你走勢 ②資產結構 ③帳戶明細 ④主要持倉 ⑤ETF ⑥風險提示。
     線圖、甜甜圈、持倉資料都沿用上面同一組函式,只是版面重排。 ══ */
  // 迷你走勢:只畫面積與線,尺度貼齊資料的最高最低點
  function sparkSVG(pts){
    if(!pts||pts.length<2) return "";
    const W=700,H=180,T=10,B=8;
    const t=x=>new Date(x+"T00:00:00Z").getTime();
    const t0=t(pts[0].d), t1=t(pts[pts.length-1].d);
    const lo=Math.min(...pts.map(p=>p.v)), hi=Math.max(...pts.map(p=>p.v));
    const span=(hi-lo)||1;
    const X=d=>((t(d)-t0)/((t1-t0)||1))*W;
    const Y=v=>T+(1-(v-lo)/span)*(H-T-B);
    const line=pts.map((p,i)=>`${i?"L":"M"}${X(p.d).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(" ");
    return `<svg class="dm-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <path d="${line} L${W} ${H} L0 ${H} Z" fill="#e7f6ef"></path>
      <path d="${line}" fill="none" stroke="#12a670" stroke-width="4"
        vector-effect="non-scaling-stroke" stroke-linejoin="round"></path></svg>`;
  }
  const S=[0,1,2,3].map(i=>A.summary[i]||{label:"",value:"-"}), TP=A.timeline||[];
  const spark=sparkSVG(TP);
  const heroCard=`
    <div class="dm-card">
      <div class="dm-hd"><span class="dm-t">${escH(S[1].label)}</span>
        ${S[1].delta?`<span class="dm-delta ${escH(S[1].deltaDir||"")}">${escH(S[1].delta)}</span>`:""}</div>
      <div class="dm-big"><span class="n">${escH(S[1].value)}</span>
        <span class="u">${escH(S[1].unit||"")}</span></div>
      <div class="dm-sub">${escH(S[1].sub||"")}</div>
      <div class="dm-net"><span class="l">${escH(S[0].label)} <b>${escH(S[0].value)} ${escH(S[0].unit||"")}</b></span>
        <span class="r">${escH(S[0].sub||"")}</span></div>
      ${spark?`${spark}
      <div class="dm-sparkl"><span>${TP[0].d.slice(0,4)}</span>
        <span>歷年流動資產 · 萬台幣</span><span>今天 ${TP[TP.length-1].v}</span></div>
      <button class="dm-btn" id="asTlToggle">${AS_TLOPEN?"收起歷年線圖 ▲":"展開歷年線圖(萬台幣)▾"}</button>
      ${AS_TLOPEN?`<div class="dm-open" style="padding-top:8px">${tl}</div>`:""}`:""}
    </div>`;
  // 資產結構:三種切法,展開才畫甜甜圈與圖例(重用 donuts 的資料)
  const structRows=[
    {k:"ETF vs 個股", v:S[2].value, sub:S[2].sub, di:1},
    {k:"現金 vs 股票", v:S[3].value, sub:S[3].sub, di:2},
    {k:"淨資產類別", v:(A.donuts[0]?A.donuts[0].slices.length:0)+" 類",
     sub:(A.donuts[0]?A.donuts[0].slices:[]).map(x=>x.name).join(" · "), di:0},
    {k:"帳戶分佈", v:A.accounts.length+" 個",
     sub:A.accounts.slice(0,3).map(x=>x.name).join(" · ")+" 等", di:3},
  ].map((r,i)=>{
    const DN=[0,1,2].map(k=>A.donuts[k]).concat([acctDonut]);
    const d=DN[r.di]||{slices:[]}, tot=d.slices.reduce((a,x)=>a+x.value,0)||1;
    const open=AS_STRUCT===i;
    const seg=d.slices.map(x=>
      `<i style="width:${(x.value/tot*100).toFixed(2)}%;background:${x.color}"></i>`).join("");
    const lgd=d.slices.map(x=>
      `<span><i style="background:${x.color}"></i>${escH(x.name)} <b>${fmt(x.value)}</b> · ${Math.round(x.value/tot*100)}%</span>`).join("");
    return `<div class="dm-strow">
      <div class="h"><span class="k">${r.k}</span><span class="v">${escH(r.v)}</span></div>
      <div class="dm-seg">${seg}</div>
      <div class="f"><span class="s">${escH(r.sub||"")}</span>
        <button data-asstruct="${i}">${open?"收起 ▲":"看明細 ▾"}</button></div>
      ${open?`<div class="dm-donut">${donutSVG(d.slices,112)}<div class="dm-lgd">${lgd}</div></div>`:""}
    </div>`;
  }).join("");
  // 持倉列:Compass 有線圖資料的才可點,點了開走勢彈窗
  const posRow=r=>{
    const link=!!(typeof DATA!=="undefined"&&DATA&&DATA[r.sym]&&DATA[r.sym].hist);
    return `<div class="dm-pos${link?" link":""}"${link?` data-sym="${escH(r.sym)}"`:""}>
      <span class="dm-tag ${tagCls[r.tag]||"st"}">${escH(r.tag)}</span>
      <span class="nm">${escH(r.name)}</span>
      <span class="pc">${escH(r.pctAll)}%</span>
      <span class="vl">${fmt(r.value)}</span></div>`;
  };
  const holdCard=(idx,open,btnId,n)=>{
    const h=A.holdings[idx]; if(!h) return "";
    const rows=(open?h.rows:h.rows.slice(0,n)).map(posRow).join("");
    const more=h.rows.length>n;
    return `<div class="dm-card c2">
      <div class="dm-hd bl"><span class="dm-t">${escH(h.title)}</span>
        <span class="dm-hint">點列開走勢圖 · 佔流動資產 %</span></div>
      ${rows}
      ${more?`<button class="dm-btn" id="${btnId}">${open?"收起 ▲":`展開全部 ${h.rows.length} 檔 ▾`}</button>`:""}
    </div>`;
  };
  const riskRows=A.risks.map((r,i)=>`
    <div class="dm-risk ${ICO[r.level]?r.level:""}">
      <div class="h" data-asrisk="${i}" aria-expanded="${AS_RISKOPEN===i}"><i>${ICO[r.level]||"i"}</i><span>${escH(r.title)}</span></div>
      ${AS_RISKOPEN===i?`<div class="b">${escH(r.body)}</div>`:""}
    </div>`).join("");
  el.innerHTML=`
    ${heroCard}
    <div class="dm-card c2"><div class="dm-t">資產結構</div>${structRows}
      <div class="dm-foot">${escH(A.accountsNote||"")}</div></div>
    ${HOLD.map((h,i)=>holdCard(A.holdings.indexOf(h),!!AS_HOLDS[i],"asHold"+i,6)).join("")}
    <div class="dm-card c3"><div class="dm-t">風險提示</div>${riskRows}</div>
    <div class="dm-disc">資料每天自動更新(股價與匯率),要改股數或現金請改 asset-portfolio.json / asset-balances.json。持倉列 Compass 也在追蹤的,點了直接開線圖。</div>`;
}
