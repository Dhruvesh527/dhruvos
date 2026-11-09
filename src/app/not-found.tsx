import Link from "next/link";
export default function NotFound(){return <main className="not-found"><span className="error-code">404</span><h1>This file isn't here.</h1><p>The page may have moved, or the address may be incomplete.</p><Link className="primary-button" href="/?skip=1">Return to desktop</Link></main>;}
