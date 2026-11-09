"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Keeps something on screen long enough to play its closing animation.
 * `mounted` = render it; `closing` = add the "closing" class.
 */
export function usePresence(open: boolean, exitMs = 180) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  // Opening mounts in the same render (adjusting state during render is React's own recommended pattern),
  // so things like a search box exist and can take focus before the next keystroke arrives.
  if (open && (!mounted || closing)) { setMounted(true); setClosing(false); }
  useEffect(() => {
    if (open) return;
    if (!mounted) return;
    setClosing(true);
    const timer = setTimeout(() => { setMounted(false); setClosing(false); }, exitMs);
    return () => clearTimeout(timer);
  }, [open, exitMs, mounted]);
  return { mounted, closing };
}

/**
 * Closes a flyout on Escape or a click outside it.
 * Clicks on elements matching `ignore` (e.g. the button that opened it) are left to that button.
 */
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void, ignore?: string) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target || ref.current?.contains(target)) return;
      if (ignore && target.closest(ignore)) return;
      close.current();
    };
    // React (in Next.js) listens on the document too, so a component's stopPropagation can't stop this
    // listener. Components that handle Escape themselves (e.g. "clear the search first") call
    // preventDefault, and we respect that.
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !event.defaultPrevented) close.current(); };
    // Wait a tick so the click that opened the flyout doesn't immediately close it.
    const timer = setTimeout(() => {
      document.addEventListener("pointerdown", onPointer, true);
      document.addEventListener("keydown", onKey);
    });
    return () => {
      clearTimeout(timer);
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, ref, ignore]);
}

/** The current time, refreshed every 15 seconds. */
export function useNow(intervalMs = 15000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

type BatteryManagerLike = { level: number; charging: boolean; addEventListener: (type: string, fn: () => void) => void; removeEventListener: (type: string, fn: () => void) => void };

/** The device's real battery level, where the browser shares it (Chrome/Edge). `null` elsewhere. */
export function useBattery() {
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManagerLike> };
    if (!nav.getBattery) return;
    let manager: BatteryManagerLike | null = null;
    const read = () => manager && setBattery({ level: Math.round(manager.level * 100), charging: manager.charging });
    nav.getBattery().then(m => {
      manager = m;
      read();
      m.addEventListener("levelchange", read);
      m.addEventListener("chargingchange", read);
    }).catch(() => {});
    return () => {
      manager?.removeEventListener("levelchange", read);
      manager?.removeEventListener("chargingchange", read);
    };
  }, []);
  return battery;
}
