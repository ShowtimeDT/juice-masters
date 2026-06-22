"use client";

import Link from "next/link";

interface NotificationBellProps {
  /** Show the gold unread dot. */
  unread?: boolean;
}

/**
 * Notifications entry point in the top bar.
 * TODO(backend): notifications have no table/API yet — this links to a placeholder
 * screen. Wire `unread` to a real unread count once the backend exists.
 */
export default function NotificationBell({ unread = false }: NotificationBellProps) {
  return (
    <Link
      href="/notifications"
      aria-label="Notifications"
      className="relative flex items-center justify-center w-9 h-9 rounded-full border border-edge text-muted hover:text-gold hover:border-gold/50 transition-colors shrink-0"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <path
          d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {unread && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold ring-2 ring-bg2" />
      )}
    </Link>
  );
}
