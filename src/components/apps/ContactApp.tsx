"use client";

import { useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, Copy, Mail, Monitor } from "lucide-react";
import { profile } from "@/content/portfolio";

export default function ContactApp({onNotify,onOpen}:{onNotify:(message:string)=>void;onOpen?:(id:"mail")=>void}){
  const [copying,setCopying]=useState(false);
  const copy=async()=>{
    setCopying(true);
    try{await navigator.clipboard.writeText(profile.email||window.location.origin);onNotify(profile.email?"Email address copied":"Portfolio link copied");}
    catch{onNotify("Copy isn't available here. Use your browser's address bar.");}
    finally{setCopying(false);}
  };
  return <article className="app-reading contact-app"><span className="contact-symbol"><Mail size={38} strokeWidth={1.25}/></span><h1>Good things start<br/>with a hello<span className="title-dot">.</span></h1><p className="contact-lead">A development role, a website idea,<br/>or a conversation about building something useful.</p><div className="contact-intentions"><span><BriefcaseBusiness size={17}/> Hiring for a role</span><span><Monitor size={17}/> Have a project in mind</span></div>{profile.email?<a className="contact-email" href={"mailto:"+profile.email}>{profile.email}<ArrowUpRight size={23}/></a>:<div className="contact-pending"><span className="status-dot"/>Public contact details are being prepared.</div>}<div className="reading-actions">{profile.email&&onOpen&&<button className="primary-button" onClick={()=>onOpen("mail")}><Mail size={16}/> Write a message</button>}{profile.email&&!onOpen&&<a className="primary-button" href={"mailto:"+profile.email}><Mail size={16}/> Say hello</a>}<button className="secondary-button" onClick={copy} disabled={copying}><Copy size={16}/>{profile.email?"Copy email":"Copy portfolio link"}</button>{profile.linkedin&&<a className="secondary-button" href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight size={15}/></a>}{profile.github&&<a className="secondary-button" href={profile.github} target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={15}/></a>}</div><div className="contact-bottom"><span>Thanks for stopping by.</span><span>{profile.name}</span></div></article>;
}
