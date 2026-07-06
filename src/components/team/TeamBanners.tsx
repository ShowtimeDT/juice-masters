import { ReactNode } from "react";
import { formatScore } from "@/lib/format";
import Headshot from "@/components/ui/Headshot";
import type { TeamGolfer } from "./MyTeam";

/** Shared status-banner shell: icon tile + title/body + optional action. */
function Banner({
  tint,
  icon,
  title,
  body,
  action,
}: {
  /** Tailwind classes for the banner gradient/border + icon tile. */
  tint: { wrap: string; tile: string };
  icon: ReactNode;
  title: string;
  body: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={`flex items-center gap-[18px] rounded-2xl border px-6 py-5 ${tint.wrap}`}>
      <div className={`w-[46px] h-[46px] rounded-xl flex items-center justify-center shrink-0 ${tint.tile}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <b className="block font-serif font-medium text-[21px] text-ink leading-[1.1]">{title}</b>
        <span className="block text-[13px] text-muted">{body}</span>
      </div>
      {action}
    </div>
  );
}

/** Pre-tournament: roster is locked, scores go live when play begins. */
export function LockedBanner() {
  return (
    <Banner
      tint={{
        wrap: "border-sage/30 bg-[linear-gradient(180deg,rgba(156,203,134,0.07),transparent),var(--surface)]",
        tile: "bg-[rgba(156,203,134,0.14)] text-sage",
      }}
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      }
      title="Your picks are locked"
      body="Eight golfers in. Scores go live when play begins."
    />
  );
}

/** Field pending: the draft hasn't opened — eight empty tier slots await the field. */
export function FieldPendingBanner() {
  return (
    <Banner
      tint={{
        wrap: "border-blue/30 bg-[linear-gradient(180deg,rgba(127,168,201,0.06),transparent),var(--surface)]",
        tile: "bg-[rgba(127,168,201,0.14)] text-blue",
      }}
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      }
      title="Your team isn’t set yet"
      body="The field is announced the Sunday before the major. You’ll draft your eight golfers once it opens."
    />
  );
}

/** Final: the major is over — team total settled. */
export function FinalBanner({ total }: { total: number }) {
  return (
    <Banner
      tint={{
        wrap: "border-gold/30 bg-[linear-gradient(180deg,rgba(201,162,75,0.08),transparent),var(--surface)]",
        tile: "bg-[linear-gradient(180deg,var(--gold2),var(--gold))] text-[#1A1408]",
      }}
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path
            d="M7 5H4.5v1.5A2.5 2.5 0 0 0 7 9M17 5h2.5v1.5A2.5 2.5 0 0 1 17 9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path d="M12 13v3M9 20h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      }
      title="Your team is final"
      body={
        <>
          Your best five counted, closing at{" "}
          <span className={`font-mono ${total < 0 ? "text-sage" : total > 0 ? "text-rose" : "text-muted"}`}>
            {formatScore(total)}
          </span>
          .
        </>
      }
    />
  );
}

/** Pre-tournament roster row: locked golfer, "—" score, optional bench tag. */
export function LockedRow({ golfer, counting }: { golfer: TeamGolfer; counting: boolean }) {
  return (
    <div className={`flex items-center gap-3.5 px-[22px] py-[13px] border-t border-line2 first:border-t-0 relative ${counting ? "" : "opacity-50"}`}>
      {counting && <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-[2px] bg-gold" />}
      <span className={`font-serif italic text-[13px] w-[22px] shrink-0 ${counting ? "text-gold" : "text-faint"}`}>
        T{golfer.tier}
      </span>
      <Headshot name={golfer.name} espnId={golfer.score.espnId} size={34} />
      <span className="flex-1 min-w-0 font-medium text-[15px] text-ink truncate">{golfer.name}</span>
      {!counting && (
        <span className="text-[8px] tracking-[0.8px] uppercase text-faint border border-edge rounded px-1.5 py-0.5 shrink-0">
          Bench
        </span>
      )}
      <span className="font-semibold text-[16px] text-faint w-[34px] text-right shrink-0">—</span>
    </div>
  );
}

/** Field-pending placeholder row: an empty tier slot awaiting the field. */
export function EmptySlotRow({ tier }: { tier: number }) {
  return (
    <div className="flex items-center gap-3.5 px-[22px] py-[13px] border-t border-line2 first:border-t-0 opacity-60">
      <span className="font-serif italic text-[13px] w-[22px] shrink-0 text-gold">T{tier}</span>
      <span className="w-[34px] h-[34px] rounded-full border border-dashed border-edge flex items-center justify-center shrink-0 text-faint text-[13px] font-semibold">
        ?
      </span>
      <span className="flex-1 min-w-0 text-[15px] text-faint">Open slot — awaiting field</span>
      <span className="font-semibold text-[16px] text-faint w-[34px] text-right shrink-0">—</span>
    </div>
  );
}
