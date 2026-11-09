# Verification status

Last full check: 2026-11-09, on Windows 11 with Microsoft Edge and Playwright's Chromium (headless), and in GitHub Actions on Ubuntu (Chromium): [CI runs](https://github.com/Dhruvesh527/dhruvos/actions).

| Check | Command | Result |
|---|---|---|
| TypeScript (strict, no unused code) | `npm run typecheck` | ✅ passes |
| Unit tests | `npm test` | ✅ 57 / 57 |
| Browser tests (Playwright) | `npm run test:e2e` | ✅ 61 / 61 (Edge and Chromium) |
| Production build + prefetch fix | `npm run build` | ✅ |
| Exported links | `npm run verify` | ✅ all resolve |
| Lighthouse, live site (2026-11-09) | [dhruvos-blue.vercel.app](https://dhruvos-blue.vercel.app) | desktop 100 / 100 / 100 / 100 · phone performance 78–93 (varies with test-machine load; accessibility, best practices, SEO 100) |
| Browser tests against the live site | `BASE_URL=https://dhruvos-blue.vercel.app npm run test:e2e` | ✅ 61 / 61 |

## What the browser tests cover (`tests/e2e/`)
| File | Tests | Covers |
|---|---|---|
| `intro.spec.ts` | 4 | Power on → boot → lock → sign in by keyboard; Skip intro; intro once per visit; reduce motion |
| `desktop-shell.spec.ts` | 8 | Taskbar previews, Quick Settings (theme, accent, saved on reload), notifications, right-click wallpaper, icon drag + save, very fast icon drag (regression), drag-select, lock and sign back in |
| `windows.spec.ts` | 10 | Resize + minimum size, drag-to-snap, snap layouts, un-snap, maximize by double-click, minimize/close animations, Task view, Alt+\`, Show desktop, phone full-screen |
| `start-search.spec.ts` | 9 | Start menu, ranked search, All apps, type-to-search, search commands, Escape behaviour, Restart, Shut down, phone fit |
| `apps.spec.ts` | 10 | Terminal, Mail, Browser (live pages, search, external sites, tabs), Photos, Settings, Files, About, Résumé, phone terminal |
| `phone-tablet.spec.ts` | 8 | Home screen, dock, zoom-from-icon, ‹ back, home bar tap + swipe, recent apps, status bar flyouts, no sideways overflow, tablet maximized |
| `pages.spec.ts` | 5 | Simple view, project page, metadata, no-JavaScript content, 404 |
| `content.spec.ts` | 7 | Availability, Ozzat experience, Achievements hidden while empty, résumé window + page, 1–2 page A4 PDF, Simple view details, phone home screen |

Every test also fails if the page throws an uncaught error or logs a console error.

## Not yet verified
- Real phones (Android, iPhone/Safari) and Firefox. The tests emulate phone and tablet sizes and touch in Edge/Chromium only.
- A screen-reader pass (NVDA/VoiceOver). Lighthouse accessibility is 100, but that's automated.
- A Google PageSpeed Insights run (independent of the test laptop).
