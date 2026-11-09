"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type CSSProperties } from "react";
import {
  ArrowDownAZ, ArrowRight, Check, FileText, FolderOpen, Image as ImageIcon, LayoutGrid,
  ListRestart, MessageSquare, Palette, PanelLeft, RefreshCw, RotateCcw, Rocket,
} from "lucide-react";
import { projects, thumbOf } from "@/content/portfolio";
import { snapRect, windowReducer, type Bounds, type SnapZone, type WindowState } from "@/lib/window-state.mjs";
import { createBootSequence } from "@/lib/boot-sequence.mjs";
import { WALLPAPERS, accentColor, type IconSize, type WallpaperId } from "@/lib/os-settings.mjs";
import { CELL_SIZES, gridSize, layoutIcons } from "@/lib/desktop-grid.mjs";
import { appDefinitions, desktopApps, windowTitle, type AppId } from "@/components/apps/registry";
import AppWindow, { type WindowApi } from "@/components/windows/AppWindow";
import TaskSwitcher from "@/components/shell/TaskSwitcher";
import AppContent from "@/components/apps/AppContent";
import Taskbar from "@/components/shell/Taskbar";
import { PhoneHome, PhoneNav, PhoneStatusBar } from "@/components/shell/PhoneShell";
import SystemTray from "@/components/shell/SystemTray";
import QuickSettings from "@/components/shell/QuickSettings";
import NotificationCenter, { NotificationCard, type OsNotification } from "@/components/shell/NotificationCenter";
import StartMenu from "@/components/shell/StartMenu";
import DesktopIcons from "@/components/shell/DesktopIcons";
import ContextMenu, { type MenuEntry } from "@/components/shell/ContextMenu";
import PowerScreen from "@/components/boot/PowerScreen";
import BootScreen from "@/components/boot/BootScreen";
import LockScreen from "@/components/boot/LockScreen";
import { SettingsProvider, useSettings } from "@/components/os/OsSettings";
import { usePresence } from "@/components/os/hooks";
import type { OsAction } from "@/components/os/searchIndex";
import DotsSpinner from "@/components/boot/DotsSpinner";

type Phase = "off" | "revealing" | "booting" | "desktop" | "entering" | "lock" | "ready";
type Flyout = "start" | "search" | "quick" | "notifications" | null;
const initialBounds = { width: 1280, height: 740 };

const featured = projects[0];
const INITIAL_NOTIFICATIONS: OsNotification[] = [
  ...(featured ? [{ id: "featured", title: "Start with " + featured.name, body: featured.subtitle, icon: Rocket, action: { label: "Open case study", app: "project" as AppId, resource: featured.slug } }] : []),
  { id: "resume", title: "Résumé ready", body: "Read it here, or print it and save it as a PDF.", icon: FileText, action: { label: "View résumé", app: "resume" } },
  { id: "contact", title: "Let's talk", body: "Hiring, or have a project in mind? I'd love to hear from you.", icon: MessageSquare, action: { label: "Say hello", app: "contact" } },
];

export default function Desktop() {
  return <SettingsProvider><DesktopOS /></SettingsProvider>;
}

function DesktopOS() {
  const { settings, update } = useSettings();
  const [phase, setPhase] = useState<Phase>("off");
  const [mounted, setMounted] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [tablet, setTablet] = useState(false);
  const [bounds, setBounds] = useState<Bounds>(initialBounds);
  const [windows, dispatch] = useReducer(windowReducer, []);
  const [flyout, setFlyout] = useState<Flyout>(null);
  const [selected, setSelected] = useState<AppId[]>([]);
  const [systemReduced, setSystemReduced] = useState(false);
  const [toast, setToast] = useState("");
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [seen, setSeen] = useState(false);
  const [popup, setPopup] = useState<OsNotification | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; target: AppId | null } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [relock, setRelock] = useState(false);
  const [searchSeed, setSearchSeed] = useState("");
  const [power, setPower] = useState<"restarting" | "shutting-down" | null>(null);
  const [snapPreview, setSnapPreview] = useState<SnapZone | "maximize" | null>(null);
  const [switcher, setSwitcher] = useState<{ open: boolean; index: number; viaKeys: boolean }>({ open: false, index: 0, viaKeys: false });
  const [wallLayers, setWallLayers] = useState<{ key: number; id: WallpaperId }[]>([{ key: 0, id: "ribbon" }]);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const sequence = useRef<ReturnType<typeof createBootSequence> | null>(null);
  const launchers = useRef(new Map<AppId, HTMLElement>());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);
  const prepared = useRef<Promise<unknown>>(Promise.resolve());
  const lastLaunchers = useRef(new Map<AppId, HTMLElement>());
  const windowApis = useRef(new Map<AppId, WindowApi>());
  const hiddenByShowDesktop = useRef<AppId[]>([]);
  const launchRects = useRef(new Map<AppId, DOMRect>());
  const reducedMotion = systemReduced || settings.reduceMotion;
  const reducedRef = useRef(false);
  reducedRef.current = reducedMotion;
  const activeWindow = windows.filter(w => !w.minimized).sort((a, b) => b.order - a.order)[0];
  const popupPresence = usePresence(Boolean(popup), 260);
  const shownPopup = useRef<OsNotification | null>(null);
  if (popup) shownPopup.current = popup;

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }, []);

  const finishBoot = useCallback(() => {
    sequence.current?.cancel();
    setPhase("ready");
    try { sessionStorage.setItem("dhruvos-booted", "1"); } catch {}
  }, []);

  const boot = useCallback(() => {
    if (phase !== "off" && phase !== "ready") return;
    setFlyout(null);
    setRelock(false);
    sequence.current?.start({ reduced: reducedMotion, mobile: window.matchMedia("(max-width: 759px)").matches });
  }, [phase, reducedMotion]);

  const lock = useCallback(() => { setFlyout(null); setMenu(null); setPopup(null); setRelock(true); setPhase("lock"); }, []);

  useEffect(() => {
    setMounted(true);
    // After the zoom, show the lock screen (reduced motion goes straight to the desktop).
    sequence.current = createBootSequence({ onPhase: setPhase, onReady: () => { if (reducedRef.current) finishBoot(); else setPhase("lock"); }, prepare: () => prepared.current });
    prepared.current = Promise.allSettled([document.fonts.ready, ...["/wallpaper.svg", projects[0] && thumbOf(projects[0])].filter(Boolean).map(src => new Promise(resolve => { const image = new Image(); image.onload = () => resolve(true); image.onerror = () => resolve(false); image.src = src!; }))]);
    const query = new URLSearchParams(window.location.search);
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const phone = window.matchMedia("(max-width: 759px)");
    const touchTablet = window.matchMedia("(min-width: 760px) and (pointer: coarse)");
    setTablet(touchTablet.matches);
    const onTablet = () => setTablet(touchTablet.matches);
    touchTablet.addEventListener("change", onTablet);
    setSystemReduced(preference.matches);
    setMobile(phone.matches);
    const onPreference = () => { setSystemReduced(preference.matches); if (preference.matches) finishBoot(); };
    const onPhone = () => setMobile(phone.matches);
    preference.addEventListener("change", onPreference);
    phone.addEventListener("change", onPhone);
    let returning = false;
    try { returning = sessionStorage.getItem("dhruvos-booted") === "1"; } catch {}
    if (returning || preference.matches || query.get("skip") === "1" || query.has("project")) finishBoot();
    return () => {
      preference.removeEventListener("change", onPreference);
      phone.removeEventListener("change", onPhone);
      touchTablet.removeEventListener("change", onTablet);
      sequence.current?.cancel();
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [finishBoot]);

  useEffect(() => {
    if (!mounted || !workspaceRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = { width: entry.contentRect.width, height: entry.contentRect.height };
      if (next.width > 0 && next.height > 0) { setBounds(next); dispatch({ type: "resizeBounds", bounds: next }); }
    });
    observer.observe(workspaceRef.current);
    return () => observer.disconnect();
  }, [mounted]);

  // Wallpaper changes cross-fade: the new layer fades in over the old one, then the old one is removed.
  useEffect(() => {
    setWallLayers(layers => layers.at(-1)?.id === settings.wallpaper ? layers : [...layers.slice(-1), { key: (layers.at(-1)?.key ?? 0) + 1, id: settings.wallpaper }]);
  }, [settings.wallpaper]);
  useEffect(() => {
    if (wallLayers.length < 2) return;
    const timer = setTimeout(() => setWallLayers(layers => layers.slice(-1)), 800);
    return () => clearTimeout(timer);
  }, [wallLayers]);

  // After the intro, the desktop was "inert" when the Projects window opened, so it couldn't take focus.
  // Move focus into the front window once the desktop is really ready, then pop up a welcome notification.
  const introPlayed = useRef(false);
  useEffect(() => {
    if (phase !== "off" && phase !== "ready") introPlayed.current = true;
    if (phase !== "ready" || !introPlayed.current) return;
    introPlayed.current = false;
    const frame = requestAnimationFrame(() => document.querySelector<HTMLElement>(".app-window.active")?.focus({ preventScroll: true }));
    const show = setTimeout(() => setPopup(current => current ?? INITIAL_NOTIFICATIONS[0] ?? null), 1400);
    return () => { cancelAnimationFrame(frame); clearTimeout(show); };
  }, [phase]);
  useEffect(() => {
    if (!popup) return;
    const timer = setTimeout(() => setPopup(null), 7000);
    return () => clearTimeout(timer);
  }, [popup]);

  const syncUrl = useCallback((slug?: string) => {
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("project", slug); else url.searchParams.delete("project");
    window.history.pushState({}, "", url.pathname + url.search + url.hash);
  }, []);

  const openApp = useCallback((id: AppId, resource?: string) => {
    if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
      lastLaunchers.current.set(id, document.activeElement);
      // On phones, apps zoom out of whatever was tapped.
      launchRects.current.set(id, document.activeElement.getBoundingClientRect());
    }
    // Touch tablets: apps open full-size, like Windows in tablet posture.
    dispatch({ type: "open", id, bounds, resource, maximized: tablet });
    setFlyout(null);
    if (id === "project" && resource) syncUrl(resource);
  }, [bounds, syncUrl, tablet]);

  useEffect(() => {
    if (!mounted || initialized.current) return;
    initialized.current = true;
    // Desktops start with Projects open; phones start on the home screen.
    if (!window.matchMedia("(max-width: 759px)").matches) dispatch({ type: "open", id: "projects", bounds });
    const slug = new URLSearchParams(window.location.search).get("project");
    if (slug && projects.some(p => p.slug === slug)) dispatch({ type: "open", id: "project", resource: slug, bounds });
  }, [mounted, bounds]);

  useEffect(() => {
    const navigate = () => {
      const slug = new URLSearchParams(window.location.search).get("project");
      if (slug && projects.some(p => p.slug === slug)) dispatch({ type: "open", id: "project", resource: slug, bounds });
      else dispatch({ type: "close", id: "project" });
    };
    window.addEventListener("popstate", navigate);
    return () => window.removeEventListener("popstate", navigate);
  }, [bounds]);

  const closeApp = useCallback((id: AppId) => {
    dispatch({ type: "close", id });
    if (id === "project") syncUrl();
    requestAnimationFrame(() => {
      const previous = lastLaunchers.current.get(id);
      const launcher = previous?.isConnected ? previous : launchers.current.get(id) ?? launchers.current.get("projects");
      if (launcher?.isConnected) launcher.focus();
    });
  }, [syncUrl]);

  // Minimize/close through the window itself when it's on screen, so the animation plays.
  const minimizeWindow = useCallback((id: AppId) => { const api = windowApis.current.get(id); if (api) api.minimize(); else dispatch({ type: "minimize", id }); }, []);
  const closeWindow = useCallback((id: AppId) => { const api = windowApis.current.get(id); if (api) api.close(); else closeApp(id); }, [closeApp]);

  // ---------- Task switcher (Alt+Tab / Task view) ----------
  const recentWindows = useMemo(() => [...windows].sort((a, b) => b.order - a.order), [windows]);
  const openSwitcher = (viaKeys: boolean, step = 1) => {
    setFlyout(null); setMenu(null);
    setSwitcher(current => {
      const count = recentWindows.length || 1;
      if (current.open) return { ...current, index: (current.index + step + count) % count };
      return { open: true, viaKeys, index: viaKeys && recentWindows.length > 1 ? 1 : 0 };
    });
  };
  const closeSwitcher = () => setSwitcher(current => ({ ...current, open: false }));
  const pickWindow = (id: AppId) => { closeSwitcher(); dispatch({ type: "focus", id }); };

  // ---------- Show desktop (the sliver at the far right of the taskbar) ----------
  const showDesktop = () => {
    const visible = windows.filter(w => !w.minimized).sort((a, b) => a.order - b.order).map(w => w.id);
    if (visible.length) { hiddenByShowDesktop.current = visible; dispatch({ type: "minimizeAll" }); return; }
    for (const id of hiddenByShowDesktop.current) if (windows.some(w => w.id === id)) dispatch({ type: "focus", id });
    hiddenByShowDesktop.current = [];
  };

  // ---------- Keyboard shortcuts ----------
  // Windows itself keeps the Win key and Alt+Tab, so these also work as Meta (Cmd) shortcuts and
  // Alt+` for the switcher; every one of them also has a click path (Task view, Show desktop, snap layouts).
  const keyHandler = useRef<{ down: (e: KeyboardEvent) => void; up: (e: KeyboardEvent) => void } | null>(null);
  const metaAlone = useRef(false);
  keyHandler.current = {
    down: event => {
      if (phase !== "ready") return;
      if (event.key === "Meta") { metaAlone.current = true; return; }
      metaAlone.current = false;
      if (event.altKey && (event.key === "`" || event.key === "Tab")) { event.preventDefault(); openSwitcher(true, event.shiftKey ? -1 : 1); return; }
      if (switcher.open) {
        const count = recentWindows.length || 1;
        if (event.key === "Escape") { event.preventDefault(); closeSwitcher(); }
        else if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); setSwitcher(c => ({ ...c, index: (c.index + 1) % count })); }
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); setSwitcher(c => ({ ...c, index: (c.index - 1 + count) % count })); }
        else if (event.key === "Enter" && recentWindows[switcher.index]) { event.preventDefault(); pickWindow(recentWindows[switcher.index].id); }
        return;
      }
      // Letters typed while search is still opening go into the search box, not nowhere.
      if (flyout === "search" && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey
        && !(document.activeElement as HTMLElement | null)?.closest?.("input, textarea, [contenteditable=true]")) {
        event.preventDefault();
        setSearchSeed(seed => seed + event.key);
        return;
      }
      // Start typing on the desktop to search, like Windows.
      if (!flyout && !menu && event.key.length === 1 && event.key.trim() && !event.ctrlKey && !event.metaKey && !event.altKey
        && !(event.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable=true], .app-window, .flyout, .context-menu")) {
        event.preventDefault();
        setSearchSeed(event.key);
        setFlyout("search");
        return;
      }
      if (!event.metaKey || (event.target as HTMLElement | null)?.closest?.("input, textarea, [contenteditable=true]")) return;
      const key = event.key.toLowerCase();
      const target = activeWindow;
      if (key === "d") { event.preventDefault(); showDesktop(); }
      else if (key === "e") { event.preventDefault(); openApp("projects"); }
      else if (target && (key === "arrowleft" || key === "arrowright")) { event.preventDefault(); dispatch({ type: "snap", id: target.id, zone: key === "arrowleft" ? "half-left" : "half-right", bounds }); }
      else if (target && key === "arrowup") { event.preventDefault(); if (!target.maximized) dispatch({ type: "maximize", id: target.id }); }
      else if (target && key === "arrowdown") {
        event.preventDefault();
        if (target.maximized) dispatch({ type: "maximize", id: target.id });
        else if (target.snap) dispatch({ type: "unsnap", id: target.id, anchor: { x: target.x + target.width / 2, y: (target.restore?.y ?? target.y) + 18 }, bounds });
        else minimizeWindow(target.id);
      }
    },
    up: event => {
      if (event.key === "Meta" && metaAlone.current && phase === "ready") { metaAlone.current = false; toggleFlyout("start"); }
      if (event.key === "Alt" && switcher.open && switcher.viaKeys) {
        const chosen = recentWindows[switcher.index];
        if (chosen) pickWindow(chosen.id); else closeSwitcher();
      }
    },
  };
  useEffect(() => {
    const down = (e: KeyboardEvent) => keyHandler.current?.down(e);
    const up = (e: KeyboardEvent) => keyHandler.current?.up(e);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // Only one flyout at a time; closing one by keyboard returns focus to the button that opened it.
  function toggleFlyout(name: Exclude<Flyout, null>) {
    setMenu(null);
    closeSwitcher();
    setFlyout(current => (current === name ? null : name));
    if (name === "notifications") { setSeen(true); setPopup(null); }
    if (name === "search") setSearchSeed("");
  }

  // ---------- Power: restart and shut down ----------
  const powerCycle = (kind: "restarting" | "shutting-down") => {
    setFlyout(null); setMenu(null); setPopup(null); closeSwitcher();
    setPower(kind);
    setTimeout(() => {
      // A fresh start: close every app, reopen Projects for next time.
      dispatch({ type: "closeAll" });
      if (!window.matchMedia("(max-width: 759px)").matches) dispatch({ type: "open", id: "projects", bounds });
      try { sessionStorage.removeItem("dhruvos-booted"); } catch {}
      setPower(null);
      setRelock(false);
      setPhase("off");
      if (kind === "restarting") boot();
    }, 1600);
  };

  /** Runs whatever was picked in Start or search. */
  const runAction = (action: OsAction) => {
    setFlyout(null);
    if (action.type === "app") { openApp(action.app, action.resource); return; }
    if (action.type === "link") {
      if (action.external) window.open(action.href, "_blank", "noopener,noreferrer");
      else window.location.href = action.href;
      return;
    }
    switch (action.name) {
      case "toggleTheme": update({ type: "toggleTheme" }); break;
      case "nextWallpaper": update({ type: "nextWallpaper" }); break;
      case "reduceMotion": update({ type: "reduceMotion", value: !settings.reduceMotion }); break;
      case "showDesktop": showDesktop(); break;
      case "taskView": openSwitcher(false); break;
      case "lock": lock(); break;
      case "restart": powerCycle("restarting"); break;
      case "shutdown": powerCycle("shutting-down"); break;
    }
  };
  const closeFlyout = useCallback(() => {
    setFlyout(current => {
      const active = document.activeElement;
      if (current && active?.closest(".flyout")) document.querySelector<HTMLElement>(`[data-flyout-toggle="${current}"]`)?.focus();
      return null;
    });
  }, []);

  const runNotification = (item: OsNotification) => {
    setPopup(null);
    setNotifications(list => list.filter(n => n.id !== item.id));
    openApp(item.action.app, item.action.resource);
  };

  const sortIcons = (byName: boolean) => {
    if (!byName) { update({ type: "resetIcons" }); return; }
    const sorted = [...desktopApps].sort((a, b) => appDefinitions[a].title.localeCompare(appDefinitions[b].title));
    update({ type: "iconPositions", value: layoutIcons(sorted, {}, gridSize(bounds, CELL_SIZES[settings.iconSize])) });
  };

  const menuItems = useMemo<MenuEntry[]>(() => {
    const sizes: { id: IconSize; label: string }[] = [{ id: "large", label: "Large icons" }, { id: "medium", label: "Medium icons" }, { id: "small", label: "Small icons" }];
    const desktop: MenuEntry[] = [
      { kind: "item", id: "view", label: "View", icon: LayoutGrid, submenu: sizes.map(size => ({ kind: "item", id: size.id, label: size.label, checked: settings.iconSize === size.id, onSelect: () => update({ type: "iconSize", value: size.id }) })) },
      { kind: "item", id: "sort", label: "Sort by", icon: ArrowDownAZ, submenu: [
        { kind: "item", id: "name", label: "Name", onSelect: () => sortIcons(true) },
        { kind: "item", id: "default", label: "Default order", icon: ListRestart, onSelect: () => sortIcons(false) },
      ] },
      { kind: "item", id: "refresh", label: "Refresh", icon: RefreshCw, onSelect: () => setRefreshKey(key => key + 1) },
      { kind: "separator", id: "s1" },
      { kind: "item", id: "wallpaper", label: "Wallpaper", icon: ImageIcon, submenu: (Object.keys(WALLPAPERS) as WallpaperId[]).map(id => ({ kind: "item", id, label: WALLPAPERS[id].label, checked: settings.wallpaper === id, onSelect: () => update({ type: "wallpaper", value: id }) })) },
      { kind: "item", id: "personalise", label: "Personalise", icon: Palette, onSelect: () => setFlyout("quick") },
      { kind: "separator", id: "s2" },
      { kind: "item", id: "simple", label: "Simple view", icon: PanelLeft, onSelect: () => { window.location.href = "/simple/"; } },
      { kind: "item", id: "replay", label: "Replay intro", icon: RotateCcw, onSelect: () => { setPhase("off"); boot(); } },
    ];
    if (!menu?.target) return desktop;
    const target = menu.target;
    return [
      { kind: "item", id: "open", label: "Open", icon: FolderOpen, hint: "Enter", onSelect: () => openApp(target) },
      { kind: "separator", id: "s0" },
      ...desktop.slice(0, 3),
    ];
  }, [settings.iconSize, settings.wallpaper, menu?.target, boot, openApp, update]); // eslint-disable-line react-hooks/exhaustive-deps

  const sceneScale = Math.min(.72, Math.max(.4, Math.min(bounds.width / 1500, bounds.height / 1040)));
  const shellStyle = { "--blue": accentColor(settings) } as CSSProperties;
  const unread = seen ? 0 : notifications.length;

  return <div className={"portfolio-os phase-" + phase + (mounted ? " hydrated" : "")} style={{ "--scene-scale": sceneScale } as CSSProperties} data-motion={settings.reduceMotion ? "reduced" : undefined}>
    <div className="physical-scene" aria-hidden="true"><div className="desk-light" /><div className="desk-surface" /><span className="scene-caption">A little window into my world.</span></div>
    <div className="screen-stage">
      <div className="laptop-housing" aria-hidden="true"><span className="laptop-camera" /><span className="laptop-brand" /></div>
      <div className="laptop-base" aria-hidden="true"><span /><i /></div>
      <div className="desktop-shell" inert={phase !== "ready"} data-theme={settings.theme} data-wall-tone={WALLPAPERS[settings.wallpaper].tone} style={shellStyle}>
        {wallLayers.map((layer, index) => (
          <div key={layer.key} className={"wallpaper" + (index > 0 ? " incoming" : "")} aria-hidden="true" style={{ backgroundImage: `url("${WALLPAPERS[layer.id].src}")` }} />
        ))}
        {mobile && <PhoneStatusBar unread={unread} onNotifications={() => toggleFlyout("notifications")} onQuick={() => toggleFlyout("quick")} />}
        <div className="desktop-workspace" ref={workspaceRef}>
          <div className="wallpaper-signature" aria-hidden="true">Make yourself<br />at home<span>.</span></div>
          {mobile ? <PhoneHome onOpen={id => openApp(id)} registerLauncher={(id, element) => launchers.current.set(id, element)} /> : (
            <DesktopIcons
            apps={desktopApps}
            bounds={bounds}
            mobile={mobile}
            selected={selected}
            onSelect={setSelected}
            onOpen={id => openApp(id)}
            onContextMenu={(point, target) => { setFlyout(null); setMenu({ ...point, target }); }}
            registerLauncher={(id, element) => launchers.current.set(id, element)}
            refreshKey={refreshKey}
          />
          )}
          {windows.map(appWindow => <AppWindow key={appWindow.id} appWindow={appWindow} active={activeWindow?.id === appWindow.id} bounds={bounds}
            onFocus={() => dispatch({ type: "focus", id: appWindow.id })}
            onClose={() => closeApp(appWindow.id)}
            onMinimize={() => dispatch({ type: "minimize", id: appWindow.id })}
            onMaximize={() => dispatch({ type: "maximize", id: appWindow.id })}
            onMove={position => dispatch({ type: "move", id: appWindow.id, position, bounds })}
            onResize={rect => dispatch({ type: "resize", id: appWindow.id, rect, bounds })}
            onSnap={zone => dispatch({ type: "snap", id: appWindow.id, zone, bounds })}
            onUnsnap={anchor => dispatch({ type: "unsnap", id: appWindow.id, anchor, bounds })}
            onSnapPreview={setSnapPreview}
            reducedMotion={reducedMotion}
            registerApi={api => { if (api) windowApis.current.set(appWindow.id, api); else windowApis.current.delete(appWindow.id); }}
            launchRect={mobile ? launchRects.current.get(appWindow.id) : null}>
            <AppContent id={appWindow.id} resource={appWindow.resource} onOpen={openApp} onNotify={notify} onReplay={() => { setPhase("off"); boot(); }} onClose={() => closeWindow(appWindow.id)} reducedMotion={reducedMotion} systemReducedMotion={systemReduced} />
          </AppWindow>)}
          <StartMenu open={flyout === "start" || flyout === "search"} mode={flyout === "search" ? "search" : "start"} seed={searchSeed} theme={settings.theme} onClose={closeFlyout} onRun={runAction} />
          <QuickSettings open={flyout === "quick"} onClose={closeFlyout} onOpenSettings={() => openApp("settings")} onReplay={() => { setPhase("off"); boot(); }} onLock={lock} />
          <NotificationCenter open={flyout === "notifications"} onClose={closeFlyout} notifications={notifications}
            onAction={runNotification} onDismiss={id => setNotifications(list => list.filter(n => n.id !== id))} onClearAll={() => setNotifications([])} />
          {snapPreview && (
            <div className="snap-preview" aria-hidden="true"
              style={snapPreview === "maximize" ? { left: 0, top: 0, width: bounds.width, height: bounds.height } : { left: snapRect(snapPreview, bounds).x, top: snapRect(snapPreview, bounds).y, width: snapRect(snapPreview, bounds).width, height: snapRect(snapPreview, bounds).height }} />
          )}
          <TaskSwitcher open={switcher.open} windows={recentWindows} index={switcher.index}
            onIndex={index => setSwitcher(c => ({ ...c, index }))} onPick={pickWindow} onCloseWindow={id => closeWindow(id)} onDismiss={closeSwitcher}
            windowTitle={(w: WindowState) => windowTitle(w.id, w.resource)}
            renderPreview={(w: WindowState) => <AppContent id={w.id} resource={w.resource} onOpen={() => {}} onNotify={() => {}} onReplay={() => {}} reducedMotion />} />
          {menu && <ContextMenu x={menu.x} y={menu.y} bounds={bounds} items={menuItems} onClose={() => setMenu(null)} label={menu.target ? appDefinitions[menu.target].title + " menu" : "Desktop menu"} />}
          {popupPresence.mounted && shownPopup.current && (
            <div className={"notif-toast" + (popupPresence.closing ? " closing" : "")} role="status">
              <NotificationCard item={shownPopup.current} onAction={() => runNotification(shownPopup.current!)} onDismiss={() => setPopup(null)} />
            </div>
          )}
        </div>
        {mobile ? (
          <PhoneNav windows={windows} activeId={activeWindow?.id} appOpen={Boolean(activeWindow)} startOpen={flyout === "start"} recentsOpen={switcher.open}
            onStart={() => toggleFlyout("start")} onLaunch={id => openApp(id)} onRecents={() => (switcher.open ? closeSwitcher() : openSwitcher(false))}
            onHome={() => { closeSwitcher(); setFlyout(null); windows.filter(w => !w.minimized).forEach(w => minimizeWindow(w.id)); }} />
        ) : (
        <Taskbar
          windows={windows}
          activeId={activeWindow?.id}
          startOpen={flyout === "start"}
          onStart={() => toggleFlyout("start")}
          onLaunch={id => openApp(id)}
          onFocus={id => dispatch({ type: "focus", id })}
          onMinimize={minimizeWindow}
          onClose={closeWindow}
          taskViewOpen={switcher.open}
          searchOpen={flyout === "search"}
          onSearch={() => toggleFlyout("search")}
          onTaskView={() => (switcher.open ? closeSwitcher() : openSwitcher(false))}
          onShowDesktop={showDesktop}
          windowTitle={(w: WindowState) => windowTitle(w.id, w.resource)}
          renderPreview={(w: WindowState) => <AppContent id={w.id} resource={w.resource} onOpen={() => {}} onNotify={() => {}} onReplay={() => {}} reducedMotion />}
          tray={<SystemTray quickOpen={flyout === "quick"} notificationsOpen={flyout === "notifications"} unread={unread}
            onQuick={() => toggleFlyout("quick")} onNotifications={() => toggleFlyout("notifications")} />}
        />
        )}
        {power && (
          <div className="power-overlay" role="status">
            <DotsSpinner size={36} />
            <span>{power === "restarting" ? "Restarting" : "Shutting down"}</span>
          </div>
        )}
        <div className="brightness-dim" aria-hidden="true" style={{ opacity: ((100 - settings.brightness) / 100) * 0.9 }} />
      </div>
      {phase === "off" && <PowerScreen onPower={boot} onSkip={finishBoot} />}
      {(phase === "revealing" || phase === "booting") && <BootScreen />}
      {(phase === "desktop" || phase === "entering" || phase === "lock") && <LockScreen interactive={phase === "lock"} onDone={finishBoot} wallpaper={WALLPAPERS[settings.wallpaper].src} relock={relock} lightWallpaper={WALLPAPERS[settings.wallpaper].tone === "light"} />}
    </div>
    {phase !== "off" && phase !== "ready" && <button className="skip-boot" onClick={finishBoot}>{relock ? "Back to desktop" : "Skip intro"} <ArrowRight size={15} /></button>}
    <div className={"toast" + (toast ? " visible" : "")} role="status">{toast && <><Check size={16} />{toast}</>}</div>
    <div className="boot-announcement" role="status" aria-live="polite">{phase === "ready" ? "Desktop ready. Projects folder is open." : phase === "lock" ? "Lock screen. Press any key to unlock." : ""}</div>
  </div>;
}
