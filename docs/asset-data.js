// 由 asset_build.py 產生,每天自動更新,不要手改。
// 要改數字請改 asset-portfolio.json(股數)或 asset-balances.json(現金)。
window.ASSET_DATA = {
 "meta": {
  "title": "個人資產總覽",
  "date": "2026 / 08 / 22",
  "rate": 37.21,
  "footnote": "★ 台灣銀行以 2026-08-21 資料估算　價格每日自動更新"
 },
 "summary": [
  {
   "label": "淨資產（扣房貸）",
   "value": "130,993",
   "unit": "EUR",
   "sub": "≈ 487.5 萬 TWD",
   "delta": null,
   "deltaDir": null
  },
  {
   "label": "流動資產（不含房產）",
   "value": "100,993",
   "unit": "EUR",
   "sub": "≈ 375.8 萬 TWD",
   "delta": null,
   "deltaDir": null
  },
  {
   "label": "荷蘭 vs 台灣（流動資產）",
   "value": "57% : 43%",
   "sub": "57,366 EUR vs 43,628 EUR"
  },
  {
   "label": "現金 vs 股票（流動資產）",
   "value": "16% : 84%",
   "sub": "現金 16,138 / 股票 84,855 EUR"
  }
 ],
 "donuts": [
  {
   "title": "淨資產類別",
   "slices": [
    {
     "name": "荷蘭投資(BUX+IB)",
     "value": 41665,
     "color": "#2f6fed"
    },
    {
     "name": "台灣股票(元大)",
     "value": 41209,
     "color": "#e08b2f"
    },
    {
     "name": "房產淨值",
     "value": 30000,
     "color": "#d9682f"
    },
    {
     "name": "荷蘭現金",
     "value": 13720,
     "color": "#b8bfc9"
    },
    {
     "name": "台灣現金/借款",
     "value": 2418,
     "color": "#8f97a3"
    },
    {
     "name": "加密貨幣",
     "value": 1981,
     "color": "#5b6270"
    }
   ]
  },
  {
   "title": "荷蘭 vs 台灣（流動）",
   "slices": [
    {
     "name": "🇳🇱 荷蘭",
     "value": 57366,
     "color": "#2f6fed"
    },
    {
     "name": "🇹🇼 台灣",
     "value": 43628,
     "color": "#e08b2f"
    }
   ]
  },
  {
   "title": "現金 vs 個股 vs ETF（流動）",
   "slices": [
    {
     "name": "個股(BUX)",
     "value": 18567,
     "color": "#2f6fed"
    },
    {
     "name": "ETF/大盤",
     "value": 64307,
     "color": "#e08b2f"
    },
    {
     "name": "加密貨幣",
     "value": 1981,
     "color": "#5b6270"
    },
    {
     "name": "現金/借款",
     "value": 16138,
     "color": "#8f97a3"
    }
   ]
  }
 ],
 "accountsNote": "房貸 -270,000 EUR 已扣除，房產以「淨值 30,000 EUR」呈現（市場估值 300,000 EUR）",
 "accounts": [
  {
   "name": "元大證券",
   "value": 41209,
   "color": "#e08b2f",
   "pct": 31.5
  },
  {
   "name": "房產淨值",
   "value": 30000,
   "color": "#d9682f",
   "pct": 22.9
  },
  {
   "name": "Interactive Brokers",
   "value": 22197,
   "color": "#7b5cd6",
   "pct": 16.9
  },
  {
   "name": "BUX 投資",
   "value": 18687,
   "color": "#2f6fed",
   "pct": 14.3
  },
  {
   "name": "儲蓄帳戶",
   "value": 12000,
   "color": "#ec6a9c",
   "pct": 9.2
  },
  {
   "name": "日常帳戶",
   "value": 2500,
   "color": "#9aa4b2",
   "pct": 1.9
  },
  {
   "name": "台灣銀行",
   "value": 2418,
   "color": "#9aa4b2",
   "pct": 1.8
  },
  {
   "name": "加密貨幣",
   "value": 1981,
   "color": "#3b82f6",
   "pct": 1.5
  }
 ],
 "holdings": [
  {
   "title": "台股 ETF",
   "rows": [
    {
     "tag": "台股ETF",
     "name": "台積電 (元大)",
     "value": 19428,
     "pct": 47.1,
     "sym": "2330.TW",
     "pctAll": 23.4
    },
    {
     "tag": "台股ETF",
     "name": "元大台灣50 (0050)",
     "value": 11248,
     "pct": 27.3,
     "sym": "0050.TW",
     "pctAll": 13.6
    },
    {
     "tag": "台股ETF",
     "name": "富邦台50 (006208)",
     "value": 7716,
     "pct": 18.7,
     "sym": "006208.TW",
     "pctAll": 9.3
    },
    {
     "tag": "台股ETF",
     "name": "元大高股息 (0056)",
     "value": 2816,
     "pct": 6.8,
     "sym": "0056.TW",
     "pctAll": 3.4
    }
   ]
  },
  {
   "title": "歐股 ETF",
   "rows": [
    {
     "tag": "ETF",
     "name": "iShares Core S&P 500",
     "value": 8510,
     "pct": 36.8,
     "sym": "SXR8.DE",
     "pctAll": 10.3
    },
    {
     "tag": "ETF",
     "name": "iShares NASDAQ 100",
     "value": 4328,
     "pct": 18.7,
     "sym": "SXRV.DE",
     "pctAll": 5.2
    },
    {
     "tag": "ETF",
     "name": "iShares MSCI Global Semi",
     "value": 3360,
     "pct": 14.5,
     "sym": "SEC0.DE",
     "pctAll": 4.1
    },
    {
     "tag": "黃金",
     "name": "Xetra Gold",
     "value": 3172,
     "pct": 13.7,
     "sym": "4GLD.DE",
     "pctAll": 3.8
    },
    {
     "tag": "ETF",
     "name": "Amundi Nasdaq-100 2x",
     "value": 1871,
     "pct": 8.1,
     "sym": "LQQ.PA",
     "pctAll": 2.3
    },
    {
     "tag": "ETF",
     "name": "Amundi MSCI USA 2x",
     "value": 1856,
     "pct": 8.0,
     "sym": "CL2.PA",
     "pctAll": 2.2
    }
   ]
  },
  {
   "title": "個股",
   "rows": [
    {
     "tag": "股票",
     "name": "NVIDIA",
     "value": 3310,
     "pct": 17.8,
     "sym": "NVDA",
     "pctAll": 4.0
    },
    {
     "tag": "股票",
     "name": "Alphabet A",
     "value": 2953,
     "pct": 15.9,
     "sym": "GOOGL",
     "pctAll": 3.6
    },
    {
     "tag": "股票",
     "name": "AMD",
     "value": 2431,
     "pct": 13.1,
     "sym": "AMD",
     "pctAll": 2.9
    },
    {
     "tag": "股票",
     "name": "Amazon.com",
     "value": 1772,
     "pct": 9.5,
     "sym": "AMZN",
     "pctAll": 2.1
    },
    {
     "tag": "股票",
     "name": "Microsoft",
     "value": 1655,
     "pct": 8.9,
     "sym": "MSFT",
     "pctAll": 2.0
    },
    {
     "tag": "股票",
     "name": "Broadcom",
     "value": 1578,
     "pct": 8.5,
     "sym": "AVGO",
     "pctAll": 1.9
    },
    {
     "tag": "股票",
     "name": "ASML",
     "value": 1510,
     "pct": 8.1,
     "sym": "ASML",
     "pctAll": 1.8
    },
    {
     "tag": "股票",
     "name": "Meta Platforms",
     "value": 1413,
     "pct": 7.6,
     "sym": "META",
     "pctAll": 1.7
    },
    {
     "tag": "股票",
     "name": "Apple",
     "value": 1324,
     "pct": 7.1,
     "sym": "AAPL",
     "pctAll": 1.6
    },
    {
     "tag": "股票",
     "name": "Tesla",
     "value": 621,
     "pct": 3.3,
     "sym": "TSLA",
     "pctAll": 0.7
    }
   ]
  }
 ],
 "risks": [
  {
   "level": "warn",
   "title": "台積電集中度",
   "body": "元大台積電 + BUX ADR 合計 19,428 EUR，佔流動資產 19.2%、佔淨資產 14.8%。"
  },
  {
   "level": "info",
   "title": "最大單一部位（台積電以外）：元大台灣50 (0050)",
   "body": "11,248 EUR，佔流動資產 11.1%。"
  },
  {
   "level": "warn",
   "title": "IB 帳戶有融資",
   "body": "現金餘額 -900 EUR（負數＝借券商的錢），持股市值 23,097 EUR，淨值 22,197 EUR。"
  },
  {
   "level": "ok",
   "title": "現金水位",
   "body": "各帳戶現金與借款合計 16,138 EUR，佔流動資產 16.0%。"
  }
 ],
 "notesDefault": "這是公開示範版,所有金額都是編的。",
 "timeline": [
  {
   "d": "2021-10-01",
   "v": 90,
   "note": "示範起點"
  },
  {
   "d": "2022-07-01",
   "v": 130,
   "note": ""
  },
  {
   "d": "2023-02-01",
   "v": 165,
   "note": ""
  },
  {
   "d": "2024-02-01",
   "v": 210,
   "note": ""
  },
  {
   "d": "2025-02-01",
   "v": 280,
   "note": ""
  },
  {
   "d": "2025-12-01",
   "v": 360,
   "note": ""
  },
  {
   "d": "2026-06-01",
   "v": 430,
   "note": ""
  },
  {
   "d": "2026-08-22",
   "v": 375.8,
   "note": "今天(自動)"
  }
 ],
 "holdingsTotal": 82872,
 "leverage": {
  "exposure": 88582,
  "liquid": 100993,
  "lev": 0.877,
  "boost": 3727,
  "core": 64307,
  "corePct": 63.7,
  "cash": 16138,
  "cashPct": 16.0,
  "single": 18567,
  "singlePct": 18.4
 }
};
