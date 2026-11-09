"use client";

import { useState } from "react";
import { ArrowLeft, Check, Copy, Inbox, Folder, PenLine, Reply, Send } from "lucide-react";
import { profile } from "@/content/portfolio";
import type { AppId } from "./registry";

const FIRST = profile.name.split(" ")[0];
const TEMPLATES: Record<string, { subject: string; body: string }> = {
  "Job opportunity": { subject: "Job opportunity", body: `Hi ${FIRST},\n\nI'm [your role] at [company]. I'd like to talk to you about a [position] role.\n\nAre you available for a short call this week?\n\nThanks,\n` },
  "Freelance project": { subject: "Project enquiry", body: `Hi ${FIRST},\n\nI have a project in mind: [what you want to build].\n\nTimeline: [when]\nBudget: [rough range]\n\nThanks,\n` },
  "Just saying hi": { subject: "Hello from your portfolio", body: `Hi ${FIRST},\n\nI came across your portfolio and wanted to say [something nice].\n\n` },
};

/** A Mail app that writes the message here, then hands it to the visitor's own email app (nothing is sent from this site). */
export default function MailApp({ onOpen, onNotify }: { onOpen: (id: AppId, resource?: string) => void; onNotify: (message: string) => void }) {
  const [view, setView] = useState<"inbox" | "read" | "compose" | "sent">("read");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");

  const message = () => body.trim() + (name.trim() ? `\n${name.trim()}` : "");
  const mailto = () => `mailto:${profile.email}?subject=${encodeURIComponent(subject || "Hello")}&body=${encodeURIComponent(message())}`;
  const compose = (template?: string, subjectLine?: string) => {
    const t = template ? TEMPLATES[template] : undefined;
    setSubject(subjectLine ?? t?.subject ?? subject);
    if (t && (!body.trim() || Object.values(TEMPLATES).some(x => x.body === body))) setBody(t.body);
    setView("compose");
  };
  const send = () => { if (!body.trim() || !profile.email) return; window.location.href = mailto(); setView("sent"); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(`To: ${profile.email}\nSubject: ${subject}\n\n${message()}`); onNotify("Message copied"); }
    catch { onNotify("Copy isn't available here"); }
  };

  return (
    <div className="mail-app">
      <nav className="mail-nav" aria-label="Mail folders">
        <button className="primary-button mail-new" onClick={() => compose()}><PenLine size={16} /> New message</button>
        <button className={"mail-folder" + (view === "inbox" || view === "read" ? " active" : "")} onClick={() => setView("inbox")}><Inbox size={16} /> Inbox <span className="mail-count">1</span></button>
        <button className={"mail-folder" + (view === "compose" || view === "sent" ? " active" : "")} onClick={() => setView("compose")}><Folder size={16} /> Drafts</button>
        <p className="mail-note">Send opens <strong>your own</strong> email app with the message ready. Nothing is sent from this website.</p>
      </nav>

      <section className="mail-main">
        {view === "inbox" && (
          <div className="mail-list">
            <button className="mail-item unread" onClick={() => setView("read")}>
              <img src={profile.photo} alt="" width="36" height="36" />
              <span><strong>{profile.name}</strong><em>Thanks for visiting 👋</em><small>Hi! I&apos;m glad you found your way here…</small></span>
            </button>
          </div>
        )}

        {view === "read" && (
          <article className="mail-read">
            <button className="mail-back" onClick={() => setView("inbox")}><ArrowLeft size={15} /> Inbox</button>
            <h1>Thanks for visiting 👋</h1>
            <div className="mail-from">
              <img src={profile.photo} alt="" width="40" height="40" />
              <div><strong>{profile.name}</strong><span>{profile.email}</span></div>
            </div>
            <div className="mail-body">
              <p>Hi! I&apos;m glad you found your way here.</p>
              <p>I&apos;m a {profile.role.toLowerCase()} who enjoys building complete products, from the first screen to the database. The best place to start is my main project, <strong>Ozzat</strong>.</p>
              <p>If you&apos;re hiring, or have a project in mind, just hit <strong>Reply</strong>. I&apos;d love to hear from you.</p>
              <p>{FIRST}</p>
            </div>
            <div className="mail-actions">
              <button className="primary-button" onClick={() => compose(undefined, "Re: Thanks for visiting")}><Reply size={16} /> Reply</button>
              <button className="secondary-button" onClick={() => onOpen("projects")}>See my projects</button>
            </div>
          </article>
        )}

        {view === "compose" && (
          <form className="mail-compose" onSubmit={event => { event.preventDefault(); send(); }}>
            <div className="mail-field"><span>To</span><span className="mail-chip">{profile.name} &lt;{profile.email}&gt;</span></div>
            <label className="mail-field"><span>Subject</span><input value={subject} onChange={event => setSubject(event.target.value)} placeholder="What's it about?" /></label>
            <div className="mail-templates" aria-label="Start from a template">
              {Object.keys(TEMPLATES).map(t => <button type="button" key={t} onClick={() => compose(t)}>{t}</button>)}
            </div>
            <textarea value={body} onChange={event => setBody(event.target.value)} placeholder="Write your message…" aria-label="Message" rows={9} />
            <label className="mail-field"><span>Your name</span><input value={name} onChange={event => setName(event.target.value)} placeholder="Optional, added as a sign-off" autoComplete="name" /></label>
            <div className="mail-actions">
              <button type="submit" className="primary-button" disabled={!body.trim()}><Send size={16} /> Send</button>
              <button type="button" className="secondary-button" onClick={copy} disabled={!body.trim()}><Copy size={16} /> Copy message</button>
            </div>
          </form>
        )}

        {view === "sent" && (
          <div className="mail-sent">
            <span className="mail-sent-icon"><Check size={28} /></span>
            <h1>Ready to send</h1>
            <p>Your email app should have opened with the message filled in. If nothing happened, copy the message and send it to <a href={"mailto:" + profile.email}>{profile.email}</a>.</p>
            <div className="mail-actions">
              <button className="secondary-button" onClick={copy}><Copy size={16} /> Copy message</button>
              <button className="secondary-button" onClick={() => { setBody(""); setSubject(""); setView("compose"); }}>Write another</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
