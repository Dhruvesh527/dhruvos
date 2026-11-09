import type { AppId } from "./window-state.mjs";
export type TerminalLine = { text: string; tone?: "muted" | "accent" | "error" | "success" | "heading"; command?: string; href?: string };
export type TerminalEffect =
  | { type: "open"; app: AppId; resource?: string }
  | { type: "link"; href: string }
  | { type: "theme"; value: "dark" | "light" }
  | { type: "clear" }
  | { type: "close" };
export type TerminalContext = {
  profile: { name: string; role: string; tagline: string; introduction: string; email: string; github: string; linkedin: string };
  projects: { slug: string; name: string; kind: string; status: string; stack: string[] }[];
  history: string[];
  theme: "dark" | "light";
  now: Date;
  startedAt: Date | number;
  /** Apps that are hidden (no content yet); `open` won't offer or open them. */
  hiddenApps?: string[];
};
export const COMMANDS: [string, string][];
export function levenshtein(a: string, b: string): number;
export function suggest(word: string): string | null;
export function runCommand(raw: string, ctx: TerminalContext): { lines: TerminalLine[]; effect?: TerminalEffect };
export function complete(input: string, ctx: TerminalContext): { value: string; options: string[] };
