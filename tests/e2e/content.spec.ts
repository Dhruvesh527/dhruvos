import { test, expect, PHONE, openDesktop, win } from "./fixtures";

// Your details: availability, experience, the résumé, and apps hidden until they have content.

test.describe("desktop", () => {
  test.beforeEach(async ({ page }) => { await openDesktop(page); });

  test("About shows the availability status", async ({ page }) => {
    await page.locator('.tb-item[data-app="about"]').click();
    await expect(win(page, "about").locator(".about-open")).toContainText("Open to full-time roles and freelance work");
  });

  test("Experience lists the Ozzat role with highlights", async ({ page }) => {
    await page.locator("#start-button").click();
    await page.keyboard.type("experience");
    await page.keyboard.press("Enter");
    const experience = win(page, "experience");
    await expect(experience).toContainText("Lead Full-Stack Developer");
    await expect(experience).toContainText("Ozzat");
    await expect(experience).toContainText("Jul 2026 – present");
    expect(await experience.locator(".timeline-highlights li").count()).toBeGreaterThanOrEqual(3);
  });

  test("Achievements stays hidden while it has no content", async ({ page }) => {
    await expect(page.locator('.desktop-icon[data-app="achievements"]')).toHaveCount(0);
    await page.locator("#start-button").click();
    await expect(page.locator(".sm-tile", { hasText: "Achievements" })).toHaveCount(0);
    await page.keyboard.type("achievements");
    await expect(page.locator(".sm-result", { hasText: /^Achievements/ })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    const files = win(page, "projects");
    await expect(files.locator(".explorer-sidebar button", { hasText: "Achievements" })).toHaveCount(0);
    await expect(files.locator(".explorer-sidebar button", { hasText: "Experience" })).toHaveCount(1);
  });

  test("the Résumé window has a Save as PDF button that opens the printable page", async ({ page }) => {
    await page.locator('.tb-item[data-app="resume"]').click();
    const resume = win(page, "resume");
    await expect(resume.locator(".resume-content")).toContainText("Lead Full-Stack Developer · Ozzat");
    await expect(resume.locator(".pdf-save")).toHaveAttribute("href", "/resume/?print=1");
    await expect(resume.locator(".resume-actions")).toHaveCount(0);
  });
});

test("the résumé page is complete and prints cleanly", async ({ page }) => {
  await page.goto("/resume/");
  const resume = page.locator(".resume-content");
  for (const text of ["Dhruvesh Gohil", "gohildhruvesh47@gmail.com", "Open to full-time roles and freelance work", "Experience", "Projects", "Skills", "Next.js"])
    await expect(resume).toContainText(text);
  await expect(resume).not.toContainText(/draft/i);
  await expect(resume.getByRole("button", { name: "Save as PDF" })).toBeVisible();

  // What "Save as PDF" produces: an A4 PDF without the buttons, at most 2 pages.
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".resume-actions")).toBeHidden();
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  expect(pages).toBeGreaterThanOrEqual(1);
  expect(pages).toBeLessThanOrEqual(2);
});

test("Simple view shows availability and experience, and no empty Achievements", async ({ page }) => {
  await page.goto("/simple/");
  await expect(page.locator(".simple-status")).toContainText("Open to full-time roles");
  await expect(page.locator("main")).toContainText("Lead Full-Stack Developer · Ozzat");
  await expect(page.getByRole("heading", { name: "Achievements" })).toHaveCount(0);
});

test.describe("phone", () => {
  test.use(PHONE);
  test("no Achievements icon on the home screen", async ({ page }) => {
    await openDesktop(page);
    await expect(page.locator('.phone-app[data-app="achievements"]')).toHaveCount(0);
    await expect(page.locator('.phone-app[data-app="experience"]')).toHaveCount(1);
  });
});
