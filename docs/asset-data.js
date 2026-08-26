// 由 asset_build.py 產生,每天自動更新,不要手改。
// 要改數字請改 asset-portfolio.json(股數)或 asset-balances.json(現金)。
window.ASSET_DATA = {
 "meta": {
  "title": "個人資產總覽",
  "date": "2026 / 08 / 26",
  "rate": 1.0,
  "footnote": "★ 以 2026-08-22 的資料估算　價格每日自動更新"
 },
 "summary": [
  {
   "label": "淨資產（扣房貸）",
   "value": "3,249,409",
   "unit": "TWD",
   "sub": "≈ 324.9 萬 TWD",
   "delta": null,
   "deltaDir": null
  },
  {
   "label": "流動資產（不含房產）",
   "value": "1,249,409",
   "unit": "TWD",
   "sub": "≈ 124.9 萬 TWD",
   "delta": null,
   "deltaDir": null
  },
  {
   "label": "ETF vs 個股（流動資產）",
   "value": "48% : 52%",
   "sub": "ETF 395,128 / 個股 431,875 TWD"
  },
  {
   "label": "現金 vs 股票（流動資產）",
   "value": "33% : 67%",
   "sub": "現金 410,000 / 股票 839,409 TWD"
  }
 ],
 "donuts": [
  {
   "title": "淨資產類別",
   "slices": [
    {
     "name": "ETF",
     "value": 395128,
     "color": "#2f6fed"
    },
    {
     "name": "個股",
     "value": 431875,
     "color": "#e08b2f"
    },
    {
     "name": "房產淨值",
     "value": 2000000,
     "color": "#d9682f"
    },
    {
     "name": "現金",
     "value": 410000,
     "color": "#b8bfc9"
    },
    {
     "name": "加密貨幣",
     "value": 12406,
     "color": "#5b6270"
    }
   ]
  },
  {
   "title": "ETF vs 個股（流動）",
   "slices": [
    {
     "name": "ETF",
     "value": 395128,
     "color": "#2f6fed"
    },
    {
     "name": "個股",
     "value": 431875,
     "color": "#e08b2f"
    }
   ]
  },
  {
   "title": "資產類型（流動）",
   "slices": [
    {
     "name": "ETF",
     "value": 395128,
     "color": "#2f6fed"
    },
    {
     "name": "個股",
     "value": 431875,
     "color": "#e08b2f"
    },
    {
     "name": "其他資產",
     "value": 422406,
     "color": "#8f97a3"
    }
   ]
  }
 ],
 "accountsNote": "房貸 -4,000,000 TWD 已扣除，房產以「淨值 2,000,000 TWD」呈現（市場估值 6,000,000 TWD）",
 "accounts": [
  {
   "name": "房產淨值",
   "value": 2000000,
   "color": "#d9682f",
   "pct": 61.5
  },
  {
   "name": "券商帳戶",
   "value": 727002,
   "color": "#7b5cd6",
   "pct": 22.4
  },
  {
   "name": "定存",
   "value": 350000,
   "color": "#ec6a9c",
   "pct": 10.8
  },
  {
   "name": "活存",
   "value": 160000,
   "color": "#9aa4b2",
   "pct": 4.9
  },
  {
   "name": "加密貨幣",
   "value": 12406,
   "color": "#3b82f6",
   "pct": 0.4
  }
 ],
 "holdings": [
  {
   "title": "歐股 ETF",
   "rows": [
    {
     "tag": "ETF",
     "name": "元大高股息",
     "value": 79875,
     "pct": 20.2,
     "sym": "0056.TW",
     "pctAll": 9.7
    },
    {
     "tag": "ETF",
     "name": "元大S&P500",
     "value": 76950,
     "pct": 19.5,
     "sym": "00646.TW",
     "pctAll": 9.3
    },
    {
     "tag": "ETF",
     "name": "國泰永續高股息",
     "value": 65640,
     "pct": 16.6,
     "sym": "00878.TW",
     "pctAll": 7.9
    },
    {
     "tag": "ETF",
     "name": "富邦科技",
     "value": 61950,
     "pct": 15.7,
     "sym": "0052.TW",
     "pctAll": 7.5
    },
    {
     "tag": "ETF",
     "name": "元大高息低波",
     "value": 61650,
     "pct": 15.6,
     "sym": "00713.TW",
     "pctAll": 7.5
    },
    {
     "tag": "ETF",
     "name": "富邦NASDAQ正2",
     "value": 49062,
     "pct": 12.4,
     "sym": "00670L.TW",
     "pctAll": 5.9
    }
   ]
  },
  {
   "title": "個股",
   "rows": [
    {
     "tag": "股票",
     "name": "富邦金",
     "value": 69250,
     "pct": 16.0,
     "sym": "2881.TW",
     "pctAll": 8.4
    },
    {
     "tag": "股票",
     "name": "鴻海",
     "value": 61625,
     "pct": 14.3,
     "sym": "2317.TW",
     "pctAll": 7.5
    },
    {
     "tag": "股票",
     "name": "聯發科",
     "value": 59175,
     "pct": 13.7,
     "sym": "2454.TW",
     "pctAll": 7.2
    },
    {
     "tag": "股票",
     "name": "中華電",
     "value": 54400,
     "pct": 12.6,
     "sym": "2412.TW",
     "pctAll": 6.6
    },
    {
     "tag": "股票",
     "name": "台達電",
     "value": 52500,
     "pct": 12.2,
     "sym": "2308.TW",
     "pctAll": 6.3
    },
    {
     "tag": "股票",
     "name": "廣達",
     "value": 49875,
     "pct": 11.5,
     "sym": "2382.TW",
     "pctAll": 6.0
    },
    {
     "tag": "股票",
     "name": "長榮",
     "value": 46200,
     "pct": 10.7,
     "sym": "2603.TW",
     "pctAll": 5.6
    },
    {
     "tag": "股票",
     "name": "統一",
     "value": 38850,
     "pct": 9.0,
     "sym": "1216.TW",
     "pctAll": 4.7
    }
   ]
  }
 ],
 "risks": [
  {
   "level": "info",
   "title": "最大單一部位：元大高股息",
   "body": "79,875 TWD，佔流動資產 6.4%。"
  },
  {
   "level": "warn",
   "title": "IB 帳戶有融資",
   "body": "現金餘額 -100,000 TWD（負數＝借券商的錢），持股市值 827,002 TWD，淨值 727,002 TWD。"
  },
  {
   "level": "ok",
   "title": "現金水位",
   "body": "各帳戶現金與借款合計 410,000 TWD，佔流動資產 32.8%。"
  }
 ],
 "notesDefault": "這是公開示範版,所有金額都是編的。",
 "timeline": [
  {
   "d": "2021-10-01",
   "v": 30,
   "note": "示範起點"
  },
  {
   "d": "2022-07-01",
   "v": 48,
   "note": ""
  },
  {
   "d": "2023-02-01",
   "v": 65,
   "note": ""
  },
  {
   "d": "2024-02-01",
   "v": 84,
   "note": ""
  },
  {
   "d": "2025-02-01",
   "v": 103,
   "note": ""
  },
  {
   "d": "2025-12-01",
   "v": 116,
   "note": ""
  },
  {
   "d": "2026-06-01",
   "v": 123,
   "note": ""
  },
  {
   "d": "2026-08-26",
   "v": 124.9,
   "note": "今天(自動)"
  }
 ],
 "perf": {},
 "perfNames": {
  "ib": "券商帳戶"
 },
 "holdingsTotal": 827002,
 "leverage": {
  "exposure": 888471,
  "liquid": 1249409,
  "lev": 0.711,
  "boost": 49062,
  "core": 395128,
  "corePct": 31.6,
  "cash": 410000,
  "cashPct": 32.8,
  "single": 431875,
  "singlePct": 34.6
 }
};
