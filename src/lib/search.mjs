// Start-menu search: ranks apps, projects, skills, pages and commands for a typed query.
// Pure functions: no React, no DOM, easy to test.

/** Lower-case, strip accents ("Résumé" → "resume") and collapse spaces. */
export function normalize(text) {
  return String(text ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

const words = text => normalize(text).split(/[^a-z0-9+#.]+/).filter(Boolean);

/** True when every letter of `query` appears in `text` in order ("ozt" → "Ozzat"). */
export function isSubsequence(query, text) {
  let i = 0;
  for (const char of text) if (char === query[i]) i++;
  return i === query.length;
}

/** How well one query token matches one entry (0 = not at all). */
function tokenScore(token, entry) {
  const title = normalize(entry.title);
  if (title === token) return 100;
  if (title.startsWith(token)) return 90;
  if (words(entry.title).some(w => w.startsWith(token))) return 80;
  const keywords = (entry.keywords ?? []).map(normalize);
  if (keywords.includes(token)) return 75;
  if (keywords.some(k => k.startsWith(token) || k.split(" ").some(w => w.startsWith(token)))) return 65;
  if (title.includes(token)) return 60;
  if (keywords.some(k => k.includes(token))) return 45;
  if (normalize(entry.subtitle).includes(token)) return 35;
  if (token.length >= 3 && normalize(entry.description).includes(token)) return 20;
  if (token.length >= 3 && isSubsequence(token, title.replace(/ /g, ""))) return 18;
  return 0;
}

const KIND_BOOST = { app: 4, project: 3, skill: 2, page: 1, link: 1, command: 0 };

/** Score an entry for the whole query. Every word of the query has to match somewhere. */
export function scoreEntry(entry, query) {
  const q = normalize(query);
  if (!q) return 0;
  const whole = tokenScore(q, entry);
  const tokens = q.split(" ");
  let combined = 0;
  if (tokens.length > 1) {
    const scores = tokens.map(t => tokenScore(t, entry));
    if (scores.every(s => s > 0)) combined = Math.min(...scores) * 0.9;
  }
  const best = Math.max(whole, combined);
  return best > 0 ? best + (KIND_BOOST[entry.kind] ?? 0) : 0;
}

/** The best matches, highest score first (ties keep their original order). */
export function search(index, query, limit = 8) {
  return index
    .map((entry, position) => ({ entry, position, score: scoreEntry(entry, query) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.position - b.position)
    .slice(0, limit)
    .map(result => result.entry);
}

/** Where the query appears in the title, for bold highlighting: [start, end] or null. */
export function matchRange(title, query) {
  const q = normalize(query);
  if (!q) return null;
  const t = String(title).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const start = t.indexOf(q);
  return start >= 0 && t.length === String(title).length ? [start, start + q.length] : null;
}
