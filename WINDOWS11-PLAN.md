# DhruvOS 2.0: Windows 11-style upgrade plan

**Goal:** turn the portfolio into a desktop that feels like a fully working Windows 11 PC: real boot, lock screen and sign-in, a centred taskbar, Start menu, search, snap layouts, resizable windows, smooth animations everywhere, and real apps inside. First make the website great; then add the personal details (see `TODO.md`).

Written: 2026-11-06 · Status: **approved, in progress**. Steps 1–6 of 7 done (2026-11-07); step 7 tests, your details and GitHub done 2026-11-09; deploy still to do.

---

## Ground rules

1. **Windows 11-*inspired*, not a copy of Microsoft.** Same feel (rounded corners, frosted glass, centred taskbar, snap layouts, smooth motion) but **original assets**:
   - No Windows logo, no Microsoft wallpapers, no Microsoft product names ("Edge", "Outlook"). Apps get plain names: Files, Browser, Terminal, Mail, Settings.
   - The current DhruvOS logo (4 blue squares) looks too much like the Windows logo, so it gets a new "D" monogram mark.
   - Icons: Fluent UI System Icons (`@fluentui/react-icons`, MIT licence, free to use) or our own.
   - Wallpapers: our own generated artwork (we already have an original one).
2. **Recruiters first.** The OS is the hook, not a wall:
   - Desktop ready in **under 3 seconds**. "Skip intro" always visible; the intro plays only once per visit.
   - Name, role, best project and contact reachable in **one click** from the desktop.
   - Simple view and direct project links keep working.
3. **Every animation smooth and optional.** Only `transform` and `opacity` animate (GPU, 60 fps). Everything respects "reduce motion".
4. **Phones get a phone UI.** No tiny desktop on a 6-inch screen: full-screen apps, a dock, and Start as an app grid.

---

## Phase 0 — Foundation (no visible change) ✅ mostly done
**Done:** windows and apps split out (`windows/AppWindow.tsx`, `apps/registry.ts`, `apps/AppContent.tsx`, `apps/ProjectsApp.tsx`, `apps/ContactApp.tsx`), new `shell/OsMark.tsx` "D." logo, design tokens (glass, shadows, radius, motion) in `globals.css`. `Desktop.tsx` went from 31 KB to 14 KB.
**Moved to step 2:** taskbar/Start split, the shared OS state store, light theme, and the `motion` library (added only when the taskbar springs need it).

Today almost the whole OS lives in one 31 KB file (`src/components/Desktop.tsx`). Before adding features:
- Split it into parts: `shell/` (Taskbar, StartMenu, Search, QuickSettings, NotificationCenter, DesktopIcons, ContextMenu, AltTab), `windows/` (Window, SnapLayouts, resize handles), `apps/` (one file per app), `boot/` (power, boot, lock, sign-in).
- One OS state store (React `useReducer` + context): windows, focus order, Start/Search open, theme, accent colour, wallpaper, notifications.
- Design tokens: light **and** dark theme, accent colour, "Mica" (blurred wallpaper tint) and "Acrylic" (frosted glass) materials, corner radius, shadows, motion durations and easing curves.
- Add the `motion` animation library for spring physics and enter/exit animations.
- Keep the existing 13 tests passing; extend the window tests.

## Phase 1 — Boot, lock screen and sign-in ✅ done
Files: `boot/PowerScreen.tsx`, `boot/BootScreen.tsx`, `boot/LockScreen.tsx`, `boot/DotsSpinner.tsx`, `lib/lock-flow.mjs` (+ 5 tests).
1. **Power screen** (current): power button → laptop reveal.
2. **Boot:** "D" logo + spinning dots loader on black, about 1.5 s.
3. **Lock screen:** full-screen wallpaper, big clock and date, fades and slides up on click, key press or swipe.
4. **Sign-in:** blurred wallpaper, **your photo**, "Dhruvesh Gohil", a "Sign in" button (no password) → "Welcome" spinner → desktop fades in.
- Skippable at every step; once per session; reduced-motion version jumps straight to the desktop.

## Phase 2 — Desktop and taskbar ✅ done
Files: `shell/Taskbar.tsx`, `shell/SystemTray.tsx`, `shell/QuickSettings.tsx`, `shell/NotificationCenter.tsx`, `shell/DesktopIcons.tsx`, `shell/ContextMenu.tsx`, `shell/StartMenu.tsx`, `os/OsSettings.tsx` (settings store, saved per visitor), `os/hooks.ts`, `lib/os-settings.mjs`, `lib/desktop-grid.mjs`, `lib/calendar.mjs` (+13 tests), wallpapers `public/wallpapers/{dusk,aurora,daylight}.svg`.
Also done here (deferred from Phase 0): settings store, light theme (scoped to the desktop), accent colours.
**Changed from plan:** no `motion` library. Every animation so far is plain CSS (smaller site). Re-check in step 3 (window springs).
Extras not in the plan: real battery level in the tray (Chrome/Edge), Lock button in Quick Settings, welcome notification toast after the intro, keyboard menu key / Shift+F10 for the right-click menu.
- **Centred taskbar** with frosted glass: Start, Search, pinned apps, running apps.
  - Indicator under each app: small dot = open, wide pill = focused (animates between them).
  - Hover: tooltip plus a live **thumbnail preview** of the window.
  - Icons bounce on click and slide in and out when apps open and close.
- **System tray:** Wi-Fi, volume and battery icons, clock and date.
  - Click → **Quick Settings** panel: dark/light theme, accent colour, reduce motion, "Simple view".
  - Click the clock → **Notification Centre** with a calendar and a few notifications ("Welcome! Start with Ozzat →", "Download my résumé").
- **Desktop icons:** drag with grid snap, rubber-band selection rectangle, double-click (or Enter or tap) to open.
- **Right-click menu** on the desktop: View, Sort by, Refresh, Change wallpaper, Personalise, Open Terminal.
- **Wallpapers:** 3–4 original wallpapers with a cross-fade when switching (saved per visitor).

## Phase 3 — Windows that behave like real ones ✅ done
Files: `windows/AppWindow.tsx` (rewritten), `shell/TaskSwitcher.tsx`, `lib/window-state.mjs` (resize, snap, unsnap, edge zones, cascade, minimizeAll) + `tests/window-snap.test.mjs` (9 tests).
Animations use the browser's Web Animations API: still no `motion` library needed.
Extras: Task view button, Show-desktop sliver, apps adapt to their **window** width (container queries), Cmd/Meta shortcuts + Alt+` (Windows itself keeps Win and Alt+Tab).
Browser checks: `step3.mjs` in the session scratchpad (18 checks, headless Edge).
- **Open:** scale 0.95 → 1 + fade. **Close:** scale down + fade.
- **Minimise:** shrinks and flies to its taskbar icon; restore reverses it.
- **Maximise / restore:** smooth resize animation; double-click the title bar to toggle.
- **Resize** from all edges and corners, with a minimum size.
- **Snap layouts:** hover the maximise button → a small panel with 4–6 layouts (half, thirds, quarters). Drag a window to a screen edge → glass preview outline → snaps into place.
- **Alt + Tab** switcher with window thumbnails.
- **Keyboard:** Win/Meta key = Start, Win+D = show desktop, Win+E = Files, Esc closes menus, arrow keys in menus. (Browsers keep some shortcuts for themselves, so every shortcut also has a click path.)
- Focused window gets a stronger shadow and a coloured title bar; others dim slightly.

## Phase 4 — Start menu and Search ✅ done
Files: `shell/StartMenu.tsx` (rewritten: search, Pinned, Recommended, All apps, user, power menu), `os/searchIndex.ts`, `lib/search.mjs` (+7 tests: accents, keywords, multi-word, typos, highlight).
Search finds apps, projects, skills (from project stacks), links (GitHub, LinkedIn, email), pages and settings commands (Light/Dark mode, wallpaper, lock, restart, shut down…).
Taskbar search button + type anywhere on the desktop to search. Restart and Shut down have their own screens.
Browser checks: `step4.mjs` in the session scratchpad (18 checks).
- **Start menu** slides up with a spring:
  - Search box at the top.
  - **Pinned** apps grid.
  - **Recommended:** Ozzat case study, résumé, latest project.
  - Bottom bar: your photo + name (opens About), power button menu:
    - **Sleep** → lock screen
    - **Restart** → replays the boot
    - **Shut down** → back to the power screen
- **Search** (taskbar button or start typing on the desktop): instant results across apps, projects, skills ("Next.js" → Ozzat) and pages; Enter opens the top result.

## Phase 5 — Apps ✅ done
New: `apps/TerminalApp.tsx` + `lib/terminal.mjs` (+9 tests), `apps/BrowserApp.tsx`, `apps/MailApp.tsx`, `apps/PhotosApp.tsx`, `apps/SettingsApp.tsx`, `apps/AboutApp.tsx`, `apps/ResumeViewer.tsx`; Files (`apps/ProjectsApp.tsx`) gained Documents/Pictures, back/forward and a preview pane.
Browser shows our own pages live in a frame; external sites get a card + "Open in new tab" (most sites forbid framing).
Not done: Project viewer screenshot gallery (each project has one image so far); Experience/Achievements wait for real content.
Fix found while testing: root containers now use `overflow: clip` (focus could scroll the whole desktop).
Browser checks: `step5.mjs` in the session scratchpad (32 checks).
| App | What it does |
|---|---|
| **Files** (upgrade of today's explorer) | Folders: Projects, Documents (résumé, certificates), Pictures (project screenshots); breadcrumbs, back/forward, grid/list, preview pane |
| **Project viewer** | Today's case study page inside a window, with a screenshot gallery |
| **Browser** | Tabs + address bar showing live projects. Many sites block being shown inside another page, so it falls back to a screenshot + "Open in new tab" |
| **Terminal** | Real commands: `help`, `whoami`, `ls projects`, `open ozzat`, `skills`, `contact`, `resume`, `clear`, a system-info banner, command history with ↑ ↓ |
| **About** (styled like Settings → System → About) | Photo, bio, skills, "device specs" joke card (CPU: Coffee ☕) |
| **Résumé** | PDF-viewer style window with Download and Print |
| **Mail** | Compose window → opens the visitor's email app with the message filled in (no server needed) |
| **Settings** | Personalisation (theme, accent, wallpaper), Accessibility (reduce motion, simple view), About this OS |
| **Photos** | Gallery of project screenshots with a zoom animation |
| **Experience / Achievements** | Timeline and certificate cards (filled when you add details) |

## Phase 6 — Phone and tablet ✅ done
Phone: `shell/PhoneShell.tsx` (status bar, home screen, dock, home bar with tap/swipe-up, recent apps); apps zoom out of the tapped icon and shrink back on close; ‹ back button; phones start on the home screen.
Tablet (touch, ≥760px): apps open maximized, bigger targets.
- **Phone:** lock screen → home screen with an app grid and a bottom dock; apps open full screen with a zoom-from-icon animation; swipe up or a back button to close.
- **Tablet:** desktop with bigger touch targets; windows open maximised by default; snap still works.
- Same content and links as desktop.

## Phase 7 — Animation polish and speed ✅ done
Lighthouse (local, gzip on): **phone 98–100 / 100 / 100 / 100**, **desktop 100 / 100 / 100 / 100** (performance / accessibility / best practices / SEO).
Done: lazy-loaded apps (`next/dynamic`), WebP images + thumbnails, press feedback, 12px minimum text, 24px tap targets, accessible names that match visible text, prefetch 404 fix (`scripts/fix-prefetch.mjs`, runs after every build), gzip in `scripts/preview.mjs`.
Page weight: ~238 KB gzipped JS+CSS, most of it React/Next.js itself.
- One motion system: 150 ms (small), 250 ms (windows), 400 ms (boot/lock); Fluent-style easing curves; springs for Start and the taskbar.
- Hover and press states on every button (lift, glow, scale 0.97 on press).
- Load apps only when opened (code splitting) so the first load stays small.
- Optimised wallpapers (WebP/AVIF), preloaded only what's needed for the boot.
- Targets: Lighthouse **90+** on phone, smooth 60 fps on a mid-range laptop, desktop ready in under 3 s.

## Phase 8 — Testing ✅ done (2026-11-09)
Saved in the project: 53 Playwright browser tests in `tests/e2e/` (`npm run test:e2e`), 56 unit tests (`npm test`), CI workflow in `.github/workflows/ci.yml`. Bug found and fixed: in search, the first Escape closed the panel instead of clearing the text.
Still manual: real phones, Safari/Firefox, a screen-reader pass.
- Unit tests: window reducer (snap, resize, minimise, Alt+Tab order), Terminal commands, search.
- Browser tests with **Playwright**: boot → lock → sign-in → desktop → open each app → snap → Alt+Tab → Start → shut down; phone and tablet sizes.
- Keyboard-only and screen-reader pass; reduced-motion pass.
- Lighthouse on phone and desktop.

## Phase 9 — Your details, then go live
After the site is ready, you add (from `TODO.md`): Experience, Achievements, résumé PDF, more projects. Then deploy to Vercel with your own domain.

---

## Build order and review points

| Step | Phases | You review |
|---|---|---|
| 1 ✅ | 0 + 1 | New boot → lock → sign-in → desktop (done 2026-11-06) |
| 2 ✅ | 2 | Taskbar, tray, Quick Settings, desktop icons, right-click menu (done 2026-11-06) |
| 3 ✅ | 3 | Window animations, resize, snap layouts, Alt+Tab (done 2026-11-07) |
| 4 ✅ | 4 | Start menu, power menu, search (done 2026-11-07) |
| 5 ✅ | 5 | Apps (Terminal, Browser, Settings, Mail, Photos…) (done 2026-11-07) |
| 6 ✅ | 6 + 7 | Phone/tablet, animation polish, speed (done 2026-11-07) |
| 7 ◐ | 8 + 9 | Full test pass ✅, your details ✅, GitHub + green CI ✅ (2026-11-09), then deploy |

I show you a working preview after each step, and you can change direction at any point.

## New packages
- `motion`: animations and springs (MIT)
- `@fluentui/react-icons`: Windows 11-style icons (MIT)
- `@playwright/test` (dev only): browser tests (Apache-2.0)
