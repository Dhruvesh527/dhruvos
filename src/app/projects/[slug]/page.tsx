import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectContent from "@/components/ProjectContent";
import { projects } from "@/content/portfolio";
export function generateStaticParams() { return projects.map(p=>({slug:p.slug})); }
export async function generateMetadata({params}: {params:Promise<{slug:string}>}): Promise<Metadata> {
  const {slug}=await params; const project=projects.find(p=>p.slug===slug);
  return {title:project?.name??"Project",description:project?.description,robots:project?.status==="Draft"?{index:false,follow:true}:undefined};
}
export default async function ProjectPage({params}: {params:Promise<{slug:string}>}) {
  const {slug}=await params; const project=projects.find(p=>p.slug===slug);
  if(!project) notFound();
  return <main className="standalone-case"><ProjectContent project={project}/></main>;
}
