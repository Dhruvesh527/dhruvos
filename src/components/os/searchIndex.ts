import {
  Accessibility, FileText, FolderGit2, Image as ImageIcon, Lock, Mail, Moon, MonitorUp, PanelLeft, Power,
  RotateCcw, SquareStack, Sun, Wrench, type LucideIcon,
} from "lucide-react";
import { profile, projects, thumbOf } from "@/content/portfolio";
import type { SearchEntry } from "@/lib/search.mjs";
import { appDefinitions, isVisibleApp, type AppId } from "@/components/apps/registry";

export type OsCommand = "toggleTheme" | "nextWallpaper" | "reduceMotion" | "lock" | "restart" | "shutdown" | "showDesktop" | "taskView";
export type OsAction =
  | { type: "app"; app: AppId; resource?: string }
  | { type: "link"; href: string; external?: boolean }
  | { type: "command"; name: OsCommand };
export type OsSearchEntry = SearchEntry<OsAction> & { icon?: LucideIcon; image?: string; badge?: string };

/** Extra words people might type for each app. */
const APP_KEYWORDS: Partial<Record<AppId, string[]>> = {
  projects: ["work", "portfolio", "files", "explorer", "case studies"],
  about: ["bio", "me", "who", "profile", "photo", "introduction"],
  experience: ["jobs", "career", "work history", "employment"],
  achievements: ["awards", "certificates", "certifications"],
  resume: ["cv", "resume", "pdf", "print"],
  contact: ["email", "hire", "hire me", "message", "mail", "reach", "linkedin", "github"],
  settings: ["preferences", "options", "theme", "wallpaper", "personalise", "personalize", "accent", "accessibility"],
  terminal: ["cli", "command line", "shell", "console", "bash", "cmd", "powershell"],
  browser: ["web", "internet", "edge", "chrome", "website", "live site", "tabs"],
  mail: ["compose", "write", "send", "email", "message", "hire"],
  photos: ["pictures", "gallery", "images", "screenshots", "wallpapers"],
};

const SEARCHABLE_APPS: AppId[] = (["projects", "about", "experience", "achievements", "resume", "contact", "terminal", "browser", "mail", "photos", "settings"] as AppId[]).filter(isVisibleApp);

/** Everything the Start-menu search can find. `theme` decides whether the toggle says "dark" or "light". */
export function buildSearchIndex(theme: "dark" | "light"): OsSearchEntry[] {
  const entries: OsSearchEntry[] = [];

  for (const id of SEARCHABLE_APPS) {
    entries.push({ id: "app:" + id, kind: "app", title: appDefinitions[id].title, subtitle: "App", keywords: APP_KEYWORDS[id], icon: appDefinitions[id].icon, action: { type: "app", app: id } });
  }

  for (const project of projects) {
    entries.push({
      id: "project:" + project.slug, kind: "project", title: project.name, subtitle: project.kind,
      keywords: [...project.stack, project.status === "Live" ? "live" : "", "project", "case study"].filter(Boolean),
      description: project.description + " " + project.features.join(" "),
      image: thumbOf(project), badge: project.status === "Live" ? "Live" : undefined,
      action: { type: "app", app: "project", resource: project.slug },
    });
  }

  // Skills: every technology from the project stacks, pointing at the projects that use it.
  const skills = new Map<string, string[]>();
  for (const project of projects) for (const skill of project.stack) skills.set(skill, [...(skills.get(skill) ?? []), project.slug]);
  for (const [skill, slugs] of skills) {
    const names = slugs.map(slug => projects.find(p => p.slug === slug)?.name).filter(Boolean);
    entries.push({ id: "skill:" + skill, kind: "skill", title: skill, subtitle: "Used in " + names.join(", "), keywords: ["skill", "tech", "stack"], icon: Wrench, action: { type: "app", app: "project", resource: slugs[0] } });
  }

  if (profile.github) entries.push({ id: "link:github", kind: "link", title: "GitHub", subtitle: profile.github.replace(/^https:\/\//, ""), keywords: ["code", "source", "repositories", "git"], icon: FolderGit2, action: { type: "link", href: profile.github, external: true } });
  if (profile.linkedin) entries.push({ id: "link:linkedin", kind: "link", title: "LinkedIn", subtitle: profile.linkedin.replace(/^https:\/\/(www\.)?/, ""), keywords: ["profile", "network", "connect"], action: { type: "link", href: profile.linkedin, external: true } });
  if (profile.email) entries.push({ id: "link:email", kind: "link", title: "Email " + profile.name.split(" ")[0], subtitle: profile.email, keywords: ["email", "mail", "message", "contact"], icon: Mail, action: { type: "link", href: "mailto:" + profile.email } });
  entries.push({ id: "page:simple", kind: "page", title: "Simple view", subtitle: "The whole portfolio as one easy page", keywords: ["accessible", "plain", "text", "page"], icon: PanelLeft, action: { type: "link", href: "/simple/" } });
  entries.push({ id: "page:resume", kind: "page", title: "Printable résumé", subtitle: "Opens the résumé as a page you can print", keywords: ["cv", "print", "pdf"], icon: FileText, action: { type: "link", href: "/resume/" } });

  const dark = theme === "dark";
  const commands: [OsCommand, string, string, LucideIcon, string[]][] = [
    ["toggleTheme", dark ? "Light mode" : "Dark mode", "Switch the desktop theme", dark ? Sun : Moon, ["theme", "dark mode", "light mode", "night", "day"]],
    ["nextWallpaper", "Change wallpaper", "Next desktop background", ImageIcon, ["background", "wallpaper", "personalise"]],
    ["reduceMotion", "Reduce motion", "Turn animations on or off", Accessibility, ["animations", "accessibility", "motion"]],
    ["showDesktop", "Show desktop", "Minimize all windows", MonitorUp, ["minimize", "desktop", "hide windows"]],
    ["taskView", "Task view", "See every open window", SquareStack, ["windows", "switch", "alt tab"]],
    ["lock", "Lock", "Back to the lock screen", Lock, ["sleep", "lock screen"]],
    ["restart", "Restart", "Replay the intro", RotateCcw, ["reboot", "replay", "intro"]],
    ["shutdown", "Shut down", "Turn the portfolio off", Power, ["power off", "turn off", "exit"]],
  ];
  for (const [name, title, subtitle, icon, keywords] of commands) entries.push({ id: "cmd:" + name, kind: "command", title, subtitle, icon, keywords, action: { type: "command", name } });

  return entries;
}

export const KIND_LABELS: Record<OsSearchEntry["kind"], string> = { app: "App", project: "Project", skill: "Skill", page: "Page", link: "Link", command: "Setting" };
