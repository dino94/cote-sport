// public/sw.js
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Handler fetch minimal (nécessaire pour Chrome Android)
self.addEventListener("fetch", (event) => {
  // Laisse passer toutes les requêtes normalement
  // Ne fait rien de spécial, mais "existe" pour Chrome
});