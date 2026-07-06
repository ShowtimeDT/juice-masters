"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { DraftData } from "@/lib/draft/types";
import { TournamentConfig } from "@/lib/tournaments";
import TierCard from "./TierCard";

interface DraftPickViewProps {
  draftData: DraftData;
  config: TournamentConfig;
  onPicksSubmitted: () => void;
  leagueId?: string;
  isMember?: boolean;
}

function getDeadlineInfo(firstTeeTime: string): { deadlineStr: string; timeLeft: string | null; isPast: boolean } {
  if (!firstTeeTime) return { deadlineStr: "", timeLeft: null, isPast: false };

  const deadline = new Date(firstTeeTime);
  deadline.setMinutes(deadline.getMinutes() - 15);

  const now = new Date();
  const isPast = now >= deadline;

  const deadlineStr = deadline.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  if (isPast) return { deadlineStr, timeLeft: null, isPast: true };

  const diff = deadline.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let timeLeft = "";
  if (days > 0) timeLeft = `${days}d ${hours}h`;
  else if (hours > 0) timeLeft = `${hours}h ${minutes}m`;
  else timeLeft = `${minutes}m`;

  return { deadlineStr, timeLeft, isPast };
}

const lastName = (name: string) => name.split(" ").pop() || name;

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
    <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function DraftPickView({
  draftData,
  config,
  onPicksSubmitted,
}: DraftPickViewProps) {
  const { data: session } = useSession();
  const { draft, tiers, golfers, picks, members } = draftData;
  const pickCounts = draftData.pickCounts || [];

  const [selections, setSelections] = useState<Record<number, string>>({});
  const [tiebreaker, setTiebreaker] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const isOpen = draft.status === "open";
  const isClosed = draft.status === "closed" || draft.status === "locked";
  const deadlineInfo = getDeadlineInfo(config.firstTeeTime);

  const currentUserName = session?.user?.name || "";
  const isLoggedIn = !!session?.user;

  // Check if user is a draft member
  const isDraftMember = members.some(
    (m) => m.user_id === session?.user?.id || m.name === currentUserName
  );

  // Load existing picks for current user. This resets the form whenever the
  // saved picks or the signed-in user change — done by adjusting state during
  // render (https://react.dev/learn/you-might-not-need-an-effect) rather than
  // in an effect, so the form never paints with stale picks.
  const userId = session?.user?.id;
  const [prevPicksKey, setPrevPicksKey] = useState<{
    isLoggedIn: boolean;
    picks: typeof picks;
    userId: string | undefined;
    currentUserName: string;
  } | null>(null);

  if (
    prevPicksKey === null ||
    prevPicksKey.isLoggedIn !== isLoggedIn ||
    prevPicksKey.picks !== picks ||
    prevPicksKey.userId !== userId ||
    prevPicksKey.currentUserName !== currentUserName
  ) {
    setPrevPicksKey({ isLoggedIn, picks, userId, currentUserName });

    // Find picks belonging to current user (by user_id or owner name)
    const myPicks = isLoggedIn
      ? picks.filter((p) => p.user_id === userId || p.owner === currentUserName)
      : [];

    if (myPicks.length > 0) {
      const sel: Record<number, string> = {};
      for (const p of myPicks) {
        sel[p.tier_number] = p.golfer_name;
      }
      setSelections(sel);
      const tb = myPicks.find((p) => p.tiebreaker_guess != null)?.tiebreaker_guess;
      setTiebreaker(tb?.toString() || "");
      setSubmitted(true);
    } else {
      setSelections({});
      setTiebreaker("");
      setSubmitted(false);
    }
  }

  const handleSelect = (tierNumber: number, golferName: string) => {
    setSelections((prev) => ({
      ...prev,
      [tierNumber]: prev[tierNumber] === golferName ? "" : golferName,
    }));
    setSubmitted(false);
  };

  const stepBirdie = (delta: number) => {
    const base = parseInt(tiebreaker) || 1450;
    const next = Math.max(0, base + delta);
    setTiebreaker(String(next));
    setSubmitted(false);
  };

  const allTiersPicked = tiers.every((t) => selections[t.tier_number]);
  const canSubmit = isOpen && isLoggedIn && allTiersPicked && tiebreaker.trim() !== "";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");

    try {
      const picksPayload = tiers.map((t) => ({
        tier_number: t.tier_number,
        golfer_name: selections[t.tier_number],
      }));

      const res = await fetch(`/api/draft/${draft.id}/pick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Identity is derived server-side from the session.
        body: JSON.stringify({
          picks: picksPayload,
          tiebreaker_guess: parseInt(tiebreaker),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit picks");
      } else {
        setSubmitted(true);
        onPicksSubmitted();
      }
    } catch {
      setError("Failed to submit picks");
    }
    setSubmitting(false);
  };

  if (!isLoggedIn) return null;

  const pickedCount = pickCounts.length;
  const totalMembers = members.length;

  const numPicked = tiers.filter((t) => selections[t.tier_number]).length;
  const hasGuess = tiebreaker.trim() !== "";

  // Guiding button label: "Add 2 more picks + birdie guess" → "Add birdie guess" → "Lock in picks"
  const need: string[] = [];
  const remaining = tiers.length - numPicked;
  if (remaining > 0) need.push(`${remaining} more pick${remaining > 1 ? "s" : ""}`);
  if (!hasGuess) need.push("birdie guess");
  const lockLabel = submitting
    ? "Locking in…"
    : need.length > 0
      ? `Add ${need.join(" + ")}`
      : submitted
        ? "Update picks"
        : "Lock in picks";

  return (
    // Container-free: the host view (My Team) provides page width/padding.
    // pb leaves room for the fixed tray that sits at the bottom of the viewport.
    <div className="space-y-5 pb-28">
      {/* Event header */}
      {isDraftMember && (
        <div className="relative overflow-hidden px-4 pb-6 pt-2 text-center">
          <div
            className="pointer-events-none absolute left-1/2 top-[-30%] h-[260px] w-[520px] max-w-full -translate-x-1/2"
            style={{ background: "radial-gradient(ellipse, rgba(201,162,75,0.12), transparent 66%)" }}
          />
          <div className="relative eyebrow">
            {config.name} · {isOpen ? "Draft open" : isClosed ? "Draft closed" : "Draft"}
          </div>
          <h1 className="relative mt-2 font-serif text-[clamp(30px,6vw,46px)] font-medium leading-none text-ink">
            Build your team
          </h1>
          <p className="relative mt-2.5 text-[13.5px] text-muted">
            Pick one golfer from every tier ·{" "}
            <b className="font-medium text-gold2">
              {numPicked} of {tiers.length} picked
            </b>
          </p>

          {/* Progress dots */}
          <div className="relative mt-4 flex flex-wrap items-center justify-center gap-2">
            {tiers.map((t, i) => {
              const done = Boolean(selections[t.tier_number]);
              return (
                <span
                  key={t.tier_number}
                  className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border text-[10.5px] font-medium ${
                    done
                      ? "border-gold/50 bg-goldsoft text-gold2"
                      : "border-edge text-faint"
                  }`}
                >
                  {done ? <Check /> : i + 1}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Status banner (closed/locked) */}
      {isClosed && isDraftMember && (
        <div className="rounded-xl border border-edge bg-goldsoft px-4 py-3 text-center text-[13px] font-medium text-gold2">
          {draft.status === "locked"
            ? "Draft is locked — picks are final"
            : "Draft is closed — no more changes"}
        </div>
      )}

      {/* Identity strip */}
      {isDraftMember && (
        <div className="flex items-center justify-between rounded-xl border border-edge bg-card px-4 py-3">
          <div>
            <span className="eyebrow block">Picking as</span>
            <span className="mt-0.5 block font-serif text-lg font-medium text-ink">{currentUserName}</span>
          </div>
          <div className="flex items-center gap-2 text-right">
            {isOpen && (
              <span className="text-[11px] text-muted">
                {pickedCount} of {totalMembers} submitted · private until lock
              </span>
            )}
            {submitted && (
              <span className="rounded-md border border-gold/40 bg-goldsoft px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold2">
                Submitted
              </span>
            )}
          </div>
        </div>
      )}

      {!isDraftMember && (
        <div className="rounded-xl border border-edge bg-card p-6 text-center">
          <p className="text-[13px] text-muted">
            You are not a member of this draft. Contact the league commissioner to be added.
          </p>
        </div>
      )}

      {/* Tier grid + birdie + tray */}
      {isDraftMember && (
        <>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => {
              const tierGolfers = golfers.filter((g) => g.tier_number === tier.tier_number);
              return (
                <TierCard
                  key={tier.tier_number}
                  tierName={tier.name}
                  tierNumber={tier.tier_number}
                  golfers={tierGolfers}
                  selectedGolfer={selections[tier.tier_number] || null}
                  onSelect={(name) => handleSelect(tier.tier_number, name)}
                  disabled={isClosed}
                  theme={config.theme}
                />
              );
            })}
          </div>

          {/* Birdie tiebreaker — SANS-font stepper + input */}
          <div
            className="flex flex-wrap items-center gap-5 rounded-2xl border border-edge p-5"
            style={{
              background:
                "linear-gradient(180deg, rgba(201,162,75,0.05), transparent), var(--surface)",
            }}
          >
            <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-goldsoft text-gold2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="1.4" fill="currentColor" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <b className="block font-serif text-[21px] font-medium leading-tight text-ink">
                Birdie tiebreaker
              </b>
              <span className="text-[13px] text-muted">
                Guess the total birdies the whole field will make this week. Closest guess wins any tie.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => stepBirdie(-25)}
                disabled={isClosed}
                aria-label="Decrease guess"
                className="h-12 w-10 shrink-0 rounded-[11px] border border-edge bg-surface2 text-xl text-gold2 transition-colors hover:border-gold/50 disabled:opacity-40"
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                value={tiebreaker}
                onChange={(e) => {
                  setTiebreaker(e.target.value);
                  setSubmitted(false);
                }}
                placeholder="—"
                min={0}
                max={5000}
                disabled={isClosed}
                className={`h-12 w-[108px] rounded-[11px] border border-edge bg-bg2 text-center font-sans text-2xl font-semibold outline-none transition-colors focus:border-gold/50 disabled:opacity-50 ${
                  tiebreaker ? "text-ink" : "text-faint"
                } [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              />
              <button
                type="button"
                onClick={() => stepBirdie(25)}
                disabled={isClosed}
                aria-label="Increase guess"
                className="h-12 w-10 shrink-0 rounded-[11px] border border-edge bg-surface2 text-xl text-gold2 transition-colors hover:border-gold/50 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          {error && <p className="text-[13px] text-rose">{error}</p>}
        </>
      )}

      {/* Sticky bottom tray */}
      {isDraftMember && isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-edge bg-bg2/[0.92] shadow-[0_-16px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1180px] items-center gap-5 px-4 py-3.5 sm:px-7">
            {/* Per-tier filled slots */}
            <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
              {tiers.map((t) => {
                const sel = selections[t.tier_number];
                return (
                  <div
                    key={t.tier_number}
                    className={`min-w-[64px] flex-1 rounded-[10px] border px-2 py-1.5 text-center ${
                      sel ? "border-gold/35 bg-goldsoft" : "border-edge bg-card"
                    }`}
                  >
                    <div className="text-[8.5px] uppercase tracking-wider text-faint">
                      T{t.tier_number}
                    </div>
                    <div
                      className={`mt-0.5 truncate text-[12px] font-medium ${
                        sel ? "text-gold2" : "text-muted"
                      }`}
                    >
                      {sel ? lastName(sel) : "—"}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-4">
              {/* Draft closes countdown */}
              {deadlineInfo.timeLeft && (
                <div className="hidden text-right sm:block">
                  <div className="text-[9.5px] uppercase tracking-[0.14em] text-faint">
                    Draft closes in
                  </div>
                  <div className="font-mono text-[15px] tnum text-ink">{deadlineInfo.timeLeft}</div>
                </div>
              )}

              {/* Lock in picks — disabled until all tiers picked AND a guess entered */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="flex h-[50px] items-center gap-2 whitespace-nowrap rounded-xl px-6 font-sans text-[15px] font-semibold transition-transform hover:-translate-y-px disabled:translate-y-0 disabled:bg-surface2 disabled:text-muted disabled:shadow-none"
                style={
                  canSubmit && !submitting
                    ? {
                        background: "linear-gradient(180deg, var(--gold2), var(--gold))",
                        color: "#1A1408",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      }
                    : undefined
                }
              >
                {lockLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
