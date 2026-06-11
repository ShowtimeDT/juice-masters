const STEPS = [
  {
    title: "Start a league",
    body: "Create a league in seconds and share one invite link with your group. Sign in with Google or email.",
  },
  {
    title: "The field becomes 8 tiers",
    body: "Before each major, the site pulls the real field and builds 8 tiers of 10 golfers from the odds. Your commissioner sets the pick deadline.",
  },
  {
    title: "Everyone drafts a team",
    body: "Pick one golfer from every tier — favorites are cheap to agree on, the sleepers win leagues. Picks stay hidden until they lock at tee-off.",
  },
  {
    title: "Sweat it live",
    body: "Standings update automatically all weekend, every major, plus a season-long leaderboard across all four.",
  },
];

export default function HowItWorks() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-14">
      <h2 className="text-white font-serif font-bold text-2xl sm:text-3xl text-center mb-10">
        How it works
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((step, i) => (
          <div key={step.title} className="bg-card rounded-lg border border-edge p-5">
            <span className="text-brand font-serif italic font-bold text-3xl">{i + 1}</span>
            <h3 className="text-white font-semibold text-sm mt-3 mb-2">{step.title}</h3>
            <p className="text-gray-400 text-xs leading-relaxed">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
