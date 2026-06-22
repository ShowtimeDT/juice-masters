const STATS = [
  { big: "8", lbl: "Tiers drafted" },
  { big: "5/8", lbl: "Best scores count" },
  { big: "+10", lbl: "Missed-cut penalty" },
  { big: "×4", lbl: "Majors per season" },
];

/** Dark stat band beneath the hero — 8 tiers / 5-of-8 / +10 / ×4. */
export default function StatBand() {
  return (
    <section className="border-y border-edge bg-bg2">
      <div className="mx-auto max-w-[1140px] px-6 sm:px-10">
        <div className="grid grid-cols-2 divide-x divide-edge sm:grid-cols-4 sm:divide-x">
          {STATS.map((s) => (
            <div key={s.lbl} className="px-7 py-[38px]">
              <div className="font-serif text-[46px] text-gold">{s.big}</div>
              <div className="mt-1.5 text-[11.5px] uppercase tracking-[1.8px] text-muted">
                {s.lbl}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
