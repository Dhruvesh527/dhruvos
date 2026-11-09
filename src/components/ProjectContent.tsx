import { ArrowUpRight, Code2, ExternalLink, Monitor, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProjectImage from "./ProjectImage";
import type { Project } from "@/content/portfolio";

export default function ProjectContent({ project, inWindow = false }: { project: Project; inWindow?: boolean }) {
  return <article className="case-study">
    {!inWindow && <Link className="text-link" href="/?skip=1"><ArrowLeft size={16}/> Back to desktop</Link>}
    <div className="case-meta"><span>{project.kind}</span><span className={"status-tag " + project.status.toLowerCase()}>{project.status === "Draft" ? "Case study in progress" : project.status === "Live" ? "Live" : "Local preview"}</span></div>
    <h1>{project.name}<span className="title-dot">.</span></h1>
    <p className="case-lead">{project.subtitle}</p>
    <div className={"project-shot " + project.color}><ProjectImage src={project.image} alt={project.imageAlt ?? (project.status === "Draft" ? "Illustrative layout for a future " + project.kind.toLowerCase() + " case study" : project.name + " interface")}  /><span className="shot-label">{project.imageLabel ?? (project.status === "Draft" ? "Illustrative preview" : "Interface illustration")}</span></div>
    <div className="case-actions">
      {project.liveUrl && <a className="primary-button" href={project.liveUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> Open live website</a>}
      {project.sourceUrl && <a className="secondary-button" href={project.sourceUrl} target="_blank" rel="noopener noreferrer"><Code2 size={16}/> Source code</a>}
      {inWindow && <Link className="secondary-button" href={"/projects/" + project.slug + "/"}><ArrowUpRight size={16}/> Open project page</Link>}
      {project.slug === "dhruvos" && !inWindow && <Link className="primary-button" href="/?skip=1"><Monitor size={16}/> Explore the desktop</Link>}
    </div>
    <section><h2>Overview</h2><p>{project.description}</p></section>
    <div className="case-facts"><div><span>My role</span><p>{project.role}</p></div><div><span>Built with</span><p>{project.stack.length ? project.stack.join(" · ") : "Details coming with the full case study"}</p></div></div>
    {project.features.length > 0 && <section><h2>What it does</h2><ul className="feature-list">{project.features.map(feature=><li key={feature}>{feature}</li>)}</ul></section>}
    <section><h2>The challenge</h2><p>{project.challenge}</p></section>
    <section><h2>The result</h2><p>{project.outcome}</p></section>
    <footer className="case-footer"><span>Thanks for taking a look.</span><Monitor size={20}/></footer>
  </article>;
}
