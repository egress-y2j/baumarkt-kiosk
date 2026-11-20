// Service Worker: speichert die App beim ersten Laden und liefert sie danach auch ohne Internet.
// Bei Änderungen an der App die Versionsnummer erhöhen (kiosk-v9 -> kiosk-v10).
// Bilder liegen in einem eigenen Speicher (kiosk-img) und bleiben bei App-Updates erhalten.
var V = "kiosk-v9", IMG = "kiosk-img";
var CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "shops/demo.json"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(CORE.map(function (u) { return new Request(u, { cache: "reload" }); })); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== V && k !== IMG; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Zuerst aus dem Zwischenspeicher, im Hintergrund aktualisieren
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var cn = /\/images\//.test(e.request.url) ? IMG : V;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(e.request).then(function (r) {
        if (r && (r.ok || r.type === "opaque")) {
          var copy = r.clone();
          caches.open(cn).then(function (c) { c.put(e.request, copy); });
        }
        return r;
      }).catch(function () { return hit || caches.match("index.html"); });
      return hit || net;
    })
  );
});
