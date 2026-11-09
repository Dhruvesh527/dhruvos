"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Globe, House, Lock, Plus, RefreshCw, Search, X } from "lucide-react";
import { profile, projects, thumbOf } from "@/content/portfolio";
import { search } from "@/lib/search.mjs";
import { useSettings } from "@/components/os/OsSettings";
import { buildSearchIndex, KIND_LABELS } from "@/components/os/searchIndex";
import OsMark from "@/components/shell/OsMark";
import type { AppId } from "./registry";

const NEW_TAB = "dhruvos://newtab";
/** Domain endings we treat as websites, so "ozzat.com" opens a site but "next.js" searches. */
const TLDS = new Set(["com", "org", "net", "io", "dev", "app", "in", "co", "me", "ai", "edu", "gov", "uk", "us", "xyz", "tech", "info", "site", "page", "shop", "store", "online", "blog", "cloud", "design"]);
type Tab = { id: number; history: string[]; index: number; reload: number; loading: boolean };

/** Turns whatever was typed into a URL: a path, a website, or a portfolio search. */
export function toUrl(text: string) {
  const value = text.trim();
  if (!value) return NEW_TAB;
  if (value.startsWith("dhruvos://")) return value;
  if (value.startsWith("/")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  const domain = value.match(/^(?:www\.)?[\w-]+(?:\.[\w-]+)*\.([a-z]{2,24})(?::\d+)?(?:\/\S*)?$/i);
  if (domain && (value.startsWith("www.") || value.includes("/") || TLDS.has(domain[1].toLowerCase()))) return "https://" + value;
  return "dhruvos://search?q=" + encodeURIComponent(value);
}

function describe(url: string) {
  if (url === NEW_TAB) return { title: "New tab", kind: "newtab" as const };
  if (url.startsWith("dhruvos://search")) return { title: "Search: " + decodeURIComponent(url.split("q=")[1] ?? ""), kind: "search" as const };
  if (url.startsWith("/")) {
    const path = url.split(/[?#]/)[0];
    if (path === "/" || path === "") return { title: "DhruvOS", kind: "home" as const };
    const project = projects.find(p => path.replace(/\/$/, "") === "/projects/" + p.slug);
    const title = project ? project.name + " · Case study" : path.startsWith("/simple") ? "Simple view" : path.startsWith("/resume") ? "Résumé" : path;
    return { title, kind: "page" as const };
  }
  try { return { title: new URL(url).hostname.replace(/^www\./, ""), kind: "external" as const }; }
  catch { return { title: url, kind: "external" as const }; }
}

export default function BrowserApp({ onOpen, initialUrl }: { onOpen: (id: AppId, resource?: string) => void; initialUrl?: string }) {
  const { settings } = useSettings();
  const nextId = useRef(1);
  const [tabs, setTabs] = useState<Tab[]>([{ id: 0, history: [initialUrl ?? NEW_TAB], index: 0, reload: 0, loading: false }]);
  const [activeId, setActiveId] = useState(0);
  const [address, setAddress] = useState<string | null>(null);
  const tab = tabs.find(t => t.id === activeId) ?? tabs[0];
  const url = tab.history[tab.index];
  const info = describe(url);
  const index = useMemo(() => buildSearchIndex(settings.theme).filter(e => e.kind !== "command"), [settings.theme]);

  const patch = (id: number, change: (t: Tab) => Tab) => setTabs(list => list.map(t => (t.id === id ? change(t) : t)));
  const go = (next: string, id = tab.id) => {
    setAddress(null);
    patch(id, t => ({ ...t, history: [...t.history.slice(0, t.index + 1), next], index: t.index + 1, loading: next.startsWith("/") }));
  };
  const newTab = (start = NEW_TAB) => {
    const id = nextId.current++;
    setTabs(list => [...list, { id, history: [start], index: 0, reload: 0, loading: start.startsWith("/") }]);
    setActiveId(id);
    setAddress(null);
  };
  const closeTab = (id: number) => {
    setTabs(list => {
      if (list.length === 1) return [{ id: nextId.current++, history: [NEW_TAB], index: 0, reload: 0, loading: false }];
      const remaining = list.filter(t => t.id !== id);
      if (id === activeId) setActiveId(remaining[Math.max(0, list.findIndex(t => t.id === id) - 1)].id);
      return remaining;
    });
  };
  const submit = (event: FormEvent) => { event.preventDefault(); go(toUrl(address ?? url)); };

  const speedDial = [
    ...projects.filter(p => p.liveUrl).map(p => ({ label: p.name, sub: "Live site", url: p.liveUrl!, image: thumbOf(p) })),
    ...projects.map(p => ({ label: p.name + " case study", sub: "Portfolio page", url: "/projects/" + p.slug + "/", image: thumbOf(p) })),
    { label: "Simple view", sub: "One readable page", url: "/simple/", image: undefined },
    { label: "Résumé", sub: "Printable page", url: "/resume/", image: undefined },
    ...(profile.github ? [{ label: "GitHub", sub: "github.com", url: profile.github, image: undefined }] : []),
    ...(profile.linkedin ? [{ label: "LinkedIn", sub: "linkedin.com", url: profile.linkedin, image: undefined }] : []),
  ];
  const liveProject = info.kind === "external" ? projects.find(p => p.liveUrl && new URL(p.liveUrl).hostname === new URL(url).hostname) : undefined;

  let content;
  if (info.kind === "newtab") {
    content = (
      <div className="br-newtab">
        <OsMark />
        <form className="br-big-search" onSubmit={event => { event.preventDefault(); const q = new FormData(event.currentTarget).get("q"); go(toUrl(String(q ?? ""))); }}>
          <Search size={18} /><input name="q" placeholder="Search the portfolio or type a web address" aria-label="Search or address" />
        </form>
        <div className="br-dial">
          {speedDial.map(item => (
            <button key={item.url + item.label} className="br-dial-item" onClick={() => go(item.url)}>
              {item.image ? <img src={item.image} alt="" width="56" height="56" /> : <span className="br-dial-icon"><Globe size={22} /></span>}
              <strong>{item.label}</strong><small>{item.sub}</small>
            </button>
          ))}
        </div>
      </div>
    );
  } else if (info.kind === "search") {
    const q = decodeURIComponent(url.split("q=")[1] ?? "");
    const results = search(index, q, 10);
    content = (
      <div className="br-results">
        <p className="br-results-count">{results.length ? `${results.length} results in this portfolio for “${q}”` : `Nothing in this portfolio matches “${q}”.`}</p>
        {results.map(entry => (
          <button key={entry.id} className="br-result" onClick={() => {
            const action = entry.action;
            if (action.type === "app") onOpen(action.app, action.resource);
            else if (action.type === "link") go(action.href);
          }}>
            <small>{KIND_LABELS[entry.kind]}{entry.action.type === "link" ? " · " + entry.action.href.replace(/^https?:\/\/|^mailto:/, "") : ""}</small>
            <strong>{entry.title}</strong>
            <span>{entry.subtitle}</span>
          </button>
        ))}
      </div>
    );
  } else if (info.kind === "home") {
    content = (
      <div className="br-card">
        <OsMark />
        <h2>You&apos;re already here 🙂</h2>
        <p>This address is the DhruvOS desktop itself. Opening it inside its own browser would be a computer inside a computer inside a computer.</p>
        <button className="secondary-button" onClick={() => go(NEW_TAB)}><House size={16} /> New tab</button>
      </div>
    );
  } else if (info.kind === "page") {
    content = (
      <>
        {tab.loading && <div className="br-progress" aria-hidden="true" />}
        <iframe key={tab.id + ":" + tab.index + ":" + tab.reload} className="br-frame" src={url} title={info.title}
          onLoad={event => {
            patch(tab.id, t => ({ ...t, loading: false }));
            // Same-origin pages: keep the address bar in sync when links inside the page are clicked.
            try {
              const loc = event.currentTarget.contentWindow?.location;
              const now = loc ? loc.pathname + loc.search : url;
              if (now && now !== url && now !== "blank") patch(tab.id, t => ({ ...t, history: [...t.history.slice(0, t.index), now, ...t.history.slice(t.index + 1)] }));
            } catch {}
          }} />
      </>
    );
  } else {
    content = (
      <div className="br-card br-external">
        {liveProject ? <img className="br-shot" src={liveProject.image} alt={liveProject.imageAlt ?? liveProject.name + " screenshot"} width="1200" height="750" /> : <span className="br-dial-icon big"><Globe size={34} /></span>}
        <h2>{liveProject ? liveProject.name + " is live" : info.title}</h2>
        <p>Most websites (for good security reasons) don&apos;t allow themselves to be shown inside another website, so this opens in a real browser tab instead.</p>
        <a className="primary-button" href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> Open {info.title} in a new tab</a>
      </div>
    );
  }

  return (
    <div className="browser-app">
      <div className="br-tabs" role="tablist" aria-label="Browser tabs">
        {tabs.map(t => {
          const d = describe(t.history[t.index]);
          return (
            <div key={t.id} className={"br-tab" + (t.id === tab.id ? " active" : "")}>
              <button role="tab" aria-selected={t.id === tab.id} className="br-tab-main" onClick={() => { setActiveId(t.id); setAddress(null); }}>
                {t.loading ? <RefreshCw size={13} className="br-spin" /> : <Globe size={13} />}<span>{d.title}</span>
              </button>
              <button className="br-tab-close" aria-label={"Close tab " + d.title} onClick={() => closeTab(t.id)}><X size={13} /></button>
            </div>
          );
        })}
        <button className="br-newtab-btn" aria-label="New tab" onClick={() => newTab()}><Plus size={16} /></button>
      </div>
      <form className="br-toolbar" onSubmit={submit}>
        <button type="button" aria-label="Back" disabled={tab.index === 0} onClick={() => patch(tab.id, t => ({ ...t, index: t.index - 1, loading: t.history[t.index - 1].startsWith("/") }))}><ArrowLeft size={16} /></button>
        <button type="button" aria-label="Forward" disabled={tab.index >= tab.history.length - 1} onClick={() => patch(tab.id, t => ({ ...t, index: t.index + 1, loading: t.history[t.index + 1].startsWith("/") }))}><ArrowRight size={16} /></button>
        <button type="button" aria-label="Reload" onClick={() => patch(tab.id, t => ({ ...t, reload: t.reload + 1, loading: url.startsWith("/") }))}><RefreshCw size={15} /></button>
        <button type="button" aria-label="Home" onClick={() => go(NEW_TAB)}><House size={16} /></button>
        <label className="br-address">
          {info.kind === "external" ? <Lock size={13} /> : <Search size={13} />}
          <input value={address ?? (url === NEW_TAB ? "" : url)} placeholder="Search the portfolio or type a web address" aria-label="Address bar"
            onChange={event => setAddress(event.target.value)} onFocus={event => event.currentTarget.select()} spellCheck={false} autoComplete="off" />
        </label>
      </form>
      <div className="br-view">{content}</div>
    </div>
  );
}
