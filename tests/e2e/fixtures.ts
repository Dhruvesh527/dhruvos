import { test as base, expect, type Page } from "@playwright/test";

export { expect };

/** Viewports the site is designed for. */
export const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
export const TABLET = { viewport: { width: 1024, height: 768 }, isMobile: true, hasTouch: true };

/**
 * Every test fails if the page throws an uncaught error or logs a console error.
 * (404s are allowed: the browser logs one when a project has no live screenshot yet, which is expected.)
 */
export const test = base.extend<{ errors: string[] }>({
  errors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push("page error: " + error.message));
    page.on("console", message => {
      if (message.type() === "error" && !/404|Failed to load resource/.test(message.text())) errors.push("console error: " + message.text());
    });
    await use(errors);
    expect(errors, "the page should not throw or log errors").toEqual([]);
  }, { auto: true }],
});

/** Wait for every running animation (window open/close, flyouts…) to finish. */
export const settle = (page: Page) =>
  page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => undefined)))).then(() => undefined);

/** Open the site straight onto the desktop (skipping the intro) and wait until it's ready. */
export async function openDesktop(page: Page) {
  await page.goto("/?skip=1");
  await expect(page.locator(".portfolio-os")).toHaveClass(/phase-ready/);
  const phone = await page.evaluate(() => matchMedia("(max-width: 759px)").matches);
  if (!phone) await expect(page.locator('.app-window[data-window="projects"]')).toBeVisible();
  else await expect(page.locator(".phone-home")).toBeVisible();
  await page.waitForTimeout(300);
  await settle(page);
}

/** A window by app id, e.g. win(page, "about"). */
export const win = (page: Page, id: string) => page.locator(`.app-window[data-window="${id}"]`);

/** Ids of the windows that are open and not minimized. */
export const openWindows = (page: Page) =>
  page.evaluate(() => [...document.querySelectorAll<HTMLElement>(".app-window:not(.minimized)")].map(w => w.dataset.window));

/** Id of the focused (front) window. */
export const frontWindow = (page: Page) =>
  page.evaluate(() => document.querySelector<HTMLElement>(".app-window.active")?.dataset.window);

/** A window's position and size, rounded to whole pixels. */
export async function bounds(page: Page, id: string) {
  const box = await win(page, id).boundingBox();
  if (!box) throw new Error(`window "${id}" is not visible`);
  return { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) };
}

/** The saved settings object from localStorage. */
export const savedSettings = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("dhruvos-settings") ?? "{}"));

/** The current theme of the desktop ("dark" | "light"). */
export const theme = (page: Page) => page.evaluate(() => document.querySelector<HTMLElement>(".desktop-shell")?.dataset.theme);
