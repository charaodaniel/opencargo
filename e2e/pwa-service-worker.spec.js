/**
 * ── OpenCargo — Service Worker E2E Tests ────────────
 * Valida o registro, instalação, ativação e estratégias
 * de cache do Service Worker.
 */

import { test, expect } from "@playwright/test";

/**
 * Helper: aguarda o Service Worker ser registrado e atingir o estado "activated".
 * Usa polling a cada ~500ms (padrão Playwright) com timeout de 15s.
 * A instalação do SW chama self.skipWaiting(), portanto o SW deve
 * ativar e assumir o controle da página via clients.claim().
 */
async function waitForSWActivated(page) {
  await page.waitForFunction(
    () =>
      navigator.serviceWorker.controller?.state === "activated" ||
      false,
    { timeout: 15000 }
  );
}

test.describe("Service Worker", () => {
  test("SW is registered and activated after page load", async ({ page }) => {
    await page.goto("/", { timeout: 15000 });
    await waitForSWActivated(page);

    const hasSW = await page.evaluate(() => "serviceWorker" in navigator);
    expect(hasSW).toBeTruthy();

    const swState = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return {
        active: !!registration.active,
        scope: registration.scope,
        state: registration.active?.state,
      };
    });

    expect(swState.active).toBeTruthy();
    expect(swState.state).toBe("activated");
    expect(swState.scope).toContain("/");
  });

  test("SW caches static assets on install", async ({ page }) => {
    await page.goto("/", { timeout: 15000 });
    await waitForSWActivated(page);

    const cacheKeys = await page.evaluate(async () => {
      const keys = await caches.keys();
      return keys.filter((k) => k.startsWith("opencargo-static-"));
    });

    expect(cacheKeys.length).toBeGreaterThanOrEqual(1);

    const cacheName = cacheKeys[0];
    const cachedUrls = await page.evaluate(async (name) => {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      return requests.map((r) => r.url);
    }, cacheName);

    expect(
      cachedUrls.some((url) => url.includes("/index.html"))
    ).toBeTruthy();
    expect(
      cachedUrls.some((url) => url.includes("/offline.html"))
    ).toBeTruthy();
    expect(
      cachedUrls.some((url) => url.includes("/manifest.json"))
    ).toBeTruthy();
    expect(
      cachedUrls.some((url) => url.includes("app.js"))
    ).toBeTruthy();
    expect(
      cachedUrls.some((url) => url.includes("style.css"))
    ).toBeTruthy();
  });

  test("SW serves offline.html for navigation when offline", async ({
    page,
    context,
  }) => {
    // 1. Carrega a página e espera o SW ativar
    await page.goto("/", { timeout: 15000 });
    await waitForSWActivated(page);

    // 2. Desconecta o browser
    await context.setOffline(true);

    try {
      // 3. Usa evaluate + location.href em vez de page.goto porque
      //    page.goto cria uma navegação fresca que pode falhar antes
      //    do SW interceptar (ERR_INTERNET_DISCONNECTED).
      //    Já location.href mantém o controle do SW.
      await page.evaluate(() => {
        window.location.href = "/some-unknown-page";
      });

      // Aguarda a página offline carregar
      await page.waitForURL("**/some-unknown-page", { timeout: 15000 });
      await page.waitForLoadState("domcontentloaded", { timeout: 10000 });

      const title = await page.title();
      expect(title).toContain("Offline");
    } finally {
      await context.setOffline(false);
    }
  });

  test("SW serves cached assets when offline", async ({
    page,
    context,
  }) => {
    // 1. Carrega e ativa o SW
    await page.goto("/", { timeout: 15000 });
    await waitForSWActivated(page);

    // 2. Desconecta
    await context.setOffline(true);

    try {
      // 3. Recarrega via evaluate (mantém controle do SW)
      await page.evaluate(() => {
        window.location.reload();
      });

      await page.waitForLoadState("domcontentloaded", { timeout: 15000 });

      // O app root deve estar presente (indica que o HTML veio do cache)
      const appRoot = await page.$("#app");
      expect(appRoot).not.toBeNull();
    } finally {
      await context.setOffline(false);
    }
  });

  test("CDN cache is created if external CDNs are reachable", async ({
    page,
  }) => {
    await page.goto("/", { timeout: 15000 });
    await waitForSWActivated(page);

    const hasCDNCache = await page.evaluate(async () => {
      const keys = await caches.keys();
      return keys.some((k) => k.startsWith("opencargo-cdn-"));
    });

    // CDN cache depende de acesso externo — não falha se não existir,
    // apenas registra um warning.
    if (!hasCDNCache) {
      test.info().annotations.push({
        type: "warning",
        description:
          "Cache CDN não encontrado — pode ser esperado em ambientes sem acesso externo.",
      });
    }
  });

  test("API cache is created (Network First strategy)", async ({
    page,
  }) => {
    await page.goto("/", { timeout: 15000 });
    await waitForSWActivated(page);

    const hasApiCache = await page.evaluate(async () => {
      const keys = await caches.keys();
      return keys.some((k) => k.startsWith("opencargo-api-"));
    });

    expect(hasApiCache).toBeTruthy();
  });
});
