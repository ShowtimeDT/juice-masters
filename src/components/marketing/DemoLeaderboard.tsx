"use client";

import EntryRow from "@/components/EntryRow";
import TiebreakerPanel from "@/components/TiebreakerPanel";
import { DEMO_STANDINGS, DEMO_TOTAL_BIRDIES } from "@/lib/demo-data";
import { getTournament } from "@/lib/tournaments";

const accentColor = getTournament("season").theme.accent;

export default function DemoLeaderboard() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-14">
      <h2 className="text-white font-serif font-bold text-2xl sm:text-3xl text-center mb-2">
        This is what game day looks like
      </h2>
      <p className="text-gray-500 text-xs text-center uppercase tracking-wider mb-8">
        Live demo with sample teams — tap a row to see the full card
      </p>

      <div className="space-y-4">
        {DEMO_STANDINGS.map((standing) => (
          <EntryRow key={standing.entry.id} standing={standing} />
        ))}

        <div className="pt-2">
          <TiebreakerPanel
            standings={DEMO_STANDINGS}
            actualBirdies={DEMO_TOTAL_BIRDIES}
            accentColor={accentColor}
          />
        </div>
      </div>
    </section>
  );
}
