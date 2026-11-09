import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS, accentColor, parseSettings, settingsReducer } from "../src/lib/os-settings.mjs";

const apply = (...actions) => actions.reduce(settingsReducer, { ...DEFAULT_SETTINGS });

test("theme, accent and wallpaper accept only known values", () => {
  assert.equal(apply({ type: "theme", value: "light" }).theme, "light");
  assert.equal(apply({ type: "theme", value: "neon" }).theme, "dark");
  assert.equal(apply({ type: "accent", value: "teal" }).accent, "teal");
  assert.equal(apply({ type: "accent", value: "toString" }).accent, "blue", "prototype keys are not accents");
  assert.equal(apply({ type: "wallpaper", value: "nope" }).wallpaper, "ribbon");
});

test("toggleTheme flips and nextWallpaper cycles back to the start", () => {
  assert.equal(apply({ type: "toggleTheme" }, { type: "toggleTheme" }).theme, "dark");
  const four = apply(...Array(4).fill({ type: "nextWallpaper" }));
  assert.equal(four.wallpaper, "ribbon");
});

test("brightness is kept between 40 and 100 so the screen never goes black", () => {
  assert.equal(apply({ type: "brightness", value: 5 }).brightness, 40);
  assert.equal(apply({ type: "brightness", value: 250 }).brightness, 100);
  assert.equal(apply({ type: "brightness", value: "abc" }).brightness, 100);
});

test("changing icon size resets icon positions (the grid changes)", () => {
  const moved = apply({ type: "moveIcon", id: "about", cell: { col: 3, row: 1 } });
  assert.deepEqual(moved.iconPositions, { about: { col: 3, row: 1 } });
  assert.deepEqual(settingsReducer(moved, { type: "iconSize", value: "large" }).iconPositions, {});
});

test("broken saved data falls back to defaults field by field", () => {
  assert.deepEqual(parseSettings("{not json"), DEFAULT_SETTINGS);
  assert.deepEqual(parseSettings(null), DEFAULT_SETTINGS);
  const mixed = parseSettings(JSON.stringify({ theme: "light", accent: 42, iconPositions: { a: { col: 1, row: 2 }, b: { col: -1, row: 0 }, c: "x" } }));
  assert.equal(mixed.theme, "light");
  assert.equal(mixed.accent, "blue");
  assert.deepEqual(mixed.iconPositions, { a: { col: 1, row: 2 } });
});

test("accent colour gets deeper in the light theme for contrast", () => {
  assert.notEqual(accentColor({ ...DEFAULT_SETTINGS, theme: "dark" }), accentColor({ ...DEFAULT_SETTINGS, theme: "light" }));
});
