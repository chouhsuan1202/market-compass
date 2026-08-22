/* 示範資料:券商 A 的帳戶快照,單位台幣。數字全部是編的,不是任何人的真實帳戶。
   真的要用的話,把 quantity / market_value / net_liquidation 換成自己的。 */
window.MANUAL_SNAPSHOTS = [
  {
    source: "示範資料",
    updated_at: "2026-08-22 09:00",
    currency: "TWD",
    net_liquidation: 219000,
    settled_cash: -50000,
    cash_value: -50000,
    gross_position_value: 269000,
    margin_loan: 50000,
    daily_pnl: 620,
    unrealized_pnl: 14000,
    realized_pnl: 0,
    maintenance_margin: 70000,
    excess_liquidity: 145000,
    buying_power: 450000,
    note: "示範用的快照,方便看版面長怎樣。",
    holdings: [
      { name: "0056", ticker: "元大高股息", quantity: 1500, last_price: 52.40, avg_price: 49.20, cost_basis: 73800, market_value: 78600, unrealized_pnl: 4800, leverage: 1 },
      { name: "00878", ticker: "國泰永續高股息", quantity: 2000, last_price: 32.38, avg_price: 30.90, cost_basis: 61800, market_value: 64760, unrealized_pnl: 2960, leverage: 1 },
      { name: "00646", ticker: "元大S&P500", quantity: 1000, last_price: 76.75, avg_price: 71.50, cost_basis: 71500, market_value: 76750, unrealized_pnl: 5250, leverage: 1 },
      { name: "00670L", ticker: "富邦NASDAQ正2", quantity: 250, last_price: 197.70, avg_price: 193.70, cost_basis: 48425, market_value: 49425, unrealized_pnl: 1000, leverage: 2 },
    ],
  },
];
