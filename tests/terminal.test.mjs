import test from "node:test";
import assert from "node:assert/strict";
import { complete, runCommand, suggest } from "../src/lib/terminal.mjs";

const ctx = {
  profile: { name: "Dhruvesh Gohil", role: "Full-stack developer", tagline: "Thoughtful interfaces.", introduction: "Hello there.", email: "me@example.com", github: "https://github.com/me", linkedin: "https://www.linkedin.com/in/me" },
  projects: [
    { slug: "ozzat", name: "Ozzat", kind: "Marketplace", status: "Live", stack: ["Next.js", "Prisma"] },
    { slug: "dhruvos", name: "DhruvOS", kind: "Portfolio", status: "Preview", stack: ["Next.js", "TypeScript"] },
  ],
  history: ["help"],
  theme: "dark",
  now: new Date(2026, 10, 7, 12, 0),
  startedAt: new Date(2026, 10, 7, 11, 55),
};
const run = cmd => runCommand(cmd, ctx);
const text = result => result.lines.map(l => l.text).join("\n");

test("help lists every command, and each line can be clicked to run it", () => {
  const result = run("help");
  for (const name of ["whoami", "open", "skills", "neofetch", "clear"]) assert.match(text(result), new RegExp("\\b" + name + "\\b"));
  assert.ok(result.lines.some(l => l.command === "open ozzat"));
});

test("open finds projects by slug or name, and apps by friendly names", () => {
  assert.deepEqual(run("open ozzat").effect, { type: "open", app: "project", resource: "ozzat" });
  assert.deepEqual(run("open DhruvOS").effect, { type: "open", app: "project", resource: "dhruvos" });
  assert.deepEqual(run("open cv").effect, { type: "open", app: "resume" });
  assert.deepEqual(run("open github").effect, { type: "link", href: "https://github.com/me" });
});

test("mistakes get a helpful hint instead of a dead end", () => {
  assert.match(text(run("open ozat")), /Did you mean: ozzat/);
  assert.match(text(run("hlep")), /command not found: hlep[\s\S]*Did you mean 'help'/);
  assert.equal(suggest("neofech"), "neofetch");
  assert.equal(run("hlep").lines[1].command, "help");
});

test("skills come from the project stacks, with where each was used", () => {
  const out = text(run("skills"));
  assert.match(out, /Next\.js\s+→ Ozzat, DhruvOS/);
  assert.match(out, /Prisma\s+→ Ozzat/);
});

test("files, résumé, theme, clear and exit produce the right effects", () => {
  assert.deepEqual(run("cat resume.pdf").effect, { type: "open", app: "resume" });
  assert.match(text(run("cat nope.txt")), /No such file/);
  assert.deepEqual(run("theme").effect, { type: "theme", value: "light" });
  assert.deepEqual(run("theme dark").effect, { type: "theme", value: "dark" });
  assert.equal(run("clear").effect.type, "clear");
  assert.equal(run("exit").effect.type, "close");
});

test("sudo hire-me opens Mail; any other sudo is gently refused", () => {
  assert.deepEqual(run("sudo hire-me").effect, { type: "open", app: "mail" });
  assert.equal(run("sudo rm -rf /").effect, undefined);
});

test("neofetch shows the OS, uptime and counts", () => {
  const out = text(run("neofetch"));
  assert.match(out, /DhruvOS 2\.0/);
  assert.match(out, /Uptime: 5 minutes/);
  assert.match(out, /Projects: 2/);
});

test("Tab completes commands and their arguments", () => {
  assert.deepEqual(complete("neo", ctx), { value: "neofetch ", options: [] });
  assert.deepEqual(complete("open oz", ctx), { value: "open ozzat ", options: [] });
  const many = complete("c", ctx);
  assert.ok(many.options.includes("cat") && many.options.includes("contact"));
  assert.deepEqual(complete("zzz", ctx), { value: "zzz", options: [] });
});

test("empty input prints nothing", () => assert.deepEqual(run("   "), { lines: [] }));

test("open skips apps that are hidden because they have no content yet", () => {
  const hidden = { ...ctx, hiddenApps: ["achievements"] };
  const blocked = runCommand("open achievements", hidden);
  assert.equal(blocked.effect, undefined);
  assert.match(text(blocked), /can't find "achievements"/);
  assert.deepEqual(runCommand("open achievements", ctx).effect, { type: "open", app: "achievements" });
  assert.ok(!complete("open achie", hidden).options.includes("achievements"));
  assert.deepEqual(runCommand("open experience", hidden).effect, { type: "open", app: "experience" });
});
