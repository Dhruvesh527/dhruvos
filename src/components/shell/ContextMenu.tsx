"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronRight, type LucideIcon } from "lucide-react";
import { useDismiss } from "@/components/os/hooks";

export type MenuEntry =
  | { kind: "item"; id: string; label: string; icon?: LucideIcon; onSelect?: () => void; checked?: boolean; submenu?: MenuEntry[]; hint?: string }
  | { kind: "separator"; id: string };

type Props = { x: number; y: number; bounds: { width: number; height: number }; items: MenuEntry[]; onClose: () => void; label?: string };

const focusables = (list: HTMLElement | null) => Array.from(list?.querySelectorAll<HTMLElement>(":scope > .cm-row > [role^='menuitem']") ?? []);

function MenuList({ items, onClose, onBack, autoFocus, className, label }: { items: MenuEntry[]; onClose: () => void; onBack?: () => void; autoFocus: boolean; className: string; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [openSub, setOpenSub] = useState<{ id: string; focus: boolean } | null>(null);
  const [flip, setFlip] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (autoFocus) focusables(ref.current)[0]?.focus(); }, [autoFocus]);
  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);
  // A submenu that would run off the right edge opens to the left instead.
  useLayoutEffect(() => {
    if (!onBack || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const host = ref.current.closest(".desktop-workspace")?.getBoundingClientRect();
    if (host && rect.right > host.right - 4) setFlip(true);
  }, [onBack]);

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const list = focusables(ref.current);
    const index = list.indexOf(document.activeElement as HTMLElement);
    if (index < 0) return; // the key belongs to a submenu
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      list[(index + step + list.length) % list.length]?.focus();
    } else if (event.key === "Home") { event.preventDefault(); list[0]?.focus(); }
    else if (event.key === "End") { event.preventDefault(); list.at(-1)?.focus(); }
    else if (event.key === "ArrowRight") {
      const id = list[index].dataset.sub;
      if (id) { event.preventDefault(); setOpenSub({ id, focus: true }); }
    } else if (event.key === "ArrowLeft" && onBack) { event.preventDefault(); event.stopPropagation(); onBack(); }
  };

  return (
    <div ref={ref} role="menu" aria-label={label} className={className + (flip ? " flip" : "")} onKeyDown={onKey}>
      {items.map(entry => {
        if (entry.kind === "separator") return <hr key={entry.id} role="separator" />;
        const Icon = entry.icon;
        const hasSub = Boolean(entry.submenu?.length);
        const role = entry.checked === undefined ? "menuitem" : "menuitemradio";
        return (
          <div key={entry.id} className="cm-row" role="none">
          <button
            role={role}
            aria-checked={entry.checked}
            aria-haspopup={hasSub ? "menu" : undefined}
            aria-expanded={hasSub ? openSub?.id === entry.id : undefined}
            data-sub={hasSub ? entry.id : undefined}
            className={"cm-item" + (openSub?.id === entry.id ? " open" : "")}
            onPointerEnter={() => {
              if (hoverTimer.current) clearTimeout(hoverTimer.current);
              hoverTimer.current = setTimeout(() => setOpenSub(hasSub ? { id: entry.id, focus: false } : null), hasSub ? 120 : 200);
            }}
            onClick={() => {
              if (hasSub) { setOpenSub({ id: entry.id, focus: true }); return; }
              onClose();
              entry.onSelect?.();
            }}
          >
            <span className="cm-icon">{entry.checked ? <Check size={14} /> : Icon ? <Icon size={15} /> : null}</span>
            <span className="cm-label">{entry.label}</span>
            {entry.hint && <span className="cm-hint">{entry.hint}</span>}
            {hasSub && <ChevronRight size={14} className="cm-arrow" />}
          </button>
            {hasSub && openSub?.id === entry.id && (
              <MenuList items={entry.submenu!} onClose={onClose} autoFocus={openSub.focus} className="context-menu submenu"
                onBack={() => { setOpenSub(null); (ref.current?.querySelector(`[data-sub="${entry.id}"]`) as HTMLElement | null)?.focus(); }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** A right-click menu, kept inside the desktop and fully usable from the keyboard. */
export default function ContextMenu({ x, y, bounds, items, onClose, label = "Desktop menu" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });
  useDismiss(ref, true, onClose);
  useLayoutEffect(() => {
    const menu = ref.current?.firstElementChild as HTMLElement | null;
    if (!menu) return;
    const { width, height } = menu.getBoundingClientRect();
    setPosition({
      left: x + width > bounds.width - 6 ? Math.max(6, x - width) : x,
      top: y + height > bounds.height - 6 ? Math.max(6, y - height) : y,
    });
  }, [x, y, bounds.width, bounds.height]);
  return (
    <div ref={ref} className="context-menu-host" style={position}>
      <MenuList items={items} onClose={onClose} autoFocus className="context-menu" label={label} />
    </div>
  );
}
