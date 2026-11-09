import { Folder, LayoutGrid, Monitor, Send } from "lucide-react";
import { profile, projects } from "@/content/portfolio";
import type { AppId } from "./registry";

/** Skills come straight from the project stacks, most-used first, so they're always backed by real work. */
function skills() {
  const counts = new Map<string, number>();
  for (const p of projects) for (const s of p.stack) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).map(([s]) => s);
}

export default function AboutApp({ onOpen }: { onOpen: (id: AppId, resource?: string) => void }) {
  const featured = projects[0];
  return (
    <article className="about-app app-reading">
      <div className="about-heading">
        <div className="avatar-large"><img src={profile.photo} alt={"Photo of " + profile.name} width="413" height="531" /><span>hello.</span></div>
        <div><span className="location-label"><span />{profile.role}</span><h1>A little<br />about me<span className="title-dot">.</span></h1></div>
      </div>
      <p className="about-lead">{profile.tagline}</p>
      <p>{profile.introduction}</p>

      <section className="about-skills" aria-label="Skills">
        <h2>Skills I&apos;ve shipped with</h2>
        <div className="about-chips">{skills().map(s => <span key={s}>{s}</span>)}</div>
      </section>

      <div className="about-principles">
        <div><span><LayoutGrid size={18} /></span><h2>Thoughtful interfaces</h2><p>Clear layouts, useful details, and interactions that feel natural.</p></div>
        <div><span><Monitor size={18} /></span><h2>End-to-end thinking</h2><p>From understanding the problem to building and delivering the application.</p></div>
      </div>

      <section className="about-specs" aria-label="Device specifications (just for fun)">
        <h2>Device specifications <small>(just for fun)</small></h2>
        <dl>
          <dt>Device name</dt><dd>{profile.name}</dd>
          <dt>Processor</dt><dd>Curiosity @ 4.2 GHz, many cores of problem-solving</dd>
          <dt>Installed memory</dt><dd>Every bug I&apos;ve ever fixed</dd>
          <dt>Fuel</dt><dd>Chai ☕</dd>
          {featured && <><dt>Currently running</dt><dd><button className="text-link" onClick={() => onOpen("project", featured.slug)}>{featured.name}</button></dd></>}
          {profile.availability && <><dt>Status</dt><dd className="about-open">● {profile.availability}</dd></>}
        </dl>
      </section>

      <div className="reading-actions">
        <button className="primary-button" onClick={() => onOpen("projects")}><Folder size={16} /> Explore my work</button>
        <button className="secondary-button" onClick={() => onOpen("mail")}><Send size={16} /> Write to me</button>
      </div>
    </article>
  );
}
