import { test, expect, PHONE, openDesktop, openWindows, settle, theme } from "./fixtures";

// Start menu, search (taskbar button and type-anywhere), search commands, power menu.

const searchBox = (page: import("@playwright/test").Page) => page.locator(".sm-search input");

test.describe("Start and search", () => {
  test.beforeEach(async ({ page }) => { await openDesktop(page); });

  test("Start opens with search focused, pinned apps and recommendations", async ({ page }) => {
    await page.locator("#start-button").click();
    await expect(searchBox(page)).toBeFocused();
    expect(await page.locator(".sm-tile").count()).toBeGreaterThanOrEqual(8);
    await expect(page.locator(".sm-rec")).toHaveCount(4);
  });

  test("searching 'next' ranks Next.js first; Enter opens the project", async ({ page }) => {
    await page.locator("#start-button").click();
    await page.keyboard.type("next");
    await expect(page.locator(".sm-result").first()).toContainText("Next.js");
    await page.keyboard.press("Enter");
    await expect.poll(() => openWindows(page)).toContain("project");
  });

  test("All apps is alphabetical; Escape closes Start", async ({ page }) => {
    await page.locator("#start-button").click();
    await page.locator(".sm-pill", { hasText: "All apps" }).click();
    expect(await page.locator(".sm-letter").count()).toBeGreaterThanOrEqual(4);
    await page.keyboard.press("Escape");
    await expect(page.locator(".start-menu")).toHaveCount(0);
  });

  test("typing on the desktop opens search without losing a letter", async ({ page }) => {
    await page.getByRole("button", { name: "Show desktop" }).click();
    await settle(page);
    await page.mouse.click(900, 500);
    await page.keyboard.type("res");
    await expect(searchBox(page)).toHaveValue("res");
    await expect(page.locator(".sm-result").first()).toContainText("Résumé");
    await page.keyboard.press("Enter");
    await expect.poll(() => openWindows(page)).toContain("resume");
  });

  test("search suggestions, and the 'light mode' command", async ({ page }) => {
    await page.locator(".tb-search").click();
    expect(await page.locator(".sm-result").count()).toBeGreaterThanOrEqual(3);
    expect(await page.locator(".sm-chips button").count()).toBeGreaterThanOrEqual(4);
    await page.keyboard.type("light mode");
    await page.keyboard.press("Enter");
    await expect.poll(() => theme(page)).toBe("light");
  });

  test("no results shows chips; first Escape clears, second closes", async ({ page }) => {
    await page.locator(".tb-search").click();
    await page.keyboard.type("zzz");
    expect(await page.locator(".sm-empty .sm-chips button").count()).toBeGreaterThanOrEqual(3);
    await page.keyboard.press("Escape");
    await expect(searchBox(page)).toHaveValue("");
    await page.keyboard.press("Escape");
    await expect(page.locator(".start-menu")).toHaveCount(0);
  });

  test("Power → Restart replays the boot, then only Projects is open", async ({ page }) => {
    await page.locator('.tb-item[data-app="about"]').click();
    await page.locator("#start-button").click();
    await page.locator(".sm-power-button").click();
    await page.locator(".sm-power-menu button", { hasText: "Restart" }).click();
    await expect(page.locator(".power-overlay")).toBeVisible();
    await expect(page.locator(".portfolio-os")).toHaveClass(/phase-(revealing|booting|desktop|entering|lock)/, { timeout: 8_000 });
    await page.locator(".skip-boot").click();
    await expect(page.locator(".portfolio-os")).toHaveClass(/phase-ready/);
    await expect.poll(() => openWindows(page)).toEqual(["projects"]);
  });

  test("Power → Shut down returns to the power button", async ({ page }) => {
    await page.locator("#start-button").click();
    await page.locator(".sm-power-button").click();
    await page.locator(".sm-power-menu button", { hasText: "Shut down" }).click();
    await expect(page.locator(".portfolio-os")).toHaveClass(/phase-off/, { timeout: 8_000 });
    await expect(page.getByRole("button", { name: "Power on portfolio" })).toBeVisible();
  });
});

test.describe("phone", () => {
  test.use(PHONE);

  test("Start fits the screen", async ({ page }) => {
    await openDesktop(page);
    await page.locator("#start-button").tap();
    await settle(page);
    const box = (await page.locator(".start-menu").boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  });
});
