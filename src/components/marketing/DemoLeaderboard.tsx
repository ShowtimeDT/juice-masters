"use client";

import EntryRow from "@/components/EntryRow";
import TiebreakerPanel from "@/components/TiebreakerPanel";
import { DEMO_STANDINGS, DEMO_TOTAL_BIRDIES } from "@/lib/demo-data";
import { nameColumnWidthCh } from "@/lib/format";
import { getTournament } from "@/lib/tournaments";

const accentColor = getTournament("season").theme.accent;
const nameWidthCh = nameColumnWidthCh(DEMO_STANDINGS.map((s) => s.entry.name));

/** Which app-window framing to render — "panel" or "browser". */
const FRAME: "panel" | "browser" = "panel";

function LiveDot() {
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0">
      <span className="absolute inline-flex h-full w-full rounded-full bg-under opacity-60 animate-ping" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-under" />
    </span>
  );
}

function LiveStatus() {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <LiveDot />
      <span className="text-[11px] uppercase tracking-[0.15em] text-gray-300 font-medium whitespace-nowrap">
        Live · Final Round
      </span>
    </div>
  );
}

/* Frame A: app panel with a status bar */
function PanelChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-card-inset shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/10">
        <LiveStatus />
        <span className="text-[10px] uppercase tracking-[0.18em] text-faint truncate">
          The Sunday Game — League Standings
        </span>
      </div>
      {children}
    </div>
  );
}

/* Frame B: faux browser window */
function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-card-inset shadow-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-3 h-3 rounded-full bg-red-400/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <span className="w-3 h-3 rounded-full bg-green-400/70" />
        </div>
        <div className="flex-1 flex justify-center min-w-0">
          <span className="flex items-center gap-1.5 bg-surface rounded-md px-4 py-1 text-xs text-gray-500 font-mono truncate">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            juicemasters.vercel.app/league/the-sunday-game
          </span>
        </div>
        <div className="w-12 shrink-0" />
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-white/5">
        <LiveStatus />
        <span className="text-[10px] uppercase tracking-[0.18em] text-faint truncate">
          The Sunday Game — League Standings
        </span>
      </div>
      {children}
    </div>
  );
}

export default function DemoLeaderboard() {
  const Chrome = FRAME === "browser" ? BrowserChrome : PanelChrome;

  return (
    <section className="max-w-5xl mx-auto px-4 py-14">
      <h2 className="text-white font-serif font-bold text-2xl sm:text-3xl text-center mb-2">
        This is what game day looks like
      </h2>
      <p className="text-gray-500 text-xs text-center uppercase tracking-wider mb-8">
        Tap a row to see the full card
      </p>

      <Chrome>
        <div className="p-3 sm:p-5 space-y-4">
          {DEMO_STANDINGS.map((standing) => (
            <EntryRow key={standing.entry.id} standing={standing} nameWidthCh={nameWidthCh} />
          ))}

          <div className="pt-2">
            <TiebreakerPanel
              standings={DEMO_STANDINGS}
              actualBirdies={DEMO_TOTAL_BIRDIES}
              accentColor={accentColor}
            />
          </div>
        </div>
      </Chrome>
    </section>
  );
}
