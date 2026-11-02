/* ---------- 支出面板 ---------- */
(function(){

/* 面板外殼：獨立頁的 header 在 dashboard 是共用的，這裡自己長一列出來 */
function exShell(){
  const p=document.getElementById("expensePanel");
  if(p.querySelector("#app")) return;
  p.innerHTML='<div class="extop"><span class="exsub" id="exSub"></span>'
    +'<div class="mnav" id="mnav"></div></div><div id="app"></div>';
}

/* ── 每月支出 dashboard ──────────────────────────────────────────────
   資料在 expense-data.js(月結時月結時手動更新)。
   transactions = 真的花掉的錢(fixed:true 是每月固定帳單)。
   transfers = 錢只是換位置(投資、借出、帳戶之間搬錢、待確認匯款),不進總額。 */

let EXP_MONTH=null;
let WAS_MOBILE=null;
let PICK_OPEN=false;     /* 年月選單開著沒 */
let PICK_YEAR=null;      /* 選單目前顯示哪一年,跟實際選中的月份分開 */
let EX_FOCUS=null;       /* 圖例點下去只看某一組(組名),再點一次回到全部 */

const isMobile = () => window.matchMedia("(max-width:720px)").matches;
const exEur   = n => "NT$" + Math.round(n).toLocaleString("en-US");
const exCent  = n => "NT$" + Math.round(n).toLocaleString("en-US");
const exMonths= () => (window.EXPENSE_DATA ? EXPENSE_DATA.months.slice().sort((a,b)=>a.month<b.month?-1:1) : []);
const exLabel = m => m.slice(0,4)+"年"+parseInt(m.slice(5),10)+"月";
const exShort = m => parseInt(m.slice(5),10)+"月";
const exDay   = d => d.slice(5).replace("-","/");
/* 總支出把「代墊」那組的淨額也算進來。
   幫大家先付了整張帳單,朋友 Tikkie 還回來的是他們那幾份,剩下的淨額就是他自己那一份,
   那份是真的花掉的錢。全部排掉會少算,全部算進去會多算,取淨額才對。 */
const exTotal = m => m.transactions.reduce((s,t)=>s+t.amount,0);
const esc = s => String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pctS = (v,base) => base>0 ? Math.round(v/base*100)+"%" : "0%";

/* 各組(固定帳單、生活費、購物娛樂其他、代墊)的順序、顏色、
   need/want/neutral 全部從 expense-data.js 的 groups 讀,這裡一個都不寫死,月結時改資料就好。
   每筆交易靠 t.group 歸組,t.cat 留著當細類 */
const exGroups   = () => (window.EXPENSE_DATA && EXPENSE_DATA.groups) ? EXPENSE_DATA.groups : [];
/* 朋友還款是負數,同組先加總算淨額,所以各組合計 = 該月總支出 */
function groupSums(m){
  const map={};
  m.transactions.forEach(t=>{ map[t.group]=(map[t.group]||0)+t.amount; });
  return exGroups().map(g=>({key:g.key,color:g.color,kind:g.kind,v:map[g.key]||0}));
}

/* 趨勢柱狀圖的堆疊順序:由下往上就是 groups 的順序,固定帳單墊底、購物娛樂其他壓最上面。
   顏色固定不跟金額排序走,月份之間才比得出同一層的高低 */
function stackLayers(m){
  /* 只堆淨額為正的組。某一組會變負數是因為朋友把錢還回來、可是那張帳單記在別的月份,
     這種負數沒辦法畫成一塊,改成從最上面那幾層扣掉,柱頂才會永遠等於折線。 */
  const gs=groupSums(m);
  const ls=gs.map(g=>({name:g.key,color:g.color,v:g.v})).filter(x=>x.v>0.005);
  let left=-gs.filter(g=>g.v<0).reduce((a,g)=>a+g.v,0);
  for(let i=ls.length-1;i>=0&&left>0.005;i--){
    const cut=Math.min(ls[i].v,left); ls[i].v-=cut; left-=cut;
  }
  return ls.filter(x=>x.v>0.005);
}

/* ── 主畫面 ─────────────────────────────────────────────── */
function render(){
  const D=window.EXPENSE_DATA, app=document.getElementById("app"), nav=document.getElementById("mnav");
  /* 獨立頁是寫到 header 的 #subline,dashboard 的 header 是共用的,改寫面板自己那一列 */
  const exSub=document.getElementById("exSub");
  if(exSub) exSub.textContent = D ? (D.updated||"")+" 更新 · 銀行 + 信用卡" : "沒有資料";
  if(!D || !D.months || !D.months.length){ nav.innerHTML=""; app.innerHTML='<div class="card empty">沒有資料</div>'; return; }

  const ms=exMonths();
  if(!EXP_MONTH){
    /* 預設停在當月:他要看的是「這個月花到哪了」,不是上個月的結案報告 */
    const cur=(D.updated||"").slice(0,7);
    EXP_MONTH=(ms.find(x=>x.month===cur)||ms[ms.length-1]).month;
  }
  if(!ms.some(x=>x.month===EXP_MONTH)) EXP_MONTH=ms[ms.length-1].month;

  const i=ms.findIndex(x=>x.month===EXP_MONTH), m=ms[i], prev=ms[i-1];
  const total=exTotal(m), budget=D.fixedBudget;
  /* 總支出目標(2026-08-21 定的 4,000):hero 與趨勢虛線都對這條算。
     必要開銷 budget 留給必要開銷卡當參考,不再當主線,不然某類某類一出現每個月都紅 */
  const goal=D.totalBudget||budget;
  /* 必要(need)= 固定帳單 + 生活費,想要(want)= 購物娛樂其他。
     代墊(neutral)兩邊都不算:錢只是先墊出去再收回來,有正有負 */
  const gsums=groupSums(m);
  const needRows=gsums.filter(g=>g.kind==="need");
  const wantRows=gsums.filter(g=>g.kind==="want");
  const needSum=needRows.reduce((a,g)=>a+g.v,0);
  const wantSum=wantRows.reduce((a,g)=>a+g.v,0);
  const over=total-goal;
  const running = EXP_MONTH===(D.updated||"").slice(0,7);

  /* 月份導航:箭頭管相鄰月份,點中間的字打開年月選單。
     資料累積一兩年後只靠箭頭要按二十幾下才翻得到去年,所以兩種都留。 */
  const years=[...new Set(ms.map(x=>+x.month.slice(0,4)))].sort();
  const curY=+EXP_MONTH.slice(0,4), curM=+EXP_MONTH.slice(5);
  if(PICK_YEAR===null || !years.includes(PICK_YEAR)) PICK_YEAR=curY;
  const has=(y,mm)=>ms.some(x=>x.month===`${y}-${String(mm).padStart(2,"0")}`);
  nav.innerHTML=`
    <button id="exPrev"${i<=0?" disabled":""} aria-label="上個月">‹</button>
    <button class="ml" id="exPick" aria-haspopup="true" aria-expanded="${PICK_OPEN}">
      ${exLabel(EXP_MONTH)}<span class="caret">▾</span></button>
    <button id="exNext"${i>=ms.length-1?" disabled":""} aria-label="下個月">›</button>
    ${PICK_OPEN?`<div class="picker" id="exPicker">
      <div class="pyear">
        <button id="pyPrev"${years.indexOf(PICK_YEAR)<=0?" disabled":""} aria-label="上一年">‹</button>
        <span>${PICK_YEAR}年</span>
        <button id="pyNext"${years.indexOf(PICK_YEAR)>=years.length-1?" disabled":""} aria-label="下一年">›</button>
      </div>
      <div class="pgrid">${Array.from({length:12},(_,k)=>{
        const mm=k+1, ok=has(PICK_YEAR,mm), on=ok&&PICK_YEAR===curY&&mm===curM;
        return `<button class="pm${on?" on":""}"${ok?` data-pick="${PICK_YEAR}-${String(mm).padStart(2,"0")}"`:" disabled"}>${mm}月</button>`;
      }).join("")}</div>
    </div>`:""}`;

  /* ── hero ── */
  let delta="沒有上月資料";
  if(prev){
    const d=total-exTotal(prev);
    delta = Math.round(d)===0 ? "和上月一樣"
      : d>0 ? `比上月多 ${exEur(d)}` : `比上月少 ${exEur(-d)}`;
  }
  if(running) delta+=" · 月還沒結";

  const scale=Math.max(total,goal)||1;
  const inBase=Math.min(total,goal);
  // 退款多過花費(總額是負的)時條不能是負寬度
  const inPct=Math.max(inBase,0)/scale*100, tickPct=goal/scale*100;
  const chip = over>0
    ? `<span class="chip-over">超出目標 ${exEur(over)}</span>`
    : `<span class="chip-under">目標內,還有 ${exEur(-over)}</span>`;
  const hero=`
    <section class="card hero">
      <div class="left">
        <div class="k">${exShort(EXP_MONTH)}總支出</div>
        <div class="v">${exEur(total)}</div>
        <div class="chips">${chip}<span class="delta">${delta}</span></div>
      </div>
      <div class="right">
        <div class="bar-top"><span>0</span><span class="mid">目標 ${exEur(goal)}</span><span>${exEur(total)}</span></div>
        <div class="bar">
          <div class="seg-in" style="width:${inPct.toFixed(1)}%;border-radius:${over>0?"9px 0 0 9px":"9px"}"></div>
          ${over>0?`<div class="seg-over" style="left:${inPct.toFixed(1)}%"></div>`:""}
          <div class="tick" style="left:calc(${Math.min(tickPct,100).toFixed(1)}% - ${tickPct>=100?2:1}px)"></div>
        </div>
        <div class="bar-leg">
          <span class="i"><i style="background:var(--blue)"></i>目標內 ${exEur(inBase)}</span>
          ${over>0?`<span class="i"><i style="background:var(--red)"></i>超出 ${exEur(over)}</span>`:""}
        </div>
      </div>
    </section>`;

  /* ── 要確認:待確認的匯款要處理,其他 kind 展開後一句話帶過 ── */
  const trf=(m.transfers||[]).slice().sort((a,b)=>a.date<b.date?-1:1);
  const ask=trf.filter(t=>t.kind==="待確認");
  const askSum=ask.reduce((s,t)=>s+t.amount,0);
  const othMap={};
  trf.filter(t=>t.kind!=="待確認").forEach(t=>{ othMap[t.kind]=(othMap[t.kind]||0)+t.amount; });
  const kindOrder=["投資","借出","自己的錢搬家"];
  const othKeys=[...kindOrder.filter(k=>othMap[k]>0),
                 ...Object.keys(othMap).filter(k=>kindOrder.indexOf(k)<0)];
  const othTxt=othKeys.map(k=>`${k} ${exEur(othMap[k])}`).join("、");
  const askBlock = ask.length ? `
    <details class="ask">
      <summary>
        <span class="l"><span class="dot"></span><span class="t">要確認</span>
          <span class="n">${ask.length} 筆待分類 · 未計入下方分類</span></span>
        <span class="amt">${exEur(askSum)}</span>
      </summary>
      <div class="body">
        ${ask.map(t=>`<div class="row"><span class="d">${exDay(t.date)}</span>
          <span class="n2">${esc(t.desc)}</span><span class="a">${exEur(t.amount)}</span></div>`).join("")}
        ${othTxt?`<div class="oth">另有${othTxt},錢只是換位置,不算支出</div>`:""}
      </div>
    </details>` : "";

  /* ── 這個月花在哪:全部五組都列(固定帳單、生活費也是花掉的錢),代墊不進這張卡。
     他 2026-08-27 說清楚了:這張卡是「記錄實際花了多少」,目標與差距歸右邊那張卡管 ── */
  const wants=wantRows.filter(g=>g.v>0.005);
  const allRows=gsums.filter(g=>g.kind!=="neutral" && g.v>0.005);
  const maxWant=allRows.reduce((a,g)=>Math.max(a,g.v),0)||1;
  /* 明細列的細類用小字掛在 desc 後面,知道這筆是超市還是外食 */
  const itemRow=(d,desc,cat,src,amt)=>`
    <div class="item"><span class="d">${d}</span>
      <span class="t">${esc(desc)}${cat?` <span class="catlab">${esc(cat)}</span>`:""} <span class="srcchip">${esc(src||"")}</span></span>
      <span class="a">${exCent(amt)}</span></div>`;
  const groupItems = key => m.transactions
    .filter(t=>t.group===key)
    .slice().sort((a,b)=>a.date<b.date?-1:1)
    .map(t=>itemRow(exDay(t.date),t.desc,t.cat,t.src,t.amount)).join("");
  const needBody = g => {
    const tx=m.transactions.filter(t=>t.group===g.key);
    if(tx.some(t=>t.fixed)){
      const mortgage=tx.filter(t=>t.cat==="房貸").reduce((a,t)=>a+t.amount,0);
      const hMisc=tx.filter(t=>t.cat==="住房雜費").reduce((a,t)=>a+t.amount,0);
      const others=tx.filter(t=>t.cat!=="房貸" && t.cat!=="住房雜費");
      const othSum=others.reduce((a,t)=>a+t.amount,0);
      const merged=[], idx={};
      others.forEach(t=>{
        if(idx[t.desc]===undefined){ idx[t.desc]=merged.length; merged.push({desc:t.desc,date:t.date,cat:t.cat,amount:t.amount,src:t.src,n:1}); }
        else { const q=merged[idx[t.desc]]; q.amount+=t.amount; q.n++; }
      });
      const othItems=merged.sort((a,b)=>b.amount-a.amount)
        .map(q=>itemRow(q.n>1?`×${q.n}`:exDay(q.date),q.desc,q.cat,q.src,q.amount)).join("");
      /* 沒有房貸的月份(例如一月)不列 0 的空行 */
      return `<div class="fixsub">
        ${mortgage>0.005?`<div class="fixline"><span>房貸</span><span class="fixv">${exEur(mortgage)}</span></div>`:""}
        ${hMisc>0.005?`<div class="fixline"><span>住房雜費</span><span class="fixv">${exEur(hMisc)}</span></div>`:""}
        ${othSum>0.005?`<details class="fixrow sub">
          <summary><span class="nm">其他固定帳單</span><span class="fixv">${exEur(othSum)}</span></summary>
          <div class="items">${othItems}</div>
        </details>`:""}
      </div>`;
    }
    const cm={};
    tx.forEach(t=>{ cm[t.cat]=(cm[t.cat]||0)+t.amount; });
    /* 朋友分帳收支相抵會是 0,這種細類不列。每個細類再點開看逐筆(2026-08-27 他要的) */
    const lines=Object.keys(cm).filter(k=>Math.abs(cm[k])>0.005).sort((a,b)=>cm[b]-cm[a])
      .map(k=>{
        const items=tx.filter(t=>t.cat===k).slice().sort((a,b)=>a.date<b.date?-1:1)
          .map(t=>itemRow(exDay(t.date),t.desc,"",t.src,t.amount)).join("");
        return `<details class="fixrow sub">
          <summary><span class="nm">${esc(k)}</span><span class="fixv">${exEur(cm[k])}</span></summary>
          <div class="items">${items}</div>
        </details>`;
      }).join("");
    return `<div class="fixsub">${lines}</div>`;
  };
  /* 固定帳單與生活費展開用整理過的小計(needBody);
     某類展開先按國家分(他要看去了哪些國家),再點開看逐筆;其他組直接逐筆 */
  const bodyFor=g=>{
    if(g.kind==="need") return needBody(g);
    const tx=m.transactions.filter(t=>t.group===g.key);
    if(tx.some(t=>t.country)){
      const cm={}; tx.forEach(t=>{ const c=t.country||"其他"; cm[c]=(cm[c]||0)+t.amount; });
      const rows=Object.keys(cm).filter(c=>Math.abs(cm[c])>0.005).sort((a,b)=>cm[b]-cm[a])
        .map(c=>{
          const items=tx.filter(t=>(t.country||"其他")===c).slice().sort((a,b)=>a.date<b.date?-1:1)
            .map(t=>itemRow(exDay(t.date),t.desc,t.cat,t.src,t.amount)).join("");
          return `<details class="fixrow sub">
            <summary><span class="nm">${esc(c)}</span><span class="fixv">${exEur(cm[c])}</span></summary>
            <div class="items">${items}</div>
          </details>`;
        }).join("");
      return `<div class="fixsub">${rows}</div>`;
    }
    return `<div class="items">${groupItems(g.key)}</div>`;
  };
  const wantCardRows=allRows.map(g=>`
    <details class="catrow">
      <summary>
        <span class="nm"><i style="background:${g.color}"></i>${esc(g.key)}</span>
        <span class="track"><i style="background:${g.color};width:${(g.v/maxWant*100).toFixed(1)}%"></i></span>
        <span class="amt">${exEur(g.v)}</span>
        <span class="pct">${pctS(g.v,total)}</span>
      </summary>
      ${bodyFor(g)}
    </details>`).join("");

  /* wants 本來就只有 want 三組,直接挑金額最大的兩組當主因 */
  const top2=wants.slice().sort((a,b)=>b.v-a.v).slice(0,2)
    .map(g=>`<strong>${esc(g.key)}</strong>`);
  const insight = over>0
    ? `超出目標的 <strong class="r">${exEur(over)}</strong>${top2.length?` 主要來自 ${top2.join(" 與 ")}`:""}。`
    : `<span style="color:#676e79">這個月在總支出目標內。</span>`;

  const varCard=`
    <section class="card">
      <div class="chead"><h2>這個月花在哪</h2><span class="tot">${exEur(total)}</span></div>
      <div class="csub">點一列展開</div>
      <div class="rows">${wantCardRows}</div>
      <div class="insight">${insight}</div>
    </section>`;

  /* ── 必要開銷:固定帳單(該月實際)+ 生活費(對 livingBudget 預算)兩大列,點開才看得到細項 ── */
  /* 固定帳單那組拆 Mortgage、住房雜費、其他帳單(同名合併),
     生活費那組拆底下的細類小計。哪一組走哪一種看有沒有 fixed,不寫死組名 */
  /* ── 目標卡(2026-08-27 重做):他要的是「目標 + 我跟目標的差距」,
     實際花在哪已經整包搬去左卡。三條線:總支出 4,000 / 必要 3,300 / 生活費 1,000 ── */
  const bd=D.budgetBreakdown||{};
  const lbud=(D.livingBudget>0)?D.livingBudget:0;
  const bv=needRows[0]?needRows[0].v:0;
  const lv=needRows[1]?needRows[1].v:0;
  const goalRow=(name,act,tgt)=>{
    if(!(tgt>0)) return "";
    const d=act-tgt, ok=d<=0;
    return `<div class="goalrow"><span class="gn">${name}</span>
      <span class="ga">${exEur(act)}<span class="gt"> / ${exEur(tgt)}</span></span>
      <span class="gd" style="color:${ok?"var(--up)":"var(--dn)"}">${ok?"−":"+"}${exEur(Math.abs(d))}</span></div>`;
  };
  const goalRows =
      goalRow("總支出",total,goal)
    + goalRow("固定帳單",bv,bd.bills||0)
    + goalRow("生活費",lv,lbud);
  const footTxt="固定帳單與生活費每月會浮動,抓大方向就好";
  /* ── 月收入:壓成三行(標題+大數字 / 組成 / ruling 提醒),不要長成一張表。
     Airbnb 只有那個月真的有(m.airbnb > 0)才出現,平常不佔一行。
     數字在 expense-data.js 的 income,薪資單改了就改那裡。 ── */
  const inc=D.income||null;
  let incCard="";
  if(inc){
    const sal=+inc.netSalary||0, park=+inc.parking||0;
    const abnb=+(m&&m.airbnb)||0;
    const tot=sal+park+abnb;
    const noRul=+inc.netSalaryNoRuling||0;
    const parts=[`稅後月薪 ${exEur(sal)}`,`兼職 ${exEur(park)}`]
      .concat(abnb>0?[`其他 ${exEur(abnb)}`]:[]).join(" + ");
    incCard=`
    <section class="card inccard">
      <div class="chead"><h2>月收入</h2><span class="tot">${exEur(tot)}</span></div>
      <div class="csub">${parts}</div>
      ${noRul?`<div class="incnote">年終另計 <b>${exEur(noRul)}</b></div>`:""}
    </section>`;
  }
  const fixCard=`
    <section class="card">
      <div class="chead"><h2>目標</h2></div>
      <div class="csub">實際 / 目標,右邊是差距</div>
      <div class="rows">${goalRows}</div>
      <div class="foot">${footTxt}</div>
    </section>`;

  /* ── 趨勢 ── */
  /* 圖例是篩選開關:列今年有金額的組(不只這個月),點一顆圖上就只剩那一組,再點一次回到全部。
     代墊有正有負不進圖,圖例跟著不列 */
  const yr=EXP_MONTH.slice(0,4), yms=ms.filter(x=>x.month.slice(0,4)===yr);
  const ysum={}; yms.forEach(x=>groupSums(x).forEach(g=>{ ysum[g.key]=(ysum[g.key]||0)+g.v; }));
  const lgs=exGroups().filter(g=>g.kind!=="neutral" && (ysum[g.key]||0)>0.005);
  if(EX_FOCUS && !lgs.some(g=>g.key===EX_FOCUS)) EX_FOCUS=null;
  /* 第一顆是「全部」,沒篩選時它是亮的,篩選中點它回到全部 */
  const legend=`<button type="button" class="i all${EX_FOCUS?"":" on"}" data-gk="*">全部</button>`
   +lgs.map(g=>{
    const on=EX_FOCUS===g.key;
    return `<button type="button" class="i${on?" on":""}" data-gk="${esc(g.key)}"${
      on?` style="background:${g.color}1f;border-color:${g.color};color:${g.color}"`:""
    }><i style="background:${g.color}"></i>${esc(g.key)}</button>`;
  }).join("");
  /* 示範版不放年度數字 */
  const ys={chips:"",modals:""};   // 示範版不放年度統計
  const trend=`
    <section class="card tcard">
      <div class="thead"><h2>每月支出</h2>${ys.chips}</div>
      <div class="tnote">${EX_FOCUS
        ? `${esc(EX_FOCUS)} ${yr} 年 ${exEur(ysum[EX_FOCUS]||0)}`
        : `總支出目標 ${exEur(goal)} · 必要 ${exEur(budget)}`}</div>
      <div class="exlegend">${legend}</div>
      <svg id="exTrend" role="img" aria-label="每月總支出組成堆疊柱狀圖"></svg>
      <div class="extip" id="exTip" hidden></div>
    </section>`;

  app.innerHTML = hero + askBlock + trend
    + `<div class="cols">${varCard}<div class="rcol">${incCard}${fixCard}</div></div>` + ys.modals;

  /* 圖例 = 篩選開關 */
  app.querySelectorAll("[data-gk]").forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    const k=b.dataset.gk;
    EX_FOCUS = (k==="*" || EX_FOCUS===k) ? null : k;
    render();
  });

  /* 兩個數字 ↔ 兩個 popup:點數字開,點遮罩或 ✕ 關 */
  app.querySelectorAll("[data-ys]").forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    const mk=document.getElementById("exm-"+b.dataset.ys); if(mk) mk.hidden=false;
  });
  app.querySelectorAll(".exmask").forEach(mk=>{
    mk.onclick=e=>{ if(e.target===mk || e.target.dataset.close) mk.hidden=true;
                    else e.stopPropagation(); };
  });

  const pb=document.getElementById("exPrev"), nb=document.getElementById("exNext");
  if(pb && i>0) pb.onclick=()=>{ EXP_MONTH=ms[i-1].month; PICK_OPEN=false; render(); };
  if(nb && i<ms.length-1) nb.onclick=()=>{ EXP_MONTH=ms[i+1].month; PICK_OPEN=false; render(); };

  /* 年月選單 */
  const pick=document.getElementById("exPick");
  if(pick) pick.onclick=e=>{ e.stopPropagation(); PICK_OPEN=!PICK_OPEN; PICK_YEAR=+EXP_MONTH.slice(0,4); render(); };
  const py=document.getElementById("pyPrev"), ny=document.getElementById("pyNext");
  if(py && !py.disabled) py.onclick=e=>{ e.stopPropagation(); PICK_YEAR--; render(); };
  if(ny && !ny.disabled) ny.onclick=e=>{ e.stopPropagation(); PICK_YEAR++; render(); };
  nav.querySelectorAll("[data-pick]").forEach(b=>b.onclick=e=>{
    /* 這行的 render() 之前被漏掉,結果點月份只改了變數、畫面完全不動 */
    e.stopPropagation(); EXP_MONTH=b.dataset.pick; PICK_OPEN=false; render(); });
  const pk=document.getElementById("exPicker");
  if(pk) pk.onclick=e=>e.stopPropagation();
  drawTrend(ms);
  WAS_MOBILE=isMobile();
}

/* ── 趨勢圖:每月一根堆疊柱 + 總額折線 ─────────────────────
   柱子拆出這個月的錢花在哪一層,折線把月與月的總額串起來。
   畫的順序是格線 → 柱子 → 基準虛線 → 折線與點,紅虛線才不會被柱子蓋掉。
   手機用窄 viewBox,不然 800 寬被壓到 360px,字會縮成 5px 看不見 */
function drawTrend(ms){
  const svg=document.getElementById("exTrend"); if(!svg) return;
  const D=window.EXPENSE_DATA, mob=isMobile();
  const W=mob?372:800, H=mob?212:230,
        padL=mob?38:60, padR=mob?12:20, padT=mob?26:30, padB=mob?34:35;
  const iw=W-padL-padR, ih=H-padT-padB;
  svg.setAttribute("viewBox",`0 0 ${W} ${H}`);

  /* 篩選中:柱子與折線都只看這一組,虛線目標是對總額的,這時不畫 */
  const fk=EX_FOCUS;
  const fCol=fk?((exGroups().find(g=>g.key===fk)||{}).color||"#2f6fed"):null;
  const gv=(mm,k)=>(groupSums(mm).find(g=>g.key===k)||{}).v||0;

  const vals=fk?ms.map(mm=>gv(mm,fk)):ms.map(exTotal);
  /* 柱子排掉代墊後,堆疊合計可能高過該月總額,取兩者的大值當上界才不會畫出格子外 */
  const stacks=fk
    ? ms.map(mm=>{ const v=gv(mm,fk); return v>0.005?[{name:fk,color:fCol,v:v}]:[]; })
    : ms.map(stackLayers);
  const tops=stacks.map(ls=>ls.reduce((a,l)=>a+l.v,0));
  const goal=D.totalBudget||D.fixedBudget;
  // 沒設目標、月份又全是 0 時 maxV 會是 0,y() 除以 0 整張圖變 NaN,所以至少 1
  const maxV=(fk?Math.max(...vals,...tops,1):Math.max(...vals,...tops,goal,1))*1.15;
  const n=ms.length;
  /* 格數 = 月份數 + 1:右邊永遠留一格呼吸,月份少時柱子也攤得開 */
  const slot=iw/Math.max(n+1,3);
  const px=k=>padL+slot*k+slot/2;
  const y=v=>padT+ih-(v/maxV)*ih;
  const bw=Math.min(mob?26:46, slot*0.55);
  const yBase=padT+ih;

  let s="";
  [0,.5,1].forEach(f=>{
    const yy=y(maxV*f);
    s+=`<line x1="${padL}" y1="${yy.toFixed(1)}" x2="${W-padR}" y2="${yy.toFixed(1)}" stroke="${f===0?"#d9dce3":"#eceff3"}" stroke-width="1"/>`;
    s+=`<text class="ax" x="${padL-8}" y="${(yy+4).toFixed(1)}" text-anchor="end">${f===0?"0":"NT$"+(Math.round(maxV*f/100)/10)+"k"}</text>`;
  });

  /* 只有最上面那層收圓角,中間層跟著圓會把堆疊的層次咬破 */
  const topSeg=(x,yy,w,h)=>{
    const r=Math.min(3,w/2,h);
    return `M${x.toFixed(1)} ${(yy+r).toFixed(1)}A${r} ${r} 0 0 1 ${(x+r).toFixed(1)} ${yy.toFixed(1)}`
      +`H${(x+w-r).toFixed(1)}A${r} ${r} 0 0 1 ${(x+w).toFixed(1)} ${(yy+r).toFixed(1)}`
      +`V${(yy+h).toFixed(1)}H${x.toFixed(1)}Z`;
  };

  /* 柱子連同透明的點擊區包在同一個 g,整根柱子都點得到 */
  ms.forEach((mm,k)=>{
    const x0=px(k)-bw/2, ls=stacks[k];
    let acc=0, bars="";
    ls.forEach((l,j)=>{
      const y0=y(acc+l.v), y1=y(acc); acc+=l.v;
      const h=Math.max(y1-y0,0.8), top=(j===ls.length-1);
      /* 1px 白邊當層與層之間的縫 */
      bars += top
        ? `<path d="${topSeg(x0,y0,bw,h)}" fill="${l.color}" stroke="#fff" stroke-width="1"/>`
        : `<rect x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="${l.color}" stroke="#fff" stroke-width="1"/>`;
    });
    s+=`<g data-exi="${k}">${bars}`
      +`<rect class="hit" x="${(padL+slot*k).toFixed(1)}" y="${padT}" width="${slot.toFixed(1)}" height="${(ih+padB-14).toFixed(1)}"/></g>`;
  });

  if(!fk){
    const yb=y(goal);
    s+=`<line x1="${padL}" y1="${yb.toFixed(1)}" x2="${W-padR}" y2="${yb.toFixed(1)}" stroke="#d98a8a" stroke-width="1.5" stroke-dasharray="5 4"/>`;
  }

  /* 折線與點疊在柱子上面,但不吃滑鼠事件,點下去要落到下面的 hit 區 */
  const pts=vals.map((v,k)=>[px(k),y(v)]);
  let over="";
  if(pts.length>1){
    const line=pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
    over+=`<polyline points="${line}" fill="none" stroke="${fk?fCol:"#2f6fed"}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  }

  const curM=(D.updated||"").slice(0,7);
  ms.forEach((mm,k)=>{
    const v=vals[k], cx=pts[k][0], cy=pts[k][1];
    const on=mm.month===EXP_MONTH, overB=!fk && v>goal, run=mm.month===curM;
    const col=fk?fCol:(overB?"#c3312f":"#2f6fed");
    over+=`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${run?5:4}" fill="${run?"#ffffff":col}" stroke="${run?col:"#fff"}" stroke-width="${run?2.5:1.5}"/>`;
    /* 每個月都標金額,選中的那個月大一號深色,其他月小一號灰色 */
    {
      /* 手機的柱子擠,沒選中的月份字再小一號 */
      const sm=mob&&!on;
      const lab=exEur(v), lw=lab.length*(on?7.2:(sm?5:6.2));
      let tx=cx, anc="middle";
      if(cx-lw/2<padL){ tx=padL; anc="start"; }
      else if(cx+lw/2>W-padR){ tx=W-padR; anc="end"; }
      /* 折線的點有時候低於柱頂(那個月堆疊比總額高),字要壓在柱頂上面才不會蓋到顏色 */
      const yLab=Math.min(cy, y(tops[k]));
      over+=`<text class="vl${on?" now":""}${sm?" sm":""}" x="${tx.toFixed(1)}" y="${(yLab-(on?16:11)).toFixed(1)}" text-anchor="${anc}" fill="${
        on?(fk?fCol:"#1d4fc4"):"#676e79"}">${lab}</text>`;
    }
    over+=`<text class="ax" x="${cx.toFixed(1)}" y="${H-14}" text-anchor="middle" fill="${on?"#5f6673":"#676e79"}"${on?' font-weight="600"':""}>${exShort(mm.month)}</text>`;
  });
  s+=`<g pointer-events="none">${over}</g>`;

  svg.innerHTML=s;
  /* 滑到哪根柱子就浮出那個月的組成;手機沒有 hover,點柱子切月份就好 */
  const tip=document.getElementById("exTip"), card=tip&&tip.parentElement;
  const showTip=(k,e)=>{
    if(!tip||mob) return;
    const mm=ms[k], ls=stacks[k], tot=fk?(exTotal(mm)||1):(tops[k]||1);
    tip.innerHTML=`<div class="th"><span>${exLabel(mm.month)}</span><span>${exEur(vals[k])}</span></div>`
      +ls.slice().reverse().map(l=>`<div class="tr"><i style="background:${l.color}"></i><span>${esc(l.name)}</span>
         <span class="a">${exEur(l.v)}</span><span class="p">${pctS(l.v,tot)}</span></div>`).join("");
    tip.hidden=false;
    const cr=card.getBoundingClientRect();
    let x=e.clientX-cr.left+14, yv=e.clientY-cr.top-10;
    if(x+tip.offsetWidth>cr.width-8) x=e.clientX-cr.left-tip.offsetWidth-14;
    if(yv+tip.offsetHeight>cr.height-8) yv=cr.height-tip.offsetHeight-8;
    tip.style.left=x+"px"; tip.style.top=Math.max(8,yv)+"px";
  };
  svg.querySelectorAll("g[data-exi]").forEach(g=>{
    const k=+g.dataset.exi;
    g.onclick=()=>{ EXP_MONTH=ms[k].month; render(); };
    g.onmouseenter=e=>showTip(k,e);
    g.onmousemove=e=>showTip(k,e);
    g.onmouseleave=()=>{ if(tip) tip.hidden=true; };
  });
}

/* 桌機↔手機切換要整頁重畫,同一邊只重畫線圖,免得展開中的明細被關掉 */

/* 對外只露這一個，其餘識別字(render / isMobile / D …)全部關在這層裡面 */
/* 給「資產支出」合併頁的頂部總覽用:本月總支出、必要開銷、超出多少 */
window.exSummary=function(){
  const ms=exMonths(); if(!ms.length) return null;
  const m=ms.find(x=>x.month===EXP_MONTH)||ms[ms.length-1];
  const total=exTotal(m), base=(window.EXPENSE_DATA&&(EXPENSE_DATA.totalBudget||EXPENSE_DATA.fixedBudget))||0;
  return {month:m.month, label:exLabel(m.month), short:exShort(m.month),
          total, base, over:total-base};
};
window.renderExpense=function(){
  if(!window.EXPENSE_DATA) return;
  exShell();
  const sub=document.getElementById("exSub");
  if(sub) sub.textContent=EXPENSE_DATA.updated+" 更新 · 銀行 + 信用卡";
  render();
};
document.addEventListener("click",function(){
  if(PICK_OPEN && !document.getElementById("expensePanel").hidden){ PICK_OPEN=false; render(); }
});
document.addEventListener("keydown",function(e){
  if(e.key!=="Escape") return;
  const open=[...document.querySelectorAll("#expensePanel .exmask")].filter(m=>!m.hidden);
  if(open.length){ open.forEach(m=>m.hidden=true); return; }
  if(PICK_OPEN){ PICK_OPEN=false; render(); }
});
window.addEventListener("resize",function(){
  const p=document.getElementById("expensePanel");
  if(!p || p.hidden || !p.querySelector("#app")) return;
  if(isMobile()!==WAS_MOBILE) render(); else drawTrend(exMonths());
});
})();
