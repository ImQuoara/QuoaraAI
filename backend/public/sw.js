self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
// Security choice: do not cache authenticated pages, API responses, prompts, or generated media.
self.addEventListener('fetch', () => {});
