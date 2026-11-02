/* 槓桿風險頁最下面的備註:我的 to-do。內容跟 Notion「三師開槓紀錄」同步,改這個陣列就好 */
const RK_TODO_DATE = "2026-08-22";
/* 示範用的待辦。要加就往這個陣列塞 {title, body},會自動接在自動待辦後面繼續編號。
   body 吃 HTML,可以用 <b>。這份是公開示範版,內容全部是編的。 */
const RK_TODO = [
  { title:"每月 1 號對一次帳",
    body:`打開「支出」分頁,把上個月的每一筆對過。`
      +`固定帳單金額有變就改 <b>expense-data.js</b>,不然預算線會不準。` },
  { title:"跌破年線的先不要加碼",
    body:`「股票面板」裡年線那一格變紅的,先放著觀察。`
      +`站回年線再進場,這條規則寫死不看心情。` },
  { title:"曝險超過 1.3 倍就停止買進",
    body:`看「槓桿風險」最上面那個數字。`
      +`超過就把多出來的兩倍 ETF 賣回原型,回到基準再說。` },
  { title:"把持股換成自己的",
    body:`改 <b>asset-portfolio.json</b> 的股數與代號,`
      +`再改 <b>asset-balances.json</b> 的現金與房貸,畫面就會跟著變。` },
];
/* To-Do 勾選:勾了只畫刪除線,不會刪掉任何一條,所以不會誤刪。
   狀態存在 localStorage,key 是標題文字。自動待辦的標題會跟著資料變(例如「今日可加碼 6 檔」),
   標題一變就自動回到未勾選,這是刻意的。清除鈕可以一次全部取消。 */
const TODO_KEY="mc_todo_done";
function todoDone(){ try{ return JSON.parse(localStorage.getItem(TODO_KEY)||"{}"); }catch(e){ return {}; } }
function todoToggle(t){ const d=todoDone(); if(d[t]) delete d[t]; else d[t]=1;
  try{ localStorage.setItem(TODO_KEY,JSON.stringify(d)); }catch(e){} }
function todoClear(){ try{ localStorage.removeItem(TODO_KEY); }catch(e){} }
/* 自己加的與刪掉的都存這台裝置(跟勾選同一套做法):
   mc_todo_mine   = 自己在彈窗裡加的條目
   mc_todo_hidden = 刪掉的標題。自動待辦刪不掉本體,用這份把它藏起來;
                    標題跟著資料變(例如目標倍率改了)就會自己浮回來,這是故意的。 */
const TODO_MINE_KEY="mc_todo_mine", TODO_HIDE_KEY="mc_todo_hidden";
function myTodos(){ try{ return JSON.parse(localStorage.getItem(TODO_MINE_KEY)||"[]"); }catch(e){ return []; } }
function myTodoAdd(title){ const L=myTodos(); L.push({title, mine:true});
  try{ localStorage.setItem(TODO_MINE_KEY,JSON.stringify(L)); }catch(e){} }
function todoHidden(){ try{ return JSON.parse(localStorage.getItem(TODO_HIDE_KEY)||"{}"); }catch(e){ return {}; } }
function todoDelete(titles){
  // 自己加的直接移除;其他的(自動+手寫)刪不掉本體,進隱藏清單
  const hide=todoHidden(), mine=myTodos(), keep=mine.filter(t=>!titles.includes(t.title));
  const mineSet=new Set(mine.map(m=>m.title));
  titles.forEach(t=>{ if(!mineSet.has(t)) hide[t]=1; });
  const d=todoDone(); titles.forEach(t=>delete d[t]);
  try{
    localStorage.setItem(TODO_MINE_KEY,JSON.stringify(keep));
    localStorage.setItem(TODO_HIDE_KEY,JSON.stringify(hide));
    localStorage.setItem(TODO_KEY,JSON.stringify(d));
  }catch(e){}
}
/* 一份清單兩邊共用:自動待辦在前,手寫的中間,自己加的最後,刪掉的不出現 */
function todoList(){
  const hide=todoHidden();
  return [...autoTodos(),...RK_TODO,...myTodos()].filter(t=>!hide[t.title]);
}
function todoCount(){ const L=todoList(), D=todoDone();
  return {done:L.filter(t=>D[t.title]).length, all:L.length}; }

function renderTodoSheet(){
  const el=document.getElementById("todoSheet"); if(!el) return;
  let L=[]; try{ L=todoList(); }catch(e){ L=RK_TODO; }
  const D=todoDone();
  const rows=L.map((t,i)=>{ const on=!!D[t.title];
    return `<div class="td-row${on?" done":""}" data-todo="${encodeURIComponent(t.title)}">
      <span class="ck">${on?"\u2713":""}</span>
      <div><div class="t"><span class="no">${String(i+1).padStart(2,"0")}</span>${escH(t.title)}</div>
      ${t.body?`<div class="b">${t.mine?escH(t.body):t.body}</div>`:""}</div></div>`; }).join("");
  const done=L.filter(t=>D[t.title]).length;
  el.innerHTML=`<div class="td-hd"><h2>To-Do</h2>
      <span class="sub">示範清單 · ${RK_TODO_DATE}</span>
      <button class="td-x" id="todoClose" aria-label="關閉">✕</button></div>
    ${rows||'<div style="padding:18px 0;color:var(--faint);font-size:13px">目前沒有待辦。</div>'}
    <div class="td-add"><input id="todoNew" aria-label="新增待辦" placeholder="新增一條,按 Enter 或加入" maxlength="120">
      <button id="todoAdd">加入</button></div>
    <div class="td-foot"><span>已完成 ${done} / ${L.length} · 新增與刪除只存這台裝置</span>
      <span style="display:flex;gap:8px">
        ${done?`<button id="todoDelDone" style="color:#c2373b;border-color:#e8c4c5">刪除已勾選</button>`:""}
        ${done?`<button id="rkTodoClear">清除勾選</button>`:""}</span></div>`;
  const inp=el.querySelector("#todoNew");
  if(inp) inp.addEventListener("keydown",e=>{
    if(e.key==="Enter"){ e.preventDefault(); todoAddFromInput(); }
    e.stopPropagation();   // Esc 留給輸入框,不要直接關掉彈窗
  });
}
function todoAddFromInput(){
  const inp=document.getElementById("todoNew"); if(!inp) return;
  const t=inp.value.trim(); if(!t) return;
  myTodoAdd(t); renderTodoSheet(); syncTodoBadge();
  const again=document.getElementById("todoNew"); if(again) again.focus();
}
function syncTodoBadge(){
  const b=document.getElementById("todoBadge"); if(!b) return;
  let L=[]; try{ L=todoList(); }catch(e){ L=RK_TODO; }
  const D=todoDone(); const n=L.filter(t=>!D[t.title]).length;
  b.hidden=!n; b.textContent=n;
}
function openTodo(){ renderTodoSheet(); document.getElementById("todoModal").classList.add("show"); modalFocus("todoModal"); }
function closeTodo(){ modalBlur("todoModal"); }
