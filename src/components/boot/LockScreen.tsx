"use client";

import { useEffect, useReducer, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ArrowRight, BatteryFull, ChevronUp, Power, Volume2, Wifi } from "lucide-react";
import { profile, projects, thumbOf } from "@/content/portfolio";
import { LOCK_TIMING, SWIPE_UNLOCK_DISTANCE, isUnlockKey, lockReducer } from "@/lib/lock-flow.mjs";
import DotsSpinner from "./DotsSpinner";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function formatTime(date: Date) {
  // "10:42", without "am/pm", the way lock screens show it.
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" })
    .formatToParts(date).filter(part => part.type !== "dayPeriod").map(part => part.value).join("").trim();
}

/**
 * Lock screen → sign-in → "Welcome" → desktop.
 * `interactive` is false while the camera is still zooming into the laptop: the lock screen is
 * visible on the laptop's display but can't be used yet.
 */
export default function LockScreen({ interactive, onDone, wallpaper = "/wallpaper.svg", relock = false, lightWallpaper = false }: { interactive: boolean; onDone: () => void; wallpaper?: string; relock?: boolean; lightWallpaper?: boolean }) {
  const [stage, send] = useReducer(lockReducer, "lock");
  const [dragY, setDragY] = useState(0);
  const swipe = useRef<{ pointer: number; startY: number } | null>(null);
  const lockRef = useRef<HTMLDivElement>(null);
  const signInRef = useRef<HTMLButtonElement>(null);
  const now = useClock();
  const featured = projects[0];

  // Move keyboard focus to whatever the visitor can act on next.
  useEffect(() => {
    if (!interactive) return;
    if (stage === "lock") lockRef.current?.focus({ preventScroll: true });
    if (stage === "signin") {
      const timer = setTimeout(() => signInRef.current?.focus({ preventScroll: true }), LOCK_TIMING.unlock * 0.6);
      return () => clearTimeout(timer);
    }
  }, [interactive, stage]);

  // "Welcome" plays for a moment, the screen fades, then the desktop takes over.
  useEffect(() => {
    if (stage === "welcome") {
      const timer = setTimeout(() => send("welcomed"), LOCK_TIMING.welcome);
      return () => clearTimeout(timer);
    }
    if (stage === "leaving") {
      const timer = setTimeout(() => send("left"), LOCK_TIMING.leave);
      return () => clearTimeout(timer);
    }
    if (stage === "done") onDone();
  }, [stage, onDone]);

  // Escape on the sign-in screen goes back to the lock screen.
  useEffect(() => {
    if (!interactive || stage !== "signin") return;
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") send("back"); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [interactive, stage]);

  const onLockKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isUnlockKey(event.key)) return;
    event.preventDefault();
    send("unlock");
  };
  const startSwipe = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    swipe.current = { pointer: event.pointerId, startY: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveSwipe = (event: PointerEvent<HTMLDivElement>) => {
    const current = swipe.current;
    if (!current || current.pointer !== event.pointerId) return;
    setDragY(Math.min(0, event.clientY - current.startY));
  };
  const endSwipe = () => {
    // A tap, a click, or a swipe up all unlock; a small drag that isn't a swipe just springs back.
    const moved = dragY;
    swipe.current = null;
    setDragY(0);
    if (moved <= -SWIPE_UNLOCK_DISTANCE || moved > -8) send("unlock");
  };

  const signingIn = stage === "welcome" || stage === "leaving" || stage === "done";
  return (
    <div className={"lock-screen stage-" + stage + (interactive ? "" : " preview") + (relock ? " relock" : "") + (lightWallpaper ? " tone-light" : "")} inert={!interactive}>
      <div className="lock-wallpaper" aria-hidden="true" style={{ backgroundImage: `url("${wallpaper}")` }} />

      <div className="signin-layer" inert={stage === "lock"} aria-hidden={stage === "lock"}>
        <div className="signin-card">
          <img className="signin-photo" src={profile.photo} alt={"Photo of " + profile.name} width="413" height="531" />
          <h2>{profile.name}</h2>
          {signingIn ? (
            <div className="signin-welcome" role="status">
              <DotsSpinner size={30} />
              <span>Welcome</span>
            </div>
          ) : (
            <>
              <p>{profile.role}</p>
              <button ref={signInRef} className="signin-button" onClick={() => send("signIn")}>
                Sign in <ArrowRight size={16} />
              </button>
              <span className="signin-note">No password needed. Come on in.</span>
            </>
          )}
        </div>
        <div className="lock-status signin-status" aria-hidden="true"><Wifi size={17} /><Volume2 size={17} /><Power size={17} /></div>
      </div>

      <div
        ref={lockRef}
        className={"lock-layer" + (dragY ? " dragging" : "")}
        style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
        role="button"
        tabIndex={interactive && stage === "lock" ? 0 : -1}
        aria-label="Lock screen. Click, press any key, or swipe up to unlock."
        onKeyDown={onLockKey}
        onPointerDown={startSwipe}
        onPointerMove={moveSwipe}
        onPointerUp={endSwipe}
        onPointerCancel={() => { swipe.current = null; setDragY(0); }}
      >
        <div className="lock-clock" aria-hidden="true">
          <span className="lock-time">{formatTime(now)}</span>
          <span className="lock-date">{new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(now)}</span>
        </div>
        {featured && (
          <div className="lock-card" aria-hidden="true">
            <img src={thumbOf(featured)} alt="" width="480" height="300" />
            <div><span>Featured project</span><strong>{featured.name}</strong><small>{featured.kind}</small></div>
          </div>
        )}
        <div className="lock-hint" aria-hidden="true"><ChevronUp size={18} /><span className="mouse-hint">Click, press a key, or swipe up</span><span className="touch-hint">Tap or swipe up to unlock</span></div>
        <div className="lock-status" aria-hidden="true"><Wifi size={17} /><Volume2 size={17} /><BatteryFull size={19} /></div>
      </div>
    </div>
  );
}
