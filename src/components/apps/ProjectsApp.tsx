"use client";

import { useState } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, ChevronRight, FileText, Folder, Grid2X2, Image as ImageIcon, List,
  Monitor, PanelRight, Search, Sparkles, Trophy, UserRound, X,
} from "lucide-react";
import { profile, projects, thumbOf } from "@/content/portfolio";
import { WALLPAPERS, type WallpaperId } from "@/lib/os-settings.mjs";
import { appDefinitions, isVisibleApp, type AppId } from "./registry";
import FolderIcon from "@/components/FolderIcon";
import ProjectImage from "@/components/ProjectImage";

type Place = "projects" | "documents" | "pictures";
const PLACES: { id: Place; label: string }[] = [{ id: "projects", label: "Projects" }, { id: "documents", label: "Documents" }, { id: "pictures", label: "Pictures" }];

/** File Explorer: Projects, Documents and Pictures, with back/forward and a preview pane. */
export default function ProjectsApp({ onOpen }: { onOpen: (id: AppId, resource?: string) => void }) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"all" | "ready">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [nav, setNav] = useState<{ stack: Place[]; index: number }>({ stack: ["projects"], index: 0 });
  const [previewPane, setPreviewPane] = useState(true);
  const place = nav.stack[nav.index];
  const filtered = projects.filter(p => (filter === "all" || p.status !== "Draft") && (p.name + " " + p.kind + " " + p.subtitle + " " + p.stack.join(" ")).toLowerCase().includes(search.toLowerCase()));
  const selectedProject = projects.find(p => p.slug === selected);
  const openProject = (slug: string) => onOpen("project", slug);

  const goTo = (next: Place) => {
    setSelected(null); setSearch("");
    if (next === place) return;
    setNav(n => ({ stack: [...n.stack.slice(0, n.index + 1), next], index: n.index + 1 }));
  };
  const move = (delta: number) => { setSelected(null); setNav(n => ({ ...n, index: Math.min(n.stack.length - 1, Math.max(0, n.index + delta)) })); };

  const documents = [
    { id: "resume", name: "Résumé.pdf", type: "PDF document", icon: FileText, open: () => onOpen("resume") },
    ...(isVisibleApp("achievements") ? [{ id: "certificates", name: "Certificates", type: "File folder", icon: Trophy, open: () => onOpen("achievements") }] : []),
    { id: "about", name: "About me.txt", type: "Text document", icon: UserRound, open: () => onOpen("about") },
  ];
  const pictures = [
    ...projects.map(p => ({ id: p.slug, name: p.name + ".webp", src: thumbOf(p) })),
    ...(Object.keys(WALLPAPERS) as WallpaperId[]).map(id => ({ id, name: WALLPAPERS[id].label + ".svg", src: WALLPAPERS[id].src })),
  ];
  const label = PLACES.find(p => p.id === place)!.label;
  const count = place === "projects" ? filtered.length : place === "documents" ? documents.length : pictures.length;

  return (
    <div className="explorer">
      <div className="explorer-address">
        <div className="address-navigation">
          <button aria-label="Back" disabled={nav.index === 0} onClick={() => move(-1)}><ArrowLeft size={16} /></button>
          <button aria-label="Forward" disabled={nav.index >= nav.stack.length - 1} onClick={() => move(1)}><ArrowRight size={16} /></button>
          <button aria-label="Up to Projects" onClick={() => { goTo("projects"); setFilter("all"); }}><ArrowUp size={17} /></button>
        </div>
        <div className="breadcrumbs"><Monitor size={16} /><span>This PC</span><ChevronRight size={13} /><span>{profile.name}</span><ChevronRight size={13} /><strong>{label}</strong></div>
        <label className="explorer-search"><Search size={15} /><input value={search} onChange={e => { setSearch(e.target.value); setSelected(null); if (place !== "projects") goTo("projects"); }} placeholder="Search projects and skills" aria-label="Search projects" />{search && <button aria-label="Clear project search" onClick={() => setSearch("")}><X size={13} /></button>}</label>
      </div>
      <div className="explorer-tools">
        <div>
          {place === "projects" ? <>
            <button className={filter === "all" ? "tool-active" : ""} onClick={() => { setFilter("all"); setSelected(null); }}><Folder size={15} />All work</button>
            <button className={filter === "ready" ? "tool-active" : ""} onClick={() => { setFilter("ready"); setSelected(null); }}><Sparkles size={15} />Featured</button>
          </> : <span className="tool-label">{label}</span>}
        </div>
        <div className="view-toggle">
          <button className={view === "grid" ? "active" : ""} aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}><Grid2X2 size={16} /></button>
          <button className={view === "list" ? "active" : ""} aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}><List size={18} /></button>
          <button className={previewPane ? "active" : ""} aria-label="Preview pane" aria-pressed={previewPane} onClick={() => setPreviewPane(v => !v)}><PanelRight size={16} /></button>
        </div>
      </div>
      <div className={"explorer-layout" + (previewPane && place === "projects" ? " with-preview" : "")}>
        <nav className="explorer-sidebar" aria-label="Folder navigation">
          <span className="sidebar-heading">This PC</span>
          {PLACES.map(p => (
            <button key={p.id} className={place === p.id ? "active" : ""} aria-current={place === p.id ? "page" : undefined} onClick={() => goTo(p.id)}>
              {p.id === "projects" ? <Folder size={17} /> : p.id === "documents" ? <FileText size={17} /> : <ImageIcon size={17} />}{p.label}
            </button>
          ))}
          <span className="sidebar-heading">Quick access</span>
          {(["about", "experience", "achievements", "contact"] as AppId[]).filter(isVisibleApp).map(id => { const Icon = appDefinitions[id].icon; return <button key={id} onClick={() => onOpen(id)}><Icon size={17} />{appDefinitions[id].title}</button>; })}
          <div className="sidebar-bottom"><Monitor size={17} /><div><span>This PC</span><small>{profile.name.split(" ")[0]}&apos;s workspace</small></div></div>
        </nav>

        <div className="explorer-main">
          {place === "projects" && <>
            <header className="projects-heading"><div><span className="location-label"><span />Personal collection</span><h1>Selected work<span>.</span></h1><p>Websites, applications, and things made with care.</p></div><span className="project-count">{filtered.length.toString().padStart(2, "0")}<small>projects</small></span></header>
            <div className={"project-files " + view} role="group" aria-label="Project files">{filtered.map((p, index) => <div key={p.slug} className={"project-file" + (selected === p.slug ? " selected" : "")}>
              <button className="project-file-main" onClick={() => { setSelected(p.slug); if (window.matchMedia("(pointer: coarse)").matches) openProject(p.slug); }} onDoubleClick={() => openProject(p.slug)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); openProject(p.slug); } }}>
                <div className={"file-preview " + p.color}><ProjectImage src={thumbOf(p)} alt="" /><span className="file-number">0{index + 1}</span>{p.status === "Draft" && <span className="preview-draft">Draft</span>}{p.status === "Live" && <span className="preview-live">● Live</span>}</div>
                <div className="file-info"><FolderIcon color={p.color} small /><div><h2>{p.name}</h2><span>{p.kind}</span></div></div>
                <span className="sr-only">. Double-click, or use Open, to view.</span>
              </button>
              <div className="file-bottom"><span>{p.status === "Draft" ? "Case study in progress" : "Explore the project"}</span><button onClick={() => openProject(p.slug)} aria-label={"Open " + p.name}>Open <ArrowUpRight size={13} /></button></div>
            </div>)}</div>
            {!filtered.length && <div className="search-empty"><Search size={30} /><h2>No projects found</h2><p>Try another name or skill, or show all work.</p><button className="secondary-button" onClick={() => { setSearch(""); setFilter("all"); }}>Clear filters</button></div>}
            <div className="explorer-intro"><div className="intro-mark"><UserRound size={20} /></div><div><strong>Hi, I&apos;m {profile.name}.</strong><p>{profile.tagline}</p></div><button className="text-link" onClick={() => onOpen("about")}>A little about me <ArrowUpRight size={14} /></button></div>
          </>}

          {place === "documents" && (
            <div className="file-table" role="table" aria-label="Documents">
              <div className="file-row head" role="row"><span role="columnheader">Name</span><span role="columnheader">Type</span></div>
              {documents.map(d => { const Icon = d.icon; return (
                <button key={d.id} className="file-row" role="row" onDoubleClick={d.open} onClick={() => { if (window.matchMedia("(pointer: coarse)").matches) d.open(); else setSelected(d.id); }}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); d.open(); } }} aria-label={"Open " + d.name} aria-pressed={selected === d.id}>
                  <span role="cell"><Icon size={18} />{d.name}</span><span role="cell">{d.type}</span>
                </button>
              ); })}
            </div>
          )}

          {place === "pictures" && (
            <div className="picture-grid" role="group" aria-label="Pictures">
              {pictures.map(p => (
                <button key={p.id} className="picture-tile" onDoubleClick={() => onOpen("photos")} onClick={() => { if (window.matchMedia("(pointer: coarse)").matches) onOpen("photos"); else setSelected(p.id); }}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onOpen("photos"); } }} aria-label={"Open " + p.name + " in Photos"} aria-pressed={selected === p.id}>
                  <img src={p.src} alt="" loading="lazy" /><span>{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {previewPane && place === "projects" && (
          <aside className="explorer-preview" aria-label="Preview">
            {selectedProject ? <>
              <div className={"preview-image " + selectedProject.color}><ProjectImage src={thumbOf(selectedProject)} alt={selectedProject.imageAlt ?? selectedProject.name} /></div>
              <h2>{selectedProject.name}</h2>
              <p className="preview-kind">{selectedProject.kind}{selectedProject.status === "Live" ? " · Live" : ""}</p>
              <p>{selectedProject.description}</p>
              {selectedProject.stack.length > 0 && <div className="preview-stack">{selectedProject.stack.map(s => <span key={s}>{s}</span>)}</div>}
              <button className="primary-button" onClick={() => openProject(selectedProject.slug)}>Open case study <ArrowUpRight size={15} /></button>
            </> : <p className="preview-empty">Select a project to see a preview.</p>}
          </aside>
        )}
      </div>
      <footer className="explorer-status"><span>{count} items{selected ? " · 1 selected" : ""}</span><span><span className="mouse-hint">Double-click to open</span><span className="touch-hint">Tap to open</span><span className="status-dot" />Made to be opened</span></footer>
    </div>
  );
}
