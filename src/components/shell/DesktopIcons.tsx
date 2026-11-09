"use client";

import { useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { CELL_SIZES, cellToPoint, dropCell, gridSize, iconsInRect, layoutIcons, pointToCell } from "@/lib/desktop-grid.mjs";
import { appDefinitions, type AppId } from "@/components/apps/registry";
import { useSettings } from "@/components/os/OsSettings";
import FolderIcon from "@/components/FolderIcon";

type Props = {
  apps: AppId[];
  bounds: { width: number; height: number };
  /** Phones get a simple tap-to-open grid instead of a free desktop. */
  mobile: boolean;
  selected: AppId[];
  onSelect: (ids: AppId[]) => void;
  onOpen: (id: AppId) => void;
  onContextMenu: (point: { x: number; y: number }, target: AppId | null) => void;
  registerLauncher: (id: AppId, element: HTMLElement) => void;
  refreshKey: number;
};

type Drag = { id: AppId; pointer: number; startX: number; startY: number; dx: number; dy: number; moved: boolean };
type Band = { pointer: number; x0: number; y0: number; x1: number; y1: number; additive: AppId[] };

const coarse = () => window.matchMedia("(pointer: coarse)").matches;

export default function DesktopIcons({ apps, bounds, mobile, selected, onSelect, onOpen, onContextMenu, registerLauncher, refreshKey }: Props) {
  const { settings, update } = useSettings();
  const layer = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [band, setBand] = useState<Band | null>(null);
  const justDragged = useRef(false);

  const cell = CELL_SIZES[settings.iconSize];
  const grid = gridSize(bounds, cell);
  const layout = useMemo(() => layoutIcons(apps, settings.iconPositions, grid), [apps, settings.iconPositions, grid.cols, grid.rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const localPoint = (event: { clientX: number; clientY: number }) => {
    const rect = layer.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  // ----- Rubber-band selection on empty desktop -----
  const startBand = (event: PointerEvent<HTMLDivElement>) => {
    if (mobile || event.button !== 0 || event.target !== event.currentTarget) return;
    const p = localPoint(event);
    const additive = event.ctrlKey || event.metaKey ? selected : [];
    setBand({ pointer: event.pointerId, x0: p.x, y0: p.y, x1: p.x, y1: p.y, additive });
    onSelect(additive);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveBand = (event: PointerEvent<HTMLDivElement>) => {
    if (!band || band.pointer !== event.pointerId) return;
    const p = localPoint(event);
    const next = { ...band, x1: p.x, y1: p.y };
    setBand(next);
    const hit = iconsInRect({ x: next.x0, y: next.y0, width: next.x1 - next.x0, height: next.y1 - next.y0 }, layout, cell) as AppId[];
    onSelect([...new Set([...band.additive, ...hit])]);
  };
  const endBand = () => setBand(null);

  // ----- Dragging an icon -----
  const startDrag = (id: AppId, event: PointerEvent<HTMLButtonElement>) => {
    if (mobile || event.button !== 0 || coarse()) return;
    setDrag({ id, pointer: event.pointerId, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0, moved: false });
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag || drag.pointer !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    if (!drag.moved) onSelect([drag.id]);
    setDrag({ ...drag, dx, dy, moved: true });
  };
  const endDrag = () => {
    if (!drag) return;
    if (drag.moved) {
      const origin = cellToPoint(layout[drag.id], cell);
      const target = pointToCell({ x: origin.x + drag.dx, y: origin.y + drag.dy }, cell, grid);
      // Save every icon's position so the others don't shuffle when this one moves.
      update({ type: "iconPositions", value: { ...layout, [drag.id]: dropCell(layout, drag.id, target, grid) } });
      justDragged.current = true;
      setTimeout(() => { justDragged.current = false; }, 0);
    }
    setDrag(null);
  };

  const click = (id: AppId, event: MouseEvent<HTMLButtonElement>) => {
    if (justDragged.current) return;
    if (mobile || coarse()) { onOpen(id); return; }
    if (event.ctrlKey || event.metaKey) onSelect(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
    else onSelect([id]);
  };

  const contextMenu = (event: MouseEvent<HTMLElement>, target: AppId | null) => {
    if (mobile) return;
    event.preventDefault();
    if (target && !selected.includes(target)) onSelect([target]);
    onContextMenu(localPoint(event), target);
  };

  const bandRect = band && {
    left: Math.min(band.x0, band.x1), top: Math.min(band.y0, band.y1),
    width: Math.abs(band.x1 - band.x0), height: Math.abs(band.y1 - band.y0),
  };

  return (
    <div
      ref={layer}
      className={"desktop-layer icons-" + settings.iconSize + (mobile ? " desktop-icons" : " positioned")}
      style={{ "--cell-w": cell.width + "px", "--cell-h": cell.height + "px" } as CSSProperties}
      onPointerDown={startBand}
      onPointerMove={moveBand}
      onPointerUp={endBand}
      onPointerCancel={endBand}
      onContextMenu={event => { if (event.target === event.currentTarget) contextMenu(event, null); }}
      role={mobile ? undefined : "group"}
      aria-label="Desktop"
    >
      {apps.map((id, index) => {
        const app = appDefinitions[id];
        const Icon = app.icon;
        const point = cellToPoint(layout[id] ?? { col: 0, row: 0 }, cell);
        const dragging = drag?.id === id && drag.moved;
        const style: CSSProperties | undefined = mobile ? undefined : {
          left: point.x, top: point.y,
          transform: dragging ? `translate(${drag.dx}px, ${drag.dy}px)` : undefined,
          animationDelay: `${refreshKey ? index * 25 : 0}ms`,
        };
        return (
          <button
            key={id + ":" + refreshKey}
            ref={element => { if (element) registerLauncher(id, element); }}
            className={"desktop-icon" + (selected.includes(id) ? " selected" : "") + (dragging ? " dragging" : "") + (refreshKey ? " refreshed" : "")}
            style={style}
            data-app={id}
            aria-label={"Open " + app.title}
            aria-pressed={mobile ? undefined : selected.includes(id)}
            onPointerDown={event => startDrag(id, event)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={() => setDrag(null)}
            onClick={event => click(id, event)}
            onDoubleClick={() => onOpen(id)}
            onKeyDown={event => {
              if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(id); }
              // The menu key (or Shift+F10) opens the right-click menu from the keyboard.
              if (!mobile && (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10"))) {
                event.preventDefault();
                onSelect([id]);
                onContextMenu({ x: point.x + cell.width * 0.6, y: point.y + cell.height * 0.5 }, id);
              }
            }}
            onContextMenu={event => contextMenu(event, id)}
          >
            {id === "projects" ? <FolderIcon /> : <span className={"app-art " + app.color}><Icon strokeWidth={1.5} /></span>}
            <span>{app.title}</span>
          </button>
        );
      })}
      {bandRect && bandRect.width + bandRect.height > 4 && <div className="selection-band" style={bandRect} aria-hidden="true" />}
    </div>
  );
}
