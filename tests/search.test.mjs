import test from "node:test";
import assert from "node:assert/strict";
import { matchRange, normalize, search } from "../src/lib/search.mjs";

const index = [
  { id: "app:resume", kind: "app", title: "Résumé", keywords: ["cv", "pdf"], action: null },
  { id: "app:projects", kind: "app", title: "Projects", keywords: ["work", "portfolio", "files"], action: null },
  { id: "app:contact", kind: "app", title: "Contact", keywords: ["email", "hire me"], action: null },
  { id: "project:ozzat", kind: "project", title: "Ozzat", subtitle: "Marketplace · web + mobile", keywords: ["Next.js", "Prisma", "MongoDB", "Expo"], description: "Connects shoppers with nearby boutiques", action: null },
  { id: "skill:nextjs", kind: "skill", title: "Next.js", subtitle: "Used in Ozzat, DhruvOS", action: null },
  { id: "cmd:dark", kind: "command", title: "Dark mode", keywords: ["theme", "night", "light mode"], action: null },
];
const ids = q => search(index, q).map(e => e.id);

test("accents and case don't matter", () => {
  assert.equal(normalize("  RÉSUMÉ  "), "resume");
  assert.equal(ids("resume")[0], "app:resume");
  assert.equal(ids("RES")[0], "app:resume");
});

test("an exact title beats a prefix, which beats a keyword", () => {
  assert.deepEqual(ids("next.js").slice(0, 2), ["skill:nextjs", "project:ozzat"], "the skill itself first, then the project that uses it");
  assert.equal(ids("cv")[0], "app:resume");
});

test("keywords and descriptions find things whose titles don't match", () => {
  assert.equal(ids("hire")[0], "app:contact");
  assert.equal(ids("theme")[0], "cmd:dark");
  assert.ok(ids("boutiques").includes("project:ozzat"));
});

test("multi-word queries need every word to match", () => {
  assert.equal(ids("dark mode")[0], "cmd:dark");
  assert.deepEqual(ids("ozzat banana"), []);
});

test("small typos still find a title (letters in order)", () => {
  assert.equal(ids("ozt")[0], "project:ozzat");
});

test("empty or unmatched queries return nothing", () => {
  assert.deepEqual(ids(""), []);
  assert.deepEqual(ids("zzzz"), []);
});

test("highlight range points at the matched letters, even with accents", () => {
  assert.deepEqual(matchRange("Résumé", "sum"), [2, 5]);
  assert.deepEqual(matchRange("Projects", "JECT"), [3, 7]);
  assert.equal(matchRange("Projects", "xyz"), null);
});
