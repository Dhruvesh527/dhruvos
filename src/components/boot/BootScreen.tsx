import OsMark from "@/components/shell/OsMark";
import DotsSpinner from "./DotsSpinner";

/** Black screen with the logo and a spinner, shown inside the laptop while it "starts". */
export default function BootScreen() {
  return (
    <div className="boot-screen" role="status" aria-label="DhruvOS is starting">
      <div className="boot-brand">
        <OsMark />
        <h1>DhruvOS</h1>
      </div>
      <DotsSpinner size={44} />
    </div>
  );
}
