"use client";

import { useState } from "react";
import { Download, FileText, Minus, Plus } from "lucide-react";
import { profile } from "@/content/portfolio";
import ResumeContent from "@/components/ResumeContent";

/** The résumé shown like a PDF viewer: grey desk, white page, zoom controls. */
export default function ResumeViewer() {
  const [zoom, setZoom] = useState(100);
  const change = (delta: number) => setZoom(z => Math.min(150, Math.max(70, z + delta)));
  return (
    <div className="pdf-viewer">
      <div className="pdf-toolbar">
        <span className="pdf-name"><FileText size={15} /> Résumé.pdf</span>
        <div className="pdf-zoom" role="group" aria-label="Zoom">
          <button aria-label="Zoom out" onClick={() => change(-10)} disabled={zoom <= 70}><Minus size={15} /></button>
          <button className="pdf-zoom-value" aria-label="Reset zoom" onClick={() => setZoom(100)}>{zoom}%</button>
          <button aria-label="Zoom in" onClick={() => change(10)} disabled={zoom >= 150}><Plus size={15} /></button>
        </div>
        {profile.resumeUrl
          ? <a className="pdf-save" href={profile.resumeUrl} download><Download size={15} /> Download</a>
          : <a className="pdf-save" href="/resume/?print=1" target="_blank" rel="noopener"><Download size={15} /> Save as PDF</a>}
      </div>
      <div className="pdf-desk">
        <div className="pdf-page" style={{ zoom: zoom / 100 }}><ResumeContent inWindow /></div>
      </div>
    </div>
  );
}
