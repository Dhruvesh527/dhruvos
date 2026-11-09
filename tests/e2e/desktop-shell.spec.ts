import { test, expect, openDesktop, savedSettings, settle, theme } from "./fixtures";

// The desktop itself: taskbar, tray flyouts, themes, wallpapers, icons, lock.

test.beforeEach(async ({ page }) => { await openDesktop(page); });

test("hovering a taskbar app shows a live preview", async ({ page }) => {
  await page.locator('.tb-item[data-app="projects"]').hover();
  await expect(page.locator(".tb-preview")).toBeVisible();
});

test("Quick Settings: light theme and accent colour, saved across reloads", async ({ page }) => {
  await page.locator('[data-flyout-toggle="quick"]').click();
  await expect(page.locator(".quick-settings")).toBeVisible();
  await page.locator(".qs-tile").first().click();
  await page.getByRole("radio", { name: "Purple" }).click();
  expect(await theme(page)).toBe("light");

  await page.keyboard.press("Escape");
  await expect(page.locator(".quick-settings")).toHaveCount(0);

  await page.reload();
  await expect(page.locator(".portfolio-os")).toHaveClass(/phase-ready/);
  expect(await theme(page)).toBe("light");
  expect((await savedSettings(page)).accent).toBe("purple");
});

test("notification centre opens and clears the badge", async ({ page }) => {
  await page.locator('[data-flyout-toggle="notifications"]').click();
  await expect(page.locator(".notification-center")).toBeVisible();
  await expect(page.locator(".tb-badge")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.locator(".notification-center")).toHaveCount(0);
});

test("right-click the desktop → Wallpaper → Aurora", async ({ page }) => {
  await page.getByRole("button", { name: "Minimize Projects" }).first().click();
  await settle(page);
  await page.mouse.click(900, 420, { button: "right" });
  await expect(page.locator(".context-menu")).toBeVisible();
  await page.locator(".cm-item", { hasText: "Wallpaper" }).hover();
  await page.locator(".context-menu.submenu .cm-item", { hasText: "Aurora" }).click();
  await expect.poll(async () => (await savedSettings(page)).wallpaper).toBe("aurora");
});

test("desktop icons can be dragged to a new cell, and the spot is saved", async ({ page }) => {
  await page.getByRole("button", { name: "Minimize Projects" }).first().click();
  await settle(page);
  const icon = page.locator('.desktop-icon[data-app="about"]');
  const before = (await icon.boundingBox())!;
  await page.mouse.move(before.x + before.width / 2, before.y + 30);
  await page.mouse.down();
  await page.mouse.move(before.x + 300, before.y + 200, { steps: 8 });
  await page.mouse.up();
  const after = (await icon.boundingBox())!;
  expect(after.x).toBeGreaterThan(before.x + 150);
  expect((await savedSettings(page)).iconPositions?.about).toBeTruthy();
});

test("drag-selecting on the desktop selects icons (without selecting text)", async ({ page }) => {
  await page.getByRole("button", { name: "Minimize Projects" }).first().click();
  await settle(page);
  await page.mouse.move(4, 4);
  await page.mouse.down();
  await page.mouse.move(110, 360, { steps: 6 });
  await expect(page.locator(".selection-band")).toBeVisible();
  await page.mouse.up();
  expect(await page.locator(".desktop-icon.selected").count()).toBeGreaterThanOrEqual(2);
  expect(await page.evaluate(() => getSelection()?.toString() ?? "")).toBe("");
});

test("Lock from Quick Settings, then sign back in", async ({ page }) => {
  await page.locator('[data-flyout-toggle="quick"]').click();
  await page.locator(".qs-tile", { hasText: "Lock" }).click();
  await expect(page.locator(".lock-screen")).toBeVisible();
  await page.waitForTimeout(600);
  await page.keyboard.press("Enter");
  await expect(page.locator(".lock-screen")).toHaveClass(/stage-signin/);
  await page.waitForTimeout(400);
  await page.keyboard.press("Enter");
  await expect(page.locator(".portfolio-os")).toHaveClass(/phase-ready/, { timeout: 8_000 });
  await expect(page.locator(".lock-screen")).toHaveCount(0);
});
