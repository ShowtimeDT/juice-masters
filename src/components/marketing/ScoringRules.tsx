const RULES = [
  {
    figure: "5 of 8",
    title: "Counting scores",
    body: "Your team score is the sum of your five best golfers, relative to par. Three mulligans built in.",
  },
  {
    figure: "+10",
    title: "Missed-cut penalty",
    body: "A golfer who misses the cut takes ten extra strokes. Tier-one stars aren’t always safe.",
  },
  {
    figure: "1,456",
    title: "Birdie tiebreaker",
    body: "Everyone guesses the field’s total birdies. Closest guess wins any tie.",
  },
  {
    figure: "×4",
    title: "Season-long race",
    body: "Scores carry across the Masters, PGA, U.S. Open, and The Open.",
  },
];

export default function ScoringRules() {
  return (
    <section id="scoring" className="py-[104px]">
      <div className="mx-auto max-w-[1140px] px-6 sm:px-10">
        <div className="mx-auto max-w-[720px] text-center">
          <div className="eyebrow">Scoring, in plain English</div>
          <h2 className="mt-4 font-serif text-[clamp(34px,4.4vw,54px)] font-medium leading-[1.04] text-ink">
            The whole rulebook fits on one card.
          </h2>
        </div>

        <div className="mt-[54px] overflow-hidden rounded-[20px] border border-edge bg-[linear-gradient(180deg,rgba(201,162,75,0.05),transparent_30%),var(--surface)] shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
          <div className="border-b border-edge px-6 pb-6 pt-8 text-center">
            <div className="text-[11px] uppercase tracking-[3px] text-gold">
              Four Majors · Est. 2026
            </div>
            <div className="mt-1.5 font-serif text-[32px] text-ink">Juice Tour</div>
            <div className="mt-1 text-[11px] uppercase tracking-[2.5px] text-faint">
              Official Scorecard
            </div>
          </div>

          <div className="grid grid-cols-1 divide-y divide-edge sm:grid-cols-2 sm:divide-y-0">
            {RULES.map((r, i) => (
              <div
                key={r.title}
                className={`px-8 py-8 sm:px-9 ${i % 2 === 1 ? "sm:border-l sm:border-edge" : ""} ${i >= 2 ? "sm:border-t sm:border-edge" : ""}`}
              >
                <div className="font-serif text-[40px] leading-none text-gold">
                  {r.figure}
                </div>
                <h4 className="mt-[11px] font-serif text-[21px] font-medium leading-[1.04] text-ink">
                  {r.title}
                </h4>
                <p className="mt-[9px] text-[14px] leading-[1.6] text-muted">
                  {r.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
