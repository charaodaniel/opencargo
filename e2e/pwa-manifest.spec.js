/**
 * ── OpenCargo — PWA Manifest E2E Tests ───────────────
 * Valida o manifesto PWA, temas, ícones e configurações
 * necessárias para instalação como Progressive Web App.
 */

import { test, expect } from "@playwright/test";

/**
 * Helper: navega para a página raiz com waitUntil domcontentloaded.
 * As páginas que verificam meta tags/links não precisam aguardar
 * o carregamento completo (load event), pois o DOM já está pronto.
 */
async function gotoRoot(page) {
  await page.goto("/", { timeout: 20000, waitUntil: "domcontentloaded" });
}

test.describe("PWA Manifest", () => {
  test("manifest.json is served with correct content type", async ({ request }) => {
    const response = await request.get("/manifest.json");
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("application/json");
  });

  test("manifest.json has required PWA fields", async ({ request }) => {
    const res = await request.get("/manifest.json");
    const manifest = await res.json();

    // Campos obrigatórios para PWA installable
    expect(manifest).toHaveProperty("name");
    expect(manifest).toHaveProperty("short_name");
    expect(manifest).toHaveProperty("start_url");
    expect(manifest).toHaveProperty("display");
    expect(manifest).toHaveProperty("icons");
    expect(manifest).toHaveProperty("theme_color");

    // Valores esperados
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(Array.isArray(manifest.icons)).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    // Pelo menos um ícone 192x192 e um 512x512
    const sizes = manifest.icons.map((icon) => icon.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");

    // Ícones devem ter tipo definido
    manifest.icons.forEach((icon) => {
      expect(icon).toHaveProperty("type");
      expect(icon).toHaveProperty("src");
    });
  });

  test("manifest icons are accessible", async ({ request }) => {
    const res = await request.get("/manifest.json");
    const manifest = await res.json();

    for (const icon of manifest.icons) {
      const iconRes = await request.get(icon.src);
      expect(iconRes.ok()).toBeTruthy();
    }
  });

  test("theme-color meta tag is present", async ({ page }) => {
    await gotoRoot(page);
    const themeColor = await page.$('meta[name="theme-color"]');
    expect(themeColor).not.toBeNull();
    const content = await themeColor.getAttribute("content");
    expect(content).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test("apple-mobile-web-app-capable meta tag is present", async ({ page }) => {
    await gotoRoot(page);
    const meta = await page.$('meta[name="apple-mobile-web-app-capable"]');
    expect(meta).not.toBeNull();
    expect(await meta.getAttribute("content")).toBe("yes");
  });

  test("viewport includes viewport-fit=cover for safe areas", async ({ page }) => {
    await gotoRoot(page);
    const viewport = await page.$('meta[name="viewport"]');
    expect(viewport).not.toBeNull();
    const content = await viewport.getAttribute("content");
    expect(content).toContain("viewport-fit=cover");
  });

  test("apple-touch-icon links are present", async ({ page }) => {
    await gotoRoot(page);
    const links = await page.$$('link[rel="apple-touch-icon"]');
    expect(links.length).toBeGreaterThanOrEqual(1);

    // Verifica se os ícones são acessíveis
    for (const link of links) {
      const href = await link.getAttribute("href");
      const iconRes = await page.request.get(href);
      expect(iconRes.ok()).toBeTruthy();
    }
  });
});
