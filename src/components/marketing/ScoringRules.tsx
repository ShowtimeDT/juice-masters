const RULES = [
  {
    figure: "5 of 8",
    title: "Counting scores",
    body: "Your team score is the sum of your five best golfers, relative to par. Three mulligans built right in.",
  },
  {
    figure: "+10",
    title: "Missed cut penalty",
    body: "A golfer who misses the cut takes ten extra strokes. Tier-1 stars aren't always safe.",
  },
  {
    figure: "1,456",
    title: "Birdie tiebreaker",
    body: "Everyone guesses the field's total birdies for the week. Closest guess wins any ties.",
  },
  {
    figure: "×4",
    title: "Season-long race",
    body: "Scores carry across the Masters, PGA Championship, U.S. Open, and The Open.",
  },
];

/* Subtle paper grain, same noise technique as the hero */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

function DoubleRule() {
  return (
    <div className="space-y-[3px]">
      <div className="h-px bg-paper-line" />
      <div className="h-px bg-paper-line" />
    </div>
  );
}

export default function ScoringRules() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-14">
      <h2 className="text-white font-serif font-bold text-2xl sm:text-3xl text-center mb-10">
        Scoring, in plain English
      </h2>

      <div className="max-w-3xl mx-auto">
        <div className="relative bg-paper text-paper-ink rounded-sm shadow-2xl -rotate-1 hover:rotate-0 transition-transform duration-300 px-6 sm:px-10 py-8">
          {/* Paper grain */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none rounded-sm"
            style={{ backgroundImage: GRAIN }}
          />

          {/* Card header */}
          <div className="relative text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-paper-faint">
              Four Majors · Est. 2026
            </p>
            <h3 className="font-serif font-bold text-2xl sm:text-3xl uppercase tracking-wide mt-1">
              Juice Tour
            </h3>
            <p className="font-serif italic text-sm text-paper-faint mt-0.5 mb-5">
              Official Scorecard
            </p>
            <DoubleRule />
          </div>

          {/* Rules as scorecard line items */}
          <div className="relative">
            {RULES.map((rule, i) => (
              <div
                key={rule.title}
                className={`flex items-center gap-5 sm:gap-8 py-5 ${
                  i < RULES.length - 1 ? "border-b border-paper-line" : ""
                }`}
              >
                <div className="w-20 sm:w-24 shrink-0 text-center">
                  <span className="font-serif italic font-bold text-2xl sm:text-3xl whitespace-nowrap">
                    {rule.figure}
                  </span>
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] uppercase tracking-[0.18em] font-semibold">
                    {rule.title}
                  </h4>
                  <p className="text-sm text-paper-ink/80 mt-1">{rule.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Signature footer */}
          <div className="relative">
            <DoubleRule />
            <div className="flex items-end justify-between gap-4 pt-4">
              <p className="font-serif italic text-sm">
                Attest:{" "}
                <span className="inline-block w-28 sm:w-40 border-b border-paper-ink/60 align-baseline" />{" "}
                <span className="text-paper-faint">The Commissioner</span>
              </p>
              <p className="font-serif italic text-sm text-paper-faint shrink-0">Play well.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
