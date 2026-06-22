"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

/** Login destinations — every CTA on the marketing page routes here. */
const SIGN_IN = "/login?callbackUrl=/";
const CREATE = "/login?callbackUrl=/?create=1";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "The app" },
  { href: "#scoring", label: "Scoring" },
  { href: "#majors", label: "The majors" },
];

/**
 * Fixed marketing nav — transparent over the hero, fades to a blurred solid
 * bg2 once the page scrolls. Brand mark uses the shared Dawn <Logo>.
 */
export default function Nav() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        solid
          ? "border-edge bg-bg2/80 backdrop-blur-md"
          : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-[1140px] items-center justify-between px-6 sm:px-10">
        <Link href="#top" className="flex items-center gap-3">
          <Logo size={34} />
          <b className="whitespace-nowrap font-serif text-[22px] font-semibold tracking-[0.3px] text-ink">
            Juice Tour
          </b>
        </Link>

        <nav className="hidden items-center gap-[34px] lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="whitespace-nowrap text-[13.5px] text-muted transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4 sm:gap-[22px]">
          <Link
            href={SIGN_IN}
            className="whitespace-nowrap text-[13.5px] font-medium text-ink"
          >
            Sign in
          </Link>
          <Link
            href={CREATE}
            className="btn-gold inline-flex items-center whitespace-nowrap rounded-full px-5 py-3 text-[14px] font-medium tracking-[0.6px] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_24px_rgba(201,162,75,0.18)] transition-transform hover:-translate-y-0.5"
          >
            Create a League
          </Link>
        </div>
      </div>
    </header>
  );
}
