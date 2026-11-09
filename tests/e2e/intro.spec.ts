import { test, expect, settle } from "./fixtures";

// The first-visit story: power button → boot → lock screen → sign in → desktop.

test("power on, unlock and sign in with the keyboard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Power on portfolio" }).click();

  // The laptop boots and zooms into the lock screen.
  const os = page.locator(".portfolio-os");
  await expect(os).toHaveClass(/phase-lock/, { timeout: 15_000 });

  await page.keyboard.press("Enter"); // unlock
  await expect(page.locator(".lock-screen")).toHaveClass(/stage-signin/);
  await page.waitForTimeout(400);
  await page.keyboard.press("Enter"); // "Sign in" is focused
  await expect(page.locator(".signin-welcome")).toBeVisible();

  await expect(os).toHaveClass(/phase-ready/, { timeout: 10_000 });
  await expect(page.locator(".taskbar")).toBeVisible();
  await expect(page.locator('.app-window[data-window="projects"]')).toBeVisible();
  await expect(page.locator(".notif-toast")).toContainText("Start with Ozzat");
});

test("Skip intro goes straight to the desktop", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Power on portfolio" }).click();
  await page.locator(".skip-boot").click();
  await expect(page.locator(".portfolio-os")).toHaveClass(/phase-ready/);
  await expect(page.locator(".taskbar")).toBeVisible();
});

test("the intro plays once per visit: a reload skips it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Power on portfolio" }).click();
  await page.locator(".skip-boot").click();
  await expect(page.locator(".portfolio-os")).toHaveClass(/phase-ready/);
  await page.reload();
  await expect(page.locator(".portfolio-os")).toHaveClass(/phase-ready/);
  await expect(page.getByRole("button", { name: "Power on portfolio" })).toHaveCount(0);
});

test("Reduce motion from Quick Settings", async ({ page }) => {
  await page.goto("/?skip=1");
  await expect(page.locator(".portfolio-os")).toHaveClass(/phase-ready/);
  await settle(page);
  await page.locator('[data-flyout-toggle="quick"]').click();
  await page.locator(".qs-tile", { hasText: "Reduce motion" }).click();
  await expect(page.locator(".portfolio-os")).toHaveAttribute("data-motion", "reduced");
});
