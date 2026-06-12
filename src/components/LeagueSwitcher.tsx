"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useOutsideClick } from "@/lib/useOutsideClick";

export interface LeagueOption {
  id: string;
  name: string;
  slug: string;
}

interface LeagueSwitcherProps {
  currentName: string;
  currentSlug: string;
  leagues: LeagueOption[];
  /** Link to the manage page, or null when the viewer isn't the commissioner. */
  manageHref: string | null;
}

/** League name + dropdown to switch leagues, manage, or join/create. */
export default function LeagueSwitcher({
  currentName,
  currentSlug,
  leagues,
  manageHref,
}: LeagueSwitcherProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef, () => setOpen(false), open);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="text-gray-300 text-xs uppercase tracking-wider font-semibold flex items-center gap-1 cursor-pointer hover:text-white py-3.5"
      >
        <span className="truncate max-w-[8rem] sm:max-w-[14rem]">{currentName}</span>
        <svg
          className={`w-3 h-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 bg-card border border-edge rounded-lg shadow-lg z-50 min-w-[12rem]">
          {leagues.map((league) => (
            <a
              key={league.id}
              href={`/league/${league.slug}`}
              className={`block px-4 py-2 text-sm transition-colors ${
                league.slug === currentSlug
                  ? "text-white bg-white/5"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              onClick={() => setOpen(false)}
            >
              {league.name}
            </a>
          ))}
          <div className="border-t border-edge">
            {manageHref && (
              <a
                href={manageHref}
                className="px-4 py-2 text-xs text-brand hover:text-white transition-colors flex items-center gap-1.5"
                onClick={() => setOpen(false)}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Manage League
              </a>
            )}
            <Link
              href="/?home=1"
              className="block px-4 py-2 text-xs text-brand hover:text-white transition-colors rounded-b-lg"
              onClick={() => setOpen(false)}
            >
              + Join or Create League
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
