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
   "value": "6,602,445",
   "unit": "TWD",
   "sub": "≈ 660.2 萬 TWD",
   "delta": null,
   "deltaDir": null
  },
  {
   "label": "流動資產（不含房產）",
   "value": "2,602,445",
   "unit": "TWD",
   "sub": "≈ 260.2 萬 TWD",
   "delta": null,
   "deltaDir": null
  },
  {
   "label": "ETF vs 個股（流動資產）",
   "value": "48% : 52%",
   "sub": "ETF 783,870 / 個股 859,200 TWD"
  },
  {
   "label": "現金 vs 股票（流動資產）",
   "value": "36% : 64%",
   "sub": "現金 935,000 / 股票 1,667,445 TWD"
  }
 ],
 "donuts": [
  {
   "title": "淨資產類別",
   "slices": [
    {
     "name": "ETF",
     "value": 783870,
     "color": "#2f6fed"
    },
    {
     "name": "個股",
     "value": 859200,
     "color": "#e08b2f"
    },
    {
     "name": "房產淨值",
     "value": 4000000,
     "color": "#d9682f"
    },
    {
     "name": "現金",
     "value": 935000,
     "color": "#b8bfc9"
    },
    {
     "name": "加密貨幣",
     "value": 24375,
     "color": "#5b6270"
    }
   ]
  },
  {
   "title": "ETF vs 個股（流動）",
   "slices": [
    {
     "name": "ETF",
     "value": 783870,
     "color": "#2f6fed"
    },
    {
     "name": "個股",
     "value": 859200,
     "color": "#e08b2f"
    }
   ]
  },
  {
   "title": "資產類型（流動）",
   "slices": [
    {
     "name": "ETF",
     "value": 783870,
     "color": "#2f6fed"
    },
    {
     "name": "個股",
     "value": 859200,
     "color": "#e08b2f"
    },
    {
     "name": "其他資產",
     "value": 959375,
     "color": "#8f97a3"
    }
   ]
  }
 ],
 "accountsNote": "房貸 -8,000,000 TWD 已扣除，房產以「淨值 4,000,000 TWD」呈現（市場估值 12,000,000 TWD）",
 "accounts": [
  {
   "name": "房產淨值",
   "value": 4000000,
   "color": "#d9682f",
   "pct": 60.6
  },
  {
   "name": "個股帳戶",
   "value": 874200,
   "color": "#2f6fed",
   "pct": 13.2
  },
  {
   "name": "定存",
   "value": 700000,
   "color": "#ec6a9c",
   "pct": 10.6
  },
  {
   "name": "券商 A",
   "value": 439070,
   "color": "#7b5cd6",
   "pct": 6.7
  },
  {
   "name": "活存",
   "value": 320000,
   "color": "#9aa4b2",
   "pct": 4.8
  },
  {
   "name": "券商 B",
   "value": 244800,
   "color": "#e08b2f",
   "pct": 3.7
  },
  {
   "name": "加密貨幣",
   "value": 24375,
   "color": "#3b82f6",
   "pct": 0.4
  }
 ],
 "holdings": [
  {
   "title": "台股 ETF",
   "rows": [
    {
     "tag": "ETF",
     "name": "元大高息低波",
     "value": 123100,
     "pct": 50.3,
     "sym": "00713.TW",
     "pctAll": 7.5
    },
    {
     "tag": "ETF",
     "name": "富邦科技",
     "value": 121700,
     "pct": 49.7,
     "sym": "0052.TW",
     "pctAll": 7.4
    }
   ]
  },
  {
   "title": "歐股 ETF",
   "rows": [
    {
     "tag": "ETF",
     "name": "元大高股息",
     "value": 157200,
     "pct": 29.2,
     "sym": "0056.TW",
     "pctAll": 9.6
    },
    {
     "tag": "ETF",
     "name": "元大S&P500",
     "value": 153500,
     "pct": 28.5,
     "sym": "00646.TW",
     "pctAll": 9.3
    },
    {
     "tag": "ETF",
     "name": "國泰永續高股息",
     "value": 129520,
     "pct": 24.0,
     "sym": "00878.TW",
     "pctAll": 7.9
    },
    {
     "tag": "ETF",
     "name": "富邦NASDAQ正2",
     "value": 98850,
     "pct": 18.3,
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
     "value": 134000,
     "pct": 15.6,
     "sym": "2881.TW",
     "pctAll": 8.2
    },
    {
     "tag": "股票",
     "name": "鴻海",
     "value": 122750,
     "pct": 14.3,
     "sym": "2317.TW",
     "pctAll": 7.5
    },
    {
     "tag": "股票",
     "name": "聯發科",
     "value": 113700,
     "pct": 13.2,
     "sym": "2454.TW",
     "pctAll": 6.9
    },
    {
     "tag": "股票",
     "name": "中華電",
     "value": 109200,
     "pct": 12.7,
     "sym": "2412.TW",
     "pctAll": 6.6
    },
    {
     "tag": "股票",
     "name": "台達電",
     "value": 105000,
     "pct": 12.2,
     "sym": "2308.TW",
     "pctAll": 6.4
    },
    {
     "tag": "股票",
     "name": "長榮",
     "value": 100600,
     "pct": 11.7,
     "sym": "2603.TW",
     "pctAll": 6.1
    },
    {
     "tag": "股票",
     "name": "廣達",
     "value": 96450,
     "pct": 11.2,
     "sym": "2382.TW",
     "pctAll": 5.9
    },
    {
     "tag": "股票",
     "name": "統一",
     "value": 77500,
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
   "body": "157,200 TWD，佔流動資產 6.0%。"
  },
  {
   "level": "warn",
   "title": "IB 帳戶有融資",
   "body": "現金餘額 -100,000 TWD（負數＝借券商的錢），持股市值 539,070 TWD，淨值 439,070 TWD。"
  },
  {
   "level": "ok",
   "title": "現金水位",
   "body": "各帳戶現金與借款合計 935,000 TWD，佔流動資產 35.9%。"
  }
 ],
 "notesDefault": "這是公開示範版,所有金額都是編的。",
 "timeline": [
  {
   "d": "2021-10-01",
   "v": 60,
   "note": "示範起點"
  },
  {
   "d": "2022-07-01",
   "v": 95,
   "note": ""
  },
  {
   "d": "2023-02-01",
   "v": 130,
   "note": ""
  },
  {
   "d": "2024-02-01",
   "v": 168,
   "note": ""
  },
  {
   "d": "2025-02-01",
   "v": 205,
   "note": ""
  },
  {
   "d": "2025-12-01",
   "v": 232,
   "note": ""
  },
  {
   "d": "2026-06-01",
   "v": 244,
   "note": ""
  },
  {
   "d": "2026-08-22",
   "v": 260.2,
   "note": "今天(自動)"
  }
 ],
 "holdingsTotal": 1643070,
 "leverage": {
  "exposure": 1766295,
  "liquid": 2602445,
  "lev": 0.679,
  "boost": 98850,
  "core": 783870,
  "corePct": 30.1,
  "cash": 935000,
  "cashPct": 35.9,
  "single": 859200,
  "singlePct": 33.0
 }
};
