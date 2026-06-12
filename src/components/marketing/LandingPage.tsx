import Link from "next/link";
import Hero from "./Hero";
import HowItWorks from "./HowItWorks";
import DemoLeaderboard from "./DemoLeaderboard";
import ScoringRules from "./ScoringRules";
import MajorsStrip from "./MajorsStrip";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Hero />
      <HowItWorks />
      <DemoLeaderboard />
      <ScoringRules />
      <MajorsStrip />

      {/* Final call to action */}
      <section className="max-w-5xl mx-auto px-4 pb-20 pt-4 text-center">
        <h2 className="text-white font-serif font-bold text-2xl sm:text-3xl mb-3">
          The next major is coming up
        </h2>
        <p className="text-gray-400 text-sm mb-8">
          Get your group in before the field locks.
        </p>
        <Link
          href="/login?callbackUrl=/?create=1"
          className="inline-block px-8 py-3.5 bg-brand text-black font-semibold text-sm rounded-lg hover:bg-brand-hover glow-brand"
        >
          Start Your League — Free
        </Link>
      </section>

      <footer className="text-center text-gray-600 text-xs py-6 border-t border-white/5">
        Juice Tour — Fantasy golf for the majors
      </footer>
    </div>
  );
}
