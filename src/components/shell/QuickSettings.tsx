"use client";

import { useRef } from "react";
import Link from "next/link";
import { Accessibility, BatteryFull, Image as ImageIcon, Lock, Moon, PanelLeft, RotateCcw, Settings2, Sun } from "lucide-react";
import { ACCENTS, WALLPAPERS, type AccentId } from "@/lib/os-settings.mjs";
import { useSettings } from "@/components/os/OsSettings";
import { useBattery, useDismiss, usePresence } from "@/components/os/hooks";

type Props = { open: boolean; onClose: () => void; onOpenSettings: () => void; onReplay: () => void; onLock: () => void };

export default function QuickSettings({ open, onClose, onOpenSettings, onReplay, onLock }: Props) {
  const { settings, update } = useSettings();
  const { mounted, closing } = usePresence(open);
  const ref = useRef<HTMLDivElement>(null);
  const battery = useBattery();
  useDismiss(ref, open, onClose, '[data-flyout-toggle="quick"]');
  if (!mounted) return null;

  const dark = settings.theme === "dark";
  const accentFor = (id: AccentId) => (dark ? ACCENTS[id].dark : ACCENTS[id].light);
  return (
    <div ref={ref} className={"flyout quick-settings" + (closing ? " closing" : "")} role="dialog" aria-label="Quick settings">
      <div className="qs-tiles">
        <button className={"qs-tile" + (dark ? " on" : "")} aria-pressed={dark} onClick={() => update({ type: "toggleTheme" })}>
          <span className="qs-tile-icon">{dark ? <Moon size={18} /> : <Sun size={18} />}</span><span>Dark mode</span>
        </button>
        <button className={"qs-tile" + (settings.reduceMotion ? " on" : "")} aria-pressed={settings.reduceMotion} onClick={() => update({ type: "reduceMotion", value: !settings.reduceMotion })}>
          <span className="qs-tile-icon"><Accessibility size={18} /></span><span>Reduce motion</span>
        </button>
        <button className="qs-tile" onClick={() => update({ type: "nextWallpaper" })}>
          <span className="qs-tile-icon"><ImageIcon size={18} /></span><span>{WALLPAPERS[settings.wallpaper].label}</span>
        </button>
        <Link className="qs-tile" href="/simple/">
          <span className="qs-tile-icon"><PanelLeft size={18} /></span><span>Simple view</span>
        </Link>
        <button className="qs-tile" onClick={() => { onClose(); onReplay(); }}>
          <span className="qs-tile-icon"><RotateCcw size={18} /></span><span>Replay intro</span>
        </button>
        <button className="qs-tile" onClick={() => { onClose(); onLock(); }}>
          <span className="qs-tile-icon"><Lock size={18} /></span><span>Lock</span>
        </button>
      </div>

      <label className="qs-slider">
        <Sun size={17} aria-hidden="true" />
        <input type="range" min={40} max={100} step={1} value={settings.brightness} aria-label="Brightness"
          onChange={event => update({ type: "brightness", value: Number(event.target.value) })}
          style={{ "--fill": `${((settings.brightness - 40) / 60) * 100}%` } as React.CSSProperties} />
      </label>

      <div className="qs-accents" role="radiogroup" aria-label="Accent colour">
        {(Object.keys(ACCENTS) as AccentId[]).map(id => (
          <button key={id} role="radio" aria-checked={settings.accent === id} aria-label={ACCENTS[id].label}
            className={"qs-swatch" + (settings.accent === id ? " selected" : "")} style={{ background: accentFor(id) }}
            onClick={() => update({ type: "accent", value: id })} />
        ))}
      </div>

      <div className="qs-footer">
        <span className="qs-battery"><BatteryFull size={17} />{battery ? `${battery.level}%${battery.charging ? " · charging" : ""}` : "Plugged in"}</span>
        <button aria-label="Open Settings" onClick={() => { onClose(); onOpenSettings(); }}><Settings2 size={17} /></button>
      </div>
    </div>
  );
}
