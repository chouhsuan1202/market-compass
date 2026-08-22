// 由 asset_build.py 產生,每天自動更新,不要手改。
// 要改數字請改 asset-portfolio.json(股數)或 asset-balances.json(現金)。
window.ASSET_DATA = {
 "meta": {
  "title": "個人資產總覽",
  "date": "2026 / 08 / 22",
  "rate": 1.0,
  "footnote": "★ 以 2026-08-22 的資料估算　價格每日自動更新"
 },
 "summary": [
  {
   "label": "淨資產（扣房貸）",
   "value": "3,243,794",
   "unit": "TWD",
   "sub": "≈ 324.4 萬 TWD",
   "delta": null,
   "deltaDir": null
  },
  {
   "label": "流動資產（不含房產）",
   "value": "1,243,794",
   "unit": "TWD",
   "sub": "≈ 124.4 萬 TWD",
   "delta": null,
   "deltaDir": null
  },
  {
   "label": "ETF vs 個股（流動資產）",
   "value": "48% : 52%",
   "sub": "ETF 391,935 / 個股 429,600 TWD"
  },
  {
   "label": "現金 vs 股票（流動資產）",
   "value": "33% : 67%",
   "sub": "現金 410,000 / 股票 833,794 TWD"
  }
 ],
 "donuts": [
  {
   "title": "淨資產類別",
   "slices": [
    {
     "name": "ETF",
     "value": 391935,
     "color": "#2f6fed"
    },
    {
     "name": "個股",
     "value": 429600,
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
     "value": 12259,
     "color": "#5b6270"
    }
   ]
  },
  {
   "title": "ETF vs 個股（流動）",
   "slices": [
    {
     "name": "ETF",
     "value": 391935,
     "color": "#2f6fed"
    },
    {
     "name": "個股",
     "value": 429600,
     "color": "#e08b2f"
    }
   ]
  },
  {
   "title": "資產類型（流動）",
   "slices": [
    {
     "name": "ETF",
     "value": 391935,
     "color": "#2f6fed"
    },
    {
     "name": "個股",
     "value": 429600,
     "color": "#e08b2f"
    },
    {
     "name": "其他資產",
     "value": 422259,
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
   "pct": 61.7
  },
  {
   "name": "券商帳戶",
   "value": 721535,
   "color": "#7b5cd6",
   "pct": 22.2
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
   "value": 12259,
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
     "value": 78600,
     "pct": 20.1,
     "sym": "0056.TW",
     "pctAll": 9.6
    },
    {
     "tag": "ETF",
     "name": "元大S&P500",
     "value": 76750,
     "pct": 19.6,
     "sym": "00646.TW",
     "pctAll": 9.3
    },
    {
     "tag": "ETF",
     "name": "國泰永續高股息",
     "value": 64760,
     "pct": 16.5,
     "sym": "00878.TW",
     "pctAll": 7.9
    },
    {
     "tag": "ETF",
     "name": "元大高息低波",
     "value": 61550,
     "pct": 15.7,
     "sym": "00713.TW",
     "pctAll": 7.5
    },
    {
     "tag": "ETF",
     "name": "富邦科技",
     "value": 60850,
     "pct": 15.5,
     "sym": "0052.TW",
     "pctAll": 7.4
    },
    {
     "tag": "ETF",
     "name": "富邦NASDAQ正2",
     "value": 49425,
     "pct": 12.6,
     "sym": "00670L.TW",
     "pctAll": 6.0
    }
   ]
  },
  {
   "title": "個股",
   "rows": [
    {
     "tag": "股票",
     "name": "富邦金",
     "value": 67000,
     "pct": 15.6,
     "sym": "2881.TW",
     "pctAll": 8.2
    },
    {
     "tag": "股票",
     "name": "鴻海",
     "value": 61375,
     "pct": 14.3,
     "sym": "2317.TW",
     "pctAll": 7.5
    },
    {
     "tag": "股票",
     "name": "聯發科",
     "value": 56850,
     "pct": 13.2,
     "sym": "2454.TW",
     "pctAll": 6.9
    },
    {
     "tag": "股票",
     "name": "中華電",
     "value": 54600,
     "pct": 12.7,
     "sym": "2412.TW",
     "pctAll": 6.6
    },
    {
     "tag": "股票",
     "name": "台達電",
     "value": 52500,
     "pct": 12.2,
     "sym": "2308.TW",
     "pctAll": 6.4
    },
    {
     "tag": "股票",
     "name": "長榮",
     "value": 50300,
     "pct": 11.7,
     "sym": "2603.TW",
     "pctAll": 6.1
    },
    {
     "tag": "股票",
     "name": "廣達",
     "value": 48225,
     "pct": 11.2,
     "sym": "2382.TW",
     "pctAll": 5.9
    },
    {
     "tag": "股票",
     "name": "統一",
     "value": 38750,
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
   "body": "78,600 TWD，佔流動資產 6.3%。"
  },
  {
   "level": "warn",
   "title": "IB 帳戶有融資",
   "body": "現金餘額 -100,000 TWD（負數＝借券商的錢），持股市值 821,535 TWD，淨值 721,535 TWD。"
  },
  {
   "level": "ok",
   "title": "現金水位",
   "body": "各帳戶現金與借款合計 410,000 TWD，佔流動資產 33.0%。"
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
   "d": "2026-08-22",
   "v": 124.4,
   "note": "今天(自動)"
  }
 ],
 "holdingsTotal": 821535,
 "leverage": {
  "exposure": 883219,
  "liquid": 1243794,
  "lev": 0.71,
  "boost": 49425,
  "core": 391935,
  "corePct": 31.5,
  "cash": 410000,
  "cashPct": 33.0,
  "single": 429600,
  "singlePct": 34.5
 }
};
