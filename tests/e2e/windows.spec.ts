import type { Page } from "@playwright/test";
import { test, expect, PHONE, bounds, frontWindow, openDesktop, settle, win } from "./fixtures";

/**
 * Click a window's title-bar button from inside the page and return the animation it starts:
 * its duration and its final keyframe. Reading it synchronously right after the click makes the
 * check independent of how busy the machine is (no timers racing a 160 ms animation).
 */
const animationFrom = (page: Page, id: string, button: string) =>
  page.evaluate(({ id, button }) => {
    const element = document.querySelector<HTMLElement>(`.app-window[data-window="${id}"]`)!;
    element.querySelector<HTMLButtonElement>(`.window-titlebar button[aria-label="${button}"]`)!.click();
    // The newest scripted animation (the window's CSS open animation can still be listed first).
    const animation = element.getAnimations().filter(a => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition)).pop();
    if (!animation) return null;
    const frames = (animation.effect as KeyframeEffect).getKeyframes();
    const last = frames[frames.length - 1];
    return {
      duration: Number(animation.effect?.getTiming().duration),
      endOpacity: last.opacity === undefined ? 1 : Number(last.opacity),
      endTransform: String(last.transform ?? "none"),
    };
  }, { id, button });

// The window manager: resize, snap, maximize, minimize/restore, close, Task view, Show desktop.
// Desktop viewport is 1440 × 900.

test.describe("desktop windows", () => {
  test.beforeEach(async ({ page }) => { await openDesktop(page); });

  test("resize from the corner, but never below the minimum size", async ({ page }) => {
    const before = await bounds(page, "projects");
    await page.mouse.move(before.x + before.w - 4, before.y + before.h - 4);
    await page.mouse.down();
    await page.mouse.move(before.x + before.w - 204, before.y + before.h - 104, { steps: 8 });
    await page.mouse.up();
    const after = await bounds(page, "projects");
    expect(Math.abs(after.w - (before.w - 200))).toBeLessThanOrEqual(3);
    expect(Math.abs(after.h - (before.h - 100))).toBeLessThanOrEqual(3);

    await page.mouse.move(after.x + after.w - 4, after.y + after.h - 4);
    await page.mouse.down();
    await page.mouse.move(after.x + 10, after.y + 10, { steps: 6 });
    await page.mouse.up();
    const smallest = await bounds(page, "projects");
    expect(smallest.w).toBeGreaterThanOrEqual(379);
    expect(smallest.h).toBeGreaterThanOrEqual(259);
  });

  test("drag to the left edge shows a preview and snaps to the left half", async ({ page }) => {
    const bar = (await win(page, "projects").locator(".window-titlebar").boundingBox())!;
    await page.mouse.move(bar.x + 120, bar.y + 15);
    await page.mouse.down();
    await page.mouse.move(400, 300, { steps: 6 });
    await page.mouse.move(1, 400, { steps: 10 });
    await expect(page.locator(".snap-preview")).toBeVisible();
    await page.mouse.up();
    await settle(page);
    const snapped = await bounds(page, "projects");
    expect(snapped).toMatchObject({ x: 0, y: 0 });
    expect(Math.abs(snapped.w - 720)).toBeLessThanOrEqual(2);
  });

  test("snap layouts on the maximize button, then drag out to un-snap", async ({ page }) => {
    await page.locator('.tb-item[data-app="about"]').click();
    await settle(page);
    await win(page, "about").locator(".maximize-control").hover();
    await expect(page.locator(".snap-layouts")).toBeVisible();
    await win(page, "about").locator(".snap-cell.zone-half-right").click();
    await settle(page);
    const right = await bounds(page, "about");
    expect(Math.abs(right.x - 720)).toBeLessThanOrEqual(2);
    expect(Math.abs(right.w - 720)).toBeLessThanOrEqual(2);

    // Dragging a snapped window away gives it back its normal size (About is 900 wide).
    const bar = (await win(page, "about").locator(".window-titlebar").boundingBox())!;
    await page.mouse.move(bar.x + 200, bar.y + 15);
    await page.mouse.down();
    await page.mouse.move(bar.x + 150, bar.y + 200, { steps: 10 });
    await page.mouse.up();
    await settle(page);
    expect(Math.abs((await bounds(page, "about")).w - 900)).toBeLessThanOrEqual(2);
  });

  test("double-click the title bar to maximize and restore", async ({ page }) => {
    const before = await bounds(page, "projects");
    await win(page, "projects").locator(".window-title").dblclick();
    await settle(page);
    expect(await bounds(page, "projects")).toMatchObject({ x: 0, y: 0, w: 1440 });
    await win(page, "projects").locator(".window-title").dblclick();
    await settle(page);
    expect(await bounds(page, "projects")).toEqual(before);
  });

  test("minimize animates to the taskbar; the taskbar button restores it", async ({ page }) => {
    await page.locator('.tb-item[data-app="about"]').click();
    await settle(page);
    const animation = await animationFrom(page, "about", "Minimize About me");
    expect(animation, "minimizing should animate").not.toBeNull();
    expect(animation!.endTransform, "the window should fly towards the taskbar").not.toBe("none");
    expect(animation!.duration).toBeGreaterThan(100);
    await expect(win(page, "about")).toBeHidden();

    await page.locator('.tb-item[data-app="about"]').click();
    await expect(win(page, "about")).toBeVisible();
  });

  test("Task view lists open windows; arrows + Enter switch", async ({ page }) => {
    await page.locator('.tb-item[data-app="about"]').click();
    await settle(page);
    await page.locator(".tb-taskview").click();
    await expect(page.locator(".ts-card")).toHaveCount(2);
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(page.locator(".task-switcher")).toHaveCount(0);
    expect(await frontWindow(page)).toBe("projects");
  });

  test("Alt+` switcher: releasing Alt switches window", async ({ page }) => {
    await page.locator('.tb-item[data-app="about"]').click();
    await settle(page);
    expect(await frontWindow(page)).toBe("about");
    await page.keyboard.down("Alt");
    await page.keyboard.press("Backquote");
    await expect(page.locator(".task-switcher")).toBeVisible();
    await page.keyboard.up("Alt");
    await expect(page.locator(".task-switcher")).toHaveCount(0);
    expect(await frontWindow(page)).toBe("projects");
  });

  test("Show desktop hides every window and brings them back", async ({ page }) => {
    await page.locator('.tb-item[data-app="about"]').click();
    await settle(page);
    await page.locator(".tb-show-desktop").click();
    await expect(page.locator(".app-window:not(.minimized)")).toHaveCount(0);
    await page.locator(".tb-show-desktop").click();
    await expect(page.locator(".app-window:not(.minimized)")).toHaveCount(2);
  });

  test("close fades the window out, then removes it", async ({ page }) => {
    await page.locator('.tb-item[data-app="about"]').click();
    await settle(page);
    const animation = await animationFrom(page, "about", "Close About me");
    expect(animation, "closing should animate").not.toBeNull();
    expect(animation!.endOpacity, "the window should fade out").toBe(0);
    await expect(win(page, "about")).toHaveCount(0);
  });
});

test.describe("phone windows", () => {
  test.use(PHONE);

  test("apps are full-screen with no resize handles", async ({ page }) => {
    await openDesktop(page);
    await page.locator('.phone-app[data-app="about"]').tap();
    await settle(page);
    await expect(page.locator(".rz")).toHaveCount(0);
    expect((await bounds(page, "about")).w).toBe(390);
  });
});
