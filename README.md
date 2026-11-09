# DhruvOS

[![CI](https://github.com/Dhruvesh527/dhruvos/actions/workflows/ci.yml/badge.svg)](https://github.com/Dhruvesh527/dhruvos/actions/workflows/ci.yml)

**Live: [dhruvos-blue.vercel.app](https://dhruvos-blue.vercel.app)** · [Simple view](https://dhruvos-blue.vercel.app/simple/) · [Résumé](https://dhruvos-blue.vercel.app/resume/)

The portfolio of **Dhruvesh Gohil**, full-stack developer, built as a computer you can power on. You press a power button, the laptop boots, you sign in on a lock screen, and then explore projects through a desktop inspired by Windows 11: windows you can drag, resize and snap, a Start menu with search, a terminal, and a browser.

Built with **Next.js 16 (static export), React 19, TypeScript and plain CSS**. No UI library, no animation library: animations use CSS and the Web Animations API.

## Highlights
- **Desktop**
  - Taskbar with live window previews.
  - Quick Settings: light/dark theme, accent colours, wallpapers, reduce motion.
  - Notifications and a right-click menu.
  - Desktop icons you can drag and select.
- **Windows**
  - Resize from any edge, drag-to-snap, and snap layouts on the maximize button.
  - Task view, an Alt+\` switcher, and Show desktop.
  - Minimize, close and maximize animations.
- **Start menu**
  - Typo-tolerant search: start typing anywhere on the desktop.
  - Search commands like "light mode".
  - Power menu: sleep, restart, shut down.
- **Apps**
  - Projects (File Explorer), About, Résumé, Contact and Mail.
  - Terminal with tab completion, history and "did you mean".
  - A Browser that shows the site's own pages, Photos and Settings.
- **Phones and tablets:** a phone home screen with a dock, home bar (tap or swipe up) and recent apps. Touch tablets open apps full-size.
- **Accessible and fast**
  - Keyboard controls everywhere.
  - Honours reduced motion.
  - A Simple view with the full content on one plain page.
  - Works without JavaScript.
  - Lighthouse (local): phone 98–100 / 100 / 100 / 100, desktop 100 across all four.

## Run it
```bash
npm install
npm run dev -- --port 3210        # development, http://127.0.0.1:3210
npm run build && npm start        # production build, served from out/ on port 3210
```

## Tests
| Command | What it checks |
|---|---|
| `npm run typecheck` | TypeScript, strict mode |
| `npm test` | Unit tests for the logic (window manager, snapping, search, terminal, desktop grid, settings, boot and lock flow) using Node's built-in test runner |
| `npm run test:e2e` | **Playwright** browser tests against the production build: intro, desktop, windows, Start and search, every app, phone and tablet layouts, plain pages |
| `npm run verify` | Every exported page and link resolves (needs `npm start` running) |
| `npm run check` | Type check, unit tests, build, then browser tests |

The browser tests live in `tests/e2e/`. They fail on any uncaught page error or console error. Locally they use the Microsoft Edge that comes with Windows, so there's nothing extra to download. In CI they use Playwright's Chromium. Run `npm run test:e2e:report` to open the HTML report, which includes traces of failed tests.

CI (`.github/workflows/ci.yml`) runs all of these on every push once the project is on GitHub.

## Project layout
```
src/app/            pages: desktop (/), /simple, /projects/[slug], /resume
src/components/     boot/, shell/ (taskbar, Start, tray…), windows/, apps/, os/ (settings, hooks)
src/content/        portfolio.ts: all the text, projects and links
src/lib/            pure logic (.mjs), unit-tested: window-state, search, terminal…
tests/              unit tests (*.test.mjs) and browser tests (e2e/)
scripts/            preview server, export link check, prefetch fix
```

## Content
Edit `src/content/portfolio.ts` for the profile, projects, experience and achievements. Images go in `public/projects/` (WebP, plus a small `-thumb` version for icons).

## Deploying
The site is a static export (`out/`), so any static host works (Vercel, Netlify, Cloudflare Pages).
1. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SITE_URL` to the real https address (used for metadata and the sitemap).
2. Run `npm run build`. `scripts/fix-prefetch.mjs` runs automatically after the build, so Next.js prefetch files don't 404 on static hosts.
3. Upload `out/`, or connect the repository to the host.

This project is deployed on **Vercel**, connected to this repository: every push to `main` deploys to production. `NEXT_PUBLIC_SITE_URL` is set in the Vercel project settings.
