// 把根目錄的網站檔案複製到 docs/(GitHub Pages 對外的那份)。
// 改完根目錄的檔案後跑一次:npm run sync
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SITE_FILES = [
  "index.html", "sw.js", "manifest.json", "CHANGELOG.md",
  "icon-192.png", "icon-512.png", "apple-touch-icon.png",
  "data.json", "watchlist.json", "leverage-data.js", "asset-data.js", "expense-data.js",
  "asset-portfolio.json", "asset-balances.json", "asset-milestones.json", "asset-history.json",
];
export const SITE_DIRS = ["css", "js"];

export function siteFileList() {
  const out = [...SITE_FILES];
  for (const d of SITE_DIRS) {
    for (const f of fs.readdirSync(path.join(REPO, d)).sort()) out.push(`${d}/${f}`);
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const d of SITE_DIRS) fs.rmSync(path.join(REPO, "docs", d), { recursive: true, force: true });
  for (const f of siteFileList()) {
    const to = path.join(REPO, "docs", f);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(REPO, f), to);
  }
  console.log(`docs/ 已同步 ${siteFileList().length} 個檔案`);
}
