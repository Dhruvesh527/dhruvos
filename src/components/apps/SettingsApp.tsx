"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Accessibility, ArrowUpRight, Info, Monitor, Palette, RotateCcw, Sun } from "lucide-react";
import { profile } from "@/content/portfolio";
import { ACCENTS, ICON_SIZES, WALLPAPERS, type AccentId, type IconSize, type WallpaperId } from "@/lib/os-settings.mjs";
import { useSettings } from "@/components/os/OsSettings";
import { useBattery } from "@/components/os/hooks";
import OsMark from "@/components/shell/OsMark";

type Page = "personalisation" | "accessibility" | "system" | "about";
const PAGES: { id: Page; label: string; icon: typeof Palette }[] = [
  { id: "personalisation", label: "Personalisation", icon: Palette },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
  { id: "system", label: "System", icon: Monitor },
  { id: "about", label: "About", icon: Info },
];

function Row({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return <div className="st-row"><div><h3>{title}</h3>{text && <p>{text}</p>}</div><div className="st-control">{children}</div></div>;
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} className={"st-switch" + (on ? " on" : "")} onClick={() => onChange(!on)}>
      <span className="st-switch-track"><span className="st-switch-thumb" /></span><span>{on ? "On" : "Off"}</span>
    </button>
  );
}

type Device = { screen: string; viewport: string; cores?: number; memory?: number; language: string; platform: string };

export default function SettingsApp({ onReplay, reducedMotionSystem }: { onReplay: () => void; reducedMotionSystem: boolean }) {
  const { settings, update } = useSettings();
  const [page, setPage] = useState<Page>("personalisation");
  const [device, setDevice] = useState<Device | null>(null);
  const battery = useBattery();
  const dark = settings.theme === "dark";

  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number; userAgentData?: { platform?: string } };
    setDevice({
      screen: `${window.screen.width} × ${window.screen.height}`,
      viewport: `${window.innerWidth} × ${window.innerHeight}`,
      cores: nav.hardwareConcurrency || undefined,
      memory: nav.deviceMemory,
      language: nav.language,
      platform: nav.userAgentData?.platform || nav.platform || "Unknown",
    });
  }, []);

  return (
    <div className="settings-app2">
      <nav className="st-nav" aria-label="Settings sections">
        <div className="st-user"><img src={profile.photo} alt="" width="44" height="44" /><div><strong>{profile.name}</strong><span>Visitor settings</span></div></div>
        {PAGES.map(p => {
          const Icon = p.icon;
          return <button key={p.id} className={page === p.id ? "active" : ""} aria-current={page === p.id ? "page" : undefined} onClick={() => setPage(p.id)}><Icon size={17} /> {p.label}</button>;
        })}
      </nav>

      <div className="st-page">
        {page === "personalisation" && (
          <>
            <h1>Personalisation</h1>
            <section className="st-card">
              <h2>Theme</h2>
              <div className="st-themes" role="radiogroup" aria-label="Theme">
                {(["dark", "light"] as const).map(theme => (
                  <button key={theme} role="radio" aria-checked={settings.theme === theme} className={"st-theme " + theme + (settings.theme === theme ? " selected" : "")} onClick={() => update({ type: "theme", value: theme })}>
                    <span className="st-theme-preview"><i /><i /><i /></span>
                    <span>{theme === "dark" ? "Dark" : "Light"}</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="st-card">
              <h2>Accent colour</h2>
              <div className="st-accents" role="radiogroup" aria-label="Accent colour">
                {(Object.keys(ACCENTS) as AccentId[]).map(id => (
                  <button key={id} role="radio" aria-checked={settings.accent === id} className={"st-accent" + (settings.accent === id ? " selected" : "")} onClick={() => update({ type: "accent", value: id })}>
                    <span style={{ background: dark ? ACCENTS[id].dark : ACCENTS[id].light }} />{ACCENTS[id].label}
                  </button>
                ))}
              </div>
            </section>
            <section className="st-card">
              <h2>Wallpaper</h2>
              <div className="st-walls" role="radiogroup" aria-label="Wallpaper">
                {(Object.keys(WALLPAPERS) as WallpaperId[]).map(id => (
                  <button key={id} role="radio" aria-checked={settings.wallpaper === id} className={"st-wall" + (settings.wallpaper === id ? " selected" : "")} onClick={() => update({ type: "wallpaper", value: id })}>
                    <img src={WALLPAPERS[id].src} alt="" loading="lazy" /><span>{WALLPAPERS[id].label}</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="st-card">
              <Row title="Desktop icon size" text="Also in the desktop's right-click menu.">
                <div className="st-segment" role="radiogroup" aria-label="Desktop icon size">
                  {ICON_SIZES.map((size: IconSize) => <button key={size} role="radio" aria-checked={settings.iconSize === size} className={settings.iconSize === size ? "active" : ""} onClick={() => update({ type: "iconSize", value: size })}>{size[0].toUpperCase() + size.slice(1)}</button>)}
                </div>
              </Row>
            </section>
          </>
        )}

        {page === "accessibility" && (
          <>
            <h1>Accessibility</h1>
            <section className="st-card">
              <Row title="Reduce motion" text={reducedMotionSystem ? "Your device already asks for reduced motion, so animations stay off." : "Turns off animations across the desktop."}>
                <Switch on={settings.reduceMotion || reducedMotionSystem} label="Reduce motion" onChange={value => update({ type: "reduceMotion", value })} />
              </Row>
              <Row title="Brightness" text="Dims the desktop.">
                <label className="st-range"><Sun size={16} aria-hidden="true" /><input type="range" min={40} max={100} value={settings.brightness} aria-label="Brightness" onChange={event => update({ type: "brightness", value: Number(event.target.value) })} /><span>{settings.brightness}%</span></label>
              </Row>
              <Row title="Simple view" text="The whole portfolio as one easy-to-read page. Works with any screen reader.">
                <Link className="secondary-button" href="/simple/">Open <ArrowUpRight size={15} /></Link>
              </Row>
              <Row title="Keyboard" text="Tab moves between controls, Enter opens, Esc closes menus. Alt + ` switches windows. Start typing on the desktop to search.">
                <span className="st-badge">Supported</span>
              </Row>
            </section>
          </>
        )}

        {page === "system" && (
          <>
            <h1>System</h1>
            <section className="st-card">
              <Row title="Replay the intro" text="Power on, boot, lock screen and sign-in, all over again.">
                <button className="secondary-button" onClick={onReplay}><RotateCcw size={15} /> Replay</button>
              </Row>
              <Row title="Reset desktop" text="Back to the default theme, wallpaper and icon positions.">
                <button className="secondary-button" onClick={() => update({ type: "load", value: null })}>Reset</button>
              </Row>
              <Row title="Storage" text="Your choices here are saved only in this browser. Nothing is sent anywhere.">
                <span className="st-badge">Local only</span>
              </Row>
            </section>
          </>
        )}

        {page === "about" && (
          <>
            <h1>About</h1>
            <section className="st-card st-about">
              <OsMark />
              <div><h2>DhruvOS 2.0</h2><p>A portfolio you can power on. Designed and built by {profile.name}.</p></div>
            </section>
            <section className="st-card">
              <h2>This device</h2>
              <dl className="st-specs">
                <dt>Screen</dt><dd>{device?.screen ?? "…"}</dd>
                <dt>Browser window</dt><dd>{device?.viewport ?? "…"}</dd>
                <dt>Platform</dt><dd>{device?.platform ?? "…"}</dd>
                {device?.cores && <><dt>Processor threads</dt><dd>{device.cores}</dd></>}
                {device?.memory && <><dt>Memory</dt><dd>~{device.memory} GB</dd></>}
                {battery && <><dt>Battery</dt><dd>{battery.level}%{battery.charging ? ", charging" : ""}</dd></>}
                <dt>Language</dt><dd>{device?.language ?? "…"}</dd>
              </dl>
              <p className="st-fine">Read live from your browser, shown only to you.</p>
            </section>
            <section className="st-card">
              <h2>Built with</h2>
              <div className="st-chips">{["Next.js", "React", "TypeScript", "CSS", "Web Animations API"].map(t => <span key={t}>{t}</span>)}</div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
