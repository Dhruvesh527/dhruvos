"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Search, SquareStack, X } from "lucide-react";
import type { WindowState } from "@/lib/window-state.mjs";
import { appDefinitions, type AppId } from "@/components/apps/registry";
import FolderIcon from "@/components/FolderIcon";
import OsMark from "./OsMark";

export const PINNED_APPS: AppId[] = ["projects", "browser", "terminal", "about", "resume", "contact"];
const PREVIEW_WIDTH = 216;

type Props = {
  windows: WindowState[];
  activeId?: AppId;
  startOpen: boolean;
  onStart: () => void;
  onLaunch: (id: AppId) => void;
  onFocus: (id: AppId) => void;
  onMinimize: (id: AppId) => void;
  onClose: (id: AppId) => void;
  windowTitle: (window: WindowState) => string;
  renderPreview: (window: WindowState) => ReactNode;
  tray: ReactNode;
  taskViewOpen: boolean;
  onTaskView: () => void;
  searchOpen: boolean;
  onSearch: () => void;
  onShowDesktop: () => void;
};

/** Running apps that aren't pinned slide in when they open and slide out when they close. */
function useExtras(ids: AppId[]) {
  const [shown, setShown] = useState<{ id: AppId; leaving: boolean }[]>([]);
  const signature = ids.join(",");
  useEffect(() => {
    const current = signature ? (signature.split(",") as AppId[]) : [];
    setShown(previous => {
      const next = previous.map(item => ({ id: item.id, leaving: !current.includes(item.id) }));
      for (const id of current) if (!next.some(item => item.id === id)) next.push({ id, leaving: false });
      return next;
    });
  }, [signature]);
  useEffect(() => {
    if (!shown.some(item => item.leaving)) return;
    const timer = setTimeout(() => setShown(previous => previous.filter(item => !item.leaving)), 200);
    return () => clearTimeout(timer);
  }, [shown]);
  return shown;
}

export default function Taskbar({ windows, activeId, startOpen, onStart, onLaunch, onFocus, onMinimize, onClose, windowTitle, renderPreview, tray, taskViewOpen, onTaskView, searchOpen, onSearch, onShowDesktop }: Props) {
  const [bounce, setBounce] = useState<{ id: AppId; n: number } | null>(null);
  const [preview, setPreview] = useState<AppId | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const extras = useExtras(windows.filter(w => !PINNED_APPS.includes(w.id)).map(w => w.id));

  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);
  // Hide a preview whose window has closed.
  useEffect(() => { if (preview && !windows.some(w => w.id === preview)) setPreview(null); }, [preview, windows]);

  const schedulePreview = (id: AppId | null, delay: number) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setPreview(id), delay);
  };

  const press = (id: AppId) => {
    setBounce(previous => ({ id, n: (previous?.n ?? 0) + 1 }));
    setPreview(null);
    const appWindow = windows.find(w => w.id === id);
    if (!appWindow) onLaunch(id);
    else if (activeId === id && !appWindow.minimized) onMinimize(id); // clicking the focused app hides it, like Windows
    else onFocus(id);
  };

  const renderItem = (id: AppId, leaving = false) => {
    const app = appDefinitions[id];
    const Icon = app.icon;
    const appWindow = windows.find(w => w.id === id);
    const running = Boolean(appWindow);
    const active = running && activeId === id && !appWindow?.minimized;
    const title = appWindow ? windowTitle(appWindow) : app.title;
    const scale = appWindow ? PREVIEW_WIDTH / appWindow.width : 1;
    return (
      <div
        key={id}
        className={"tb-slot" + (leaving ? " leaving" : "") + (PINNED_APPS.includes(id) ? "" : " extra")}
        onPointerEnter={() => running && schedulePreview(id, 450)}
        onPointerLeave={() => schedulePreview(null, 220)}
      >
        <button
          className={"tb-item" + (running ? " running" : "") + (active ? " active" : "") + (bounce?.id === id ? " bounce" : "")}
          data-app={id}
          aria-label={(running ? (active ? "Minimize " : "Show ") : "Open ") + app.title}
          aria-pressed={active}
          onClick={() => press(id)}
          tabIndex={leaving ? -1 : undefined}
        >
          <span className="tb-icon" key={bounce?.id === id ? bounce.n : 0}>
            {id === "projects" ? <FolderIcon small /> : <Icon size={22} strokeWidth={1.75} className={"tb-glyph " + app.color} />}
          </span>
          <span className="tb-indicator" aria-hidden="true" />
        </button>
        {!running && <span className="tb-tooltip" role="tooltip">{app.title}</span>}
        {running && appWindow && preview === id && (
          <div className="tb-preview" onPointerEnter={() => schedulePreview(id, 0)}>
            <div className="tb-preview-head">
              <Icon size={14} className={app.color} />
              <span>{title}</span>
              <button aria-label={"Close " + app.title} onClick={() => { setPreview(null); onClose(id); }}><X size={14} /></button>
            </div>
            <button className="tb-thumb" aria-label={"Show " + app.title} onClick={() => { setPreview(null); onFocus(id); }}
              style={{ height: Math.round(appWindow.height * scale) }}>
              <div className="tb-thumb-inner" inert aria-hidden="true" style={{ width: appWindow.width, height: appWindow.height, transform: `scale(${scale})` }}>
                {renderPreview(appWindow)}
              </div>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <footer className="taskbar">
      <nav className="tb-center" aria-label="Taskbar">
        <div className="tb-slot">
          <button id="start-button" className={"tb-item tb-start" + (startOpen ? " active" : "")} aria-label="Start" aria-expanded={startOpen} data-flyout-toggle="start" onClick={onStart}>
            <span className="tb-icon"><OsMark small /></span>
          </button>
          <span className="tb-tooltip" role="tooltip">Start</span>
        </div>
        <div className="tb-slot">
          <button className={"tb-item tb-search" + (searchOpen ? " active" : "")} aria-label="Search" aria-expanded={searchOpen} data-flyout-toggle="search" onClick={onSearch}>
            <span className="tb-icon"><Search size={19} strokeWidth={1.9} /></span>
          </button>
          <span className="tb-tooltip" role="tooltip">Search</span>
        </div>
        <div className="tb-slot">
          <button className={"tb-item tb-taskview" + (taskViewOpen ? " active" : "")} aria-label="Task view" aria-expanded={taskViewOpen} data-flyout-toggle="taskview" onClick={onTaskView}>
            <span className="tb-icon"><SquareStack size={20} strokeWidth={1.75} /></span>
          </button>
          <span className="tb-tooltip" role="tooltip">Task view</span>
        </div>
        {PINNED_APPS.map(id => renderItem(id))}
        {extras.map(item => renderItem(item.id, item.leaving))}
      </nav>
      {tray}
      <button className="tb-show-desktop" aria-label="Show desktop" title="Show desktop" onClick={onShowDesktop} />
    </footer>
  );
}
