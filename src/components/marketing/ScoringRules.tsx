const RULES = [
  {
    title: "Best 5 of 8 count",
    body: "Your team score is the sum of your five best golfers, relative to par. Three mulligans built right in.",
    badge: "-38",
  },
  {
    title: "Miss the cut, pay the price",
    body: "A golfer who misses the cut takes a +10 penalty on top of their score. Tier-1 stars aren't always safe.",
    badge: "+10",
  },
  {
    title: "Birdie tiebreaker",
    body: "Everyone guesses the field's total birdies for the week. Closest guess wins any ties.",
    badge: "1,456",
  },
  {
    title: "A season-long race",
    body: "Scores carry across the Masters, PGA Championship, U.S. Open, and The Open for year-long standings.",
    badge: "×4",
  },
];

export default function ScoringRules() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-14">
      <h2 className="text-white font-serif font-bold text-2xl sm:text-3xl text-center mb-10">
        Scoring, in plain English
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {RULES.map((rule) => (
          <div key={rule.title} className="bg-card rounded-lg border border-edge p-5 flex gap-4">
            <span className="text-brand font-mono font-bold text-xl shrink-0 w-16 text-right">
              {rule.badge}
            </span>
            <div>
              <h3 className="text-white font-semibold text-sm mb-1.5">{rule.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{rule.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
