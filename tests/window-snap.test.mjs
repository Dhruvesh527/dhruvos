import test from "node:test";
import assert from "node:assert/strict";
import { MIN_SIZE, SNAP_LAYOUTS, SNAP_ZONES, edgeZone, snapRect, unsnapGeometry, windowReducer } from "../src/lib/window-state.mjs";

const bounds = { width: 1440, height: 850 };
const open = (state, id) => windowReducer(state, { type: "open", id, bounds });

test("snap zones cover the desktop exactly, with no gaps or overlaps", () => {
  assert.deepEqual(snapRect("half-left", bounds), { x: 0, y: 0, width: 720, height: 850 });
  assert.deepEqual(snapRect("half-right", bounds), { x: 720, y: 0, width: 720, height: 850 });
  const odd = { width: 1001, height: 701 };
  const [a, b, c] = ["third-left", "third-center", "third-right"].map(z => snapRect(z, odd));
  assert.equal(a.width + b.width + c.width, 1001);
  assert.equal(b.x, a.x + a.width);
  assert.equal(snapRect("quarter-bl", odd).y + snapRect("quarter-bl", odd).height, 701);
  for (const layout of SNAP_LAYOUTS) for (const zone of layout) assert.ok(SNAP_ZONES[zone], zone);
});

test("snapping remembers the old size and dragging out gives it back under the cursor", () => {
  let state = open([], "about");
  const before = { ...state[0] };
  state = windowReducer(state, { type: "snap", id: "about", zone: "half-left", bounds });
  assert.equal(state[0].snap, "half-left");
  assert.equal(state[0].width, 720);
  // Snapping again (to another zone) keeps the ORIGINAL size to restore
  state = windowReducer(state, { type: "snap", id: "about", zone: "quarter-br", bounds });
  assert.deepEqual(state[0].restore, { x: before.x, y: before.y, width: before.width, height: before.height });
  const anchor = { x: state[0].x + state[0].width / 2, y: state[0].y + 10 };
  state = windowReducer(state, { type: "unsnap", id: "about", anchor, bounds });
  assert.equal(state[0].snap, null);
  assert.equal(state[0].width, before.width);
  assert.equal(state[0].height, before.height);
  assert.ok(Math.abs(state[0].x + state[0].width / 2 - anchor.x) < 2 || state[0].x + state[0].width === bounds.width, "cursor stays at the same spot of the title bar");
});

test("a maximized window dragged out returns to its normal size", () => {
  let state = windowReducer(open([], "contact"), { type: "maximize", id: "contact" });
  const g = unsnapGeometry(state[0], { x: 100, y: 5 }, bounds);
  assert.equal(g.width, 900);
  assert.ok(g.x <= 100 && g.x + g.width >= 100, "the cursor is still over the window");
  state = windowReducer(state, { type: "unsnap", id: "contact", anchor: { x: 100, y: 5 }, bounds });
  assert.equal(state[0].maximized, false);
});

test("resizing respects the minimum size and the desktop edges", () => {
  let state = open([], "about");
  state = windowReducer(state, { type: "resize", id: "about", rect: { x: 100, y: 100, width: 50, height: 20 }, bounds });
  assert.equal(state[0].width, MIN_SIZE.width);
  assert.equal(state[0].height, MIN_SIZE.height);
  state = windowReducer(state, { type: "resize", id: "about", rect: { x: 1300, y: 0, width: 600, height: 400 }, bounds });
  assert.ok(state[0].x + state[0].width <= bounds.width);
});

test("a resized window keeps its chosen size when the screen shrinks and grows back", () => {
  let state = open([], "about");
  state = windowReducer(state, { type: "resize", id: "about", rect: { x: 10, y: 10, width: 700, height: 500 }, bounds });
  state = windowReducer(state, { type: "resizeBounds", bounds: { width: 500, height: 400 } });
  assert.equal(state[0].width, 500);
  state = windowReducer(state, { type: "resizeBounds", bounds });
  assert.equal(state[0].width, 700);
});

test("snapped windows follow the desktop when it resizes", () => {
  let state = windowReducer(open([], "about"), { type: "snap", id: "about", zone: "half-right", bounds });
  state = windowReducer(state, { type: "resizeBounds", bounds: { width: 1000, height: 700 } });
  assert.deepEqual({ x: state[0].x, width: state[0].width, height: state[0].height }, { x: 500, width: 500, height: 700 });
});

test("new windows cascade instead of stacking exactly on top of each other", () => {
  let state = open(open([], "about"), "contact");
  assert.notDeepEqual([state[0].x, state[0].y], [state[1].x, state[1].y]);
});

test("dragging to an edge picks the matching zone", () => {
  assert.equal(edgeZone({ x: 2, y: 400 }, bounds), "half-left");
  assert.equal(edgeZone({ x: 1439, y: 400 }, bounds), "half-right");
  assert.equal(edgeZone({ x: 700, y: 0 }, bounds), "maximize");
  assert.equal(edgeZone({ x: 0, y: 10 }, bounds), "quarter-tl");
  assert.equal(edgeZone({ x: 1440, y: 845 }, bounds), "quarter-br");
  assert.equal(edgeZone({ x: 700, y: 400 }, bounds), null);
});

test("show desktop minimizes everything", () => {
  const state = windowReducer(open(open([], "about"), "contact"), { type: "minimizeAll" });
  assert.ok(state.every(w => w.minimized));
});
