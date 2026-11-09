// Visitor preferences for the DhruvOS desktop: theme, accent, wallpaper, and so on.
// Pure and validated, so a broken or old value in localStorage can never break the page.

export const SETTINGS_KEY = "dhruvos-settings";

export const THEMES = ["dark", "light"];

/** Accent colours. Each has a lighter shade for the dark theme and a deeper one for the light theme. */
export const ACCENTS = {
  blue: { label: "Blue", dark: "oklch(.82 .09 253)", light: "oklch(.52 .17 258)" },
  purple: { label: "Purple", dark: "oklch(.8 .11 300)", light: "oklch(.5 .19 300)" },
  teal: { label: "Teal", dark: "oklch(.83 .09 190)", light: "oklch(.5 .09 195)" },
  orange: { label: "Orange", dark: "oklch(.83 .12 62)", light: "oklch(.57 .15 50)" },
  rose: { label: "Rose", dark: "oklch(.8 .11 10)", light: "oklch(.55 .19 15)" },
};

/** Original wallpapers (all drawn for this site). */
export const WALLPAPERS = {
  ribbon: { label: "Ribbon", src: "/wallpaper.svg", tone: "dark" },
  dusk: { label: "Dusk", src: "/wallpapers/dusk.svg", tone: "dark" },
  aurora: { label: "Aurora", src: "/wallpapers/aurora.svg", tone: "dark" },
  daylight: { label: "Daylight", src: "/wallpapers/daylight.svg", tone: "light" },
};

export const ICON_SIZES = ["small", "medium", "large"];

export const DEFAULT_SETTINGS = Object.freeze({
  theme: "dark",
  accent: "blue",
  wallpaper: "ribbon",
  reduceMotion: false,
  brightness: 100,
  iconSize: "medium",
  iconPositions: {},
});

const clampBrightness = value => Math.round(Math.min(100, Math.max(40, Number(value))));
const isCell = cell => cell && Number.isInteger(cell.col) && Number.isInteger(cell.row) && cell.col >= 0 && cell.row >= 0;

function cleanPositions(positions) {
  if (!positions || typeof positions !== "object") return {};
  return Object.fromEntries(Object.entries(positions).filter(([, cell]) => isCell(cell)).map(([id, { col, row }]) => [id, { col, row }]));
}

export function settingsReducer(state, action) {
  switch (action.type) {
    case "theme":
      return THEMES.includes(action.value) ? { ...state, theme: action.value } : state;
    case "toggleTheme":
      return { ...state, theme: state.theme === "dark" ? "light" : "dark" };
    case "accent":
      return Object.hasOwn(ACCENTS, action.value) ? { ...state, accent: action.value } : state;
    case "wallpaper":
      return Object.hasOwn(WALLPAPERS, action.value) ? { ...state, wallpaper: action.value } : state;
    case "nextWallpaper": {
      const keys = Object.keys(WALLPAPERS);
      return { ...state, wallpaper: keys[(keys.indexOf(state.wallpaper) + 1) % keys.length] };
    }
    case "reduceMotion":
      return { ...state, reduceMotion: Boolean(action.value) };
    case "brightness":
      return Number.isFinite(Number(action.value)) ? { ...state, brightness: clampBrightness(action.value) } : state;
    case "iconSize":
      return ICON_SIZES.includes(action.value) ? { ...state, iconSize: action.value, iconPositions: {} } : state;
    case "moveIcon":
      return isCell(action.cell) ? { ...state, iconPositions: { ...state.iconPositions, [action.id]: { col: action.cell.col, row: action.cell.row } } } : state;
    case "iconPositions":
      return { ...state, iconPositions: cleanPositions(action.value) };
    case "resetIcons":
      return { ...state, iconPositions: {} };
    case "load":
      return parseSettings(action.value);
    default:
      return state;
  }
}

/** Turns whatever was saved (string, object, garbage) into valid settings. */
export function parseSettings(raw) {
  let data = raw;
  if (typeof raw === "string") {
    try { data = JSON.parse(raw); } catch { data = null; }
  }
  if (!data || typeof data !== "object") return { ...DEFAULT_SETTINGS };
  const d = DEFAULT_SETTINGS;
  return {
    theme: THEMES.includes(data.theme) ? data.theme : d.theme,
    accent: Object.hasOwn(ACCENTS, data.accent) ? data.accent : d.accent,
    wallpaper: Object.hasOwn(WALLPAPERS, data.wallpaper) ? data.wallpaper : d.wallpaper,
    reduceMotion: typeof data.reduceMotion === "boolean" ? data.reduceMotion : d.reduceMotion,
    brightness: Number.isFinite(Number(data.brightness)) ? clampBrightness(data.brightness) : d.brightness,
    iconSize: ICON_SIZES.includes(data.iconSize) ? data.iconSize : d.iconSize,
    iconPositions: cleanPositions(data.iconPositions),
  };
}

export function accentColor(settings) {
  const accent = ACCENTS[settings.accent] ?? ACCENTS.blue;
  return settings.theme === "light" ? accent.light : accent.dark;
}
