export type Project = {
  slug: string;
  name: string;
  subtitle: string;
  kind: string;
  status: "Live" | "Preview" | "Draft";
  year: string;
  image: string;
  /** A small version of the image for icons and thumbnails (faster to load). */
  thumb?: string;
  /** Describes what the image shows, for screen readers. */
  imageAlt?: string;
  /** Small caption on the image, e.g. "Live screenshot". */
  imageLabel?: string;
  color: string;
  description: string;
  role: string;
  stack: string[];
  features: string[];
  challenge: string;
  outcome: string;
  liveUrl?: string;
  sourceUrl?: string;
};

export const profile = {
  name: "Dhruvesh Gohil",
  role: "Full-stack developer",
  tagline: "Thoughtful interfaces. Working applications.",
  /** A plain, professional summary for the résumé (the introduction above is written for the website). */
  summary: "Full-stack developer who builds web and mobile products end to end, from the first interface to production. Most recently I built Ozzat, a live marketplace with a Next.js web app, an API, and Expo mobile apps for shoppers and delivery riders.",
  introduction: "I build websites and web applications, from the first interface to the final deployment. Most recently I've been building Ozzat, a live marketplace with a Next.js web app, an API, and Expo mobile apps. This is my little corner of the internet, made to feel like a computer you can explore.",
  email: "gohildhruvesh47@gmail.com",
  github: "https://github.com/Dhruvesh527",
  linkedin: "https://www.linkedin.com/in/dhruvesh527",
  photo: "/profile.webp",
  resumeUrl: "",
  availability: "Open to full-time roles and freelance work",
};

/** The small image for a project, falling back to the full one. */
export const thumbOf = (project: Pick<Project, "image" | "thumb">) => project.thumb ?? project.image;

export const projects: Project[] = [
  {
    slug: "ozzat",
    name: "Ozzat",
    subtitle: "A hyperlocal fashion marketplace connecting shoppers with neighbourhood boutiques.",
    kind: "Marketplace · web + mobile",
    status: "Live",
    year: "2026",
    image: "/projects/ozzat.webp",
    thumb: "/projects/ozzat-thumb.webp",
    imageAlt: "The Ozzat product listing page, showing items from local boutiques with prices and discounts",
    imageLabel: "Live screenshot",
    color: "mint",
    description: "Ozzat connects Indian shoppers with nearby boutiques for fast local delivery. One platform serves five kinds of users (shoppers, sellers, delivery riders, warehouse staff, and admins) across a Next.js web app and Expo mobile apps.",
    role: "Lead Full-Stack Developer · Built end to end. I designed and built the web app, API, database, and mobile apps, from the first screen to production. The main repository has 895 commits from July to October 2026.",
    stack: ["Next.js", "React", "JavaScript", "Prisma", "MongoDB", "AWS S3", "Expo", "React Native"],
    features: [
      "Separate experiences for shoppers, sellers, delivery riders, warehouse staff, and admins, each with its own access rules.",
      "Seller onboarding with KYC document uploads to AWS S3 and digital seller agreements.",
      "Google sign-in and a referral programme that splits the reward between a verified signup and the first delivery.",
      "Ozzat Coins rewards, coupons, and generated PDF invoices.",
      "Rider and warehouse flows that move each order from the boutique, through the hub, to the shopper's door.",
      "A dedicated admin login with audit logging, and rate limiting on sign-in routes.",
      "Shopper and rider mobile apps built with Expo and React Native.",
    ],
    challenge: "Admin accounts could sign in through the same public login routes that shoppers and sellers use, which made the most powerful accounts the easiest to attack. I gave admins their own login endpoint that accepts only the admin role, blocked admin accounts from the public routes, and logged every attempt with its IP address. I used generic error messages so attackers can't tell which accounts exist, and added rate limiting to slow down password guessing.",
    outcome: "Ozzat is live at ozzat.com. In November 2026 it listed 1,241 products from local boutiques. The web platform has about 259 API routes, 136 pages, 58 data models, and around 270 automated test files.",
    liveUrl: "https://www.ozzat.com",
  },
  {
    slug: "dhruvos",
    name: "DhruvOS",
    subtitle: "A portfolio you can power on.",
    kind: "Interactive portfolio",
    status: "Preview",
    year: "2026",
    image: "/projects/dhruvos.svg",
    imageAlt: "Illustration of the DhruvOS portfolio interface",
    imageLabel: "Interface illustration",
    color: "blue",
    description: "A personal portfolio presented as a computer. Power on a laptop, enter its display, and explore projects through a familiar desktop and app windows.",
    role: "Personal portfolio · interface and application development",
    stack: ["Next.js", "React", "TypeScript", "CSS"],
    features: [
      "A skippable laptop boot sequence with a seamless transition into the desktop.",
      "App windows with close, minimize, maximize, taskbar restoration, and desktop dragging.",
      "A searchable project folder and a dedicated viewer for each case study.",
      "Touch-friendly full-screen apps, keyboard controls, reduced motion, and a simple reading view.",
      "Direct project pages that can be shared without replaying the intro.",
    ],
    challenge: "Making a computer-inspired interface remain comfortable on a phone and usable with a keyboard. The desktop adapts into full-screen apps, while a simple view keeps the same content easy to reach.",
    outcome: "This project is available as a local preview. Public deployment and personal portfolio content are still to be completed.",
  },
];

export type Experience = { title: string; organization: string; period: string; description: string; highlights?: string[] };
export type Achievement = { title: string; issuer: string; date: string; summary: string; documentUrl?: string; verificationUrl?: string };
export const experience: Experience[] = [
  {
    title: "Lead Full-Stack Developer",
    organization: "Ozzat",
    period: "Jul 2026 – present",
    description: "Built Ozzat, a live hyperlocal fashion marketplace, end to end: the Next.js web app, the API, the MongoDB database with Prisma, and the Expo mobile apps.",
    highlights: [
      "One platform for five kinds of users (shoppers, sellers, delivery riders, warehouse staff, and admins), each with its own access rules.",
      "About 259 API routes, 136 pages, and 58 data models, with around 270 automated test files.",
      "Secured admin access with a dedicated login, audit logging, generic error messages, and rate limiting.",
      "Seller onboarding with KYC uploads to AWS S3, Google sign-in, referrals, Ozzat Coins rewards, and PDF invoices.",
      "Shopper and rider mobile apps built with Expo and React Native.",
    ],
  },
];
export const achievements: Achievement[] = [];
