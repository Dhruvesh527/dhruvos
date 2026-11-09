// Window manager state: open, focus, move, resize, snap, minimize, maximize.
// Pure functions only, so every rule is easy to test.

function normalize(state){const order=[...state].sort((a,b)=>a.order-b.order);return state.map(w=>({...w,order:order.findIndex(item=>item.id===w.id)+1}));}

export const APP_IDS = ["projects", "project", "about", "experience", "achievements", "resume", "contact", "settings", "document", "terminal", "browser", "mail", "photos"];
export const defaultSize = { width: 1020, height: 620 };
/** Windows can't be resized smaller than this (or than the desktop, if the desktop is tinier). */
export const MIN_SIZE = { width: 380, height: 260 };

const SIZES = { projects: { width: 1020, height: 620 }, terminal: { width: 780, height: 500 }, browser: { width: 1120, height: 700 }, mail: { width: 860, height: 600 }, photos: { width: 1000, height: 660 } };
const preferredSize = id => SIZES[id] ?? { width: 900, height: 650 };

export function clampPosition(position, size, bounds) {
  return {
    x: Math.max(0, Math.min(position.x, Math.max(0, bounds.width - size.width))),
    y: Math.max(0, Math.min(position.y, Math.max(0, bounds.height - size.height))),
  };
}

/** New windows open slightly down and to the right of the previous one, like a real desktop. */
export function makeWindow(id, order, bounds, resource, cascade = 0, maximized = false) {
  const pref = preferredSize(id);
  const width = Math.min(pref.width, bounds.width);
  const height = Math.min(pref.height, bounds.height);
  const offset = id === "projects" ? 0 : 24 + (cascade % 6) * 28;
  const position = clampPosition({ x: (bounds.width - width) / 2 + 30 + offset, y: (bounds.height - height) / 2 + offset }, { width, height }, bounds);
  return { id, resource, ...position, width, height, pref, snap: null, restore: null, minimized: false, maximized, order };
}

// ---------- Snapping ----------

/** Every snap zone as fractions of the desktop: [x, y, width, height]. */
export const SNAP_ZONES = {
  "half-left": [0, 0, 1 / 2, 1],
  "half-right": [1 / 2, 0, 1 / 2, 1],
  "major-left": [0, 0, 2 / 3, 1],
  "minor-right": [2 / 3, 0, 1 / 3, 1],
  "third-left": [0, 0, 1 / 3, 1],
  "third-center": [1 / 3, 0, 1 / 3, 1],
  "third-right": [2 / 3, 0, 1 / 3, 1],
  "quarter-tl": [0, 0, 1 / 2, 1 / 2],
  "quarter-tr": [1 / 2, 0, 1 / 2, 1 / 2],
  "quarter-bl": [0, 1 / 2, 1 / 2, 1 / 2],
  "quarter-br": [1 / 2, 1 / 2, 1 / 2, 1 / 2],
};

/** The four layouts shown when hovering the maximize button. */
export const SNAP_LAYOUTS = [
  ["half-left", "half-right"],
  ["major-left", "minor-right"],
  ["third-left", "third-center", "third-right"],
  ["quarter-tl", "quarter-tr", "quarter-bl", "quarter-br"],
];

export function snapRect(zone, bounds) {
  const [fx, fy, fw, fh] = SNAP_ZONES[zone];
  const x = Math.round(bounds.width * fx);
  const y = Math.round(bounds.height * fy);
  return { x, y, width: Math.round(bounds.width * (fx + fw)) - x, height: Math.round(bounds.height * (fy + fh)) - y };
}

/**
 * Which zone a window would snap to when dragged to `point` (desktop coordinates):
 * corners → quarters, left/right edge → halves, top edge → "maximize". `null` = no snap.
 */
export function edgeZone(point, bounds, edge = 8, corner = 90) {
  const left = point.x <= edge, right = point.x >= bounds.width - edge;
  const top = point.y <= edge;
  if (left && point.y <= corner) return "quarter-tl";
  if (left && point.y >= bounds.height - corner) return "quarter-bl";
  if (right && point.y <= corner) return "quarter-tr";
  if (right && point.y >= bounds.height - corner) return "quarter-br";
  if (left) return "half-left";
  if (right) return "half-right";
  if (top) return "maximize";
  return null;
}

/**
 * Where a maximized or snapped window goes when you drag it out: back to its normal size,
 * positioned so the cursor keeps holding the same spot of the title bar.
 */
export function unsnapGeometry(win, anchor, bounds) {
  const current = win.maximized ? { x: 0, y: 0, width: bounds.width, height: bounds.height } : { x: win.x, y: win.y, width: win.width, height: win.height };
  const normal = win.maximized ? (win.snap && win.restore ? win.restore : { width: win.width, height: win.height }) : (win.restore ?? { width: win.width, height: win.height });
  const ratio = current.width ? Math.min(1, Math.max(0, (anchor.x - current.x) / current.width)) : 0.5;
  const size = { width: Math.min(normal.width, bounds.width), height: Math.min(normal.height, bounds.height) };
  return { ...size, ...clampPosition({ x: anchor.x - size.width * ratio, y: anchor.y - 18 }, size, bounds) };
}

const nextOrder = state => Math.max(0, ...state.map(w => w.order)) + 1;

export function windowReducer(state, action) {
  switch(action.type) {
    case "open": {
      if (!APP_IDS.includes(action.id)) return state;
      const order = nextOrder(state);
      const existing = state.find(w=>w.id===action.id);
      if(existing) return normalize(state.map(w=>w.id===action.id ? {...w,minimized:false,order,resource:action.resource??w.resource} : w));
      return normalize([...state,makeWindow(action.id,order,action.bounds,action.resource,state.length,Boolean(action.maximized))]);
    }
    case "focus": {
      const order = nextOrder(state);
      return normalize(state.map(w=>w.id===action.id ? {...w,order,minimized:false}:w));
    }
    case "close": return state.filter(w=>w.id!==action.id);
    case "closeAll": return [];
    case "minimize": return state.map(w=>w.id===action.id ? {...w,minimized:true}:w);
    case "minimizeAll": return state.map(w=>({...w,minimized:true}));
    case "maximize": return state.map(w=>w.id===action.id ? {...w,maximized:!w.maximized}:w);
    case "move": return state.map(w=>w.id===action.id ? {...w,...clampPosition(action.position,w,action.bounds),snap:null,restore:null}:w);
    case "resize": return state.map(w=>{
      if (w.id !== action.id) return w;
      const minW = Math.min(MIN_SIZE.width, action.bounds.width), minH = Math.min(MIN_SIZE.height, action.bounds.height);
      const width = Math.round(Math.min(action.bounds.width, Math.max(minW, action.rect.width)));
      const height = Math.round(Math.min(action.bounds.height, Math.max(minH, action.rect.height)));
      const position = clampPosition({ x: Math.round(action.rect.x), y: Math.round(action.rect.y) }, { width, height }, action.bounds);
      return { ...w, ...position, width, height, pref: { width, height }, snap: null, restore: null, maximized: false };
    });
    case "snap": {
      if (!Object.hasOwn(SNAP_ZONES, action.zone)) return state;
      const order = nextOrder(state);
      return normalize(state.map(w => w.id === action.id ? {
        ...w, ...snapRect(action.zone, action.bounds), snap: action.zone, maximized: false, minimized: false, order,
        // Remember the size from before the first snap, so un-snapping gives it back.
        restore: w.snap ? w.restore : { x: w.x, y: w.y, width: w.width, height: w.height },
      } : w));
    }
    case "unsnap": return state.map(w => w.id === action.id && (w.snap || w.maximized)
      ? { ...w, ...unsnapGeometry(w, action.anchor, action.bounds), snap: null, restore: null, maximized: false }
      : w);
    case "resizeBounds": return state.map(w=>{
      if (w.snap) return { ...w, ...snapRect(w.snap, action.bounds) };
      const pref = w.pref ?? preferredSize(w.id);
      const size={width:Math.min(pref.width,action.bounds.width),height:Math.min(pref.height,action.bounds.height)};
      return {...w,...size,...clampPosition(w,size,action.bounds)};
    });
    default: return state;
  }
}
