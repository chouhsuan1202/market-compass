/* 外部資料(json、data 檔、localStorage)一律先跳脫再進 innerHTML。
   名稱、備註、錯誤訊息都可能帶 < > " 這類字元,不跳脫就會被當成 HTML 執行。 */
function escH(s){ return s==null?"":String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
/* 顏色只收 #hex、CSS 變數或顏色名,其他退回灰色,資料檔塞怪字串進 style 也不會出事 */
function safeColor(c,fb){
  const s=String(c==null?"":c).trim();
  return (/^#[0-9a-f]{3,8}$/i.test(s)||/^var\(--[a-z0-9-]+\)$/i.test(s)||/^[a-z]{3,20}$/i.test(s))?s:(fb||"#9aa1ab");
}
function toNum(v){
  if(v===null||v===undefined||v===""||typeof v==="boolean") return null;
  const n=+v; return isFinite(n)?n:null;
}
/* 文字疊在資料色上(色條標籤、甜甜圈比例大字)時,顏色不夠深就自動壓暗到過 WCAG AA。
   色塊本身的顏色不變,只調字。 */
function hexLum(h){
  const m=/^#([0-9a-f]{6})$/i.exec(h||""); if(!m) return null;
  return [0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16)/255)
    .map(v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4))
    .reduce((a,v,i)=>a+v*[0.2126,0.7152,0.0722][i],0);
}
function contrastRatio(a,b){ const x=hexLum(a), y=hexLum(b); if(x==null||y==null) return 21;
  return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); }
function inkOn(bg){ return contrastRatio("#ffffff",bg)>=4.5?"#fff":"#101418"; }
function readableOn(fg,min,bg){
  let c=fg; if(hexLum(c)==null) return fg;
  for(let k=0;k<20&&contrastRatio(c,bg||"#ffffff")<min;k++){
    c="#"+[1,3,5].map(i=>Math.round(parseInt(c.slice(i,i+2),16)*0.9).toString(16).padStart(2,"0")).join("");
  }
  return c;
}
const objArr=v=>Array.isArray(v)?v.filter(x=>x&&typeof x==="object"&&!Array.isArray(x)):[];
const isISODay=d=>typeof d==="string"&&/^\d{4}-\d{2}-\d{2}/.test(d);
/* ── 資料進來先整理一遍 ─────────────────────────────────────────
   報價腳本換了格式、欄位少了、數字變成字串、API 回錯誤,畫面都不能整頁壞掉。
   這裡只做「型別修正」:數字轉數字、陣列保證是陣列、壞掉的那筆標成 error。
   判斷規則(站上/跌破、加碼/減碼)完全沒動,score/valid 用同一套規則重數一次。 */
function normData(raw){
  if(!raw||typeof raw!=="object"||Array.isArray(raw)) throw new Error("data.json 格式不對");
  const out={};
  Object.keys(raw).forEach(k=>{
    const r=raw[k];
    if(k[0]==="_"){ out[k]=r; return; }
    if(!r||typeof r!=="object"||Array.isArray(r)){ out[k]={error:"資料格式不對"}; return; }
    if(r.error){ out[k]={error:String(r.error)}; return; }
    const price=toNum(r.price);
    const mas=objArr(r.mas).map(m=>{
      let v=toNum(m.v), diff=toNum(m.diff);
      if(v!=null&&diff==null&&price!=null&&v!==0) diff=(price/v-1)*100;
      if(diff==null) v=null;   // 算不出乖離就當這條線還沒成形
      const above=(typeof m.above==="boolean")?m.above:(v!=null&&price!=null&&price>=v);
      return {...m, k:toNum(m.k), v, diff, above,
        label:m.label==null?"":String(m.label),
        cross:(m.cross==="bull"||m.cross==="bear")?m.cross:null};
    });
    let hist=null;
    if(r.hist&&Array.isArray(r.hist.d)&&Array.isArray(r.hist.c)){
      const d=[], c=[], n=Math.min(r.hist.d.length,r.hist.c.length);
      for(let i=0;i<n;i++){
        const dd=r.hist.d[i], cc=toNum(r.hist.c[i]);
        if(isISODay(dd)&&cc!=null&&cc>0){ d.push(dd.slice(0,10)); c.push(cc); }
      }
      if(c.length) hist={...r.hist, d, c};
    }
    const live=mas.filter(m=>m.v!=null);
    out[k]={...r, price, mas, hist, pe:toNum(r.pe),
      score:live.filter(m=>m.above).length, valid:live.length};
  });
  return out;
}
function normWL(raw){
  if(!raw||typeof raw!=="object"||Array.isArray(raw)) throw new Error("watchlist.json 格式不對");
  const list=a=>objArr(a).filter(h=>typeof h.s==="string"&&h.s).map(h=>{
    const o={...h};
    ["dn","note","group"].forEach(f=>{ if(o[f]!=null) o[f]=String(o[f]); });
    if(o.lev!=null) o.lev=toNum(o.lev)||1;
    if(o.cost!=null) o.cost=toNum(o.cost);
    if(o.buys!=null) o.buys=objArr(o.buys).filter(b=>isISODay(b.d))
      .map(b=>({...b, q:toNum(b.q)||0, p:toNum(b.p)}))
      .sort((x,y)=>x.d<y.d?-1:x.d>y.d?1:0);   // 首買日、「剛買」都取 buys[0],資料沒照日期排就會算錯
    return o;
  });
  return {...raw, indexes:(Array.isArray(raw.indexes)?raw.indexes:[]).filter(x=>typeof x==="string"),
    market_holdings:list(raw.market_holdings), holdings:list(raw.holdings)};
}
function normAsset(A){
  if(!A||typeof A!=="object"||Array.isArray(A)) return undefined;
  const slice=x=>({...x, name:x.name==null?"":String(x.name), value:Math.max(toNum(x.value)||0,0), color:safeColor(x.color)});
  A.meta=(A.meta&&typeof A.meta==="object")?A.meta:{};
  A.summary=objArr(A.summary);
  A.donuts=objArr(A.donuts).map(d=>({...d, title:d.title==null?"":String(d.title), slices:objArr(d.slices).map(slice)}));
  A.accounts=objArr(A.accounts).map(slice);
  A.timeline=objArr(A.timeline).filter(p=>isISODay(p.d)&&toNum(p.v)!=null)
    .map(p=>({...p, d:p.d.slice(0,10), v:toNum(p.v)})).sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);
  A.holdings=objArr(A.holdings).map(h=>({...h, title:h.title==null?"":String(h.title),
    rows:objArr(h.rows).map(r=>({...r, value:toNum(r.value)||0}))}));
  A.risks=objArr(A.risks);
  const P=(A.perf&&typeof A.perf==="object"&&!Array.isArray(A.perf))?A.perf:{};
  Object.keys(P).forEach(k=>{ P[k]=objArr(P[k]).filter(p=>isISODay(p.d)&&toNum(p.v)!=null).map(p=>({...p, v:toNum(p.v)})); });
  A.perf=P;
  if(!A.leverage||typeof A.leverage!=="object") A.leverage={};
  return A;
}
function normExpense(E){
  if(!E||typeof E!=="object"||Array.isArray(E)) return undefined;
  const tx=a=>objArr(a).filter(t=>toNum(t.amount)!=null).map(t=>({...t, amount:toNum(t.amount),
    date:typeof t.date==="string"?t.date:"", desc:t.desc==null?"":String(t.desc)}));
  E.groups=objArr(E.groups).filter(g=>g.key!=null).map(g=>({...g, key:String(g.key), color:safeColor(g.color)}));
  E.months=objArr(E.months).filter(m=>typeof m.month==="string"&&/^\d{4}-\d{2}$/.test(m.month))
    .map(m=>({...m, transactions:tx(m.transactions), transfers:tx(m.transfers)}));
  E.updated=typeof E.updated==="string"?E.updated:"";
  ["fixedBudget","totalBudget","livingBudget"].forEach(f=>{ E[f]=toNum(E[f])||0; });
  if(E.income!=null&&typeof E.income!=="object") E.income=null;
  return E;
}
function normSnaps(L){
  if(!Array.isArray(L)) return L;
  return objArr(L).map(s=>({...s, holdings:objArr(s.holdings)}));
}
function maByK(r,k){ return (r&&r.mas)?r.mas.find(m=>m.k===k):null; }
/* ---------- 中文解讀（移植舊版邏輯，原封不動） ---------- */
function interpret(r){
  const m=r.mas; if(!m||r.valid===0) return "";
  const a=k=>{ const x=m.find(o=>o.k===k); return x&&x.v!=null?x.above:null; };
  const a5=a(5),a20=a(20),a60=a(60),a120=a(120),a240=a(240);
  const all=[a5,a20,a60,a120,a240].filter(x=>x!==null);
  if(all.length&&all.every(x=>x===true)) return "站上所有均線,多頭排列、趨勢最強。";
  if(all.length&&all.every(x=>x===false)) return "跌破所有均線,空頭排列、趨勢最弱。";
  if(a240===true){
    if(a60===true) return "中長期多頭(站上季線),短線拉回整理中。";
    if(a120===true) return "跌破季線但守住半年線,回檔中。";
    return "在年線之上、但已跌破半年線,回檔較深。";
  }
  if(a240===false){
    if(a60===true) return "長期仍在年線下,但已站回季線,屬反彈。";
    if(a20===true||a5===true) return "年線、季線之下,僅短線反彈。";
    return "中長期偏空,留意下檔風險。";
  }
  return "上市時間較短、年線未成形,僅供短中期參考。";
}
/* 檔位表:NDX 距高點回落越深,目標水位越高。基準水位自己調這裡 */
const LADDER_BASE = 1.35;                      // 平常站的基準倍率。示範版基準
const LADDER = [ {dd:30, lev:2.0}, {dd:22.5, lev:1.75}, {dd:15, lev:1.5} ];  // 回落 % 由深到淺
const LADDER_EPS = 0.05;                       // 實際與目標差距在這個範圍內就算「到位」
/* 券商 TWD margin 年利率(基準 2.203% + 1.5%,LYNX 對照表 2026-08-12)。利率變了改這裡 */
const RK_MARGIN_RATE = 0.037;
/* 倍率顯示:1.3 / 1.5 / 1.75 / 2.0,不補多餘的零 */
function fmtLev(v){ return (Math.round(v*100)%10===0)?v.toFixed(1):v.toFixed(2); }
/* 依檔位表換算目標水位:回落不到最淺一檔就是基準倍率 */
function ladderTarget(dd){
  const hit=LADDER.find(x=>dd>=x.dd);
  return hit?hit.lev:LADDER_BASE;
}
/* 月看每個月最後一筆,週看每週最後一筆,年看每年最後一筆。最新那筆一定留著 */
function perfResample(pts,mode){
  if(mode==="day"||pts.length<2) return pts;
  const wk=d=>{ const t=new Date(d+"T00:00:00Z");
    t.setUTCDate(t.getUTCDate()-((t.getUTCDay()+6)%7)); return t.toISOString().slice(0,10); };
  const keyOf = mode==="week" ? wk : (d=>d.slice(0,mode==="month"?7:4));
  const last={}; pts.forEach(p=>{ last[keyOf(p.d)]=p; });
  const out=Object.keys(last).sort().map(k=>last[k]);
  const tail=pts[pts.length-1];
  if(out[out.length-1].d!==tail.d) out.push(tail);
  return out;
}
function perfPct(x,dec){ return (x>=0?"+":"−")+Math.abs(x).toFixed(dec==null?2:dec)+"%"; }
function perfPathD(p,smooth){
  const f=n=>n.toFixed(1);
  if(!smooth||p.length<3) return p.map((q,i)=>(i?"L":"M")+f(q[0])+" "+f(q[1])).join(" ");
  let d="M"+f(p[0][0])+" "+f(p[0][1]);
  for(let i=0;i<p.length-1;i++){
    const p0=p[i-1]||p[i],p1=p[i],p2=p[i+1],p3=p[i+2]||p2;
    d+=" C"+f(p1[0]+(p2[0]-p0[0])/6)+" "+f(p1[1]+(p2[1]-p0[1])/6)+" "
      +f(p2[0]-(p3[0]-p1[0])/6)+" "+f(p2[1]-(p3[1]-p1[1])/6)+" "+f(p2[0])+" "+f(p2[1]);
  }
  return d;
}
const ADD_LV={60:{n:1,lbl:"季線"},120:{n:2,lbl:"半年線"},240:{n:3,lbl:"年線"}};
/* 減碼訊號:加碼的鏡像。要求「站上所有均線」(趨勢還在)且年線乖離拉開,
   漲多了才減。已經回檔跌破均線的不算減碼,那是加碼區。
   門檻依 2026-08 持股乖離分布設定,要調整改這裡。 */
const CUT_TH=[{d:80,n:3},{d:60,n:2},{d:40,n:1}];
/* 借款紅線:用質押成數口徑。
   成數 = 借款 ÷ 持倉(擔保品)市值。法規上限 60%,安全上限 30 到 40%,
   「不要把額度借滿 6 成,借 3 到 4 成才能安穩睡覺」(參考來源,參考)。
   以前(2026-08-19 到 08-22)分母用的是 IB 淨值,同一個 40% 比較嚴格,已改掉。危險區 50%。
   「借款不超過總資產 20%」是另一條(分母是總資產),沒有改,在總曝險卡上。 */
const RK_LIMIT={safeMax:.4, watchMax:.5};
function rkNorm(s){
  const net=+s.net_liquidation||0;
  const settled=+(s.settled_cash ?? s.total_cash_value ?? 0);
  const cash=+(s.cash_value ?? settled);
  const gross=+(s.gross_position_value ?? Math.max(net-Math.max(cash,0),0));
  const loan=+(s.margin_loan ?? Math.max(-cash, gross-net, 0));
  return {...s, net, cash, gross, loan,
    exposureRatio: net>0?gross/net:null,
    borrowRatio: gross>0?loan/gross:null};   // 借款成數:借款 ÷ 持倉市值
}
function rkExpo(s){
  let boost=0; (s.holdings||[]).forEach(h=>{ const mv=+h.market_value||0, lev=+h.leverage||1;
    if(lev>1) boost+=Math.max(mv*(lev-1),0); });
  const eff=s.gross+boost;
  return {book:s.gross, boost, eff,
    effRatio:s.net>0?eff/s.net:null, bookRatio:s.net>0?s.gross/s.net:null, boostRatio:s.net>0?boost/s.net:null};
}
function rkStress(s){
  const gross=s.gross, mm=+s.maintenance_margin||0, el=+s.excess_liquidity||0, net=s.net, loan=Math.max(s.loan,0);
  return {
    marginCallDrop: gross>mm&&el>0 ? el/(gross-mm) : null,        // 距券商追繳
    breachDrop: loan>0&&gross>0 ? 1-loan/(RK_LIMIT.safeMax*gross) : null, // 市場再跌這麼多,借款成數碰到 40%
    cushionRatio: net>0 ? el/net : null,                         // 強平安全墊
    cashBuffer: net>0 ? s.cash/net : null,                       // 現金緩衝
  };
}
function rkMoney(v,cur){ if(v==null||isNaN(+v)) return "-";
  return (+v).toLocaleString(undefined,{maximumFractionDigits:0})+(cur?" "+cur:""); }
function rkPct(v){ return v==null||isNaN(+v)?"-":(v*100).toFixed(0)+"%"; }
/* 正二與原型的比例。硬規則:原型市值要大於正二,也就是「正二占原型」不超過 100%。 */
function levMix(list){
  let two=0, one=0;
  (list||[]).forEach(h=>{ const mv=+h.market_value||0; if((+h.leverage||1)>1) two+=mv; else one+=mv; });
  return {two, one, pct: one>0?two/one*100:null};
}
function rkBorrowKind(r){ if(r==null) return "safe"; return r<=RK_LIMIT.safeMax?"safe":r<=RK_LIMIT.watchMax?"watch":"danger"; }
