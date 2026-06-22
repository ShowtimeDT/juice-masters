import Link from "next/link";

/** Login destinations — every CTA on the marketing page routes through /login. */
export const LINKS = {
  signIn: "/login?callbackUrl=/",
  create: "/login?callbackUrl=/?create=1",
  join: "/login?callbackUrl=/?join=1",
};

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-[26px] py-[14px] text-[14px] font-medium tracking-[0.6px] transition-[transform,box-shadow,background] duration-150";

/** Gold gradient primary CTA. Lifts on hover. */
export function GoldButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`btn-gold ${BASE} shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_24px_rgba(201,162,75,0.18)] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_12px_30px_rgba(201,162,75,0.28)] ${className}`}
    >
      {children}
    </Link>
  );
}

/** Outlined gold "ghost" CTA. */
export function GhostButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${BASE} border border-gold/50 text-gold2 hover:border-gold hover:bg-goldsoft ${className}`}
    >
      {children}
    </Link>
  );
}
