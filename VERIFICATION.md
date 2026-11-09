# Verification status

Last full check: 2026-11-09, on Windows 11 with Microsoft Edge (headless, via Playwright).

| Check | Command | Result |
|---|---|---|
| TypeScript (strict, no unused code) | `npm run typecheck` | ✅ passes |
| Unit tests | `npm test` | ✅ 57 / 57 |
| Browser tests (Playwright) | `npm run test:e2e` | ✅ 60 / 60 |
| Production build + prefetch fix | `npm run build` | ✅ |
| Exported links | `npm run verify` | ✅ all resolve |
| Lighthouse (local, gzip on) | see `TODO.md` | home: phone 98–100 / 100 / 100 / 100 · desktop 100 × 4; /resume and /simple: accessibility, best practices, SEO 100 |

## What the browser tests cover (`tests/e2e/`)
| File | Tests | Covers |
|---|---|---|
| `intro.spec.ts` | 4 | Power on → boot → lock → sign in by keyboard; Skip intro; intro once per visit; reduce motion |
| `desktop-shell.spec.ts` | 7 | Taskbar previews, Quick Settings (theme, accent, saved on reload), notifications, right-click wallpaper, icon drag + save, drag-select, lock and sign back in |
| `windows.spec.ts` | 10 | Resize + minimum size, drag-to-snap, snap layouts, un-snap, maximize by double-click, minimize/close animations, Task view, Alt+\`, Show desktop, phone full-screen |
| `start-search.spec.ts` | 9 | Start menu, ranked search, All apps, type-to-search, search commands, Escape behaviour, Restart, Shut down, phone fit |
| `apps.spec.ts` | 10 | Terminal, Mail, Browser (live pages, search, external sites, tabs), Photos, Settings, Files, About, Résumé, phone terminal |
| `phone-tablet.spec.ts` | 8 | Home screen, dock, zoom-from-icon, ‹ back, home bar tap + swipe, recent apps, status bar flyouts, no sideways overflow, tablet maximized |
| `pages.spec.ts` | 5 | Simple view, project page, metadata, no-JavaScript content, 404 |
| `content.spec.ts` | 7 | Availability, Ozzat experience, Achievements hidden while empty, résumé window + page, 1–2 page A4 PDF, Simple view details, phone home screen |

Every test also fails if the page throws an uncaught error or logs a console error.

## Not yet verified
- Real phones (Android, iPhone/Safari) and Firefox. The tests emulate phone and tablet sizes and touch in Chromium only.
- A screen-reader pass (NVDA/VoiceOver). Lighthouse accessibility is 100, but that's automated.
- Lighthouse and the link check on the real domain: the site is not deployed yet.
