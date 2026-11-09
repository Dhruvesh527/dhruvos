import type { Metadata } from "next";
import { SimplePortfolio } from "@/components/SimplePortfolio";
export const metadata: Metadata = { title: "Simple portfolio" };
export default function SimplePage() { return <SimplePortfolio/>; }
