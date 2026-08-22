/* 示範資料:券商 A 的帳戶快照,單位台幣。數字全部是編的,不是任何人的真實帳戶。
   真的要用的話,把 quantity / market_value / net_liquidation 換成自己的。 */
window.MANUAL_SNAPSHOTS = [
  {
    source: "示範資料",
    updated_at: "2026-08-22 09:00",
    currency: "TWD",
    net_liquidation: 439000,
    settled_cash: -100000,
    cash_value: -100000,
    gross_position_value: 539000,
    margin_loan: 100000,
    daily_pnl: 1250,
    unrealized_pnl: 28000,
    realized_pnl: 0,
    maintenance_margin: 140000,
    excess_liquidity: 290000,
    buying_power: 900000,
    note: "示範用的快照,方便看版面長怎樣。",
    holdings: [
      { name: "0056", ticker: "元大高股息", quantity: 3000, last_price: 52.40, avg_price: 49.20, cost_basis: 147600, market_value: 157200, unrealized_pnl: 9600, leverage: 1 },
      { name: "00878", ticker: "國泰永續高股息", quantity: 4000, last_price: 32.38, avg_price: 30.90, cost_basis: 123600, market_value: 129520, unrealized_pnl: 5920, leverage: 1 },
      { name: "00646", ticker: "元大S&P500", quantity: 2000, last_price: 76.75, avg_price: 71.50, cost_basis: 143000, market_value: 153500, unrealized_pnl: 10500, leverage: 1 },
      { name: "00670L", ticker: "富邦NASDAQ正2", quantity: 500, last_price: 197.70, avg_price: 193.70, cost_basis: 96850, market_value: 98850, unrealized_pnl: 2000, leverage: 2 },
    ],
  },
];
