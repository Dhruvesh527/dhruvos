"use client";
import { useState } from "react";
import { ImageOff } from "lucide-react";
export default function ProjectImage({src,alt,loading}:{src:string;alt:string;loading?:"lazy"|"eager"}){
  const [failed,setFailed]=useState(false);
  if(failed)return <div className="preview-fallback" role="img" aria-label={alt+" (preview unavailable)"}><ImageOff size={28}/><span>Preview unavailable</span></div>;
  return <img src={src} alt={alt} width="1200" height="750" loading={loading} onError={()=>setFailed(true)}/>;
}
