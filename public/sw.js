const CACHE = "vahanova-v9";

// Firebase Cloud Messaging is added to this existing PWA worker so the app
// keeps one root-scoped service worker instead of competing registrations.
try {
  const encodedConfig = new URL(self.location.href).searchParams.get("firebaseConfig");
  if (encodedConfig) {
    importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
    importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");
    firebase.initializeApp(JSON.parse(encodedConfig));
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const data = payload.data || {};
      const title = data.title || "New VAHANOVA request";
      self.registration.showNotification(title, {
        body: data.body || "A new service request is waiting.",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: data.tag || `vahanova-request-${data.requestId || "new"}`,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: { url: data.url || "/mechanic#requests" },
      });
    });
  }
} catch (error) {
  // Offline startup must still leave the normal PWA cache worker operational.
  console.error("VAHANOVA push messaging could not initialize:", error);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.url || "/mechanic#requests";
  const target = new URL(path, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin) {
          return client.navigate(target).then(() => client.focus());
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
const SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/brand/mark.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Firestore, Google auth and map tiles stay on the network — never cached here.
  if (url.origin !== self.location.origin) return;

  // Pages: always try the network first so a customer never sees a stale screen.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }

  // Build chunks and brand images are versioned by filename, so cache them hard.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/brand/") || url.pathname.endsWith(".png")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
  }
});
