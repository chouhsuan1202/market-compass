/* 示範資料:IBKR 帳戶快照。數字全部是編的,不是任何人的真實帳戶。
   真的要用的話,把 quantity / market_value / net_liquidation 換成自己的。 */
window.MANUAL_SNAPSHOTS = [
  {
    source: "示範資料",
    updated_at: "2026-08-21 09:00",
    currency: "EUR",
    net_liquidation: 28000.00,
    settled_cash: -900.00,
    cash_value: -900.00,
    gross_position_value: 28900.00,
    margin_loan: 900.00,
    daily_pnl: 42.10,
    unrealized_pnl: 1180.00,
    realized_pnl: 0,
    maintenance_margin: 6200.00,
    excess_liquidity: 21800.00,
    buying_power: 109000.00,
    note: "示範用的快照,方便看版面長怎樣。",
    holdings: [
      { name: "SXR8", ticker: "iShares Core S&P 500", quantity: 12, last_price: 700.00, avg_price: 660.00, cost_basis: 7920.00, market_value: 8400.00, unrealized_pnl: 480.00, leverage: 1 },
      { name: "SXRV", ticker: "iShares NASDAQ 100 USD ACC", quantity: 3, last_price: 1450.00, avg_price: 1400.00, cost_basis: 4200.00, market_value: 4350.00, unrealized_pnl: 150.00, leverage: 1 },
      { name: "SEC0", ticker: "iShares MSCI GLB SEMICNDCT A", quantity: 200, last_price: 17.00, avg_price: 16.20, cost_basis: 3240.00, market_value: 3400.00, unrealized_pnl: 160.00, leverage: 1 },
      { name: "4GLD", ticker: "XETRA-GOLD", quantity: 25, last_price: 120.00, avg_price: 112.00, cost_basis: 2800.00, market_value: 3000.00, unrealized_pnl: 200.00, leverage: 1 },
      { name: "LQQ", ticker: "Amundi NASDAQ 100 Daily Lev", quantity: 200, last_price: 9.50, avg_price: 9.00, cost_basis: 1800.00, market_value: 1900.00, unrealized_pnl: 100.00, leverage: 2 },
      { name: "CL2", ticker: "Amundi MSCI USA Daily Lev 2x", quantity: 60, last_price: 31.00, avg_price: 30.10, cost_basis: 1806.00, market_value: 1860.00, unrealized_pnl: 54.00, leverage: 2 },
    ],
  },
];
