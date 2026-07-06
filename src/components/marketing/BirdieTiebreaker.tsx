/** Live field birdie total for the teaser. */
const ACTUAL = 332;

const GUESSES = [
  { name: "Ari G", guess: 740 },
  { name: "JT’s Squad", guess: 823 },
  { name: "M Evans", guess: 900 },
  { name: "ShowtimeDT", guess: 967 },
  { name: "Brent W", guess: 1001 },
];

/**
 * Birdie-guess tiebreaker. Each bar fills to actualBirdies / guess (closest
 * guess = fullest bar). Rows sort by closeness; color mixes gold→rose by rank.
 */
export default function BirdieTiebreaker() {
  const rows = GUESSES.map((g) => ({ ...g, diff: g.guess - ACTUAL })).sort(
    (a, b) => a.diff - b.diff
  );
  const minD = rows[0].diff;
  const maxD = rows[rows.length - 1].diff;
  const span = maxD - minD || 1;

  return (
    <section className="pb-[104px] pt-0">
      <div className="mx-auto max-w-[1140px] px-6 sm:px-10">
        <div className="max-w-[720px]">
          <div className="eyebrow">The tiebreaker</div>
          <h2 className="mt-4 font-serif text-[clamp(34px,4.4vw,54px)] font-medium leading-[1.04] text-ink">
            Even the deadlock is a sweat.
          </h2>
        </div>

        <div className="mt-[50px] overflow-hidden rounded-[16px] border border-edge bg-card">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-edge px-[26px] pb-5 pt-6">
            <div>
              <div className="eyebrow">Tiebreaker</div>
              <h3 className="mt-[5px] font-serif text-[28px] text-ink">Total Birdies</h3>
              <p className="mt-2 max-w-[42ch] text-[13px] text-muted">
                Closest guess to the field’s birdie total wins any tie — the gap
                shrinks as the birdies roll in.
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[1.8px] text-faint">
                Actual · live
              </div>
              <div className="mt-[3px] font-serif text-[44px] leading-none text-gold tnum">
                {ACTUAL}
              </div>
            </div>
          </div>

          <div>
            {rows.map((b, i) => {
              const t = (b.diff - minD) / span;
              const width = Math.round((ACTUAL / b.guess) * 100);
              const color = `color-mix(in oklab, var(--gold2), var(--rose) ${Math.round(t * 100)}%)`;
              const win = i === 0;
              return (
                <div
                  key={b.name}
                  className={`grid h-12 grid-cols-[28px_minmax(0,1fr)_70px_120px_56px] items-center gap-3 border-t border-line2 px-[26px] sm:grid-cols-[28px_minmax(0,1fr)_70px_180px_64px] sm:gap-4 ${
                    win
                      ? "bg-[linear-gradient(90deg,rgba(201,162,75,0.09),transparent_70%)]"
                      : ""
                  }`}
                >
                  <span
                    className={`font-serif text-[14px] italic ${win ? "text-gold" : "text-faint"}`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex min-w-0 items-center gap-[9px] truncate text-[14px] font-medium text-ink">
                    {b.name}
                    {win && (
                      <span className="btn-gold rounded px-[7px] py-[3px] text-[8.5px] font-bold uppercase tracking-[1px]">
                        Closest
                      </span>
                    )}
                  </span>
                  <span className="text-right text-[15px] font-semibold text-ink tnum">
                    {b.guess.toLocaleString()}
                  </span>
                  <span className="h-1.5 rounded-[3px] bg-white/[0.06]">
                    <i
                      className="block h-full rounded-[3px]"
                      style={{ width: `${width}%`, background: color }}
                    />
                  </span>
                  <span
                    className={`text-right text-[13px] tnum ${win ? "text-gold2" : "text-muted"}`}
                  >
                    +{b.diff}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
