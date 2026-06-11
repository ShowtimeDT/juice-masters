import { TOURNAMENTS } from "@/lib/tournaments";

const MAJORS = TOURNAMENTS.filter((t) => t.id !== "season");

export default function MajorsStrip() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-14">
      <h2 className="text-white font-serif font-bold text-2xl sm:text-3xl text-center mb-10">
        All four majors, one league
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MAJORS.map((t) => (
          <div
            key={t.id}
            className="relative overflow-hidden rounded-lg border border-edge p-5 text-center"
            style={{
              backgroundImage: `linear-gradient(to bottom, ${t.theme.gradientFrom}, ${t.theme.gradientVia}, ${t.theme.gradientTo})`,
            }}
          >
            <h3 className="text-white font-serif font-bold text-base sm:text-lg uppercase tracking-wider">
              {t.shortName}
            </h3>
            <p className="text-xs mt-2 font-medium" style={{ color: t.theme.badgeText }}>
              {t.dates}
            </p>
            <p className="text-white/60 text-[11px] mt-1">{t.venue}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
