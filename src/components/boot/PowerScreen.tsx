import Link from "next/link";
import { ArrowRight, ArrowUpRight, Power } from "lucide-react";
import { profile } from "@/content/portfolio";
import OsMark from "@/components/shell/OsMark";

/** The very first screen: who this is, and a big power button. */
export default function PowerScreen({ onPower, onSkip }: { onPower: () => void; onSkip: () => void }) {
  return (
    <main className="power-screen">
      <div className="power-top">
        <span><OsMark small /> DhruvOS</span>
        <Link href="/simple/">Simple view <ArrowUpRight size={14} /></Link>
      </div>
      <div className="power-content">
        <span className="power-overline">Hi, I&apos;m {profile.name} · {profile.role}</span>
        <h1>Welcome to<br />my workspace<span>.</span></h1>
        <p>Projects, ideas, and a little bit of personality.<br />Make yourself at home.</p>
        <button className="power-button" aria-label="Power on portfolio" onClick={onPower}><Power size={34} strokeWidth={1.5} /></button>
        <span className="power-hint">Click to power on</span>
      </div>
      <div className="power-bottom">
        <span>{profile.name} <span className="power-separator">/</span> {profile.role}</span>
        <button onClick={onSkip}>Skip intro <ArrowRight size={15} /></button>
      </div>
    </main>
  );
}
