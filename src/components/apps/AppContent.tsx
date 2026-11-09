"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, BriefcaseBusiness, FileText, Folder, ShieldCheck, Trophy } from "lucide-react";
import { achievements, experience, projects } from "@/content/portfolio";
import type { AppId } from "./registry";
import ProjectsApp from "./ProjectsApp";
import ContactApp from "./ContactApp";
import dynamic from "next/dynamic";
import AboutApp from "./AboutApp";

// Bigger apps load only when first opened, so the desktop itself starts faster.
const loading = () => <div className="app-loading" role="status" aria-label="Loading"><span /></div>;
const TerminalApp = dynamic(() => import("./TerminalApp"), { loading });
const BrowserApp = dynamic(() => import("./BrowserApp"), { loading });
const MailApp = dynamic(() => import("./MailApp"), { loading });
const PhotosApp = dynamic(() => import("./PhotosApp"), { loading });
const SettingsApp = dynamic(() => import("./SettingsApp"), { loading });
const ResumeViewer = dynamic(() => import("./ResumeViewer"), { loading });
import ProjectContent from "@/components/ProjectContent";

export default function AppContent({id,resource,onOpen,onNotify,onReplay,onClose,reducedMotion,systemReducedMotion=false}:{
  id:AppId;resource?:string;onOpen:(id:AppId,resource?:string)=>void;onNotify:(message:string)=>void;onReplay:()=>void;onClose?:()=>void;reducedMotion:boolean;systemReducedMotion?:boolean;
}) {
  if(id==="terminal")return <TerminalApp onOpen={onOpen} onClose={onClose}/>;
  if(id==="browser")return <BrowserApp onOpen={onOpen} initialUrl={resource}/>;
  if(id==="mail")return <MailApp onOpen={onOpen} onNotify={onNotify}/>;
  if(id==="photos")return <PhotosApp onOpen={onOpen} reducedMotion={reducedMotion}/>;
  if(id==="settings")return <SettingsApp onReplay={onReplay} reducedMotionSystem={systemReducedMotion}/>;
  if(id==="about")return <AboutApp onOpen={onOpen}/>;
  if(id==="projects")return <ProjectsApp onOpen={onOpen}/>;
  if(id==="project"){const project=projects.find(p=>p.slug===resource);return project?<ProjectContent project={project} inWindow/>:<EmptyState icon={Folder} title="Project not found" text="Open a project from the Projects folder."/>;}
  if(id==="resume")return <ResumeViewer/>;
  if(id==="experience")return <article className="app-reading"><AppHeading icon={BriefcaseBusiness} title="Experience" description="The work behind the interfaces."/>{experience.length?<div className="experience-timeline">{experience.map(e=><section key={e.title}><span>{e.period}</span><h2>{e.title}</h2><p className="timeline-company">{e.organization}</p><p>{e.description}</p>{e.highlights&&<ul className="timeline-highlights">{e.highlights.map(h=><li key={h}>{h}</li>)}</ul>}</section>)}</div>:<EmptyState icon={BriefcaseBusiness} title="My story is being written here." text="A detailed timeline of roles, responsibilities, and contributions will be added soon."/>}<div className="reading-footer"><span>{experience.length?"See what I built along the way.":"In the meantime, take a look at my work."}</span><button className="text-link" onClick={()=>onOpen("projects")}>Open projects <ArrowUpRight size={14}/></button></div></article>;
  if(id==="achievements")return <article className="app-reading"><AppHeading icon={Trophy} title="Achievements" description="Milestones, recognition, and things worth keeping."/>{achievements.length?<div className="achievement-list">{achievements.map((a,i)=><button key={a.title} onClick={()=>onOpen("document",String(i))}><FileText size={24}/><div><h2>{a.title}</h2><span>{a.issuer} · {a.date}</span></div><ArrowUpRight size={18}/></button>)}</div>:<EmptyState icon={Trophy} title="Room for the milestones." text="Verified achievements and certificates will live here, with documents and links you can open."/>}</article>;
  if(id==="document"){const a=achievements[Number(resource)];return a?<article className="app-reading"><AppHeading icon={FileText} title={a.title} description={a.issuer+" · "+a.date}/><p>{a.summary}</p>{a.documentUrl&&<iframe className="document-preview" src={a.documentUrl} title={a.title+" document preview"} loading="lazy"/>}{a.documentUrl&&<a className="primary-button" href={a.documentUrl} target="_blank" rel="noopener noreferrer">Open document <ArrowUpRight size={16}/></a>}{a.verificationUrl&&<a className="secondary-button" href={a.verificationUrl} target="_blank" rel="noopener noreferrer">Verify achievement <ShieldCheck size={16}/></a>}</article>:<EmptyState icon={FileText} title="No document selected" text="Select an achievement to view its supporting document."/>;}
  if(id==="contact")return <ContactApp onNotify={onNotify} onOpen={onOpen}/>;
  return null;
}

function AppHeading({icon:Icon,title,description}:{icon:LucideIcon;title:string;description:string}){return <header className="app-heading"><span className="heading-icon"><Icon size={23}/></span><h1>{title}<span className="title-dot">{title.endsWith(".")?"":"."}</span></h1><p>{description}</p></header>;}
function EmptyState({icon:Icon,title,text}:{icon:LucideIcon;title:string;text:string}){return <div className="empty-state"><div><Icon size={37} strokeWidth={1.25}/></div><h2>{title}</h2><p>{text}</p></div>;}
