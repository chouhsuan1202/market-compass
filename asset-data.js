// 由 asset_build.py 產生,每天自動更新,不要手改。
// 要改數字請改 asset-portfolio.json(股數)或 asset-balances.json(現金)。
window.ASSET_DATA = {
 "meta": {
  "title": "個人資產總覽",
  "date": "2026 / 08 / 22",
  "rate": 37.21,
  "footnote": "★ 以 2026-08-22 的資料估算　價格每日自動更新"
 },
 "summary": [
  {
   "label": "淨資產（扣房貸）",
   "value": "92,445",
   "unit": "EUR",
   "sub": "≈ 344.0 萬 TWD",
   "delta": null,
   "deltaDir": null
  },
  {
   "label": "流動資產（不含房產）",
   "value": "62,445",
   "unit": "EUR",
   "sub": "≈ 232.4 萬 TWD",
   "delta": null,
   "deltaDir": null
  },
  {
   "label": "ETF vs 個股（流動資產）",
   "value": "59% : 41%",
   "sub": "ETF 26,351 / 個股 17,941 EUR"
  },
  {
   "label": "現金 vs 股票（流動資產）",
   "value": "26% : 74%",
   "sub": "現金 16,180 / 股票 46,265 EUR"
  }
 ],
 "donuts": [
  {
   "title": "淨資產類別",
   "slices": [
    {
     "name": "ETF",
     "value": 26351,
     "color": "#2f6fed"
    },
    {
     "name": "個股",
     "value": 17941,
     "color": "#e08b2f"
    },
    {
     "name": "房產淨值",
     "value": 30000,
     "color": "#d9682f"
    },
    {
     "name": "現金",
     "value": 16180,
     "color": "#b8bfc9"
    },
    {
     "name": "加密貨幣",
     "value": 1972,
     "color": "#5b6270"
    }
   ]
  },
  {
   "title": "ETF vs 個股（流動）",
   "slices": [
    {
     "name": "ETF",
     "value": 26351,
     "color": "#2f6fed"
    },
    {
     "name": "個股",
     "value": 17941,
     "color": "#e08b2f"
    }
   ]
  },
  {
   "title": "資產類型（流動）",
   "slices": [
    {
     "name": "ETF",
     "value": 26351,
     "color": "#2f6fed"
    },
    {
     "name": "個股",
     "value": 17941,
     "color": "#e08b2f"
    },
    {
     "name": "其他資產",
     "value": 18152,
     "color": "#8f97a3"
    }
   ]
  }
 ],
 "accountsNote": "房貸 -270,000 EUR 已扣除，房產以「淨值 30,000 EUR」呈現（市場估值 300,000 EUR）",
 "accounts": [
  {
   "name": "房產淨值",
   "value": 30000,
   "color": "#d9682f",
   "pct": 32.5
  },
  {
   "name": "個股帳戶",
   "value": 18121,
   "color": "#2f6fed",
   "pct": 19.6
  },
  {
   "name": "券商 A",
   "value": 17695,
   "color": "#7b5cd6",
   "pct": 19.1
  },
  {
   "name": "儲蓄帳戶",
   "value": 15000,
   "color": "#ec6a9c",
   "pct": 16.2
  },
  {
   "name": "券商 B",
   "value": 7157,
   "color": "#e08b2f",
   "pct": 7.7
  },
  {
   "name": "日常帳戶",
   "value": 2500,
   "color": "#9aa4b2",
   "pct": 2.7
  },
  {
   "name": "加密貨幣",
   "value": 1972,
   "color": "#3b82f6",
   "pct": 2.1
  }
 ],
 "holdings": [
  {
   "title": "台股 ETF",
   "rows": [
    {
     "tag": "ETF",
     "name": "新興市場",
     "value": 4713,
     "pct": 65.9,
     "sym": "EMIM.AS",
     "pctAll": 10.6
    },
    {
     "tag": "ETF",
     "name": "全球科技",
     "value": 2444,
     "pct": 34.1,
     "sym": "XDWT.DE",
     "pctAll": 5.5
    }
   ]
  },
  {
   "title": "歐股 ETF",
   "rows": [
    {
     "tag": "ETF",
     "name": "iShares 全球市場",
     "value": 7591,
     "pct": 39.5,
     "sym": "IWDA.AS",
     "pctAll": 17.1
    },
    {
     "tag": "ETF",
     "name": "Vanguard 全世界",
     "value": 4989,
     "pct": 26.0,
     "sym": "VWCE.DE",
     "pctAll": 11.3
    },
    {
     "tag": "ETF",
     "name": "歐洲藍籌 2x",
     "value": 3581,
     "pct": 18.7,
     "sym": "LVE.PA",
     "pctAll": 8.1
    },
    {
     "tag": "黃金",
     "name": "實體黃金",
     "value": 3034,
     "pct": 15.8,
     "sym": "SGLD.AS",
     "pctAll": 6.8
    }
   ]
  },
  {
   "title": "個股",
   "rows": [
    {
     "tag": "股票",
     "name": "英特爾",
     "value": 4628,
     "pct": 25.8,
     "sym": "INTC",
     "pctAll": 10.4
    },
    {
     "tag": "股票",
     "name": "高通",
     "value": 2753,
     "pct": 15.3,
     "sym": "QCOM",
     "pctAll": 6.2
    },
    {
     "tag": "股票",
     "name": "泰瑞達",
     "value": 1931,
     "pct": 10.8,
     "sym": "TER",
     "pctAll": 4.4
    },
    {
     "tag": "股票",
     "name": "Adobe",
     "value": 1886,
     "pct": 10.5,
     "sym": "ADBE",
     "pctAll": 4.3
    },
    {
     "tag": "股票",
     "name": "Salesforce",
     "value": 1791,
     "pct": 10.0,
     "sym": "CRM",
     "pctAll": 4.0
    },
    {
     "tag": "股票",
     "name": "Vistra",
     "value": 1750,
     "pct": 9.8,
     "sym": "VST",
     "pctAll": 4.0
    },
    {
     "tag": "股票",
     "name": "波克夏 B",
     "value": 1698,
     "pct": 9.5,
     "sym": "BRK-B",
     "pctAll": 3.8
    },
    {
     "tag": "股票",
     "name": "甲骨文",
     "value": 1505,
     "pct": 8.4,
     "sym": "ORCL",
     "pctAll": 3.4
    }
   ]
  }
 ],
 "risks": [
  {
   "level": "info",
   "title": "最大單一部位：iShares 全球市場",
   "body": "7,591 EUR，佔流動資產 12.2%。"
  },
  {
   "level": "warn",
   "title": "IB 帳戶有融資",
   "body": "現金餘額 -1,500 EUR（負數＝借券商的錢），持股市值 19,195 EUR，淨值 17,695 EUR。"
  },
  {
   "level": "ok",
   "title": "現金水位",
   "body": "各帳戶現金與借款合計 16,180 EUR，佔流動資產 25.9%。"
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
   "v": 232.4,
   "note": "今天(自動)"
  }
 ],
 "holdingsTotal": 44294,
 "leverage": {
  "exposure": 49846,
  "liquid": 62445,
  "lev": 0.798,
  "boost": 3581,
  "core": 26351,
  "corePct": 42.2,
  "cash": 16180,
  "cashPct": 25.9,
  "single": 17941,
  "singlePct": 28.7
 }
};
