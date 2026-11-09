import type { Page } from "@playwright/test";
import { test, expect, PHONE, frontWindow, openDesktop, openWindows, savedSettings, settle, theme, win } from "./fixtures";

// The built-in apps: Terminal, Mail, Browser, Photos, Settings, Files, About, Résumé.

// Scope to the real window: the taskbar hover preview renders an inert copy of each app.
const terminalInput = (page: Page) => win(page, "terminal").locator(".term-input-row input");
async function run(page: Page, command: string) {
  await terminalInput(page).fill(command);
  await terminalInput(page).press("Enter");
}
/** Open an app from the taskbar, or from Start search if it isn't pinned. */
async function openApp(page: Page, id: string, search?: string) {
  if (search) {
    await page.locator("#start-button").click();
    await page.keyboard.type(search);
    await page.keyboard.press("Enter");
  } else {
    await page.locator(`.tb-item[data-app="${id}"]`).click();
  }
  await expect(win(page, id)).toBeVisible();
  await page.mouse.move(700, 300); // move off the taskbar so its hover preview closes
  await settle(page);
}

test.describe("apps", () => {
  test.beforeEach(async ({ page }) => { await openDesktop(page); });

  test("Terminal: real data, typo hints, Tab completion and history", async ({ page }) => {
    await openApp(page, "terminal");
    await expect(terminalInput(page)).toBeFocused();
    await run(page, "whoami");
    await run(page, "skills");
    await run(page, "neofetch");
    const screen = win(page, "terminal").locator(".term-screen");
    await expect(screen).toContainText("Dhruvesh Gohil");
    await expect(screen).toContainText(/Next\.js\s+→/);
    await expect(screen).toContainText("DhruvOS 2.0");

    await run(page, "hlep");
    await expect(screen).toContainText("Did you mean 'help'");

    await terminalInput(page).fill("neo");
    await terminalInput(page).press("Tab");
    await expect(terminalInput(page)).toHaveValue("neofetch ");
    await terminalInput(page).fill("");
    await terminalInput(page).press("ArrowUp");
    await expect(terminalInput(page)).toHaveValue("hlep");
  });

  test("Terminal commands open other apps", async ({ page }) => {
    await openApp(page, "terminal");
    await run(page, "open ozzat");
    await expect.poll(() => openWindows(page)).toContain("project");
    await openApp(page, "terminal");
    await run(page, "sudo hire-me");
    await expect.poll(() => frontWindow(page)).toBe("mail");
  });

  test("Mail: reply, templates, and Send only enabled with a message", async ({ page }) => {
    await openApp(page, "mail", "mail");
    await page.locator(".mail-actions .primary-button", { hasText: "Reply" }).click();
    await expect(page.locator('.mail-compose input[placeholder="What\'s it about?"]')).toHaveValue("Re: Thanks for visiting");
    const send = page.locator('.mail-compose button[type="submit"]');
    await expect(send).toBeDisabled();
    await page.locator(".mail-templates button", { hasText: "Job opportunity" }).click();
    await expect(page.locator(".mail-compose textarea")).toHaveValue(/role at|\[company\]/);
    await expect(send).toBeEnabled();
  });

  test("Browser: own pages load live; words search; external sites get a card", async ({ page }) => {
    await openApp(page, "browser");
    await page.locator(".br-dial-item", { hasText: "Simple view" }).click();
    await expect(page.locator(".br-frame")).toHaveAttribute("src", "/simple/");
    await expect(page.frameLocator(".br-frame").locator("h1").first()).toContainText("Dhruvesh");

    const address = page.locator(".br-address input");
    await address.fill("next.js");
    await address.press("Enter");
    expect(await page.locator(".br-result").count()).toBeGreaterThanOrEqual(2);

    await address.fill("ozzat.com");
    await address.press("Enter");
    await expect(page.locator(".br-external a", { hasText: "new tab" })).toHaveCount(1);

    await page.locator(".br-toolbar [aria-label='Back']").click();
    expect(await page.locator(".br-result").count()).toBeGreaterThanOrEqual(2);
  });

  test("Browser: tabs, and the desktop can't open inside itself", async ({ page }) => {
    await openApp(page, "browser");
    await page.locator(".br-newtab-btn").click();
    await expect(page.locator(".br-tab")).toHaveCount(2);
    await page.locator(".br-tab.active .br-tab-close").click();
    await expect(page.locator(".br-tab")).toHaveCount(1);
    await page.locator(".br-address input").fill("/");
    await page.locator(".br-address input").press("Enter");
    await expect(page.locator(".br-view")).toContainText("already here");
  });

  test("Photos: viewer, set as wallpaper, arrow keys, Esc", async ({ page }) => {
    await page.locator("#start-button").click();
    await page.keyboard.type("photos");
    await page.keyboard.press("Enter");
    await expect.poll(() => frontWindow(page)).toBe("photos");
    await settle(page);
    await page.locator(".ph-filters button", { hasText: "Wallpapers" }).click();
    await page.locator(".ph-thumb").nth(1).click();
    await expect(page.locator(".ph-viewer")).toBeVisible();
    await page.locator(".ph-viewer-bar button", { hasText: "Set as wallpaper" }).click();
    await expect.poll(async () => (await savedSettings(page)).wallpaper).toBe("dusk");
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".ph-viewer-bar")).toContainText("Aurora");
    await page.keyboard.press("Escape");
    await expect(page.locator(".ph-viewer")).toHaveCount(0);
    expect(await openWindows(page)).toContain("photos");
  });

  test("Settings: theme, reduce motion, live device specs", async ({ page }) => {
    await page.locator("#start-button").click();
    await page.locator(".sm-tile", { hasText: "Settings" }).click();
    await expect(win(page, "settings")).toBeVisible();
    await page.locator(".st-theme.light").click();
    await expect.poll(() => theme(page)).toBe("light");

    await page.locator(".st-nav button", { hasText: "Accessibility" }).click();
    await page.locator('[role="switch"][aria-label="Reduce motion"]').click();
    await expect(page.locator(".portfolio-os")).toHaveAttribute("data-motion", "reduced");

    await page.locator(".st-nav button", { hasText: "About" }).click();
    await expect(page.locator(".st-specs")).toContainText(/Screen\s*\d+ × \d+/);

    // Nothing in the desktop should ever be scrolled out of place.
    const scrolled = await page.evaluate(() =>
      [document.scrollingElement!, ...document.querySelectorAll(".portfolio-os, .desktop-shell, .desktop-workspace")]
        .filter(element => element.scrollTop || element.scrollLeft).length);
    expect(scrolled).toBe(0);
  });

  test("Files: Documents, Back, and the preview pane", async ({ page }) => {
    const files = win(page, "projects");
    await files.locator(".explorer-sidebar button", { hasText: "Documents" }).click();
    await expect(files.locator(".file-table")).toContainText("Résumé.pdf");
    await files.getByRole("button", { name: "Back" }).click();
    await expect(files.locator(".project-files")).toHaveCount(1);
    await files.locator(".project-file-main").first().click();
    await expect(files.locator(".explorer-preview")).toContainText("Open case study");
  });

  test("About lists skills; Résumé zooms", async ({ page }) => {
    await openApp(page, "about");
    expect(await page.locator(".about-chips span").count()).toBeGreaterThanOrEqual(5);
    await openApp(page, "resume");
    await page.getByRole("button", { name: "Zoom in" }).click();
    await expect(page.locator(".pdf-zoom-value")).toHaveText("110%");
  });
});

test.describe("phone", () => {
  test.use(PHONE);

  test("Terminal quick buttons work", async ({ page }) => {
    await openDesktop(page);
    await page.locator('.dock-item[data-app="terminal"]').tap();
    await settle(page);
    await page.locator(".term-quick button", { hasText: "skills" }).tap();
    await expect(page.locator(".term-screen")).toContainText("Next.js");
  });
});
