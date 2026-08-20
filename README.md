# Market Compass

A single-file dashboard for watching moving averages across a list of tickers.
Open `index.html` in a browser. No build step, no server, no account.

**Live demo:** https://chouhsuan1202.github.io/market-compass/

All numbers in the demo are generated sample data. Nothing here is a real account or a real position.

![Market Compass](preview.png)

## What it does

Three tabs:

- **Market** - core ETFs and regional funds. Each row shows five moving averages (5, 20, 60, 120, 240) as coloured dots, so you can see at a glance whether price is above or below each one.
- **Stocks** - the same read for individual names, with sparkline charts and cost basis markers.
- **Leverage** - margin headroom, distance to a margin call, and exposure mix, for people running a leveraged account.

The point is the dot row. Five moving averages per ticker, green above and hollow below, sorted so the weakest float to the top. You stop reading numbers and start reading shapes.

## How it works

The page is one HTML file. It reads two JSON files from the same folder:

- `watchlist.json` - what to show and how to group it
- `data.json` - price history and computed moving averages per ticker

See `sample-data/` for both files with the demo content, so you can match the shape.

In the demo build those two files are inlined into the page, so it works offline and from `file://`. If you want live data, drop real `watchlist.json` and `data.json` next to `index.html` and delete the inline block at the top of `<head>`.

## Making it yours

1. Copy `sample-data/watchlist.json` and edit the ticker groups.
2. Write a script that fetches prices, computes the moving averages, and writes `data.json` in the same shape. Any source works.
3. Serve the folder, or host it on GitHub Pages.

The dashboard does no fetching of market data itself. That is on purpose: you own the data step, the page only draws it.

## Notes

- Works offline once loaded. Add it to a phone home screen and it behaves like an app.
- Everything stays in the browser. No tracking, no backend, no keys.
- The layout is built mobile first. It scales up to desktop but it is designed for a phone.

## Licence

MIT. Do what you like with it.
