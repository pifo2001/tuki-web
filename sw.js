// Dos trabajos: que la app abra sin red y recibir lo que se comparte desde
// Android («Compartir → Tuki»). Una imagen compartida llega en una petición
// POST que la página no puede leer; el service worker la guarda un momento en
// una caché local del dispositivo, la página la recoge y la borra. No sale de
// ahí hasta que la página la manda a Tuki.
const COMPARTIDO = "tuki-compartido";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method === "POST" && url.pathname.endsWith("/compartir")) {
    e.respondWith((async () => {
      const base = new URL("./", url).pathname;
      try {
        const datos = await e.request.formData();
        const img = datos.get("imagen");
        if (img && img.size) {
          const c = await caches.open(COMPARTIDO);
          await c.put("/imagen-compartida", new Response(img, { headers: { "content-type": img.type || "image/jpeg" } }));
          return Response.redirect(`${base}?compartido=imagen`, 303);
        }
        const q = new URLSearchParams();
        for (const k of ["title", "text", "url"]) if (datos.get(k)) q.set(k, datos.get(k));
        return Response.redirect(`${base}?${q}`, 303);
      } catch {
        return Response.redirect(base, 303);
      }
    })());
  }
});
