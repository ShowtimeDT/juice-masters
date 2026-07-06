"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useOutsideClick } from "@/lib/useOutsideClick";

interface AccountMenuProps {
  /** Where to return after signing in, e.g. the current league page. */
  loginCallbackUrl: string;
}

/** Account chip (avatar disc + name + caret) with a Sign Out menu; a Sign In link when logged out. */
export default function AccountMenu({ loginCallbackUrl }: AccountMenuProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef, () => setOpen(false), open);

  if (!session?.user) {
    return (
      <a
        href={`/login?callbackUrl=${encodeURIComponent(loginCallbackUrl)}`}
        className="text-gold2 text-[12.5px] hover:text-ink transition-colors whitespace-nowrap"
      >
        Sign In
      </a>
    );
  }

  const name = session.user.name ?? "You";
  const initial = name.trim().charAt(0).toUpperCase() || "Y";

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap group"
      >
        <span className="w-[30px] h-[30px] rounded-full bg-goldsoft text-gold2 flex items-center justify-center font-semibold text-xs shadow-[0_0_0_1px_var(--line)]">
          {initial}
        </span>
        <span className="hidden sm:inline text-[12.5px] text-text group-hover:text-ink transition-colors">
          {name}
        </span>
        <svg
          className={`w-3.5 h-3.5 shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+10px)] right-0 bg-card border border-edge rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] z-[60] min-w-[11rem] overflow-hidden py-1">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-[13px] text-text hover:text-ink hover:bg-white/[0.03] transition-colors"
          >
            Profile
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-[13px] text-text hover:text-ink hover:bg-white/[0.03] transition-colors"
          >
            Account settings
          </Link>
          <div className="h-px bg-edge my-1" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="block w-full text-left px-4 py-2.5 text-[13px] text-muted hover:text-ink hover:bg-white/[0.03] transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
