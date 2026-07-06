import Logo from "@/components/ui/Logo";
import Link from "next/link";
import Nav from "./Nav";
import Hero from "./Hero";
import StatBand from "./StatBand";
import HowItWorks from "./HowItWorks";
import Features from "./Features";
import ScoringRules from "./ScoringRules";
import BirdieTiebreaker from "./BirdieTiebreaker";
import MajorsStrip from "./MajorsStrip";
import { GoldButton, GhostButton, LINKS } from "./buttons";

export default function LandingPage() {
  return (
    <div id="top" className="min-h-screen overflow-x-hidden bg-surface">
      <Nav />

      <main>
        <Hero />
        <StatBand />
        <HowItWorks />
        <Features />
        <ScoringRules />
        <BirdieTiebreaker />
        <MajorsStrip />

        {/* Final CTA */}
        <section className="relative overflow-hidden border-t border-edge px-6 py-[120px] text-center sm:px-10">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[760px] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(ellipse, rgba(201,162,75,0.12), transparent 64%)",
            }}
          />
          <div className="relative mx-auto max-w-[1140px]">
            <div className="eyebrow">The next major is coming up</div>
            <h2 className="mx-auto mt-[18px] max-w-[16ch] font-serif text-[clamp(38px,5vw,62px)] font-medium leading-[1.04] text-ink">
              Get your group in before the field locks.
            </h2>
            <p className="mx-auto mt-[18px] max-w-[36ch] text-[18px] text-muted">
              Start a league free, send one link, and you’ll be drafting by the
              weekend.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-[14px]">
              <GoldButton href={LINKS.create}>Start Your League — Free</GoldButton>
              <GhostButton href={LINKS.signIn}>Sign in</GhostButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-edge py-11">
        <div className="mx-auto flex max-w-[1140px] flex-wrap items-center justify-between gap-6 px-6 sm:px-10">
          <Link href="#top" className="flex items-center gap-3">
            <Logo size={34} />
            <b className="font-serif text-[22px] font-semibold tracking-[0.3px] text-ink">
              Juice Tour
            </b>
          </Link>
          <div className="flex gap-[26px]">
            <a href="#how" className="text-[13px] text-muted hover:text-ink">
              How it works
            </a>
            <a href="#scoring" className="text-[13px] text-muted hover:text-ink">
              Scoring
            </a>
            <a href="#majors" className="text-[13px] text-muted hover:text-ink">
              The majors
            </a>
            <Link href={LINKS.signIn} className="text-[13px] text-muted hover:text-ink">
              Sign in
            </Link>
          </div>
          <div className="text-[12.5px] text-faint">
            Fantasy golf for the majors · © 2026
          </div>
        </div>
      </footer>
    </div>
  );
}
