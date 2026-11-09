import type { Metadata } from "next";
import Link from "next/link";
import ResumeContent from "@/components/ResumeContent";
export const metadata: Metadata={title:"Résumé"};
export default function ResumePage(){return <main className="standalone-resume"><Link href="/?skip=1" className="text-link">← Back to desktop</Link><ResumeContent/></main>;}
