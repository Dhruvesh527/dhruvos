import { test, expect, PHONE, TABLET, bounds, openDesktop, openWindows, settle, win } from "./fixtures";

// Phones get a home screen + dock + home bar; touch tablets open apps full-size.

test.describe("phone", () => {
  test.use(PHONE);
  test.beforeEach(async ({ page }) => { await openDesktop(page); });

  test("starts on the home screen with every app and a dock", async ({ page }) => {
    expect(await openWindows(page)).toEqual([]);
    // Every visible app + Simple view (apps with no content yet, like Achievements, stay hidden).
    await expect(page.locator(".phone-app")).toHaveCount(11);
    await expect(page.locator(".phone-dock .dock-item")).toHaveCount(5);
    await expect(page.locator(".taskbar")).toHaveCount(0);
  });

  test("apps zoom out of their icon and fill the screen; ‹ back closes them", async ({ page }) => {
    // Tap from inside the page and sample ~60 ms later (Playwright's own tap delay can outlast the zoom).
    const midway = await page.evaluate(async () => {
      document.querySelector<HTMLElement>('.phone-app[data-app="about"]')!.click();
      await new Promise(resolve => setTimeout(resolve, 60));
      const element = document.querySelector<HTMLElement>('.app-window[data-window="about"]');
      return element ? getComputedStyle(element).transform : "missing";
    });
    expect(midway, "the app should be zooming in").not.toMatch(/^(none|missing)$/);
    await settle(page);
    expect((await bounds(page, "about")).w).toBe(390);
    await expect(page.locator(".phone-homebar")).toHaveCount(1);
    await expect(page.locator(".phone-dock")).toHaveCount(0);

    await page.locator(".window-back").tap();
    await expect(win(page, "about")).toHaveCount(0);
    await expect(page.locator(".phone-dock")).toHaveCount(1);
  });

  test("tapping the home bar goes home and keeps the app running", async ({ page }) => {
    await page.locator('.dock-item[data-app="terminal"]').tap();
    await settle(page);
    await page.locator(".phone-pill").tap();
    await expect.poll(() => openWindows(page)).toEqual([]);
    await expect(win(page, "terminal")).toHaveCount(1);
    await expect(page.locator('.dock-item[data-app="terminal"].running')).toHaveCount(1);
  });

  test("swiping up on the home bar goes home (mouse/pen too)", async ({ page }) => {
    await page.locator('.phone-app[data-app="projects"]').tap();
    await settle(page);
    const pill = (await page.locator(".phone-pill").boundingBox())!;
    await page.mouse.move(pill.x + pill.width / 2, pill.y + pill.height / 2);
    await page.mouse.down();
    await page.mouse.move(pill.x + pill.width / 2, pill.y - 60, { steps: 5 });
    await page.mouse.up();
    await expect.poll(() => openWindows(page)).toEqual([]);
  });

  test("recent apps shows every open app", async ({ page }) => {
    for (const id of ["terminal", "projects", "about"]) {
      if (id !== "terminal") { await page.locator(".phone-pill").tap(); await settle(page); }
      await page.locator(`.phone-app[data-app="${id}"]`).tap();
      await settle(page);
    }
    await page.getByRole("button", { name: "Recent apps" }).tap();
    await expect(page.locator(".ts-card")).toHaveCount(3);
    await expect(page.locator(".ts-hint .touch-hint")).toBeVisible();
  });

  test("status bar: icons open Quick Settings, the time opens notifications", async ({ page }) => {
    await page.locator('.phone-status [data-flyout-toggle="quick"]').tap();
    await expect(page.locator(".quick-settings")).toBeVisible();
    await page.locator('.phone-status [data-flyout-toggle="quick"]').tap();
    await expect(page.locator(".quick-settings")).toHaveCount(0);
    await page.locator('.phone-status [data-flyout-toggle="notifications"]').tap();
    await expect(page.locator(".notification-center")).toBeVisible();
  });

  test("nothing overflows sideways", async ({ page }) => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});

test.describe("touch tablet", () => {
  test.use(TABLET);

  test("apps open maximized with bigger taskbar buttons", async ({ page }) => {
    await openDesktop(page);
    await page.locator('.tb-item[data-app="about"]').tap();
    await settle(page);
    expect(await bounds(page, "about")).toMatchObject({ x: 0, w: 1024 });
    const button = (await page.locator(".tb-item").first().boundingBox())!;
    expect(Math.round(button.width)).toBeGreaterThanOrEqual(50);
  });
});
