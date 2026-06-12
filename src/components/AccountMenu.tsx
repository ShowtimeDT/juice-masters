"use client";

import { useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useOutsideClick } from "@/lib/useOutsideClick";

interface AccountMenuProps {
  /** Where to return after signing in, e.g. the current league page. */
  loginCallbackUrl: string;
}

/** User name + dropdown with Sign Out; a Sign In link when logged out. */
export default function AccountMenu({ loginCallbackUrl }: AccountMenuProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef, () => setOpen(false), open);

  if (!session?.user) {
    return (
      <a
        href={`/login?callbackUrl=${encodeURIComponent(loginCallbackUrl)}`}
        className="text-brand text-xs hover:text-white transition-colors py-3.5"
      >
        Sign In
      </a>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="text-gray-500 text-xs flex items-center gap-1 cursor-pointer hover:text-gray-300 transition-colors py-3.5"
      >
        <span className="truncate max-w-[6rem] sm:max-w-[10rem]">{session.user.name}</span>
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
        <div className="absolute top-full right-0 mt-1 bg-card border border-edge rounded-lg shadow-lg z-50 min-w-[8rem]">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="block w-full text-left px-4 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer rounded-lg"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
