const VERSION = "v1"
const STATIC_CACHE = `vartick-static-${VERSION}`
const PAGES_CACHE = `vartick-pages-${VERSION}`

/*
  Activate the new worker immediately instead of waiting for existing tabs to close.

  - The timer state lives in IndexedDB, and the worker only handles network requests.
  - Versioned caches keep each worker's cached responses isolated.
*/
self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  const deleteOldCaches = async () => {
    const keys = await caches.keys()
    const allOldCaches = keys.filter((key) => !key.endsWith(VERSION))

    await Promise.all(allOldCaches.map((key) => caches.delete(key)))
  }

  const activateWorker = async () => {
    await deleteOldCaches()
    await self.clients.claim()
  }

  event.waitUntil(activateWorker())
})

// Hashed URLs change with the content, so cached responses stay current.
const isImmutable = (url) => url.pathname.startsWith("/_next/static/")

const isAsset = (request) =>
  request.destination === "image" ||
  request.destination === "font" ||
  request.destination === "style" ||
  request.destination === "script"

const cacheFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone())
  return response
}

const networkFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName)

  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) return cached

    // Offline and never visited: the start URL is the closest thing to a shell.
    const fallback = await cache.match("/")
    if (fallback) return fallback
    throw error
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGES_CACHE))
    return
  }

  if (isImmutable(url) || isAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  }
})
