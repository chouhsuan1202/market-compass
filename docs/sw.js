/* Market Compass service worker
   策略：network first, cache fallback。
   一律先抓網路上的最新版本，成功就順手更新快取；沒網路才拿快取的上一版。
   不可以改成 cache first，那會讓面板顯示過期的價格與均線訊號。
   改動這個檔案時記得把 CACHE 的版本號加一，舊快取才會被清掉。 */

var CACHE = "compass-v69";

var PRECACHE = [
  "./",
  "index.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // 個別失敗不要讓整個安裝掛掉
      return Promise.all(
        PRECACHE.map(function (url) {
          return cache.add(url).catch(function () {});
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          return k === CACHE ? null : caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;

  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // 登入頁與登入動作不進快取，免得把「未登入」的畫面留下來
  if (url.pathname.indexOf("/__login") === 0) return;

  event.respondWith(
    fetch(req)
      .then(function (res) {
        // 只快取真正的內容。401（未登入）與轉址不要存，否則登入後還是拿到擋人的那頁
        if (res && res.ok && res.type === "basic") {
          var copy = res.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(req, copy).catch(function () {});
          });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          if (hit) return hit;
          // 導覽請求沒有對應快取時，退回首頁的快取版本
          if (req.mode === "navigate") {
            return caches.match("index.html").then(function (home) {
              return home || caches.match("./");
            });
          }
          return Response.error();
        });
      })
  );
});
