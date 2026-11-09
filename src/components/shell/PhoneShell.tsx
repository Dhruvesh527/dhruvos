"use client";

import { useRef, type PointerEvent } from "react";
import { ArrowUpRight, BatteryCharging, BatteryFull, SquareStack, Volume2, Wifi } from "lucide-react";
import { profile } from "@/content/portfolio";
import type { WindowState } from "@/lib/window-state.mjs";
import { appDefinitions, isVisibleApp, type AppId } from "@/components/apps/registry";
import { useBattery, useNow } from "@/components/os/hooks";
import FolderIcon from "@/components/FolderIcon";
import OsMark from "./OsMark";

/** Apps on the phone home screen, in order. */
export const PHONE_APPS: AppId[] = (["projects", "about", "resume", "contact", "experience", "achievements", "terminal", "browser", "photos", "mail", "settings"] as AppId[]).filter(isVisibleApp);
/** Apps in the dock at the bottom. */
export const DOCK_APPS: AppId[] = ["projects", "browser", "terminal", "mail"];

function AppIcon({ id, size = 26 }: { id: AppId; size?: number }) {
  const app = appDefinitions[id];
  const Icon = app.icon;
  if (id === "projects") return <span className="phone-art folder"><FolderIcon /></span>;
  return <span className={"phone-art app-art " + app.color}><Icon size={size} strokeWidth={1.6} /></span>;
}

/** Top status bar: tap the time for notifications, the icons for quick settings. */
export function PhoneStatusBar({ unread, onNotifications, onQuick }: { unread: number; onNotifications: () => void; onQuick: () => void }) {
  const now = useNow();
  const battery = useBattery();
  return (
    <header className="phone-status">
      <button data-flyout-toggle="notifications" onClick={onNotifications}>
        <span className="phone-time">{now ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now) : ""}</span>
        {unread > 0 && <span className="phone-dot" aria-hidden="true" />}
        <span className="sr-only">, notifications and calendar{unread ? `, ${unread} new` : ""}</span>
      </button>
      <span className="phone-brand" aria-hidden="true"><OsMark small /></span>
      <button data-flyout-toggle="quick" onClick={onQuick} aria-label="Quick settings">
        <Wifi size={15} /><Volume2 size={15} />
        {battery?.charging ? <BatteryCharging size={17} /> : <BatteryFull size={17} />}
        {battery && <span className="phone-battery">{battery.level}%</span>}
      </button>
    </header>
  );
}

/** The phone home screen: who this is, then every app. */
export function PhoneHome({ onOpen, registerLauncher }: { onOpen: (id: AppId) => void; registerLauncher: (id: AppId, element: HTMLElement) => void }) {
  return (
    <div className="phone-home">
      <section className="phone-hello">
        <img src={profile.photo} alt={"Photo of " + profile.name} width="64" height="64" />
        <div>
          <span>Welcome to my workspace</span>
          <h1>{profile.name}<span className="title-dot">.</span></h1>
          <p>{profile.role}</p>
        </div>
      </section>
      <nav className="phone-grid" aria-label="Apps">
        {PHONE_APPS.map((id, index) => (
          <button key={id} className="phone-app" data-app={id} style={{ animationDelay: index * 25 + "ms" }}
            ref={element => { if (element) registerLauncher(id, element); }} onClick={() => onOpen(id)} aria-label={"Open " + appDefinitions[id].title}>
            <AppIcon id={id} />
            <span>{appDefinitions[id].title}</span>
          </button>
        ))}
        <a className="phone-app" href="/simple/" style={{ animationDelay: PHONE_APPS.length * 25 + "ms" }}>
          <span className="phone-art app-art simple"><ArrowUpRight size={26} strokeWidth={1.6} /></span>
          <span>Simple view</span>
        </a>
      </nav>
    </div>
  );
}

type NavProps = {
  windows: WindowState[];
  activeId?: AppId;
  /** An app is on screen, so show the home bar instead of the dock. */
  appOpen: boolean;
  startOpen: boolean;
  recentsOpen: boolean;
  onStart: () => void;
  onLaunch: (id: AppId) => void;
  onHome: () => void;
  onRecents: () => void;
};

/** Bottom of the phone: the dock on the home screen, a home bar while an app is open. */
export function PhoneNav({ windows, activeId, appOpen, startOpen, recentsOpen, onStart, onLaunch, onHome, onRecents }: NavProps) {
  const swipe = useRef<{ id: number; y: number } | null>(null);
  const startSwipe = (event: PointerEvent<HTMLButtonElement>) => { swipe.current = { id: event.pointerId, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); };
  const endSwipe = (event: PointerEvent<HTMLButtonElement>) => {
    const s = swipe.current;
    swipe.current = null;
    if (s && s.id === event.pointerId && s.y - event.clientY > 24) onHome(); // swipe up = home
  };

  if (appOpen) {
    return (
      <nav className="phone-homebar" aria-label="Phone navigation">
        <button className={"phone-nav-btn" + (recentsOpen ? " active" : "")} aria-label="Recent apps" data-flyout-toggle="taskview" onClick={onRecents}><SquareStack size={18} /></button>
        <button className="phone-pill" aria-label="Home" onClick={onHome} onPointerDown={startSwipe} onPointerUp={endSwipe}><span /></button>
        <button id="start-button" className={"phone-nav-btn" + (startOpen ? " active" : "")} aria-label="Start" aria-expanded={startOpen} data-flyout-toggle="start" onClick={onStart}><OsMark small /></button>
      </nav>
    );
  }
  return (
    <nav className="phone-dock" aria-label="Dock">
      <button id="start-button" className={"dock-item dock-start" + (startOpen ? " active" : "")} aria-label="Start" aria-expanded={startOpen} data-flyout-toggle="start" onClick={onStart}>
        <span className="phone-art start"><OsMark /></span>
      </button>
      {DOCK_APPS.map(id => {
        const running = windows.some(w => w.id === id);
        return (
          <button key={id} className={"dock-item" + (running ? " running" : "") + (activeId === id ? " active" : "")} data-app={id} aria-label={"Open " + appDefinitions[id].title} onClick={() => onLaunch(id)}>
            <AppIcon id={id} size={24} />
          </button>
        );
      })}
    </nav>
  );
}
