"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import type { WindowState } from "@/lib/window-state.mjs";
import { appDefinitions, type AppId } from "@/components/apps/registry";
import { usePresence } from "@/components/os/hooks";

const THUMB_WIDTH = 236;

type Props = {
  open: boolean;
  /** Windows in most-recently-used order. */
  windows: WindowState[];
  index: number;
  onIndex: (index: number) => void;
  onPick: (id: AppId) => void;
  onCloseWindow: (id: AppId) => void;
  onDismiss: () => void;
  windowTitle: (window: WindowState) => string;
  renderPreview: (window: WindowState) => ReactNode;
};

/** Alt+Tab / Task View: every open window as a live thumbnail. */
export default function TaskSwitcher({ open, windows, index, onIndex, onPick, onCloseWindow, onDismiss, windowTitle, renderPreview }: Props) {
  const { mounted, closing } = usePresence(open, 160);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelectorAll<HTMLElement>(".ts-card")[index]?.focus({ preventScroll: true });
  }, [open, index, windows.length]);
  if (!mounted) return null;

  return (
    <div className={"task-switcher" + (closing ? " closing" : "")} onPointerDown={event => { if (event.target === event.currentTarget) onDismiss(); }}>
      <div ref={panel} className="ts-panel" role="listbox" aria-label="Open windows" aria-activedescendant={windows[index] ? "ts-" + windows[index].id : undefined}>
        {windows.length === 0 && <p className="ts-empty">No open windows. Open an app from the taskbar or the desktop.</p>}
        {windows.map((w, i) => {
          const app = appDefinitions[w.id];
          const Icon = app.icon;
          const scale = THUMB_WIDTH / w.width;
          return (
            <div key={w.id} className={"ts-item" + (i === index ? " selected" : "")}>
              <button id={"ts-" + w.id} role="option" aria-selected={i === index} className="ts-card"
                onPointerEnter={() => onIndex(i)} onFocus={() => onIndex(i)} onClick={() => onPick(w.id)}>
                <span className="ts-head"><Icon size={14} className={app.color} /><span>{windowTitle(w)}</span></span>
                <span className="ts-thumb" style={{ height: Math.round(w.height * scale) }}>
                  <span className="ts-thumb-inner" inert aria-hidden="true" style={{ width: w.width, height: w.height, transform: `scale(${scale})` }}>
                    {renderPreview(w)}
                  </span>
                  {w.minimized && <span className="ts-badge">Minimized</span>}
                </span>
              </button>
              <button className="ts-close" aria-label={"Close " + app.title} onClick={() => onCloseWindow(w.id)}><X size={14} /></button>
            </div>
          );
        })}
      </div>
      <p className="ts-hint" aria-hidden="true"><span className="mouse-hint">Click a window, or use ← → and Enter · Esc to close</span><span className="touch-hint">Tap a window to switch to it · tap outside to close</span></p>
    </div>
  );
}
