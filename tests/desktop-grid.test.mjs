import test from "node:test";
import assert from "node:assert/strict";
import { CELL_SIZES, cellToPoint, dropCell, gridSize, iconsInRect, layoutIcons, pointToCell } from "../src/lib/desktop-grid.mjs";
import { monthGrid, shiftMonth } from "../src/lib/calendar.mjs";

const cell = CELL_SIZES.medium;
const grid = { cols: 5, rows: 3 };

test("grid size fits whole cells inside the desktop", () => {
  assert.deepEqual(gridSize({ width: 24 + 92 * 4 + 50, height: 24 + 100 * 3 + 99 }, cell), { cols: 4, rows: 3 });
  assert.deepEqual(gridSize({ width: 10, height: 10 }, cell), { cols: 1, rows: 1 }, "never zero");
});

test("icons fill top-to-bottom, then the next column", () => {
  const layout = layoutIcons(["a", "b", "c", "d"], {}, grid);
  assert.deepEqual(layout, { a: { col: 0, row: 0 }, b: { col: 0, row: 1 }, c: { col: 0, row: 2 }, d: { col: 1, row: 0 } });
});

test("saved positions are kept; off-screen or clashing ones are re-placed", () => {
  const layout = layoutIcons(["a", "b", "c"], { a: { col: 4, row: 2 }, b: { col: 9, row: 9 }, c: { col: 4, row: 2 } }, grid);
  assert.deepEqual(layout.a, { col: 4, row: 2 });
  assert.deepEqual(layout.b, { col: 0, row: 0 });
  assert.deepEqual(layout.c, { col: 0, row: 1 });
});

test("a point snaps to the nearest cell and stays inside the grid", () => {
  const p = cellToPoint({ col: 2, row: 1 }, cell);
  assert.deepEqual(pointToCell({ x: p.x + 30, y: p.y - 30 }, cell, grid), { col: 2, row: 1 });
  assert.deepEqual(pointToCell({ x: -500, y: 9999 }, cell, grid), { col: 0, row: 2 });
});

test("dropping on a taken cell moves to the nearest free one; dropping on itself is fine", () => {
  const layout = { a: { col: 0, row: 0 }, b: { col: 1, row: 0 } };
  assert.deepEqual(dropCell(layout, "a", { col: 1, row: 0 }, grid), { col: 1, row: 1 });
  assert.deepEqual(dropCell(layout, "a", { col: 0, row: 0 }, grid), { col: 0, row: 0 });
});

test("the selection box picks the icons it touches, dragged in any direction", () => {
  const layout = { a: { col: 0, row: 0 }, b: { col: 0, row: 1 }, c: { col: 3, row: 2 } };
  const end = cellToPoint({ col: 0, row: 1 }, cell);
  assert.deepEqual(iconsInRect({ x: 0, y: 0, width: end.x + 40, height: end.y + 40 }, layout, cell).sort(), ["a", "b"]);
  assert.deepEqual(iconsInRect({ x: end.x + 40, y: end.y + 40, width: -(end.x + 40), height: -(end.y + 40) }, layout, cell).sort(), ["a", "b"]);
  assert.deepEqual(iconsInRect({ x: 600, y: 0, width: 5, height: 5 }, layout, cell), []);
});

test("calendar months have 42 days, start on Monday and mark today", () => {
  const days = monthGrid(2026, 10, new Date(2026, 10, 6)); // November 2026 starts on a Sunday
  assert.equal(days.length, 42);
  assert.equal(days[0].date.getDay(), 1, "first cell is a Monday");
  assert.equal(days.find(d => d.inMonth).day, 1);
  assert.equal(days.filter(d => d.isToday).length, 1);
  assert.equal(days.find(d => d.isToday).day, 6);
  assert.deepEqual(shiftMonth({ year: 2026, month: 11 }, 1), { year: 2027, month: 0 });
});
