import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl=process.env.NEXT_PUBLIC_SITE_URL;
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl || "http://127.0.0.1:3210"),
  title: { default: "Dhruvesh Gohil — Full-stack developer · DhruvOS portfolio", template: "%s · Dhruvesh Gohil" },
  description: "Power on a personal desktop and explore the web development portfolio, projects, and experience of Dhruvesh Gohil.",
  openGraph: { title: "DhruvOS — A portfolio you can power on", description: "Explore projects through a personal computer-inspired portfolio.", images: [{ url: "/social-preview.png", width: 1200, height: 630, alt: "DhruvOS desktop portfolio" }] },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#111827", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
