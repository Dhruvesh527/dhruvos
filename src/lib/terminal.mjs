// The DhruvOS Terminal: a tiny, friendly shell. Pure functions only (no React, no DOM).
// runCommand() returns lines to print and, sometimes, an "effect" for the desktop to perform.

export const COMMANDS = [
  ["help", "Show this list"],
  ["whoami", "Who built this"],
  ["about", "A short introduction"],
  ["ls", "List files (try: ls projects)"],
  ["cat", "Read a file (try: cat skills.txt)"],
  ["open", "Open a project or app (try: open ozzat)"],
  ["skills", "Technologies I use, and where"],
  ["contact", "Email, GitHub and LinkedIn"],
  ["resume", "Open my résumé"],
  ["neofetch", "System information"],
  ["theme", "Switch the theme (dark / light)"],
  ["date", "Today's date and time"],
  ["echo", "Repeat some text"],
  ["history", "Commands you've typed"],
  ["clear", "Clear the screen"],
  ["exit", "Close the terminal"],
];
const HIDDEN = ["sudo", "cls", "cd", "hello", "hi", "sysinfo", "pwd"];
const FILES = ["projects/", "about.txt", "skills.txt", "contact.txt", "resume.pdf"];
const APP_TARGETS = {
  projects: "projects", files: "projects", about: "about", experience: "experience", achievements: "achievements",
  resume: "resume", cv: "resume", contact: "contact", browser: "browser", mail: "mail", email: "mail",
  photos: "photos", pictures: "photos", settings: "settings",
};

/** App names `open` understands, minus apps that are hidden because they have no content yet. */
const appTargets = ctx => Object.keys(APP_TARGETS).filter(name => !(ctx.hiddenApps ?? []).includes(APP_TARGETS[name]));

const norm = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const slugify = s => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function levenshtein(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]++;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

/** The closest known command to a typo, or null. */
export function suggest(word) {
  const names = COMMANDS.map(([name]) => name);
  const w = norm(word);
  const prefix = names.find(n => n.startsWith(w) && w.length >= 2);
  if (prefix) return prefix;
  let best = null, bestDistance = 3;
  for (const name of names) {
    const d = levenshtein(w, name);
    if (d < bestDistance) { best = name; bestDistance = d; }
  }
  return best;
}

function skillMap(projects) {
  const map = new Map();
  for (const p of projects) for (const skill of p.stack) map.set(skill, [...(map.get(skill) ?? []), p.name]);
  return map;
}

function findTarget(arg, ctx) {
  const a = norm(arg);
  const slug = slugify(arg);
  const project = ctx.projects.find(p => p.slug === slug || norm(p.name) === a);
  if (project) return { kind: "project", project };
  if (appTargets(ctx).includes(a)) return { kind: "app", app: APP_TARGETS[a] };
  if (a === "github" && ctx.profile.github) return { kind: "link", href: ctx.profile.github, label: "GitHub" };
  if (a === "linkedin" && ctx.profile.linkedin) return { kind: "link", href: ctx.profile.linkedin, label: "LinkedIn" };
  return null;
}

const line = (text, tone, extra) => ({ text, ...(tone ? { tone } : {}), ...extra });

function neofetch(ctx) {
  const uptime = Math.max(0, Math.round((ctx.now - ctx.startedAt) / 60000));
  const logo = ["  ██████   ", "  ██   ██  ", "  ██   ██  ", "  ██   ██  ", "  ██████ ● "];
  const info = [
    [ctx.profile.name.toLowerCase().replace(/\s+/g, "") + "@dhruvos", ""],
    ["OS", "DhruvOS 2.0"],
    ["Kernel", "Next.js · React · TypeScript"],
    ["Shell", "dhruvsh 1.0"],
    ["Uptime", uptime + (uptime === 1 ? " minute" : " minutes")],
    ["Theme", ctx.theme === "light" ? "Light" : "Dark"],
    ["Projects", String(ctx.projects.length)],
    ["Skills", String(skillMap(ctx.projects).size)],
  ];
  const rows = Math.max(logo.length, info.length);
  const out = [];
  for (let i = 0; i < rows; i++) {
    const [key, value] = info[i] ?? ["", ""];
    out.push(line((logo[i] ?? " ".repeat(11)) + "  " + (value ? key + ": " + value : key), i === 0 ? "accent" : undefined));
  }
  return out;
}

export function runCommand(raw, ctx) {
  const input = String(raw ?? "").trim();
  if (!input) return { lines: [] };
  const [rawName, ...rest] = input.split(/\s+/);
  const name = norm(rawName);
  const args = rest.filter(a => !a.startsWith("-"));
  const arg = args.join(" ");
  const p = ctx.profile;

  switch (name) {
    case "help":
      return { lines: [line("Commands you can use:", "heading"), ...COMMANDS.map(([n, d]) => line(n.padEnd(10) + d, undefined, { command: n === "open" ? "open " + (ctx.projects[0]?.slug ?? "projects") : n === "cat" ? "cat skills.txt" : n === "ls" ? "ls projects" : n })), line("Tip: press Tab to complete, ↑ ↓ for history.", "muted")] };
    case "whoami":
      return { lines: [line(p.name, "accent"), line(p.role + " · " + p.tagline)] };
    case "about":
      return { lines: [line(p.introduction)] };
    case "hello": case "hi":
      return { lines: [line("Hi there! 👋 Thanks for stopping by. Type 'help' to look around.", "success")] };
    case "pwd":
      return { lines: [line("/home/" + slugify(p.name.split(" ")[0]))] };
    case "ls": {
      if (/^projects\/?$/.test(norm(arg)))
        return { lines: ctx.projects.map(pr => line(pr.slug.padEnd(14) + (pr.status === "Live" ? "● live  " : "○ " + pr.status.toLowerCase().padEnd(6)) + pr.kind, pr.status === "Live" ? "success" : undefined, { command: "open " + pr.slug })) };
      if (arg && !FILES.includes(norm(arg))) return { lines: [line(`ls: ${arg}: No such file or directory`, "error")] };
      return { lines: [line(FILES.join("   "), "accent")] };
    }
    case "cd":
      if (/^projects\/?$/.test(norm(arg))) return { lines: [line("Opening Projects…", "muted")], effect: { type: "open", app: "projects" } };
      return { lines: [line("There's only one folder worth visiting here. Try: cd projects", "muted")] };
    case "cat": {
      const file = norm(arg);
      if (!file) return { lines: [line("usage: cat <file>   (files: " + FILES.filter(f => !f.endsWith("/")).join(", ") + ")", "error")] };
      if (file === "about.txt") return { lines: [line(p.introduction)] };
      if (file === "skills.txt") return runCommand("skills", ctx);
      if (file === "contact.txt") return runCommand("contact", ctx);
      if (file === "resume.pdf") return { lines: [line("Opening résumé…", "muted")], effect: { type: "open", app: "resume" } };
      return { lines: [line(`cat: ${arg}: No such file`, "error")] };
    }
    case "open": {
      if (!arg) return { lines: [line("usage: open <project | app>   e.g. open " + (ctx.projects[0]?.slug ?? "projects"), "error")] };
      const target = findTarget(arg, ctx);
      if (!target) {
        const options = [...ctx.projects.map(pr => pr.slug), ...appTargets(ctx), "github", "linkedin"];
        const close = options.filter(o => levenshtein(norm(arg), o) <= 2 || o.startsWith(norm(arg)));
        return { lines: [line(`open: can't find "${arg}"`, "error"), ...(close.length ? [line("Did you mean: " + close.slice(0, 3).join(", ") + "?", "muted")] : [])] };
      }
      if (target.kind === "project") return { lines: [line("Opening " + target.project.name + "…", "muted")], effect: { type: "open", app: "project", resource: target.project.slug } };
      if (target.kind === "app") return { lines: [line("Opening " + target.app + "…", "muted")], effect: { type: "open", app: target.app } };
      return { lines: [line("Opening " + target.label + " in a new tab…", "muted")], effect: { type: "link", href: target.href } };
    }
    case "skills": {
      const map = skillMap(ctx.projects);
      return { lines: [line("Skills (and where I used them):", "heading"), ...[...map].map(([skill, names]) => line(skill.padEnd(14) + "→ " + names.join(", ")))] };
    }
    case "contact":
      return { lines: [
        ...(p.email ? [line("Email     " + p.email, undefined, { href: "mailto:" + p.email })] : []),
        ...(p.github ? [line("GitHub    " + p.github.replace(/^https:\/\//, ""), undefined, { href: p.github })] : []),
        ...(p.linkedin ? [line("LinkedIn  " + p.linkedin.replace(/^https:\/\/(www\.)?/, ""), undefined, { href: p.linkedin })] : []),
        line("Or run: sudo hire-me", "muted", { command: "sudo hire-me" }),
      ] };
    case "resume": case "cv":
      return { lines: [line("Opening résumé…", "muted")], effect: { type: "open", app: "resume" } };
    case "neofetch": case "sysinfo":
      return { lines: neofetch(ctx) };
    case "theme": {
      const value = norm(arg);
      const next = value === "dark" || value === "light" ? value : ctx.theme === "dark" ? "light" : "dark";
      return { lines: [line("Theme: " + next, "success")], effect: { type: "theme", value: next } };
    }
    case "date":
      return { lines: [line(new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "short" }).format(ctx.now))] };
    case "echo":
      return { lines: [line(rest.join(" "))] };
    case "history":
      return { lines: ctx.history.length ? ctx.history.map((h, i) => line(String(i + 1).padStart(3) + "  " + h, undefined, { command: h })) : [line("No history yet.", "muted")] };
    case "clear": case "cls":
      return { lines: [], effect: { type: "clear" } };
    case "exit":
      return { lines: [line("Bye! 👋", "muted")], effect: { type: "close" } };
    case "sudo": {
      if (/^hire[- ]?me$/.test(norm(arg))) return { lines: [line("[sudo] permission granted ✓", "success"), line("Great choice. Opening Mail so you can say hello…", "muted")], effect: { type: "open", app: "mail" } };
      return { lines: [line("Nice try 😄 The only sudo command here is: sudo hire-me", "muted", { command: "sudo hire-me" })] };
    }
    default: {
      const guess = suggest(name);
      return { lines: [line(`command not found: ${rawName}`, "error"), line(guess ? `Did you mean '${guess}'? Type 'help' for everything.` : "Type 'help' to see what you can do.", "muted", guess ? { command: guess } : undefined)] };
    }
  }
}

/** Tab completion: returns the completed input, plus the options when there's more than one. */
export function complete(input, ctx) {
  const value = String(input ?? "");
  const parts = value.split(/\s+/);
  let options;
  let prefix;
  if (parts.length <= 1) {
    prefix = norm(parts[0] ?? "");
    options = [...COMMANDS.map(([n]) => n), ...HIDDEN.filter(h => h !== "cls")].filter(n => n.startsWith(prefix));
  } else {
    const command = norm(parts[0]);
    prefix = norm(parts.slice(1).join(" "));
    const pool = command === "open" ? [...ctx.projects.map(p => p.slug), ...appTargets(ctx), "github", "linkedin"]
      : command === "cat" ? FILES.filter(f => !f.endsWith("/"))
      : command === "ls" || command === "cd" ? ["projects"]
      : command === "theme" ? ["dark", "light"]
      : command === "sudo" ? ["hire-me"] : [];
    options = [...new Set(pool)].filter(o => o.startsWith(prefix));
  }
  if (!options.length) return { value, options: [] };
  // Complete as far as all options agree.
  let common = options[0];
  for (const o of options) while (!o.startsWith(common)) common = common.slice(0, -1);
  const head = parts.length <= 1 ? "" : parts[0] + " ";
  const done = options.length === 1;
  return { value: head + common + (done ? " " : ""), options: done ? [] : options };
}
