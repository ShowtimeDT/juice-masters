import Image from "next/image";
import Link from "next/link";
import { getTournament, withAlpha } from "@/lib/tournaments";

const theme = getTournament("season").theme;
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
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to bottom, ${theme.gradientFrom}, ${theme.gradientVia}, ${theme.gradientTo})`,
        }}
      />

      {/* Faint Masters-green glow behind the hero text for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(55% 60% at 50% 32%, ${withAlpha(mastersGreen, 0.22)}, transparent 70%)`,
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-16 text-center">
        <Image
          src="/logo-v3.png"
          alt="Juice Tour logo"
          width={130}
          height={150}
          className="mx-auto drop-shadow-lg w-[90px] h-[104px] sm:w-[130px] sm:h-[150px]"
          priority
        />
        <h1 className="mt-4 text-4xl sm:text-6xl font-serif font-bold text-white uppercase tracking-[0.18em]">
          Juice Tour
        </h1>
        <p className="mt-3 text-xs uppercase tracking-[0.1em] text-brand font-medium">
          Fantasy golf for the majors
        </p>
        <p className="mt-5 max-w-2xl mx-auto text-gray-400 text-sm sm:text-base">
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
