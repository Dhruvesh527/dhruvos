import Link from "next/link";
import ProjectImage from "./ProjectImage";
import { profile, projects, experience, achievements } from "@/content/portfolio";

export function SimplePortfolio() {
  return <main className="simple-portfolio">
    <div className="simple-top"><Link href="/?skip=1">DhruvOS</Link><span>Simple view</span></div>
    <header><p className="simple-role">{profile.role}</p><h1>{profile.name}<span className="title-dot">.</span></h1><p className="simple-lead">{profile.tagline}</p><p>{profile.introduction}</p>{profile.availability&&<p className="simple-status">● {profile.availability}</p>}<div className="simple-links"><a href="#work">Explore projects ↓</a><Link href="/resume/">View résumé ↗</Link><a href="#contact">Contact ↓</a></div></header>
    <section id="work"><h2>Selected work</h2><div className="simple-work">{projects.map(p=><Link key={p.slug} href={"/projects/"+p.slug+"/"} className="simple-project"><div className={"simple-image "+p.color}><ProjectImage src={p.image} alt={p.imageAlt??(p.status==="Draft"?"Illustrative project layout":p.name+" interface")}  loading="lazy"/></div><div><h3>{p.name}</h3><p>{p.subtitle}</p><span>{p.status==="Draft"?"Case study in progress":p.kind} ↗</span></div></Link>)}</div></section>
    <section><h2>Experience</h2>{experience.length ? experience.map(e=><div key={e.title}><h3>{e.title} · {e.organization}</h3><p>{e.period}</p><p>{e.description}</p>{e.highlights&&<ul>{e.highlights.map(h=><li key={h}>{h}</li>)}</ul>}</div>):<p>My detailed experience timeline is being prepared.</p>}</section>
    {achievements.length>0&&<section><h2>Achievements</h2>{achievements.map(a=><div key={a.title}><h3>{a.title}</h3><p>{a.issuer} · {a.date}</p><p>{a.summary}</p></div>)}</section>}
    <section id="contact"><h2>Let's make something useful.</h2><p>Hiring for a development role or have a website project in mind? I'd love to hear from you.</p><div className="simple-links">{profile.email&&<a href={"mailto:"+profile.email}>{profile.email}</a>}{profile.github&&<a href={profile.github}>GitHub ↗</a>}{profile.linkedin&&<a href={profile.linkedin}>LinkedIn ↗</a>}</div>{!profile.email&&!profile.github&&!profile.linkedin&&<p className="muted">Public contact details are being prepared.</p>}</section>
    <footer><span>© {new Date().getFullYear()} {profile.name}</span><Link href="/?skip=1">Return to desktop ↗</Link></footer>
  </main>;
}
