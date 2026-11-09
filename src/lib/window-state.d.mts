export type AppId = "projects" | "project" | "about" | "experience" | "achievements" | "resume" | "contact" | "settings" | "document" | "terminal" | "browser" | "mail" | "photos";
export type SnapZone =
  | "half-left" | "half-right" | "major-left" | "minor-right"
  | "third-left" | "third-center" | "third-right"
  | "quarter-tl" | "quarter-tr" | "quarter-bl" | "quarter-br";
export type Rect = { x: number; y: number; width: number; height: number };
export type WindowState = {
  id: AppId; resource?: string;
  x: number; y: number; width: number; height: number;
  /** The size the visitor chose (or the default); used when the desktop grows again. */
  pref: { width: number; height: number };
  snap: SnapZone | null;
  /** Geometry from before snapping, restored when the window is dragged out. */
  restore: Rect | null;
  minimized: boolean; maximized: boolean; order: number;
};
export type Bounds = { width: number; height: number };
export type WindowAction =
  | { type: "open"; id: AppId; bounds: Bounds; resource?: string; maximized?: boolean }
  | { type: "focus" | "close" | "minimize" | "maximize"; id: AppId }
  | { type: "minimizeAll" | "closeAll" }
  | { type: "move"; id: AppId; position: {x: number; y: number}; bounds: Bounds }
  | { type: "resize"; id: AppId; rect: Rect; bounds: Bounds }
  | { type: "snap"; id: AppId; zone: SnapZone; bounds: Bounds }
  | { type: "unsnap"; id: AppId; anchor: {x: number; y: number}; bounds: Bounds }
  | { type: "resizeBounds"; bounds: Bounds };
export const APP_IDS: AppId[];
export const defaultSize: {width: number; height: number};
export const MIN_SIZE: {width: number; height: number};
export const SNAP_ZONES: Record<SnapZone, [number, number, number, number]>;
export const SNAP_LAYOUTS: SnapZone[][];
export function clampPosition(position: {x: number; y: number}, size: {width: number; height: number}, bounds: Bounds): {x: number; y: number};
export function makeWindow(id: AppId, order: number, bounds: Bounds, resource?: string, cascade?: number, maximized?: boolean): WindowState;
export function snapRect(zone: SnapZone, bounds: Bounds): Rect;
export function edgeZone(point: {x: number; y: number}, bounds: Bounds, edge?: number, corner?: number): SnapZone | "maximize" | null;
export function unsnapGeometry(win: WindowState, anchor: {x: number; y: number}, bounds: Bounds): Rect;
export function windowReducer(state: WindowState[], action: WindowAction): WindowState[];
