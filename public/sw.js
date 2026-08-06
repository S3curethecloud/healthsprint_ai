const CACHE_NAME = "healthsprint-ai-shell-v2";
const APP_SHELL = ["/", "/manifest.webmanifest", "/healthsprint-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        APP_SHELL.map(async (resource) => {
          const response = await fetch(resource, {
            cache: "reload",
          });

          if (!response.ok) {
            throw new Error(
              `Unable to cache ${resource}: ${response.status}`,
            );
          }

          await cache.put(resource, response);
        }),
      );
    }),
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (
          response.ok &&
          new URL(request.url).origin === self.location.origin
        ) {
          const responseClone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }

        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }

        if (request.mode === "navigate") {
          return caches.match("/");
        }

        return new Response("Offline", {
          status: 503,
          headers: {
            "Content-Type": "text/plain",
          },
        });
      }),
  );
});
