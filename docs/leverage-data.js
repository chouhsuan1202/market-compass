/* 示範資料:券商 A 的帳戶快照。數字全部是編的,不是任何人的真實帳戶。
   真的要用的話,把 quantity / market_value / net_liquidation 換成自己的。 */
window.MANUAL_SNAPSHOTS = [
  {
    source: "示範資料",
    updated_at: "2026-08-22 09:00",
    currency: "EUR",
    net_liquidation: 17700.00,
    settled_cash: -1500.00,
    cash_value: -1500.00,
    gross_position_value: 19200.00,
    margin_loan: 1500.00,
    daily_pnl: 38.40,
    unrealized_pnl: 960.00,
    realized_pnl: 0,
    maintenance_margin: 4200.00,
    excess_liquidity: 13000.00,
    buying_power: 65000.00,
    note: "示範用的快照,方便看版面長怎樣。",
    holdings: [
      { name: "IWDA", ticker: "iShares Core MSCI World", quantity: 60, last_price: 126.50, avg_price: 119.00, cost_basis: 7140.00, market_value: 7590.00, unrealized_pnl: 450.00, leverage: 1 },
      { name: "VWCE", ticker: "Vanguard FTSE All-World", quantity: 30, last_price: 166.30, avg_price: 158.00, cost_basis: 4740.00, market_value: 4989.00, unrealized_pnl: 249.00, leverage: 1 },
      { name: "SGLD", ticker: "Invesco Physical Gold", quantity: 8, last_price: 379.20, avg_price: 355.00, cost_basis: 2840.00, market_value: 3033.60, unrealized_pnl: 193.60, leverage: 1 },
      { name: "LVE", ticker: "Amundi EURO STOXX 50 Daily 2x", quantity: 40, last_price: 89.50, avg_price: 87.80, cost_basis: 3512.00, market_value: 3580.00, unrealized_pnl: 68.00, leverage: 2 },
    ],
  },
];
