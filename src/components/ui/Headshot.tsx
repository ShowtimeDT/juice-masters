"use client";

import { useState } from "react";
import Image from "next/image";
import { headshotUrl, golferInitials } from "@/lib/format";

interface HeadshotProps {
  name: string;
  espnId?: string;
  /** Diameter in px. */
  size?: number;
  /** Dim + grayscale + rose ring for a missed-cut golfer. */
  missedCut?: boolean;
}

/**
 * ESPN headshot with an initials-disc fallback always rendered behind the image.
 * The photo fades in on load; on error it's removed so a missing photo never
 * breaks the layout. Mirrors the design handoff's onload/onerror behavior.
 */
export default function Headshot({ name, espnId, size = 40, missedCut = false }: HeadshotProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const showImg = Boolean(espnId) && !errored;

  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden bg-surface2 shrink-0 shadow-[0_0_0_1px_var(--line)] ${
        missedCut ? "grayscale opacity-60" : ""
      }`}
      style={{ width: size, height: size }}
    >
      <span
        className="font-sans font-semibold text-gold2"
        style={{ fontSize: size * 0.34 }}
      >
        {golferInitials(name)}
      </span>
      {showImg && (
        <Image
          src={headshotUrl(espnId as string)}
          alt={name}
          fill
          unoptimized
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`absolute inset-0 object-cover object-[50%_16%] transition-opacity duration-200 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </span>
  );
}
