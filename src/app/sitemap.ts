import type { MetadataRoute } from "next";
import { projects } from "@/content/portfolio";
export const dynamic="force-static";
export default function sitemap(): MetadataRoute.Sitemap {const origin=process.env.NEXT_PUBLIC_SITE_URL;if(!origin)return [];return ["/","/simple/","/resume/",...projects.filter(p=>p.status!=="Draft").map(p=>"/projects/"+p.slug+"/")].map(path=>({url:origin.replace(/\/$/,"")+path}));}
