export type Theme = "dark" | "light";
export type AccentId = "blue" | "purple" | "teal" | "orange" | "rose";
export type WallpaperId = "ribbon" | "dusk" | "aurora" | "daylight";
export type IconSize = "small" | "medium" | "large";
export type Cell = { col: number; row: number };
export type OsSettings = {
  theme: Theme;
  accent: AccentId;
  wallpaper: WallpaperId;
  reduceMotion: boolean;
  brightness: number;
  iconSize: IconSize;
  iconPositions: Record<string, Cell>;
};
export type SettingsAction =
  | { type: "theme"; value: Theme }
  | { type: "toggleTheme" }
  | { type: "accent"; value: AccentId }
  | { type: "wallpaper"; value: WallpaperId }
  | { type: "nextWallpaper" }
  | { type: "reduceMotion"; value: boolean }
  | { type: "brightness"; value: number }
  | { type: "iconSize"; value: IconSize }
  | { type: "moveIcon"; id: string; cell: Cell }
  | { type: "iconPositions"; value: Record<string, Cell> }
  | { type: "resetIcons" }
  | { type: "load"; value: unknown };

export const SETTINGS_KEY: string;
export const THEMES: Theme[];
export const ACCENTS: Record<AccentId, { label: string; dark: string; light: string }>;
export const WALLPAPERS: Record<WallpaperId, { label: string; src: string; tone: Theme }>;
export const ICON_SIZES: IconSize[];
export const DEFAULT_SETTINGS: OsSettings;
export function settingsReducer(state: OsSettings, action: SettingsAction): OsSettings;
export function parseSettings(raw: unknown): OsSettings;
export function accentColor(settings: OsSettings): string;
