import { EntryStanding } from "@/lib/types";
import { formatScore } from "@/lib/format";

interface ChampionBannerProps {
  standing: EntryStanding;
}

/** Final-state banner crowning the winning team above the completed board. */
export default function ChampionBanner({ standing }: ChampionBannerProps) {
  const { entry, countingScore } = standing;
  return (
    <div className="relative flex items-center gap-5 sm:gap-[22px] flex-wrap rounded-[18px] border border-gold/40 px-6 sm:px-7 py-6 mb-[26px] overflow-hidden bg-[linear-gradient(120deg,rgba(201,162,75,0.16),rgba(201,162,75,0.04)_60%,transparent),var(--surface)]">
      <div className="w-14 h-14 rounded-[14px] btn-gold flex items-center justify-center shrink-0 shadow-[0_8px_20px_rgba(201,162,75,0.25)]">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M7 5H4.5v1.5A2.5 2.5 0 0 0 7 9M17 5h2.5v1.5A2.5 2.5 0 0 1 17 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 13v3M9 20h6M10 20l.5-4M14 20l-.5-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] tracking-[2.4px] uppercase text-gold">Champion</div>
        <div className="font-serif font-medium text-[26px] sm:text-[30px] text-ink leading-[1.05] mt-0.5 truncate">
          {entry.name}
        </div>
        {entry.owner !== entry.name && (
          <div className="text-[13px] text-muted mt-1">{entry.owner}</div>
        )}
      </div>

      <div className="text-right shrink-0">
        <b className="font-serif font-medium text-[40px] text-gold2 leading-none tnum">
          {formatScore(countingScore)}
        </b>
        <span className="block text-[10.5px] tracking-[1.4px] uppercase text-faint mt-0.5">
          Final
        </span>
      </div>
    </div>
  );
}
