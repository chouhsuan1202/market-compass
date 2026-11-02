// js/core.js 的單元測試:純算式,不開瀏覽器,幾秒就跑完。
// 執行:npm run test:unit(npm test 會連同頁面測試一起跑)

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const C = require("../js/core.js");

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} 應該約等於 ${b}`);

// ========================= 跳脫與型別 =========================

test("escH:HTML 特殊字元全部跳脫,null 變空字串", () => {
  assert.equal(C.escH(`<img src="x" onerror='a'>&`), "&lt;img src=&quot;x&quot; onerror=&#39;a&#39;&gt;&amp;");
  assert.equal(C.escH(null), "");
  assert.equal(C.escH(undefined), "");
  assert.equal(C.escH(0), "0");
});

test("safeColor:只收 #hex、CSS 變數、顏色名,其他退回灰色", () => {
  assert.equal(C.safeColor("#12a670"), "#12a670");
  assert.equal(C.safeColor("var(--up)"), "var(--up)");
  assert.equal(C.safeColor("red"), "red");
  assert.equal(C.safeColor('red" onmouseover="x'), "#9aa1ab");
  assert.equal(C.safeColor("url(x)"), "#9aa1ab");
  assert.equal(C.safeColor(null, "#000"), "#000");
});

test("toNum:字串數字轉數字,空值、布林、NaN、Infinity 變 null", () => {
  assert.equal(C.toNum("12.5"), 12.5);
  assert.equal(C.toNum(3), 3);
  for (const v of [null, undefined, "", true, false, "abc", NaN, Infinity]) assert.equal(C.toNum(v), null, String(v));
});

test("isISODay 與 objArr", () => {
  assert.equal(C.isISODay("2026-08-27"), true);
  assert.equal(C.isISODay("2026-08-27T07:00:00Z"), true);
  assert.equal(C.isISODay("bad"), false);
  assert.equal(C.isISODay(20260827), false);
  assert.deepEqual(C.objArr([{ a: 1 }, null, 3, [1], "x", { b: 2 }]), [{ a: 1 }, { b: 2 }]);
  assert.deepEqual(C.objArr("not an array"), []);
});

// ========================= 對比度(WCAG) =========================

test("contrastRatio:黑白是 21,同色是 1", () => {
  close(C.contrastRatio("#000000", "#ffffff"), 21, 1e-6);
  close(C.contrastRatio("#2f6fed", "#2f6fed"), 1, 1e-9);
  assert.equal(C.contrastRatio("red", "#ffffff"), 21);   // 不是 #hex 就不調整
});

test("inkOn 與 readableOn:字色壓暗到對比度夠", () => {
  assert.equal(C.inkOn("#101418"), "#fff");
  assert.equal(C.inkOn("#f4c98a"), "#101418");
  const c = C.readableOn("#f4c98a", 3);
  assert.ok(C.contrastRatio(c, "#ffffff") >= 3, `${c} 對白底要有 3:1`);
  assert.equal(C.readableOn("#101418", 4.5), "#101418");   // 本來就夠深就不動
});

// ========================= 資料整理 =========================

test("normData:數字字串轉數字、補算乖離、重數站上幾條", () => {
  const out = C.normData({
    _updated: "2026-08-27",
    A: { price: "110", mas: [{ k: 5, v: "100" }, { k: 20, v: 120, diff: -8.3, above: false }, { k: 60, v: null }],
         hist: { d: ["2026-08-25", "bad", "2026-08-26"], c: [100, 101, "102"] } },
    B: null,
    C: { error: "rate limit" },
    D: [1, 2],
  });
  assert.equal(out._updated, "2026-08-27");
  assert.equal(out.A.price, 110);
  close(out.A.mas[0].diff, 10);
  assert.equal(out.A.mas[0].above, true);
  assert.equal(out.A.mas[2].v, null);
  assert.equal(out.A.score, 1);
  assert.equal(out.A.valid, 2);
  assert.deepEqual(out.A.hist.d, ["2026-08-25", "2026-08-26"]);
  assert.deepEqual(out.A.hist.c, [100, 102]);
  assert.equal(out.B.error, "資料格式不對");
  assert.equal(out.C.error, "rate limit");
  assert.equal(out.D.error, "資料格式不對");
  assert.throws(() => C.normData(null));
  assert.throws(() => C.normData([1]));
});

test("normWL:沒代號的濾掉,買點照日期排、壞日期丟掉", () => {
  const wl = C.normWL({ indexes: ["^GSPC", 3], market_holdings: [
    { s: "X", dn: 5, lev: "2", cost: "10", buys: [{ d: "2026-08-20", q: "3", p: 11 }, { d: "2026-01-02", q: 1 }, { d: "bad" }] },
    { dn: "沒有代號" }, null, "x"] });
  assert.deepEqual(wl.indexes, ["^GSPC"]);
  assert.equal(wl.market_holdings.length, 1);
  const h = wl.market_holdings[0];
  assert.equal(h.dn, "5");
  assert.equal(h.lev, 2);
  assert.equal(h.cost, 10);
  assert.deepEqual(h.buys.map(b => b.d), ["2026-01-02", "2026-08-20"]);
  assert.equal(h.buys[0].p, null);
  assert.deepEqual(wl.holdings, []);
  assert.throws(() => C.normWL("hello"));
});

test("normAsset / normExpense / normSnaps:壞欄位補成安全的預設值", () => {
  const A = C.normAsset({ donuts: [{ title: 1, slices: [{ name: "a", value: "-5", color: "url(x)" }, null] }],
    timeline: [{ d: "2026-02-01", v: "3" }, { d: "2025-01-01", v: 1 }, { d: "bad", v: 2 }], perf: { sp: [{ d: "2026-01-01", v: "x" }] } });
  assert.equal(A.donuts[0].title, "1");
  assert.equal(A.donuts[0].slices[0].value, 0);
  assert.equal(A.donuts[0].slices[0].color, "#9aa1ab");
  assert.deepEqual(A.timeline.map(p => p.d), ["2025-01-01", "2026-02-01"]);
  assert.deepEqual(A.perf.sp, []);
  assert.deepEqual(A.accounts, []);
  assert.equal(C.normAsset(null), undefined);

  const E = C.normExpense({ updated: 20260822, groups: [{ key: 1, color: "x;" }, { color: "red" }],
    months: [{ month: "2026-08", transactions: [{ amount: "120" }, { amount: "NaN" }] }, { month: "oops" }] });
  assert.equal(E.updated, "");
  assert.deepEqual(E.groups.map(g => g.key), ["1"]);
  assert.equal(E.months.length, 1);
  assert.equal(E.months[0].transactions.length, 1);
  assert.equal(E.months[0].transactions[0].amount, 120);
  assert.equal(E.fixedBudget, 0);

  assert.deepEqual(C.normSnaps([{ holdings: { a: 1 } }, 5]), [{ holdings: [] }]);
});

// ========================= 均線判讀與加減碼 =========================

const stock = ups => {
  const ks = [5, 20, 60, 120, 240];
  const mas = ks.map((k, i) => ({ k, v: 100, above: ups[i], diff: ups[i] ? 50 : -10 - i }));
  return { mas, score: ups.filter(Boolean).length, valid: 5 };
};

test("interpret:多頭、空頭、回檔、反彈各一句", () => {
  assert.match(C.interpret(stock([true, true, true, true, true])), /多頭排列/);
  assert.match(C.interpret(stock([false, false, false, false, false])), /空頭排列/);
  assert.match(C.interpret(stock([false, false, true, true, true])), /短線拉回/);
  assert.match(C.interpret(stock([true, true, true, false, false])), /屬反彈/);
  assert.equal(C.interpret({ mas: [], valid: 0 }), "");
});

test("maAddLevel:跌破季線 1 級、半年線 2 級、年線 3 級,取最深", () => {
  assert.equal(C.maAddLevel(stock([true, true, true, true, true])), null);
  assert.equal(C.maAddLevel(stock([true, true, false, true, true])).lv, 1);
  const a = C.maAddLevel(stock([true, true, false, false, false]));
  assert.equal(a.lv, 3);
  assert.equal(a.lbl, "年線");
  assert.equal(C.maAddLevel({ error: "x" }), null);
  assert.equal(C.maAddLevel(null), null);
});

test("maCutLevel:站上全部均線且年線乖離 40/60/80% 以上才減碼", () => {
  const r = diff => ({ mas: [5, 20, 60, 120, 240].map(k => ({ k, v: 1, above: true, diff: k === 240 ? diff : 1 })), score: 5, valid: 5 });
  assert.equal(C.maCutLevel(r(39.9)), null);
  assert.equal(C.maCutLevel(r(40)).lv, 1);
  assert.equal(C.maCutLevel(r(65)).lv, 2);
  assert.equal(C.maCutLevel(r(80)).lv, 3);
  assert.equal(C.maCutLevel({ ...r(90), score: 4 }), null);   // 有一條跌破就不算
});

test("vixLevel:20 以下平靜、20 到 30 偏高、30 以上高波動", () => {
  assert.equal(C.vixLevel(15), "calm");
  assert.equal(C.vixLevel(20), "mid");
  assert.equal(C.vixLevel(30), "mid");
  assert.equal(C.vixLevel(30.1), "high");
  assert.equal(C.vixLevel(null), null);
  assert.equal(C.VIX_TXT.high, "高波動");
});

// ========================= 檔位表 =========================

test("ladderTarget:回落越深目標倍率越高,沒到最淺一檔就是基準", () => {
  assert.equal(C.ladderTarget(0), C.LADDER_BASE);
  assert.equal(C.ladderTarget(14.9), C.LADDER_BASE);
  assert.equal(C.ladderTarget(15), 1.5);
  assert.equal(C.ladderTarget(22.5), 1.75);
  assert.equal(C.ladderTarget(45), 2.0);
});

test("fmtLev:不補多餘的零", () => {
  assert.equal(C.fmtLev(1.3), "1.3");
  assert.equal(C.fmtLev(2), "2.0");
  assert.equal(C.fmtLev(1.75), "1.75");
  assert.equal(C.fmtLev(1.35), "1.35");
});

// ========================= 槓桿風險 =========================

const SNAP = { net_liquidation: 730145, cash_value: -100000, gross_position_value: 830145, margin_loan: 100000,
  maintenance_margin: 249044, excess_liquidity: 481101,
  holdings: [{ market_value: 49775, leverage: 2 }, { market_value: 780370, leverage: 1 }] };

test("rkNorm:借款成數 = 借款 ÷ 持倉市值", () => {
  const s = C.rkNorm(SNAP);
  assert.equal(s.loan, 100000);
  close(s.borrowRatio, 100000 / 830145);
  close(s.exposureRatio, 830145 / 730145);
});

test("rkNorm:沒給持倉市值與借款時從現金反推", () => {
  const s = C.rkNorm({ net_liquidation: 1000, cash_value: -200 });
  assert.equal(s.gross, 1000);       // 淨值 - max(現金,0)
  assert.equal(s.loan, 200);         // 現金是負的就是借款
  const z = C.rkNorm({});
  assert.equal(z.borrowRatio, null);
  assert.equal(z.exposureRatio, null);
});

test("rkExpo:正二多出來的那一倍算進等效曝險", () => {
  const e = C.rkExpo(C.rkNorm(SNAP));
  assert.equal(e.boost, 49775);
  assert.equal(e.eff, 830145 + 49775);
  close(e.effRatio, (830145 + 49775) / 730145);
});

test("rkStress:距追繳與碰到 40% 線要再跌多少", () => {
  const s = C.rkNorm(SNAP), st = C.rkStress(s);
  // 跌 x 之後超額流動性 = EL - x(持倉 - 維持保證金),歸零那一刻就是追繳
  close(st.marginCallDrop, 481101 / (830145 - 249044));
  // 跌 x 之後借款 ÷ 持倉 = 借款 ÷ (持倉(1-x)),等於 40% 那一刻
  close(st.breachDrop, 1 - 100000 / (0.4 * 830145));
  const after = 100000 / (830145 * (1 - st.breachDrop));
  close(after, 0.4, 1e-12);
  close(st.cashBuffer, -100000 / 730145);
});

test("rkBorrowKind:40% 以內安全、50% 以內注意、以上危險", () => {
  assert.equal(C.rkBorrowKind(null), "safe");
  assert.equal(C.rkBorrowKind(0.4), "safe");
  assert.equal(C.rkBorrowKind(0.45), "watch");
  assert.equal(C.rkBorrowKind(0.51), "danger");
});

test("下跌承受力顏色:手機與桌面用同一套門檻", () => {
  assert.equal(C.rkMarginCallKind(0.6), "safe");
  assert.equal(C.rkMarginCallKind(0.3), "watch");
  assert.equal(C.rkMarginCallKind(0.1), "danger");
  assert.equal(C.rkBreachKind(0.3), "safe");     // 以前手機版這裡會是「注意」
  assert.equal(C.rkBreachKind(0.1), "watch");
  assert.equal(C.rkBreachKind(0), "danger");
  assert.equal(C.rkBreachKind(-0.2), "danger");
  assert.equal(C.rkBreachKind(null), "safe");
});

test("levMix:正二占原型的比例", () => {
  const m = C.levMix([{ market_value: 50, leverage: 2 }, { market_value: 200, leverage: 1 }, { market_value: "x" }]);
  assert.equal(m.two, 50);
  assert.equal(m.one, 200);
  assert.equal(m.pct, 25);
  assert.equal(C.levMix([{ market_value: 5, leverage: 2 }]).pct, null);
});

test("rkPct 與 rkMoney", () => {
  assert.equal(C.rkPct(0.123), "12%");
  assert.equal(C.rkPct(null), "-");
  assert.equal(C.rkMoney(null), "-");
  assert.equal(C.rkMoney(1234.6, "TWD"), (1235).toLocaleString() + " TWD");
});

// ========================= 報酬線圖 =========================

test("perfResample:週、月、年各取最後一筆,最新那筆一定留著", () => {
  const pts = ["2026-01-05", "2026-01-30", "2026-02-02", "2026-02-27", "2026-03-03"].map((d, i) => ({ d, v: i }));
  assert.deepEqual(C.perfResample(pts, "month").map(p => p.d), ["2026-01-30", "2026-02-27", "2026-03-03"]);
  assert.deepEqual(C.perfResample(pts, "year").map(p => p.d), ["2026-03-03"]);
  assert.deepEqual(C.perfResample(pts, "week").map(p => p.d), ["2026-01-05", "2026-01-30", "2026-02-02", "2026-02-27", "2026-03-03"]);
  assert.equal(C.perfResample(pts, "day"), pts);
});

test("perfPct:正號、負號用減號,預設兩位小數", () => {
  assert.equal(C.perfPct(1.234), "+1.23%");
  assert.equal(C.perfPct(-1.25, 1), "−1.3%");
  assert.equal(C.perfPct(0), "+0.00%");
});

test("perfPathD:直線與平滑線都不會出現 NaN", () => {
  const p = [[0, 10], [10, 20], [20, 5], [30, 8]];
  assert.equal(C.perfPathD(p, false), "M0.0 10.0 L10.0 20.0 L20.0 5.0 L30.0 8.0");
  const d = C.perfPathD(p, true);
  assert.match(d, /^M0\.0 10\.0 C/);
  assert.ok(!/NaN/.test(d));
});

// ========================= 買進均價 =========================

test("buyAvg:按股數加權,缺價格的那筆不算", () => {
  close(C.buyAvg([{ q: 10, p: 100 }, { q: 30, p: 200 }]), 175);       // 不是 (100+200)/2
  close(C.buyAvg([{ q: 10, p: 100 }, { q: 5 }, { q: 0, p: 999 }]), 100);
  assert.equal(C.buyAvg([{ q: 5 }]), null);
  assert.equal(C.buyAvg(null), null);
  assert.equal(C.buyAvg("x"), null);
});

// ========================= 支出 =========================

const GROUPS = [{ key: "固定", color: "#1", kind: "need" }, { key: "生活", color: "#2", kind: "need" },
  { key: "購物", color: "#3", kind: "want" }, { key: "代墊", color: "#4", kind: "neutral" }];

test("sumByGroup:同組加總算淨額,順序照 groups", () => {
  const gs = C.sumByGroup([{ group: "生活", amount: 100 }, { group: "生活", amount: 50 }, { group: "代墊", amount: -30 },
    { group: "沒這組", amount: 999 }], GROUPS);
  assert.deepEqual(gs.map(g => [g.key, g.v]), [["固定", 0], ["生活", 150], ["購物", 0], ["代墊", -30]]);
});

test("stackOf:負的那組從最上層扣掉,柱高等於總額", () => {
  const gs = C.sumByGroup([{ group: "固定", amount: 100 }, { group: "生活", amount: 60 }, { group: "購物", amount: 20 },
    { group: "代墊", amount: -50 }], GROUPS);
  const ls = C.stackOf(gs);
  assert.deepEqual(ls.map(l => [l.name, l.v]), [["固定", 100], ["生活", 30]]);
  assert.equal(ls.reduce((a, l) => a + l.v, 0), 100 + 60 + 20 - 50);
  assert.deepEqual(C.stackOf(C.sumByGroup([{ group: "代墊", amount: -10 }], GROUPS)), []);
});
