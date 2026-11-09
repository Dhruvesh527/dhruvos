import type { LucideIcon } from "lucide-react";
import { BriefcaseBusiness, FileText, Folder, Globe, Images, Mail, Monitor, Send, Settings2, Terminal, Trophy, UserRound } from "lucide-react";
import type { AppId } from "@/lib/window-state.mjs";
import { achievements, experience, projects } from "@/content/portfolio";

export type { AppId };
export type AppDefinition = {title:string; icon:LucideIcon; color:string};

export const appDefinitions: Record<AppId, AppDefinition> = {
  projects: {title:"Projects",icon:Folder,color:"amber"},
  project: {title:"Project Viewer",icon:Monitor,color:"blue"},
  about: {title:"About me",icon:UserRound,color:"blue"},
  experience: {title:"Experience",icon:BriefcaseBusiness,color:"blue"},
  achievements: {title:"Achievements",icon:Trophy,color:"amber"},
  resume: {title:"Résumé",icon:FileText,color:"blue"},
  contact: {title:"Contact",icon:Mail,color:"mint"},
  settings: {title:"Settings",icon:Settings2,color:"blue"},
  document: {title:"Document Viewer",icon:FileText,color:"blue"},
  terminal: {title:"Terminal",icon:Terminal,color:"slate"},
  browser: {title:"Browser",icon:Globe,color:"blue"},
  mail: {title:"Mail",icon:Send,color:"blue"},
  photos: {title:"Photos",icon:Images,color:"amber"},
};
/** Apps that have no content yet stay out of sight (desktop, Start, search, phone, terminal) until they do. */
export const hiddenApps: AppId[] = [
  ...(experience.length ? [] : ["experience" as const]),
  ...(achievements.length ? [] : ["achievements" as const]),
];
export const isVisibleApp = (id: AppId) => !hiddenApps.includes(id);
export const desktopApps: AppId[] = (["projects","about","experience","achievements","resume","contact","terminal","browser","photos"] as AppId[]).filter(isVisibleApp);

/** The title shown on a window and its taskbar preview. */
export function windowTitle(id: AppId, resource?: string) {
  if (id === "project") {
    const project = projects.find(p => p.slug === resource);
    if (project) return project.name + " — Project Viewer";
  }
  if (id === "projects") return "Projects — File Explorer";
  return appDefinitions[id].title;
}
