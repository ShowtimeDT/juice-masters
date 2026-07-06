"use client";

import { TournamentConfig } from "@/lib/tournaments";
import { getTournamentState } from "@/lib/tournament-state";
import Logo from "@/components/ui/Logo";

interface TournamentPlaceholderProps {
  config: TournamentConfig;
}

/**
 * Empty state shown when a league has no draft for a major.
 * Upcoming → the "Field Pending" timeline (field announced the Sunday before play).
 * In-progress / completed → a short gold note (commissioner never set up a draft).
 */
export default function TournamentPlaceholder({ config }: TournamentPlaceholderProps) {
  const state = getTournamentState(config);

  if (state === "upcoming") {
    return (
      <main className="max-w-[620px] mx-auto px-6 pt-[74px] pb-[90px] text-center">
        <div className="relative inline-flex mb-[30px]">
          <span className="absolute -inset-3.5 rounded-full border border-dashed border-gold/30 animate-[spin_60s_linear_infinite] motion-reduce:animate-none" />
          <Logo size={76} arched={false} />
        </div>

        <h2 className="font-serif font-medium text-[32px] text-ink leading-snug">
          The field isn&apos;t set yet.
        </h2>
        <p className="text-base text-muted mt-4 mx-auto max-w-[46ch] leading-[1.62]">
          The <b className="text-gold2 font-medium">{config.shortName}</b> field is announced the{" "}
          <b className="text-gold2 font-medium">Sunday before the tournament</b>. Check back then to
          draft your team — standings appear once play begins.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-stretch mt-[42px] mx-auto max-w-[540px] border border-edge rounded-2xl bg-card overflow-hidden">
          <TimelineStage
            done
            kicker="Now"
            title="A month out"
            sub="Field not yet announced"
          />
          <TimelineStage
            kicker={config.fieldConfirmationDate || "Soon"}
            title="Field & draft open"
            sub="Build your team"
          />
          <TimelineStage kicker={config.dates} title="Tees off" sub="Standings go live" />
        </div>

        <p className="text-[12.5px] text-faint mt-4">
          Your commissioner opens the draft as soon as the field is set.
        </p>
      </main>
    );
  }

  const isLive = state === "in-progress";
  return (
    <main className="max-w-[620px] mx-auto px-6 pt-[74px] pb-[90px] text-center">
      <div className="inline-flex mb-7 opacity-90">
        <Logo size={64} arched={false} />
      </div>
      <h2 className="font-serif font-medium text-[28px] text-ink">
        {isLive ? "No draft for this major" : "This major has wrapped"}
      </h2>
      <p className="text-[15px] text-muted mt-3 mx-auto max-w-[44ch] leading-relaxed">
        {isLive
          ? `The ${config.shortName} is underway, but no draft was set up for your league. Ask your commissioner to set one up before the next major.`
          : `No draft was set up for your league for the ${config.shortName}.`}
      </p>
    </main>
  );
}

function TimelineStage({
  done = false,
  kicker,
  title,
  sub,
}: {
  done?: boolean;
  kicker: string;
  title: string;
  sub: string;
}) {
  return (
    <div
      className={`relative flex-1 px-5 py-6 border-t border-line2 first:border-t-0 sm:border-t-0 sm:border-l sm:border-l-line2 sm:first:border-l-0 ${
        done ? "bg-goldsoft" : ""
      }`}
    >
      <span
        className={`hidden sm:block absolute -top-px left-1/2 -translate-x-1/2 w-[7px] h-[7px] rounded-full ${
          done ? "bg-sage" : "bg-edge"
        }`}
      />
      <div className="text-[10.5px] tracking-[1.4px] uppercase text-faint">{kicker}</div>
      <div className={`font-serif font-medium text-[17px] mt-1.5 ${done ? "text-gold2" : "text-ink"}`}>
        {title}
      </div>
      <div className="text-[11.5px] text-muted mt-1">{sub}</div>
    </div>
  );
}
