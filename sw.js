/**
 * DOOM - Eternal Nightmare — Service Worker
 * Strategy: Cache-first for static assets, network-first for Three.js CDN.
 */

const CACHE_NAME = "doom-v1";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./src/ai/AIBehavior.js",
  "./src/ai/ChaseState.js",
  "./src/ai/PatrolState.js",
  "./src/ai/SearchState.js",
  "./src/config/GameConfig.js",
  "./src/core/EventManager.js",
  "./src/core/Game.js",
  "./src/core/InputManager.js",
  "./src/core/MenuModelViewer.js",
  "./src/core/Renderer.js",
  "./src/core/TouchInputManager.js",
  "./src/data/sprites.js",
  "./src/entities/Enemy.js",
  "./src/entities/EnemyFactory.js",
  "./src/entities/Player.js",
  "./src/managers/GameStateManager.js",
  "./src/managers/ResourceManager.js",
  "./src/systems/AudioSystem.js",
  "./src/utils/MapGenerator.js",
  "./src/utils/RayCaster.js",
  "./src/utils/Vector2D.js",
  "./src/weapons/Weapon.js",
  "./src/weapons/WeaponFactory.js",
  "./src/weapons/models/grenade_launcher.js",
  "./src/weapons/models/pistol.js",
  "./src/weapons/models/plasma.js",
  "./src/weapons/models/rifle.js",
  "./src/weapons/models/shotgun.js",
  "./src/weapons/models/smg.js",
  "./src/weapons/models/sniper.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/icon.svg",
  "./icons/screenshot-narrow.png",
  "./icons/screenshot-wide.png",
];

// CDN assets (Three.js) — cache on first fetch, serve from cache afterwards
const CDN_CACHE_NAME = "doom-cdn-v1";

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== CDN_CACHE_NAME)
            .map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // CDN assets (Three.js, fonts) — cache first, then network
  if (
    url.hostname === "cdn.jsdelivr.net" ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(
      caches.open(CDN_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          return cached;
        }
        const response = await fetch(request);
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      }),
    );
    return;
  }

  // Local static assets — cache first, fallback to network
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request)),
    );
  }
});
