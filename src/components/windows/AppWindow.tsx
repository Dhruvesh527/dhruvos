"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { ChevronLeft, Maximize2, Minus, Square, X } from "lucide-react";
import { MIN_SIZE, SNAP_LAYOUTS, edgeZone, unsnapGeometry, type Bounds, type Rect, type SnapZone, type WindowState } from "@/lib/window-state.mjs";
import { appDefinitions, windowTitle } from "@/components/apps/registry";

export type WindowApi = { minimize: () => void; close: () => void };
type EdgeTarget = SnapZone | "maximize" | null;

const EDGES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const;
type Edge = (typeof EDGES)[number];

const ZONE_LABELS: Record<SnapZone, string> = {
  "half-left": "left half", "half-right": "right half", "major-left": "left two-thirds", "minor-right": "right third",
  "third-left": "left third", "third-center": "middle third", "third-right": "right third",
  "quarter-tl": "top-left quarter", "quarter-tr": "top-right quarter", "quarter-bl": "bottom-left quarter", "quarter-br": "bottom-right quarter",
};

const EASE_FLUENT = "cubic-bezier(.1,.9,.2,1)";
const EASE_OUT = "cubic-bezier(.16,1,.3,1)";
const EASE_IN = "cubic-bezier(.55,0,.75,.2)";

type Props = {
  appWindow: WindowState;
  active: boolean;
  bounds: Bounds;
  reducedMotion: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onMove: (position: { x: number; y: number }) => void;
  onResize: (rect: Rect) => void;
  onSnap: (zone: SnapZone) => void;
  onUnsnap: (anchor: { x: number; y: number }) => void;
  onSnapPreview: (zone: EdgeTarget) => void;
  registerApi: (api: WindowApi | null) => void;
  /** Phones: where the app was tapped, so it can zoom out of that icon. */
  launchRect?: DOMRect | null;
  children: ReactNode;
};

type Drag = { pointer: number; startX: number; startY: number; x: number; y: number; moved: boolean; pendingUnsnap: boolean; zone: EdgeTarget };
type Resize = { pointer: number; edge: Edge; startX: number; startY: number; rect: Rect };

export default function AppWindow({ appWindow, active, bounds, reducedMotion, onFocus, onClose, onMinimize, onMaximize, onMove, onResize, onSnap, onUnsnap, onSnapPreview, registerApi, launchRect, children }: Props) {
  const ref = useRef<HTMLElement>(null);
  const drag = useRef<Drag | null>(null);
  const resize = useRef<Resize | null>(null);
  const frame = useRef<number | null>(null);
  const flipFrom = useRef<DOMRect | null>(null);
  const busy = useRef(false);
  const minimizeAnimation = useRef<Animation | null>(null);
  const wasMinimized = useRef(appWindow.minimized);
  const layoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [layoutsOpen, setLayoutsOpen] = useState(false);
  const app = appDefinitions[appWindow.id];
  const Icon = app.icon;
  const title = windowTitle(appWindow.id, appWindow.resource);
  const desktopMode = bounds.width >= 760;

  useEffect(() => {
    if (active && !appWindow.minimized && !ref.current?.contains(document.activeElement)) ref.current?.focus({ preventScroll: true });
  }, [active, appWindow.minimized]);
  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    if (layoutTimer.current) clearTimeout(layoutTimer.current);
  }, []);

  // ---------- Animations (Web Animations API; skipped when motion is reduced) ----------
  const taskbarVector = (rect: DOMRect) => {
    const candidates = [`.tb-item[data-app="${appWindow.id}"]`, `.dock-item[data-app="${appWindow.id}"]`, `.phone-app[data-app="${appWindow.id}"]`];
    const target = candidates.map(selector => document.querySelector<HTMLElement>(selector)?.getBoundingClientRect()).find(r => r && r.width > 0);
    if (!target) return null;
    return { dx: target.left + target.width / 2 - (rect.left + rect.width / 2), dy: target.top + target.height / 2 - (rect.top + rect.height / 2) };
  };

  /** Shrink into the taskbar icon, then actually minimize. */
  const minimize = () => {
    const element = ref.current;
    if (!element || busy.current) return;
    const vector = reducedMotion ? null : taskbarVector(element.getBoundingClientRect());
    if (!vector) { onMinimize(); return; }
    busy.current = true;
    const animation = element.animate(
      [{ transform: "none", opacity: 1 }, { transform: `translate(${vector.dx}px, ${vector.dy}px) scale(.12)`, opacity: 0 }],
      { duration: 260, easing: EASE_IN, fill: "forwards" },
    );
    minimizeAnimation.current = animation;
    animation.finished.then(() => { busy.current = false; onMinimize(); }).catch(() => { busy.current = false; });
  };

  /** Shrink and fade, then actually close. */
  const close = () => {
    const element = ref.current;
    if (!element || busy.current) return;
    if (reducedMotion) { onClose(); return; }
    busy.current = true;
    const vector = desktopMode ? null : taskbarVector(element.getBoundingClientRect());
    const frames = vector
      ? [{ transform: "none", opacity: 1, borderRadius: "0px" }, { transform: `translate(${vector.dx}px, ${vector.dy}px) scale(.14)`, opacity: 0, borderRadius: "60px" }]
      : [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.94)" }];
    element.animate(frames, { duration: vector ? 260 : 160, easing: EASE_IN, fill: "forwards" })
      .finished.then(() => onClose()).catch(() => { busy.current = false; });
  };

  useLayoutEffect(() => {
    const element = ref.current;
    if (desktopMode || !element || reducedMotion) return;
    const to = element.getBoundingClientRect();
    if (!launchRect || !to.width) {
      element.animate([{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: EASE_OUT });
      return;
    }
    element.animate(
      [{ transformOrigin: "0 0", transform: `translate(${launchRect.left - to.left}px, ${launchRect.top - to.top}px) scale(${launchRect.width / to.width}, ${launchRect.height / to.height})`, opacity: 0.4, borderRadius: "40px" },
       { transformOrigin: "0 0", transform: "none", opacity: 1, borderRadius: "0px" }],
      { duration: 340, easing: EASE_OUT },
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { registerApi({ minimize, close }); });
  useEffect(() => () => registerApi(null), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Restoring from the taskbar flies the window back out of its icon.
  useLayoutEffect(() => {
    const was = wasMinimized.current;
    wasMinimized.current = appWindow.minimized;
    if (!was || appWindow.minimized) return;
    minimizeAnimation.current?.cancel();
    minimizeAnimation.current = null;
    const element = ref.current;
    if (!element || reducedMotion) return;
    const vector = taskbarVector(element.getBoundingClientRect());
    if (!vector) return;
    element.animate(
      [{ transform: `translate(${vector.dx}px, ${vector.dy}px) scale(.12)`, opacity: 0 }, { transform: "none", opacity: 1 }],
      { duration: 300, easing: EASE_OUT },
    );
  }, [appWindow.minimized]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Remember where the window is, run the change, then animate from the old box to the new one. */
  const withFlip = (change: () => void) => {
    if (!reducedMotion && ref.current) {
      flipFrom.current = ref.current.getBoundingClientRect();
      requestAnimationFrame(() => requestAnimationFrame(() => { flipFrom.current = null; }));
    }
    change();
  };
  useLayoutEffect(() => {
    const from = flipFrom.current;
    const element = ref.current;
    if (!from || !element) return;
    flipFrom.current = null;
    const to = element.getBoundingClientRect();
    if (!to.width || !to.height) return;
    const dx = from.left - to.left, dy = from.top - to.top, sx = from.width / to.width, sy = from.height / to.height;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return;
    element.animate(
      [{ transformOrigin: "0 0", transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` }, { transformOrigin: "0 0", transform: "none" }],
      { duration: 280, easing: EASE_FLUENT },
    );
  }, [appWindow.maximized, appWindow.snap, appWindow.x, appWindow.y, appWindow.width, appWindow.height]);

  // ---------- Dragging (with drag-to-edge snapping) ----------
  const toDesktop = (event: { clientX: number; clientY: number }) => {
    const host = (ref.current?.offsetParent as HTMLElement | null)?.getBoundingClientRect();
    return { x: event.clientX - (host?.left ?? 0), y: event.clientY - (host?.top ?? 0) };
  };
  const schedule = (fn: () => void) => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => { frame.current = null; fn(); });
  };

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!desktopMode || event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
    drag.current = { pointer: event.pointerId, startX: event.clientX, startY: event.clientY, x: appWindow.x, y: appWindow.y, moved: false, pendingUnsnap: appWindow.maximized || Boolean(appWindow.snap), zone: null };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || event.pointerId !== d.pointer) return;
    if (!d.moved && Math.hypot(event.clientX - d.startX, event.clientY - d.startY) < 4) return;
    d.moved = true;
    const local = toDesktop(event);
    if (d.pendingUnsnap) {
      // Pulling a maximized/snapped window away gives it its normal size back, under the cursor.
      const geometry = unsnapGeometry(appWindow, local, bounds);
      onUnsnap(local);
      Object.assign(d, { pendingUnsnap: false, x: geometry.x, y: geometry.y, startX: event.clientX, startY: event.clientY });
      return;
    }
    const position = { x: d.x + event.clientX - d.startX, y: d.y + event.clientY - d.startY };
    schedule(() => onMove(position));
    const zone = edgeZone(local, bounds);
    if (zone !== d.zone) { d.zone = zone; onSnapPreview(zone); }
  };
  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.zone) return;
    const zone = d.zone;
    onSnapPreview(null);
    withFlip(() => { if (zone === "maximize") { if (!appWindow.maximized) onMaximize(); } else onSnap(zone); });
  };

  // ---------- Resizing from any edge or corner ----------
  const startResize = (edge: Edge, event: PointerEvent<HTMLDivElement>) => {
    if (!desktopMode || appWindow.maximized || event.button !== 0) return;
    event.stopPropagation();
    onFocus();
    resize.current = { pointer: event.pointerId, edge, startX: event.clientX, startY: event.clientY, rect: { x: appWindow.x, y: appWindow.y, width: appWindow.width, height: appWindow.height } };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveResize = (event: PointerEvent<HTMLDivElement>) => {
    const r = resize.current;
    if (!r || r.pointer !== event.pointerId) return;
    const dx = event.clientX - r.startX, dy = event.clientY - r.startY;
    let { x, y, width, height } = r.rect;
    if (r.edge.includes("e")) width += dx;
    if (r.edge.includes("s")) height += dy;
    if (r.edge.includes("w")) { x += dx; width -= dx; }
    if (r.edge.includes("n")) { y += dy; height -= dy; }
    // Keep the opposite edge still when hitting the minimum size.
    if (width < MIN_SIZE.width) { if (r.edge.includes("w")) x -= MIN_SIZE.width - width; width = MIN_SIZE.width; }
    if (height < MIN_SIZE.height) { if (r.edge.includes("n")) y -= MIN_SIZE.height - height; height = MIN_SIZE.height; }
    if (x < 0) { width += x; x = 0; }
    if (y < 0) { height += y; y = 0; }
    schedule(() => onResize({ x, y, width, height }));
  };
  const endResize = () => { resize.current = null; };

  // ---------- Snap layouts (hover the maximize button) ----------
  const showLayouts = (show: boolean, delay: number) => {
    if (layoutTimer.current) clearTimeout(layoutTimer.current);
    layoutTimer.current = setTimeout(() => setLayoutsOpen(show), delay);
  };

  const style: CSSProperties = {
    left: appWindow.maximized ? 0 : appWindow.x,
    top: appWindow.maximized ? 0 : appWindow.y,
    width: appWindow.maximized ? "100%" : appWindow.width,
    height: appWindow.maximized ? "100%" : appWindow.height,
    zIndex: 20 + appWindow.order,
  };
  const className = "app-window" + (active ? " active" : "") + (appWindow.maximized ? " maximized" : "") + (appWindow.snap ? " snapped" : "") + (appWindow.minimized ? " minimized" : "");

  return (
    <section ref={ref} tabIndex={-1} role="region" aria-label={title} className={className} style={style}
      onPointerDown={onFocus} onFocusCapture={() => { if (!active) onFocus(); }} data-window={appWindow.id}>
      <div className="window-titlebar" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={() => { drag.current = null; onSnapPreview(null); }}
        onDoubleClick={event => { if (desktopMode && !(event.target as HTMLElement).closest("button")) withFlip(onMaximize); }}>
        {!desktopMode && <button className="window-back" aria-label={"Back: close " + app.title} onClick={close}><ChevronLeft size={22} /></button>}
        <div className="window-title"><Icon size={16} className={app.color} /><span>{title}</span></div>
        <div className="window-controls">
          <button aria-label={"Minimize " + app.title} onClick={minimize}><Minus size={15} /></button>
          <div className="max-wrap"
            onPointerEnter={() => desktopMode && showLayouts(true, 450)}
            onPointerLeave={() => showLayouts(false, 250)}
            onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) showLayouts(false, 0); }}>
            <button className="maximize-control" aria-label={(appWindow.maximized ? "Restore " : "Maximize ") + app.title}
              aria-haspopup={desktopMode ? "true" : undefined}
              onClick={() => { setLayoutsOpen(false); withFlip(onMaximize); }}
              onKeyDown={event => { if (desktopMode && (event.key === "ArrowDown" || (event.altKey && event.key === "z"))) { event.preventDefault(); setLayoutsOpen(true); } }}>
              {appWindow.maximized ? <Maximize2 size={13} /> : <Square size={13} />}
            </button>
            {layoutsOpen && desktopMode && (
              <div className="snap-layouts" role="group" aria-label="Snap layouts" onPointerEnter={() => showLayouts(true, 0)}
                onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); setLayoutsOpen(false); } }}>
                {SNAP_LAYOUTS.map((layout, index) => (
                  <div key={index} className={"snap-layout layout-" + index}>
                    {layout.map(zone => (
                      <button key={zone} className={"snap-cell zone-" + zone + (appWindow.snap === zone ? " current" : "")}
                        aria-label={"Snap " + app.title + " to the " + ZONE_LABELS[zone]}
                        onClick={() => { setLayoutsOpen(false); withFlip(() => onSnap(zone)); }} />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="close-control" aria-label={"Close " + app.title} onClick={close}><X size={17} /></button>
        </div>
      </div>
      <div className="window-body" key={appWindow.resource ?? appWindow.id}>{children}</div>
      {desktopMode && !appWindow.maximized && EDGES.map(edge => (
        <div key={edge} className={"rz rz-" + edge} aria-hidden="true"
          onPointerDown={event => startResize(edge, event)} onPointerMove={moveResize} onPointerUp={endResize} onPointerCancel={endResize} />
      ))}
    </section>
  );
}
