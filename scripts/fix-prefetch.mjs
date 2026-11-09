// Next.js static export writes route prefetch data as folders, e.g.
//   out/simple/__next.simple/__PAGE__.txt
// but the browser requests a flat file name:
//   out/simple/__next.simple.__PAGE__.txt
// On a static host that mismatch is a 404 (an error in the console, and no instant page prefetch).
// This copies every such file to the flat name the browser asks for. Safe to run more than once.
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve("out");
let copied = 0;

async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith("__next.")) await flatten(dir, full);
      else if (entry.name !== "_next") await walk(full);
    }
  }
}

/** Copies files under a `__next.*` folder to `<pageDir>/<segments joined by dots>`. */
async function flatten(pageDir, nextDir) {
  const stack = [nextDir];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { stack.push(full); continue; }
      if (!entry.name.endsWith(".txt")) continue;
      const flat = path.relative(pageDir, full).split(path.sep).join(".");
      const target = path.join(pageDir, flat);
      try { await fs.access(target); } catch { await fs.copyFile(full, target); copied++; }
    }
  }
}

await walk(root);
console.log(`fix-prefetch: ${copied} prefetch file(s) copied to their flat names`);
