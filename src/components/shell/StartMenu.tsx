"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, FolderGit2, Lock, Power, RotateCcw, Search } from "lucide-react";
import { profile, projects, thumbOf } from "@/content/portfolio";
import { matchRange, search } from "@/lib/search.mjs";
import { appDefinitions, isVisibleApp, type AppId } from "@/components/apps/registry";
import { useDismiss, usePresence } from "@/components/os/hooks";
import { KIND_LABELS, buildSearchIndex, type OsAction, type OsSearchEntry } from "@/components/os/searchIndex";
import FolderIcon from "@/components/FolderIcon";

type Tile = { id: string; label: string; icon: ReactNode; action: OsAction; external?: boolean };

const appTile = (id: AppId): Tile => {
  const Icon = appDefinitions[id].icon;
  return { id, label: appDefinitions[id].title, icon: id === "projects" ? <FolderIcon small /> : <span className={"sm-app-art " + appDefinitions[id].color}><Icon size={20} strokeWidth={1.7} /></span>, action: { type: "app", app: id } };
};

function pinnedTiles(): Tile[] {
  const tiles = (["projects", "about", "experience", "achievements", "resume", "contact", "terminal", "browser", "mail", "photos", "settings"] as AppId[]).filter(isVisibleApp).map(appTile);
  const featured = projects[0];
  if (featured) tiles.splice(1, 0, { id: "project:" + featured.slug, label: featured.name, icon: <img className="sm-thumb-icon" src={thumbOf(featured)} alt="" width="40" height="40" />, action: { type: "app", app: "project", resource: featured.slug } });
  if (profile.github) tiles.push({ id: "github", label: "GitHub", icon: <span className="sm-app-art github"><FolderGit2 size={20} strokeWidth={1.7} /></span>, action: { type: "link", href: profile.github, external: true }, external: true });
  if (profile.linkedin) tiles.push({ id: "linkedin", label: "LinkedIn", icon: <span className="sm-app-art linkedin" aria-hidden="true">in</span>, action: { type: "link", href: profile.linkedin, external: true }, external: true });
  return tiles;
}

type Recommendation = { id: string; title: string; subtitle: string; image?: string; icon?: ReactNode; action: OsAction };
function recommendations(): Recommendation[] {
  const list: Recommendation[] = projects.slice(0, 2).map(p => ({
    id: p.slug, title: p.name + " case study", subtitle: (p.status === "Live" ? "Live · " : "") + p.kind, image: thumbOf(p), action: { type: "app", app: "project", resource: p.slug },
  }));
  list.push({ id: "resume", title: "Résumé", subtitle: "Read it, or print it as a PDF", icon: appTile("resume").icon, action: { type: "app", app: "resume" } });
  list.push({ id: "contact", title: "Get in touch", subtitle: profile.email || "Contact", icon: appTile("contact").icon, action: { type: "app", app: "contact" } });
  return list;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const range = matchRange(text, query);
  if (!range) return <>{text}</>;
  return <>{text.slice(0, range[0])}<mark>{text.slice(range[0], range[1])}</mark>{text.slice(range[1])}</>;
}

function ResultIcon({ entry }: { entry: OsSearchEntry }) {
  if (entry.image) return <img className="sm-result-thumb" src={entry.image} alt="" width="40" height="40" />;
  if (entry.id === "app:projects") return <FolderIcon small />;
  if (entry.id === "link:linkedin") return <span className="sm-app-art linkedin small" aria-hidden="true">in</span>;
  const Icon = entry.icon;
  return Icon ? <span className="sm-result-icon"><Icon size={18} /></span> : null;
}

const QUICK_SEARCHES = ["Next.js", "Ozzat", "React Native", "Contact", "Dark mode"];

type Props = {
  open: boolean;
  /** "search" opens straight into the search view (taskbar search button or typing on the desktop). */
  mode: "start" | "search";
  seed: string;
  theme: "dark" | "light";
  onClose: () => void;
  onRun: (action: OsAction) => void;
};

export default function StartMenu({ open, mode, seed, theme, onClose, onRun }: Props) {
  const { mounted, closing } = usePresence(open);
  const ref = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"home" | "all">("home");
  const [selected, setSelected] = useState(0);
  const [powerOpen, setPowerOpen] = useState(false);
  useDismiss(ref, open, onClose, '[data-flyout-toggle="start"], [data-flyout-toggle="search"]');

  const index = useMemo(() => buildSearchIndex(theme), [theme]);
  const pinned = useMemo(pinnedTiles, []);
  const recommended = useMemo(recommendations, []);
  const allApps = useMemo(() => index.filter(e => e.kind === "app" || e.kind === "link").sort((a, b) => a.title.localeCompare(b.title)), [index]);
  const results = useMemo(() => search(index, query, 8), [index, query]);
  const suggestions = useMemo(() => ["project:" + (projects[0]?.slug ?? ""), "app:resume", "app:contact", "page:simple"].map(id => index.find(e => e.id === id)).filter(Boolean) as OsSearchEntry[], [index]);
  const searching = query.trim().length > 0;
  const list = searching ? results : mode === "search" ? suggestions : [];

  // Every time it opens: start fresh (with the typed letter, if any) and put the cursor in the search box.
  useLayoutEffect(() => {
    if (!open) return;
    setQuery(seed);
    setView("home");
    setSelected(0);
    setPowerOpen(false);
  }, [open, seed]);
  // Focus the box before the browser handles the next key, so fast typing never loses a letter.
  useLayoutEffect(() => {
    if (!open || !input.current) return;
    input.current.focus({ preventScroll: true });
    const end = seed.length;
    input.current.setSelectionRange(end, end);
  }, [open, seed]);
  useEffect(() => { setSelected(0); }, [query]);

  if (!mounted) return null;

  const run = (action: OsAction) => onRun(action);
  const onInputKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && list.length) { event.preventDefault(); setSelected(s => (s + 1) % list.length); }
    else if (event.key === "ArrowUp" && list.length) { event.preventDefault(); setSelected(s => (s - 1 + list.length) % list.length); }
    else if (event.key === "Enter" && list[selected]) { event.preventDefault(); run(list[selected].action); }
    else if (event.key === "Escape" && query) { event.preventDefault(); event.stopPropagation(); setQuery(""); }
  };

  const resultRows = (entries: OsSearchEntry[], heading: string) => (
    <section className="sm-section" aria-label={heading}>
      <h2 className="sm-heading">{heading}</h2>
      <div className="sm-results" role="listbox" id="sm-results" aria-label={heading}>
        {entries.map((entry, i) => (
          <button key={entry.id} id={"sm-result-" + i} role="option" aria-selected={i === selected}
            className={"sm-result" + (i === selected ? " selected" : "") + (i === 0 && searching ? " top" : "")}
            onPointerEnter={() => setSelected(i)} onClick={() => run(entry.action)}>
            <ResultIcon entry={entry} />
            <span className="sm-result-text">
              <strong><Highlight text={entry.title} query={query} /></strong>
              <small>{entry.subtitle}</small>
            </span>
            {entry.badge && <span className="sm-badge">{entry.badge}</span>}
            <span className="sm-kind">{i === 0 && searching ? "Top result" : KIND_LABELS[entry.kind]}</span>
            {entry.action.type === "link" && entry.action.external && <ArrowUpRight size={14} className="sm-external" />}
          </button>
        ))}
      </div>
    </section>
  );

  return (
    <div ref={ref} className={"start-menu flyout" + (mode === "search" ? " search-mode" : "") + (closing ? " closing" : "")} role="dialog" aria-label={mode === "search" ? "Search" : "Start"}>
      <label className="sm-search">
        <Search size={17} aria-hidden="true" />
        <input ref={input} value={query} onChange={event => setQuery(event.target.value)} onKeyDown={onInputKey}
          placeholder="Search apps, projects and skills" aria-label="Search" role="combobox" aria-expanded={list.length > 0}
          aria-controls="sm-results" aria-activedescendant={list.length ? "sm-result-" + selected : undefined} autoComplete="off" spellCheck={false} />
      </label>

      <div className="sm-body">
        {searching ? (
          results.length ? resultRows(results, "Results") : (
            <div className="sm-empty">
              <p>No results for “{query}”.</p>
              <div className="sm-chips">{QUICK_SEARCHES.map(q => <button key={q} onClick={() => setQuery(q)}>{q}</button>)}</div>
            </div>
          )
        ) : mode === "search" ? (
          <>
            {resultRows(suggestions, "Suggested")}
            <section className="sm-section" aria-label="Quick searches">
              <h2 className="sm-heading">Quick searches</h2>
              <div className="sm-chips">{QUICK_SEARCHES.map(q => <button key={q} onClick={() => { setQuery(q); input.current?.focus(); }}>{q}</button>)}</div>
            </section>
          </>
        ) : view === "all" ? (
          <section className="sm-section sm-all" aria-label="All apps">
            <div className="sm-section-head"><h2 className="sm-heading">All apps</h2><button className="sm-pill" onClick={() => setView("home")}><ChevronLeft size={14} /> Back</button></div>
            <div className="sm-all-list">
              {allApps.map((entry, i) => {
                const letter = entry.title[0].toUpperCase();
                const showLetter = i === 0 || allApps[i - 1].title[0].toUpperCase() !== letter;
                return (
                  <div key={entry.id}>
                    {showLetter && <span className="sm-letter">{letter}</span>}
                    <button className="sm-all-item" onClick={() => run(entry.action)}>
                      <ResultIcon entry={entry} /><span>{entry.title}</span>
                      {entry.action.type === "link" && entry.action.external && <ArrowUpRight size={14} className="sm-external" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <>
            <section className="sm-section" aria-label="Pinned">
              <div className="sm-section-head"><h2 className="sm-heading">Pinned</h2><button className="sm-pill" onClick={() => setView("all")}>All apps <ChevronRight size={14} /></button></div>
              <div className="sm-pinned">
                {pinned.map((tile, i) => (
                  <button key={tile.id} className="sm-tile" style={{ animationDelay: i * 18 + "ms" }} onClick={() => run(tile.action)}
                    aria-label={tile.label + (tile.external ? " (opens in a new tab)" : "")}>
                    {tile.icon}<span>{tile.label}</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="sm-section" aria-label="Recommended">
              <h2 className="sm-heading">Recommended</h2>
              <div className="sm-recommended">
                {recommended.map(item => (
                  <button key={item.id} className="sm-rec" onClick={() => run(item.action)}>
                    {item.image ? <img className="sm-result-thumb" src={item.image} alt="" width="40" height="40" /> : item.icon}
                    <span className="sm-result-text"><strong>{item.title}</strong><small>{item.subtitle}</small></span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <footer className="sm-footer">
        <button className="sm-user" onClick={() => run({ type: "app", app: "about" })}>
          <img src={profile.photo} alt="" width="32" height="32" />
          <span>{profile.name}</span>
        </button>
        <div className="sm-power">
          <button className={"sm-power-button" + (powerOpen ? " active" : "")} aria-label="Power" aria-haspopup="menu" aria-expanded={powerOpen} onClick={() => setPowerOpen(o => !o)}>
            <Power size={17} />
          </button>
          {powerOpen && (
            <div className="sm-power-menu" role="menu" aria-label="Power options"
              onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setPowerOpen(false); } }}>
              <button role="menuitem" autoFocus onClick={() => run({ type: "command", name: "lock" })}><Lock size={15} /> Sleep</button>
              <button role="menuitem" onClick={() => run({ type: "command", name: "restart" })}><RotateCcw size={15} /> Restart</button>
              <button role="menuitem" onClick={() => run({ type: "command", name: "shutdown" })}><Power size={15} /> Shut down</button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
