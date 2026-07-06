const STEPS = [
  {
    no: "01",
    title: "Start a league",
    body: "Create a league in seconds and share one invite link. Sign in with Google or email.",
  },
  {
    no: "02",
    title: "The field becomes 8 tiers",
    body: "Before each major, we pull the real field and build eight tiers of ten from the odds.",
  },
  {
    no: "03",
    title: "Everyone drafts",
    body: "Pick one golfer from every tier. Favorites are cheap; the sleepers win leagues.",
  },
  {
    no: "04",
    title: "Sweat it live",
    body: "Standings update all weekend, every major, plus a season-long table across all four.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-[104px]">
      <div className="mx-auto max-w-[1140px] px-6 sm:px-10">
        <div className="max-w-[720px]">
          <div className="eyebrow">How it works</div>
          <h2 className="mt-4 font-serif text-[clamp(34px,4.4vw,54px)] font-medium leading-[1.04] text-ink">
            From group chat to the back nine in four steps.
          </h2>
        </div>

        <div className="mt-[54px] grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0">
          {STEPS.map((step, i) => (
            <div
              key={step.no}
              className={`px-0 sm:px-7 ${
                i === 0 ? "" : "sm:border-l sm:border-edge"
              } ${i === 0 ? "sm:pl-0" : ""} ${
                i === 2 ? "lg:border-l lg:border-edge sm:border-l-0" : ""
              }`}
            >
              <div className="font-serif text-[40px] italic leading-none text-gold">
                {step.no}
              </div>
              <h3 className="mt-4 font-serif text-[24px] font-medium leading-[1.04] text-ink">
                {step.title}
              </h3>
              <p className="mt-[11px] text-[14.5px] leading-[1.6] text-muted">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
