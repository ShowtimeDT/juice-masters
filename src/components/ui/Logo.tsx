"use client";

import { useId } from "react";

interface LogoProps {
  /** Pixel size of the square mark. Nav default ~38. */
  size?: number;
  /**
   * Render the "JUICE TOUR" wordmark arched across the top of the ring.
   * Turn off for very small sizes / favicons where the text is illegible.
   */
  arched?: boolean;
  className?: string;
}

/**
 * The "Dawn" brand mark — a sunrise cresting a horizon inside a medal ring,
 * with "JUICE TOUR" arched across the top (SVG textPath). Replaces the old
 * Masters-like logo. See design_handoff_juice_tour_app for the source SVG.
 *
 * Uses unique ids per instance so multiple logos on one page don't collide on
 * their clipPath / textPath references.
 */
export default function Logo({ size = 38, arched = true, className }: LogoProps) {
  const uid = useId().replace(/:/g, "");
  const arcId = `arc-${uid}`;
  const sunId = `sun-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Juice Tour"
    >
      <circle cx="100" cy="100" r="94" fill="none" stroke="#C9A24B" strokeWidth="4" />
      {arched && (
        <>
          <path id={arcId} d="M100,100 m-66,0 a66,66 0 1,1 132,0" fill="none" />
          <text
            fontFamily="Jost, sans-serif"
            fontSize="24"
            fontWeight="600"
            letterSpacing="3"
            fill="#E2C079"
          >
            <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
              JUICE TOUR
            </textPath>
          </text>
        </>
      )}
      <g stroke="#C9A24B" strokeWidth="6" strokeLinecap="round">
        <line x1="100" y1="84" x2="100" y2="72" />
        <line x1="78" y1="90" x2="71" y2="80" />
        <line x1="122" y1="90" x2="129" y2="80" />
      </g>
      <clipPath id={sunId}>
        <rect x="50" y="84" width="100" height="42" />
      </clipPath>
      <circle cx="100" cy="126" r="28" fill="#C9A24B" clipPath={`url(#${sunId})`} />
      <line
        x1="58"
        y1="126"
        x2="142"
        y2="126"
        stroke="#E2C079"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
