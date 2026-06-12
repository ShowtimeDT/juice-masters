import Image from "next/image";
import Link from "next/link";
import { getTournament, withAlpha } from "@/lib/tournaments";

const mastersGreen = getTournament("masters").theme.primary;

function CtaButton({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  const style = primary
    ? "bg-brand text-black hover:bg-brand-hover glow-brand"
    : "bg-white/10 text-white border border-white/20 hover:bg-white/20";
  return (
    <Link
      href={href}
      className={`px-6 py-3 font-semibold text-sm rounded-lg transition-colors ${style}`}
    >
      {children}
    </Link>
  );
}

export default function Hero() {
  return (
    <header className="relative overflow-hidden">
      {/* Course photograph */}
      <Image
        src="/hero-course.jpg"
        alt="Sunrise over a championship golf course"
        fill
        className="object-cover"
        priority
      />

      {/* Darken for text legibility, melting into the page background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,13,12,0.6) 0%, rgba(10,13,12,0.5) 45%, var(--color-surface) 100%)",
        }}
      />

      {/* Extra scrim focused behind the text column */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 70% at 50% 48%, rgba(10,13,12,0.45), transparent 75%)",
        }}
      />

      {/* Faint Masters-green tint for brand warmth */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(55% 60% at 50% 32%, ${withAlpha(mastersGreen, 0.12)}, transparent 70%)`,
        }}
      />

      {/* Film grain — masks upscaling softness on large screens */}
      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-20 sm:pt-20 sm:pb-24 text-center">
        <Image
          src="/logo-v3.png"
          alt="Juice Tour logo"
          width={130}
          height={150}
          className="mx-auto drop-shadow-lg w-[90px] h-[104px] sm:w-[130px] sm:h-[150px]"
          priority
        />
        <h1 className="mt-4 text-4xl sm:text-6xl font-serif font-bold text-white uppercase tracking-[0.18em] text-shadow-hero">
          Juice Tour
        </h1>
        <p className="mt-3 text-xs uppercase tracking-[0.1em] text-brand font-medium text-shadow-hero">
          Fantasy golf for the majors
        </p>
        <p className="mt-5 max-w-2xl mx-auto text-gray-200 text-sm sm:text-base text-shadow-hero">
          Draft a team of 8 pros with your friends before each major, then sweat
          every putt together. Live scoring all weekend, season-long bragging
          rights, zero spreadsheets.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <CtaButton href="/login?callbackUrl=/?create=1" primary>
            Create a League
          </CtaButton>
          <CtaButton href="/login?callbackUrl=/?join=1">Join a League</CtaButton>
          <Link
            href="/login?callbackUrl=/"
            className="px-4 py-3 text-gray-300 text-sm hover:text-white transition-colors"
          >
            Sign In →
          </Link>
        </div>
      </div>
    </header>
  );
}
