import Desktop from "@/components/Desktop";
import { SimplePortfolio } from "@/components/SimplePortfolio";
export default function Home() {
  return <>
    <Desktop />
    <noscript><style>{".portfolio-os{display:none}"}</style><div className="no-script"><SimplePortfolio /><p>JavaScript is disabled. All available portfolio content is shown above.</p></div></noscript>
  </>;
}
