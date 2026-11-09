import { test, expect } from "./fixtures";

// The plain pages that recruiters and search engines reach directly, without the desktop.

test("Simple view shows the portfolio as a normal page", async ({ page }) => {
  await page.goto("/simple/");
  await expect(page.locator("h1").first()).toContainText("Dhruvesh");
  await expect(page.getByText("Ozzat").first()).toBeVisible();
  await expect(page.locator(`a[href^="mailto:"]`).first()).toBeVisible();
});

test("each project has its own shareable page", async ({ page }) => {
  await page.goto("/projects/ozzat/");
  await expect(page).toHaveTitle(/Ozzat/);
  await expect(page.locator("h1").first()).toContainText("Ozzat");
  await expect(page.locator('a[href="https://www.ozzat.com"]').first()).toBeVisible();
});

test("the home page has a title, description and social preview", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Dhruvesh Gohil/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{40,}/);
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
});

test("the content is readable without JavaScript", async ({ request }) => {
  // What a crawler (or a browser with JavaScript off) receives: the full simple portfolio in <noscript>.
  const html = await (await request.get("/")).text();
  const fallback = html.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1] ?? "";
  expect(fallback).toContain("Dhruvesh Gohil");
  expect(fallback).toContain("Ozzat");
  expect(fallback).toContain("mailto:");
});

test("unknown pages show the 404 page", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist/");
  expect(response?.status()).toBe(404);
  await expect(page.locator("body")).toContainText(/not found|404/i);
});
