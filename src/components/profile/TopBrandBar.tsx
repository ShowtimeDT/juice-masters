"use client";

import Logo from "@/components/ui/Logo";

interface TopBrandBarProps {
  /** Initial for the gold monogram disc on the right (e.g. first letter of the user's name). */
  monogram?: string;
  /** Constrain the inner content to this max width (px) so it lines up with the page below. */
  maxWidth?: number;
}

/**
 * The simple top brand bar for top-level routes (Profile, Account Settings) that
 * live outside any league context — just the Logo + "Juice Tour" wordmark, plus
 * a small gold monogram disc. No league tabs / switcher (that's the AppShell).
 */
export default function TopBrandBar({ monogram, maxWidth = 1080 }: TopBrandBarProps) {
  return (
    <header className="sticky top-0 z-40 bg-bg2/90 backdrop-blur-md border-b border-edge">
      <div
        className="mx-auto flex h-[62px] items-center gap-7 px-7"
        style={{ maxWidth }}
      >
        <a href="/?home=1" className="flex items-center gap-3 shrink-0 no-underline">
          <Logo size={38} />
          <b className="font-serif text-[21px] font-semibold text-ink whitespace-nowrap">
            Juice Tour
          </b>
        </a>
        <div className="flex-1" />
        {monogram && (
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-goldsoft text-gold2 text-xs font-semibold shadow-[0_0_0_1px_var(--line)]">
            {monogram}
          </span>
        )}
      </div>
    </header>
  );
}
