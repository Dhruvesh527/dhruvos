"use client";
import { useEffect } from "react";
import { Download, Printer, ArrowUpRight } from "lucide-react";
import { profile, experience, projects, achievements } from "@/content/portfolio";

/** Unique skills across all shown projects, most-used first. */
function skillList() {
  const counts = new Map<string, number>();
  for (const p of projects) if (p.status !== "Draft") for (const s of p.stack) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
}

const bare = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "");

/**
 * The résumé, built from `src/content/portfolio.ts`. Used on /resume and inside the Résumé window.
 * `inWindow` hides the page's own Save button (the window toolbar has one).
 * Visiting /resume/?print=1 opens the browser's print dialog, where visitors choose "Save as PDF".
 */
export default function ResumeContent({ inWindow = false }: { inWindow?: boolean }) {
  useEffect(() => {
    if (inWindow || !new URLSearchParams(location.search).has("print")) return;
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [inWindow]);

  const contact = [
    profile.email && { href: "mailto:" + profile.email, label: profile.email },
    profile.github && { href: profile.github, label: bare(profile.github) },
    profile.linkedin && { href: profile.linkedin, label: bare(profile.linkedin) },
  ].filter(Boolean) as { href: string; label: string }[];
  const skills = skillList();

  return <article className="resume-content">
    {!inWindow && <div className="resume-actions">{profile.resumeUrl
      ? <a className="primary-button" href={profile.resumeUrl} download><Download size={16}/> Download PDF</a>
      : <button className="primary-button" onClick={() => window.print()}><Printer size={16}/> Save as PDF</button>}
      <span>Choose “Save as PDF” in the print dialog</span></div>}
    <header>
      <img className="resume-mark resume-photo" src={profile.photo} alt={"Photo of " + profile.name} width="65" height="65"/>
      <div>
        <h1>{profile.name}</h1>
        <p>{profile.role}</p>
        {contact.length > 0 && <p className="resume-contact">{contact.map((c, i) => <span key={c.href}>{i > 0 && " · "}<a href={c.href}>{c.label}</a></span>)}</p>}
      </div>
    </header>
    <p className="resume-summary">{profile.summary}</p>
    {profile.availability && <p className="resume-status">● {profile.availability}</p>}

    {experience.length > 0 && <section><h2>Experience</h2>{experience.map(e => <div className="resume-job" key={e.title + e.organization}>
      <h3>{e.title} · {e.organization}<span className="resume-period">{e.period}</span></h3>
      <p>{e.description}</p>
      {e.highlights && <ul>{e.highlights.map(h => <li key={h}>{h}</li>)}</ul>}
    </div>)}</section>}

    <section><h2>Projects</h2>{projects.filter(p => p.status !== "Draft").map(p => <div className="resume-project" key={p.slug}>
      <h3>{p.name}<a href={p.liveUrl ?? "/projects/" + p.slug + "/"} aria-label={p.liveUrl ? "Visit " + p.name : "Read the " + p.name + " case study"}><ArrowUpRight size={18}/></a></h3>
      <p>{p.subtitle}</p>
      <span>{p.stack.join(" · ")}</span>
    </div>)}</section>

    {skills.length > 0 && <section><h2>Skills</h2><p className="resume-skills">{skills.join(" · ")}</p></section>}

    {achievements.length > 0 && <section><h2>Achievements</h2>{achievements.map(a => <div key={a.title}><h3>{a.title}</h3><p>{a.issuer} · {a.date}</p></div>)}</section>}
  </article>;
}
