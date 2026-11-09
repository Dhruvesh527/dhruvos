import { useId } from "react";

/**
 * The DhruvOS logo: a rounded "D." monogram.
 * Deliberately not four squares, so it can't be mistaken for another OS's logo.
 */
export default function OsMark({ small = false }: { small?: boolean }) {
  const id = useId();
  return (
    <span className={"os-mark" + (small ? " small" : "")} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <defs>
          <linearGradient id={id + "-fill"} x1="6" y1="4" x2="42" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="oklch(.86 .08 245)" />
            <stop offset=".55" stopColor="oklch(.66 .16 258)" />
            <stop offset="1" stopColor="oklch(.5 .19 268)" />
          </linearGradient>
          <linearGradient id={id + "-shine"} x1="24" y1="2" x2="24" y2="26" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="white" stopOpacity=".38" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="13" fill={`url(#${id}-fill)`} />
        <rect x="2" y="2" width="44" height="22" rx="13" fill={`url(#${id}-shine)`} />
        <path d="M14.5 13.5h8c6.6 0 10.8 4.2 10.8 10.5s-4.2 10.5-10.8 10.5h-8z" fill="none" stroke="white" strokeWidth="4.4" strokeLinejoin="round" />
        <circle cx="37.6" cy="33.2" r="2.9" fill="oklch(.88 .14 86)" />
      </svg>
    </span>
  );
}
