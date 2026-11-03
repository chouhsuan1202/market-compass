// Compass 頁面的自動測試:用 Playwright 開真的瀏覽器,餵各種壞資料,確認畫面不會壞。
// 執行:npm test(需要 playwright 與 axe-core,見 package.json)
// 測的是 docs/(GitHub Pages 實際對外的那份)。

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { siteFileList } from "../scripts/sync-docs.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");
const ROOT = path.join(REPO, "docs");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".png": "image/png", ".md": "text/plain; charset=utf-8" };

let server, base, browser;

before(async () => {
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p.endsWith("/")) p += "index.html";
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" });
    res.end(fs.readFileSync(f));
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); });

const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const DATA = () => JSON.parse(read("data.json"));
const WL = () => JSON.parse(read("watchlist.json"));
// 把 window.X = {...} 這種資料檔讀成物件
function readGlobal(file, name) {
  const sandbox = { window: {} };
  new Function("window", read(file))(sandbox.window);
  return sandbox.window[name];
}
const asScript = (name, obj) => `window.${name} = ${JSON.stringify(obj)};`;

/* 開一頁。routes:{ "data.json": {status, body, contentType, hang} }。
   回傳 page 與收集到的錯誤(pageerror 與 console.error)。 */
async function open({ width = 1280, hash = "", routes = {}, clock = false, init } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 820 }, serviceWorkers: "block" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error") errors.push("console: " + m.text()); });
  // 外部字型與第三方請求回空內容,測試不靠網路(用 abort 會在 console 多一行 ERR_FAILED)
  await page.route(u => !u.href.startsWith(base), r => r.fulfill({ status: 200, body: "", contentType: "text/css" }));
  for (const [file, spec] of Object.entries(routes)) {
    await page.route(u => u.href.startsWith(base) && u.pathname.endsWith("/" + file), async r => {
      if (spec.hang) return; // 永遠不回應,模擬逾時
      await r.fulfill({ status: spec.status || 200, body: spec.body ?? "",
        contentType: spec.contentType || (file.endsWith(".js") ? "application/javascript" : "application/json") });
    });
  }
  if (clock) await page.clock.install();
  if (init) await page.addInitScript(init);
  await page.goto(base + (hash ? "#" + hash : ""));
  if (!clock) await page.waitForLoadState("networkidle");
  await page.waitForTimeout(150);
  return { page, ctx, errors };
}
// 資料腳本本身的 404 會在 console 留一行 "Failed to load resource",那是瀏覽器的訊息不是頁面壞掉
const real = errs => errs.filter(e => !/Failed to load resource/.test(e));

async function noHScroll(page, label) {
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  assert.ok(r.sw <= r.cw, `${label}: 橫向捲動 scrollWidth ${r.sw} > ${r.cw}`);
}
async function goPanel(page, key) {
  await page.evaluate(k => { location.hash = k; }, key);
  await page.waitForTimeout(120);
}

// ======================= 煙霧測試 =======================

test("煙霧測試:頁面打得開,每個 CSS 與 JS 都載到,四個分頁都有內容", async () => {
  const failed = [];
  const { page, ctx, errors } = await open({ width: 1280 });
  page.on("requestfailed", r => failed.push(r.url()));
  const res = await page.evaluate(() => performance.getEntriesByType("resource")
    .filter(e => /\/(css|js)\//.test(e.name)).map(e => ({ n: e.name, s: e.responseStatus })));
  assert.equal(res.filter(r => r.n.endsWith(".css")).length, 2, "兩個 CSS 都要載到");
  assert.equal(res.filter(r => r.n.endsWith(".js")).length, 9, "九個 JS 都要載到");
  assert.ok(res.every(r => r.s === 200), JSON.stringify(res));
  // CSS 有吃到:版心是 1232px 的桌面版,不是瀏覽器預設樣式
  assert.equal(await page.locator("#tabbar").isVisible(), false, "桌面不該看到手機底部列");
  assert.ok(await page.locator("#macro .brow").count() > 5, "股票面板要有清單");
  assert.ok(await page.locator("#rail .rl-card").count() >= 2, "右欄要有脈搏卡與訊號卡");
  await goPanel(page, "risk");
  assert.match(await page.locator("#riskPanel").innerText(), /借款成數/);
  await goPanel(page, "asset");
  assert.match(await page.locator("#assetPanel").innerText(), /資產配置/);
  await goPanel(page, "expense");
  assert.match(await page.locator("#expensePanel").innerText(), /總支出/);
  assert.deepEqual(failed, []);
  assert.deepEqual(errors, []);
  await ctx.close();
});

// ───────────────────────── 正常資料 ─────────────────────────

for (const width of [375, 1280]) {
  test(`正常資料 ${width}px:每個分頁都畫得出來、沒有 console error、不會橫向捲動`, async () => {
    const { page, ctx, errors } = await open({ width });
    for (const k of ["macro", "risk", "asset", "expense"]) {
      await goPanel(page, k);
      await noHScroll(page, `${width}/${k}`);
    }
    await goPanel(page, "risk");
    await page.click('[data-riskview="perf"]');
    await noHScroll(page, `${width}/risk-perf`);
    await goPanel(page, "macro");
    const rows = await page.locator("#macro [data-sym]").count();
    assert.ok(rows > 5, "股票清單應該有列");
    await page.locator("#macro [data-sym]").first().click();
    assert.ok(await page.locator("#chartModal.show").count(), "點列要開線圖");
    await noHScroll(page, `${width}/chart`);
    await page.keyboard.press("Escape");
    await page.click("#todoBtn");
    await noHScroll(page, `${width}/todo`);
    await page.keyboard.press("Escape");
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

// ───────────────────────── API 失敗、逾時、空資料 ─────────────────────────

const failCases = {
  "HTTP 500": { "data.json": { status: 500, body: "oops" } },
  "HTTP 404": { "data.json": { status: 404, body: "nf" } },
  "JSON 壞掉": { "data.json": { body: "{\"^GSPC\": {\"price\": 1," } },
  "回傳 HTML": { "data.json": { body: "<html>login</html>", contentType: "text/html" } },
  "data 是 null": { "data.json": { body: "null" } },
  "data 是陣列": { "data.json": { body: "[1,2,3]" } },
  "watchlist 是字串": { "watchlist.json": { body: "\"hello\"" } },
};
for (const [name, routes] of Object.entries(failCases)) {
  test(`讀取失敗(${name}):顯示錯誤與重試,不丟例外`, async () => {
    const { page, ctx, errors } = await open({ width: 375, routes });
    const st = page.locator("#status");
    await st.locator("text=讀不到資料").waitFor({ timeout: 5000 });
    assert.equal(await page.locator("#retryBtn").count(), 1);
    // 其他分頁仍可切換(資料檔是另外載入的)
    for (const k of ["risk", "asset", "expense"]) await goPanel(page, k);
    assert.deepEqual(real(errors), []);
    await ctx.close();
  });
}

test("逾時:data.json 一直不回,25 秒後顯示「太久沒回應」", async () => {
  const { page, ctx, errors } = await open({ width: 1280, clock: true, routes: { "data.json": { hang: true } } });
  await page.waitForTimeout(300);
  assert.match(await page.locator("#status").innerText(), /讀取資料中/);
  await page.clock.fastForward(26000);
  await page.locator("#status >> text=太久沒回應").waitFor({ timeout: 5000 });
  assert.deepEqual(real(errors), []);
  await ctx.close();
});

test("重試鈕:第一次失敗,第二次成功就恢復正常", async () => {
  let n = 0;
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, serviceWorkers: "block" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.route(u => !u.href.startsWith(base), r => r.fulfill({ status: 200, body: "", contentType: "text/css" }));
  await page.route(u => u.pathname.endsWith("/data.json"), r => (n++ === 0 ? r.fulfill({ status: 503, body: "" }) : r.continue()));
  await page.goto(base);
  await page.locator("#retryBtn").click();
  await page.locator("#macro [data-sym]").first().waitFor({ timeout: 5000 });
  assert.deepEqual(errors, []);
  await ctx.close();
});

for (const width of [375, 1280]) {
  test(`空資料 ${width}px:data.json 是 {},watchlist 空,頁面照常`, async () => {
    const { page, ctx, errors } = await open({ width, routes: {
      "data.json": { body: "{}" }, "watchlist.json": { body: "{}" } } });
    await page.waitForFunction(() => document.getElementById("status").style.display === "none");
    for (const k of ["macro", "risk", "asset", "expense"]) await goPanel(page, k);
    await goPanel(page, "risk");
    await page.click('[data-riskview="perf"]');
    await page.click("#todoBtn");
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

// ───────────────────────── 格式變動 ─────────────────────────

test("格式變動:數字變字串、欄位缺、陣列變 null、歷史序列長短不一", async () => {
  const d = DATA(), syms = Object.keys(d).filter(k => k[0] !== "_" && d[k] && !d[k].error && d[k].hist && d[k].mas && !k.startsWith("^"));
  const [a, b, c, e, f, g, h] = syms;
  d[a].price = String(d[a].price);                       // 字串數字
  d[a].mas.forEach(m => { m.v = String(m.v); delete m.diff; delete m.above; });
  d[b].mas = null;                                       // mas 不見
  d[c].hist = { d: d[c].hist.d.slice(0, 10), c: d[c].hist.c }; // 長短不一
  d[e].hist = { d: [], c: [] };                          // 空序列
  d[f] = 42;                                             // 整筆變數字
  d[g].mas[0] = null; d[g].mas[1].v = "abc";             // 陣列裡有垃圾
  d[h] = { error: "API rate limit" };                    // API 錯誤
  d["^VIX"] = { price: null };
  d._updated = { weird: true };
  const wl = WL();
  wl.market_holdings.push({ dn: "沒有代號" }, null, "x");
  wl.holdings[0].buys = "not-an-array";
  for (const width of [375, 1280]) {
    const { page, ctx, errors } = await open({ width, routes: {
      "data.json": { body: JSON.stringify(d) }, "watchlist.json": { body: JSON.stringify(wl) } } });
    await page.waitForFunction(() => document.getElementById("status").style.display === "none");
    const n = await page.locator("#macro [data-sym]").count();
    assert.ok(n > 3, "壞掉的那幾筆以外照常列出");
    // 每一筆可點的都打開線圖看一次
    for (let i = 0; i < n; i++) {
      await page.locator("#macro [data-sym]").nth(i).click();
      await page.keyboard.press("Escape");
    }
    await goPanel(page, "risk");
    await goPanel(page, "asset");
    assert.deepEqual(errors, [], `${width}px`);
    await ctx.close();
  }
});

test("資料檔不見(404):槓桿、資產、支出分頁自動隱藏,股票面板照常", async () => {
  const { page, ctx, errors } = await open({ width: 375, routes: {
    "leverage-data.js": { status: 404 }, "asset-data.js": { status: 404 }, "expense-data.js": { status: 404 } } });
  await page.locator("#macro [data-sym]").first().waitFor();
  assert.equal(await page.locator("#tabbarRisk").isHidden(), true);
  assert.equal(await page.locator("#tabbarAsset").isHidden(), true);
  assert.equal(await page.locator("#tabbarExpense").isHidden(), true);
  await page.locator("#macro [data-sym]").first().click();
  assert.deepEqual(real(errors), []);
  await ctx.close();
});

test("資料檔格式亂掉:每個分頁仍可開,不丟例外", async () => {
  const asset = { summary: "x", donuts: [{ title: "A", slices: [{ name: "a", value: "12", color: "red;}" }, null] }],
    accounts: null, timeline: [{ d: "2026-01-01", v: "3" }, { d: "bad", v: 1 }], holdings: [{ title: "個股", rows: null }],
    risks: [{ level: "warn", title: "t", body: "b" }], perf: { sp500: [{ d: "2026-08-01", v: 100 }, { d: "2026-08-02", v: "x" }] } };
  const lev = [{ net_liquidation: "abc", holdings: { a: 1 } }, 5];
  const exp = { updated: 20260822, groups: [{ key: "生活費", color: "url(x)", kind: "need" }],
    months: [{ month: "2026-08", transactions: [{ date: "2026-08-02", desc: null, group: "生活費", amount: "120" }, { amount: "NaN" }] }, { month: "oops" }] };
  for (const width of [375, 1280]) {
    const { page, ctx, errors } = await open({ width, routes: {
      "asset-data.js": { body: asScript("ASSET_DATA", asset) },
      "leverage-data.js": { body: asScript("MANUAL_SNAPSHOTS", lev) },
      "expense-data.js": { body: asScript("EXPENSE_DATA", exp) } } });
    for (const k of ["risk", "asset", "expense", "macro"]) await goPanel(page, k);
    await goPanel(page, "risk");
    await page.click('[data-riskview="perf"]');
    await noHScroll(page, `${width}/亂資料`);
    assert.deepEqual(errors, [], `${width}px`);
    await ctx.close();
  }
});

test("支出沒有任何月份:顯示「沒有資料」", async () => {
  const exp = readGlobal("expense-data.js", "EXPENSE_DATA");
  exp.months = [];
  const { page, ctx, errors } = await open({ width: 1280, hash: "expense",
    routes: { "expense-data.js": { body: asScript("EXPENSE_DATA", exp) } } });
  await page.locator("#expensePanel >> text=沒有資料").first().waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

// ───────────────────────── 安全性:外部字串要跳脫 ─────────────────────────

test("XSS:各資料來源塞 HTML 都只會顯示成文字", async () => {
  const X = '<img src=x onerror="window.__xss=(window.__xss||0)+1">"\'';
  const d = DATA(), wl = WL();
  wl.market_holdings[0].dn = X; wl.market_holdings[1].note = X; wl.holdings[0].dn = X;
  d[wl.market_holdings[2].s] = { error: X };
  d["^GSPC"].src = X; d["^GSPC"].fallback = true;
  d[wl.market_holdings[0].s].mas.forEach(m => { m.label = X; m.cross = "bull"; });
  const asset = readGlobal("asset-data.js", "ASSET_DATA");
  asset.summary.forEach(s => { s.label = X; s.sub = X; s.value = X; });
  asset.donuts.forEach(dn => { dn.title = X; dn.slices.forEach(s => { s.name = X; s.color = 'red" onmouseover="x'; }); });
  asset.accounts.forEach(a => { a.name = X; });
  asset.meta.date = X; asset.accountsNote = X;
  (asset.risks || []).forEach(r => { r.title = X; r.body = X; });
  asset.holdings.forEach(h => { h.title = X; h.rows.forEach(r => { r.name = X; r.tag = X; }); });
  const lev = readGlobal("leverage-data.js", "MANUAL_SNAPSHOTS");
  lev[0].holdings.forEach(h => { h.name = X; h.ticker = X; });
  lev[0].currency = X; lev[0].updated_at = X;
  const exp = readGlobal("expense-data.js", "EXPENSE_DATA");
  exp.updated = X;
  exp.months.forEach(m => m.transactions.forEach(t => { t.desc = X; t.cat = X; t.src = X; }));
  const init = `try{localStorage.setItem("mc_todo_mine", JSON.stringify([{title:${JSON.stringify(X)},body:${JSON.stringify(X)},mine:true}]));}catch(e){}`;
  for (const width of [375, 1280]) {
    const { page, ctx } = await open({ width, init, routes: {
      "data.json": { body: JSON.stringify(d) }, "watchlist.json": { body: JSON.stringify(wl) },
      "asset-data.js": { body: asScript("ASSET_DATA", asset) },
      "leverage-data.js": { body: asScript("MANUAL_SNAPSHOTS", lev) },
      "expense-data.js": { body: asScript("EXPENSE_DATA", exp) } } });
    await page.locator("#macro [data-sym]").first().click();
    await page.keyboard.press("Escape");
    await page.click("#todoBtn");
    await page.keyboard.press("Escape");
    for (const k of ["risk", "asset", "expense"]) {
      await goPanel(page, k);
      await page.locator("details summary").first().click().catch(() => {});
      await page.hover(".as-donut path.sl").catch(() => {});
    }
    await goPanel(page, "asset");
    await page.locator("[data-asstruct]").first().click().catch(() => {});
    await page.locator("[data-asrisk]").first().click().catch(() => {});
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.__xss), undefined, `${width}px:有 HTML 被執行`);
    assert.equal(await page.locator('img[src="x"]').count(), 0, `${width}px:有 HTML 被插進畫面`);
    await ctx.close();
  }
});

test("To-Do:輸入框打的 HTML 只當文字", async () => {
  const { page, ctx } = await open({ width: 375 });
  await page.click("#todoBtn");
  await page.fill("#todoNew", '<img src=x onerror="window.__xss=1">');
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => window.__xss), undefined);
  assert.ok((await page.locator("#todoSheet").innerText()).includes("<img src=x"));
  await ctx.close();
});

// ───────────────────────── 無障礙(WCAG 2.1 AA) ─────────────────────────

async function axe(page) {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] });
    return r.violations.map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(" ")).join(" | ")}`);
  });
}
for (const width of [375, 1280]) {
  for (const vix of [15, 25, 35]) {
    test(`axe WCAG 2.1 AA ${width}px(VIX ${vix})`, async () => {
      const d = DATA(); d["^VIX"].price = vix;
      const { page, ctx } = await open({ width, routes: { "data.json": { body: JSON.stringify(d) } } });
      const found = [];
      const check = async label => { (await axe(page)).forEach(v => found.push(`${label} ${v}`)); };
      for (const k of ["macro", "risk", "asset", "expense"]) { await goPanel(page, k); await check(k); }
      await goPanel(page, "risk"); await page.click('[data-riskview="perf"]'); await check("perf");
      await goPanel(page, "macro");
      await page.locator("#macro [data-sym]").first().click(); await check("chart");
      await page.keyboard.press("Escape");
      await page.click("#todoBtn"); await check("todo");
      await page.keyboard.press("Escape");
      assert.deepEqual(found, []);
      await ctx.close();
    });
  }
}

test("鍵盤:Tab 到清單列按 Enter 開線圖,Esc 關掉焦點回原位", async () => {
  const { page, ctx } = await open({ width: 1280 });
  const row = page.locator("#macro [data-sym]").first();
  assert.equal(await row.getAttribute("tabindex"), "0");
  await row.focus();
  await page.keyboard.press("Enter");
  assert.ok(await page.locator("#chartModal.show").count(), "Enter 要開線圖");
  assert.ok(await page.evaluate(() => !!document.activeElement.closest("#chartSheet")), "焦點要在彈窗裡");
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#chartModal.show").count(), 0);
  assert.ok(await page.evaluate(() => document.activeElement && document.activeElement.matches("[data-sym]")), "焦點回到原本那列");
  await ctx.close();
});

// ───────────────────────── 極端數值:圖表不能出現 NaN ─────────────────────────

test("歷年線圖:全是 0、同一天、負值,年與月兩種檢視都畫得出來", async () => {
  const cases = {
    "全是 0": [{ d: "2025-05-01", v: 0 }, { d: "2026-07-01", v: 0 }, { d: "2026-08-01", v: 0 }],
    "同一天": [{ d: "2025-05-01", v: 300 }, { d: "2026-08-01", v: 310 }, { d: "2026-08-01", v: 320 }],
    "負值": [{ d: "2025-05-01", v: -120 }, { d: "2026-07-01", v: -40 }, { d: "2026-08-01", v: 15 }],
  };
  for (const [name, timeline] of Object.entries(cases)) {
    const asset = readGlobal("asset-data.js", "ASSET_DATA");
    asset.timeline = timeline;
    if (name === "同一天") asset.timeline = [timeline[1], timeline[2]]; // 月模式只剩同一天的兩筆
    const { page, ctx, errors } = await open({ width: 1280, hash: "asset",
      routes: { "asset-data.js": { body: asScript("ASSET_DATA", asset) } } });
    for (const mode of ["year", "month"]) {
      const btn = page.locator(`#assetPanel [data-tlmode="${mode}"]`);
      if (await btn.count()) await btn.click();
      const svg = await page.evaluate(() => [...document.querySelectorAll("#assetPanel svg")].map(s => s.outerHTML).join(""));
      assert.ok(!/NaN|Infinity/.test(svg), `${name}/${mode}: 線圖座標不能是 NaN`);
    }
    assert.deepEqual(errors, [], name);
    await ctx.close();
  }
});

test("支出趨勢圖:沒設目標、每月都是 0,圖不出現 NaN", async () => {
  const exp = readGlobal("expense-data.js", "EXPENSE_DATA");
  exp.totalBudget = 0; exp.fixedBudget = 0;
  exp.months = exp.months.map(m => ({ ...m, transactions: [] }));
  const { page, ctx, errors } = await open({ width: 1280, hash: "expense",
    routes: { "expense-data.js": { body: asScript("EXPENSE_DATA", exp) } } });
  await page.locator("#exTrend").waitFor({ state: "attached" });
  const svg = await page.locator("#exTrend").evaluate(s => s.innerHTML);
  assert.ok(svg.length > 0 && !/NaN|Infinity/.test(svg), "趨勢圖座標不能是 NaN");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("支出總額是負的(退款多過花費):目標條不會是負寬度", async () => {
  const exp = readGlobal("expense-data.js", "EXPENSE_DATA");
  const last = exp.months[exp.months.length - 1];
  last.transactions = [{ date: last.month + "-03", desc: "退款", group: exp.groups[0].key, amount: -500 }];
  exp.updated = last.month + "-28";
  const { page, ctx, errors } = await open({ width: 1280, hash: "expense",
    routes: { "expense-data.js": { body: asScript("EXPENSE_DATA", exp) } } });
  const w = await page.locator("#expensePanel .seg-in").evaluate(e => e.style.width);
  assert.equal(w, "0%");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("報酬線圖:買點沒照日期排、有一筆缺價格,首買日取最早那筆,數字不是 NaN", async () => {
  const d = DATA(), wl = WL();
  const sym = Object.keys(d).find(k => k[0] !== "_" && d[k] && d[k].hist && d[k].hist.d.length > 40 && !k.startsWith("^"));
  const hd = d[sym].hist.d, n = hd.length;
  const early = hd[n - 30], late = hd[n - 10];
  wl.market_holdings = [{ s: sym, dn: "測試標的", cost: d[sym].hist.c[n - 30],
    buys: [{ d: late, q: 10, p: d[sym].hist.c[n - 10] }, { d: early, q: 10, p: d[sym].hist.c[n - 30] }, { d: late, q: 5 }] }];
  const asset = readGlobal("asset-data.js", "ASSET_DATA");
  asset.perf = { sp500: hd.slice(-30).map((x, i) => ({ d: x, v: 100 + i / 10 })) };
  const { page, ctx, errors } = await open({ width: 1280, hash: "risk", routes: {
    "data.json": { body: JSON.stringify(d) }, "watchlist.json": { body: JSON.stringify(wl) },
    "asset-data.js": { body: asScript("ASSET_DATA", asset) } } });
  await page.click('[data-riskview="perf"]');
  await page.click(`[data-perfsubj="${sym}"]`);
  const html = await page.locator("#riskPanel").innerHTML();
  assert.ok(html.includes(early + " 首買起"), "首買日要是最早那筆");
  assert.ok(!/NaN/.test(html), "不能出現 NaN");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("舊版 Safari:MediaQueryList 沒有 addEventListener 也不丟例外", async () => {
  const { page, ctx, errors } = await open({ width: 1280, init: () => {
    window.__mqOld = 0;
    const P = MediaQueryList.prototype;
    P.addListener = function () { window.__mqOld++; };
    delete P.addEventListener;
    Object.defineProperty(P, "addEventListener", { value: undefined, configurable: true });
  } });
  assert.ok(await page.evaluate(() => window.__mqOld > 0), "要退回 addListener");
  assert.deepEqual(errors, []);
  await ctx.close();
});

// ======================= 第三輪修理 =======================

test("外部字型載不到(Google Fonts 斷線):頁面照常,字型退回系統字", async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 820 }, serviceWorkers: "block" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.route(u => !u.href.startsWith(base), r => r.abort());
  await page.goto(base);
  await page.locator("#macro [data-sym]").first().waitFor({ timeout: 5000 });
  const fam = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  assert.match(fam, /sans-serif/);
  await goPanel(page, "risk");
  const lev = await page.locator(".rk-lev").first().evaluate(e => getComputedStyle(e).fontFamily);
  assert.match(lev, /sans-serif/, "槓桿小標要有系統字備援");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("視窗跨過 720px:資產支出的桌面總覽與手機標題跟著切換", async () => {
  const { page, ctx, errors } = await open({ width: 1280, hash: "asset" });
  const state = () => page.evaluate(() => ({ af: !document.getElementById("afHead").hidden,
    h1: document.querySelector("header h1").textContent }));
  assert.deepEqual(await state(), { af: true, h1: "Compass (Beta)" });
  await page.setViewportSize({ width: 375, height: 820 });
  await page.waitForTimeout(200);
  assert.deepEqual(await state(), { af: false, h1: "資產總覽" }, "縮成手機:總覽要收起來、標題要換");
  await page.setViewportSize({ width: 1280, height: 820 });
  await page.waitForTimeout(200);
  assert.deepEqual(await state(), { af: true, h1: "Compass (Beta)" });
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("線圖彈窗:沒填成本時,買點均價按股數加權,缺價格的那筆不算", async () => {
  const d = DATA(), wl = WL();
  const sym = wl.market_holdings[0].s, n = d[sym].hist.d.length;
  const da = d[sym].hist.d[n - 20], db = d[sym].hist.d[n - 10];
  // 10 股 @ 100、30 股 @ 200、5 股缺價格:均價是 175,不是 (100+200+0)/3 = 100
  wl.market_holdings[0].buys = [{ d: da, q: 10, p: 100 }, { d: db, q: 30, p: 200 }, { d: db, q: 5 }];
  delete wl.market_holdings[0].cost;
  for (const width of [375, 1280]) {
    const { page, ctx, errors } = await open({ width, routes: { "watchlist.json": { body: JSON.stringify(wl) } } });
    await page.locator(`#macro [data-sym="${sym}"]`).click();
    const txt = await page.locator("#chartSheet").innerText();
    assert.match(txt, /均價\s*175\.00/, `${width}px`);
    if (width === 1280) assert.match(txt, /買點 175\.00/);
    assert.ok(!/NaN|Infinity/.test(txt));
    assert.deepEqual(errors, []);
    await ctx.close();
  }
});

test("鍵盤:彈窗開著時 Tab 只在彈窗裡繞,不會跑到後面", async () => {
  const { page, ctx } = await open({ width: 1280 });
  await page.click("#todoBtn");
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    assert.ok(await page.evaluate(() => !!document.activeElement.closest("#todoModal")), `第 ${i + 1} 次 Tab 跑出彈窗`);
  }
  await page.keyboard.press("Shift+Tab");
  assert.ok(await page.evaluate(() => !!document.activeElement.closest("#todoModal")));
  await ctx.close();
});

test("鍵盤:資產頁的圓餅圖例可以 Tab 到,焦點停在哪一項就顯示金額", async () => {
  const { page, ctx, errors } = await open({ width: 1280, hash: "asset" });
  const item = page.locator("#assetPanel .as-donut .lg span[tabindex]").first();
  assert.ok(await item.count(), "圖例要能用 Tab 選到");
  await item.focus();
  const hv = await item.evaluate(e => e.closest(".as-donut").querySelector(".as-hv").textContent);
  assert.match(hv, /TWD/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("分段切換鈕都有 aria-pressed,讀屏知道現在選哪一個", async () => {
  const { page, ctx } = await open({ width: 1280 });
  const missing = async () => page.evaluate(() => [...document.querySelectorAll(
    ".tabs button[data-seg],#panelToggle button,[data-range],[data-riskview],[data-allocsort],[data-tlmode],[data-perfx],[data-af],[data-gk]")]
    .filter(b => !b.hasAttribute("aria-pressed")).map(b => b.outerHTML.slice(0, 60)));
  await page.locator("#macro [data-sym]").first().click();
  assert.deepEqual(await missing(), []);
  await page.keyboard.press("Escape");
  for (const k of ["risk", "asset", "expense"]) { await goPanel(page, k); assert.deepEqual(await missing(), [], k); }
  await ctx.close();
});

// ───────────────────────── 檔案層級檢查 ─────────────────────────

const tracked = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  if ((e.name.startsWith(".") && e.name !== ".github") || e.name === "node_modules") return [];
  const p = path.join(dir, e.name);
  return e.isDirectory() ? tracked(p) : [p];
}).filter(p => /\.(html|js|mjs|json|md|yml|css)$/.test(p) && !p.endsWith("package-lock.json"));

test("沒有破折號字元(en dash、em dash、橫線、雙倍與三倍破折號)", () => {
  const dash = new RegExp("[" + String.fromCharCode(0x2013, 0x2014, 0x2015, 0x2E3A, 0x2E3B) + "]");
  const bad = tracked(REPO).filter(f => dash.test(fs.readFileSync(f, "utf8")));
  assert.deepEqual(bad.map(f => path.relative(REPO, f)), []);
});

test("沒有看起來像金鑰的字串", () => {
  const pat = /(sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}|AIza[0-9A-Za-z_-]{30,}|xox[abp]-[A-Za-z0-9-]{10,}|(api[_-]?key|apikey|secret|token)\s*[:=]\s*["'][^"']{12,}["'])/i;
  const bad = tracked(REPO).filter(f => pat.test(fs.readFileSync(f, "utf8")));
  assert.deepEqual(bad.map(f => path.relative(REPO, f)), []);
});

test("根目錄與 docs/ 的網站檔案同一份(改完根目錄要跑 npm run sync)", () => {
  for (const f of siteFileList()) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), `docs/${f} 不存在`);
    assert.ok(fs.readFileSync(path.join(REPO, f)).equals(fs.readFileSync(path.join(ROOT, f))), f);
  }
  const extra = d => fs.readdirSync(path.join(ROOT, d)).filter(f => !fs.existsSync(path.join(REPO, d, f)));
  assert.deepEqual([...extra("css"), ...extra("js")], [], "docs/ 裡有根目錄沒有的舊檔");
});

test("index.html 引用的檔案都存在,service worker 都有預先快取", () => {
  const html = read("index.html");
  const refs = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map(m => m[1]);
  assert.ok(refs.length > 10);
  for (const r of refs) assert.ok(fs.existsSync(path.join(ROOT, r)), `${r} 不存在`);
  const sw = read("sw.js");
  for (const r of refs.filter(r => /^(css|js)\//.test(r))) assert.ok(sw.includes(`"${r}"`), `sw.js 沒有預先快取 ${r}`);
});

test("每個字型設定都有系統字備援(Google Fonts 載不到時不會掉成預設襯線字)", () => {
  const files = ["css/app.css", "css/demo.css", ...fs.readdirSync(path.join(ROOT, "js")).map(f => "js/" + f)];
  const bad = [];
  for (const f of files) {
    const txt = read(f);
    for (const m of txt.matchAll(/font(?:-family)?\s*[:=]\s*([^;}>]*)/g)) {
      if (/(Noto|Manrope|Plex)/.test(m[1]) && !/(sans-serif|monospace|system-ui)/.test(m[1])) bad.push(`${f}: ${m[0]}`);
    }
  }
  assert.deepEqual(bad, []);
});

test("README 裡連到的本機檔案都存在", () => {
  const md = fs.readFileSync(path.join(REPO, "README.md"), "utf8");
  const links = [...md.matchAll(/\]\(([^)\s]+)\)/g)].map(m => m[1]).filter(l => !/^(https?:|#|mailto:)/.test(l));
  for (const l of links) assert.ok(fs.existsSync(path.join(REPO, l)), `README 連到不存在的 ${l}`);
});
