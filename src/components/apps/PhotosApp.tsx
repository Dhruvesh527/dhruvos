"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Image as ImageIcon, X } from "lucide-react";
import { profile, projects, thumbOf } from "@/content/portfolio";
import { WALLPAPERS, type WallpaperId } from "@/lib/os-settings.mjs";
import { useSettings } from "@/components/os/OsSettings";
import type { AppId } from "./registry";

type Photo = { id: string; src: string; thumb?: string; title: string; caption: string; group: "Projects" | "Wallpapers" | "Profile"; project?: string; wallpaper?: WallpaperId };

const PHOTOS: Photo[] = [
  ...projects.map(p => ({ id: "p-" + p.slug, src: p.image, thumb: thumbOf(p), title: p.name, caption: p.imageAlt ?? p.subtitle, group: "Projects" as const, project: p.slug })),
  ...(Object.keys(WALLPAPERS) as WallpaperId[]).map(id => ({ id: "w-" + id, src: WALLPAPERS[id].src, title: WALLPAPERS[id].label, caption: "Original DhruvOS wallpaper", group: "Wallpapers" as const, wallpaper: id })),
  { id: "me", src: profile.photo, title: profile.name, caption: profile.role, group: "Profile" },
];
const FILTERS = ["All", "Projects", "Wallpapers"] as const;

export default function PhotosApp({ onOpen, reducedMotion }: { onOpen: (id: AppId, resource?: string) => void; reducedMotion: boolean }) {
  const { settings, update } = useSettings();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [open, setOpen] = useState<number | null>(null);
  const thumbs = useRef(new Map<string, HTMLElement>());
  const big = useRef<HTMLImageElement>(null);
  const from = useRef<DOMRect | null>(null);
  const viewer = useRef<HTMLDivElement>(null);
  const shown = useMemo(() => PHOTOS.filter(p => filter === "All" || p.group === filter), [filter]);
  const photo = open === null ? null : shown[open];

  const show = (index: number) => {
    from.current = thumbs.current.get(shown[index].id)?.getBoundingClientRect() ?? null;
    setOpen(index);
  };
  // Move focus into the viewer only when it first opens (not on every change, which could pull this window in front).
  const isOpen = open !== null;
  useLayoutEffect(() => { if (isOpen) viewer.current?.focus({ preventScroll: true }); }, [isOpen]);
  // ← → and Esc work even after a button inside the viewer loses focus.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      const active = document.activeElement;
      const host = viewer.current?.closest(".app-window");
      if (active && active !== document.body && !host?.contains(active)) return;
      if (event.key === "Escape") { event.preventDefault(); setOpen(null); }
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  // Zoom out of the thumbnail into the full view.
  useLayoutEffect(() => {
    if (open === null) return;
    const start = from.current;
    from.current = null;
    const end = big.current?.getBoundingClientRect();
    if (!start || !end || !end.width || reducedMotion) return;
    big.current!.animate(
      [{ transformOrigin: "0 0", transform: `translate(${start.left - end.left}px, ${start.top - end.top}px) scale(${start.width / end.width}, ${start.height / end.height})`, opacity: 0.6 },
       { transformOrigin: "0 0", transform: "none", opacity: 1 }],
      { duration: 320, easing: "cubic-bezier(.16,1,.3,1)" },
    );
  }, [open, reducedMotion]);

  const step = (delta: number) => setOpen(i => (i === null ? i : (i + delta + shown.length) % shown.length));

  return (
    <div className="photos-app">
      <header className="ph-head">
        <h1><ImageIcon size={20} /> Photos</h1>
        <div className="ph-filters" role="tablist" aria-label="Albums">
          {FILTERS.map(f => <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? "active" : ""} onClick={() => { setFilter(f); setOpen(null); }}>{f}</button>)}
        </div>
      </header>
      <div className="ph-grid">
        {shown.map((p, i) => (
          <button key={p.id} ref={el => { if (el) thumbs.current.set(p.id, el); }} className={"ph-thumb group-" + p.group.toLowerCase()} onClick={() => show(i)} aria-label={"View " + p.title}>
            <img src={p.thumb ?? p.src} alt="" loading="lazy" decoding="async" />
            <span>{p.title}{p.wallpaper && settings.wallpaper === p.wallpaper ? " · current" : ""}</span>
          </button>
        ))}
      </div>

      {photo && (
        <div ref={viewer} className="ph-viewer" role="dialog" aria-label={photo.title} tabIndex={-1}
          onKeyDown={event => { if (event.key === "Escape") event.stopPropagation(); }}>
          <div className="ph-viewer-bar">
            <span><strong>{photo.title}</strong> · {photo.caption}</span>
            <div>
              {photo.project && <button className="secondary-button" onClick={() => onOpen("project", photo.project)}>Open case study <ArrowUpRight size={15} /></button>}
              {photo.wallpaper && <button className="secondary-button" disabled={settings.wallpaper === photo.wallpaper} onClick={() => update({ type: "wallpaper", value: photo.wallpaper! })}>{settings.wallpaper === photo.wallpaper ? "Current wallpaper" : "Set as wallpaper"}</button>}
              <button className="ph-icon" aria-label="Close viewer" onClick={() => setOpen(null)}><X size={18} /></button>
            </div>
          </div>
          <div className="ph-stage">
            <button className="ph-nav prev" aria-label="Previous photo" onClick={() => step(-1)}><ChevronLeft size={22} /></button>
            <img ref={big} key={photo.id} src={photo.src} alt={photo.caption} className={photo.group === "Profile" ? "portrait" : ""} />
            <button className="ph-nav next" aria-label="Next photo" onClick={() => step(1)}><ChevronRight size={22} /></button>
          </div>
          <p className="ph-count">{(open ?? 0) + 1} / {shown.length}</p>
        </div>
      )}
    </div>
  );
}
