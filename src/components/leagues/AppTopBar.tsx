"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";

interface AppTopBarProps {
  /** The signed-in user's display name (shown next to the avatar). */
  userName?: string | null;
  /** Right-side action: sign-out handler, or a "Cancel" link target. */
  onSignOut?: () => void;
  cancelHref?: string;
  cancelLabel?: string;
  /** Max width of the inner bar — match the page's content width. */
  maxWidthClass?: string;
}

/** The "Dawn" app top bar: brand on the left, account / cancel on the right. */
export default function AppTopBar({
  userName,
  onSignOut,
  cancelHref,
  cancelLabel = "Cancel",
  maxWidthClass = "max-w-5xl",
}: AppTopBarProps) {
  const initial = (userName?.trim()?.[0] || "?").toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-bg2/90 backdrop-blur-md">
      <div className={`mx-auto flex h-[62px] items-center gap-5 px-7 ${maxWidthClass}`}>
        <Link href="/home" className="flex flex-none items-center gap-3 no-underline">
          <Logo size={38} />
          <b className="whitespace-nowrap font-serif text-[21px] font-semibold text-ink">
            Juice Tour
          </b>
        </Link>
        <div className="flex-1" />
        {onSignOut ? (
          <div className="flex flex-none items-center gap-2.5">
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-goldsoft text-xs font-semibold text-gold2 shadow-[0_0_0_1px_var(--line)]">
              {initial}
            </span>
            {userName && <span className="text-[12.5px] text-text">{userName}</span>}
            <button
              onClick={onSignOut}
              className="ml-1.5 cursor-pointer whitespace-nowrap text-[12.5px] text-muted transition-colors hover:text-gold2"
            >
              Sign out
            </button>
          </div>
        ) : cancelHref ? (
          <a
            href={cancelHref}
            className="flex-none whitespace-nowrap text-[13px] text-muted transition-colors hover:text-gold2"
          >
            {cancelLabel}
          </a>
        ) : null}
      </div>
    </header>
  );
}
