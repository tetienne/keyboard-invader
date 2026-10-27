// Service worker: precaches the whole build so the game works offline once installed.
// Built as /sw.js by the `pwa` plugin in vite.config.ts, which also fills in the file list.

interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void
}
interface FetchEvent extends ExtendableEvent {
  readonly request: Request
  respondWith(response: Response | Promise<Response>): void
}
interface WorkerScope {
  readonly clients: { claim(): Promise<void> }
  readonly location: Location
  addEventListener(type: 'install' | 'activate', listener: (e: ExtendableEvent) => void): void
  addEventListener(type: 'fetch', listener: (e: FetchEvent) => void): void
}
declare const self: WorkerScope
// A module, so `self` above shadows the DOM global instead of clashing with it.
export {}

// Replaced at build time; the version changes whenever any file does.
const { version, files } = JSON.parse('__PWA_MANIFEST__') as { version: string; files: string[] }
const PREFIX = 'keyboard-invader-'
const CACHE = PREFIX + version

self.addEventListener('install', (e) => {
  // Bypass the HTTP cache: public files keep their name across versions.
  const requests = files.map((f) => new Request(f, { cache: 'reload' }))
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(requests)))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  if (req.mode === 'navigate') {
    // Online players get the latest version; offline ones the cached one.
    e.respondWith(fetch(req).catch(() => cached('/')))
    return
  }
  // Built assets have hashed names, so a cached copy is never stale. Vary is ignored:
  // module scripts send an Origin header the precache requests did not.
  e.respondWith(caches.match(req, { ignoreVary: true }).then((hit) => hit ?? fetch(req)))
})

async function cached(url: string): Promise<Response> {
  return (await caches.match(url)) ?? Response.error()
}
