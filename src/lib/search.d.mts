export type SearchKind = "app" | "project" | "skill" | "page" | "link" | "command";
export type SearchEntry<A = unknown> = {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle?: string;
  description?: string;
  keywords?: string[];
  action: A;
};
export function normalize(text: unknown): string;
export function isSubsequence(query: string, text: string): boolean;
export function scoreEntry(entry: SearchEntry, query: string): number;
export function search<E extends SearchEntry>(index: E[], query: string, limit?: number): E[];
export function matchRange(title: string, query: string): [number, number] | null;
