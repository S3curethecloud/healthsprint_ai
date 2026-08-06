const CACHE_NAME = "healthsprint-ai-shell-v5";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/healthsprint-icon-192.png",
  "/healthsprint-icon-512.png",
  "/healthsprint-maskable-512.png",
];

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

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);

    if (response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    const cachedResponse = await cache.match(request, {
      ignoreSearch: true,
    });

    if (cachedResponse) {
      return cachedResponse;
    }

    const shellResponse =
      (await cache.match("/", { ignoreSearch: true })) ||
      (await caches.match("/", { ignoreSearch: true }));

    if (shellResponse) {
      return shellResponse;
    }

    return new Response("HealthSprint AI is currently offline.", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const networkResponse = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
      }

      return response;
    })
    .catch(() => null);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await networkResponse;

  if (response) {
    return response;
  }

  return new Response("Resource unavailable while offline.", {
    status: 503,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "image" ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
