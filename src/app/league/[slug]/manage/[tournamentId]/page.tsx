"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TOURNAMENTS, TournamentConfig } from "@/lib/tournaments";
import { Draft, DraftGolfer } from "@/lib/draft/types";
import TierEditor from "@/components/admin/TierEditor";
import Logo from "@/components/ui/Logo";

const tournamentConfigs = TOURNAMENTS.filter((t) => t.id !== "season");

// Convert ISO string to datetime-local input format (YYYY-MM-DDTHH:MM)
function isoToLocalInput(isoStr: string): string {
  const d = new Date(isoStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Get default close time: 15 minutes before first tee, in local input format
function getDefaultCloseTime(firstTeeTime: string): string {
  const tee = new Date(firstTeeTime);
  const close = new Date(tee.getTime() - 15 * 60 * 1000);
  return isoToLocalInput(close.toISOString());
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, Math.trunc(v)));

// Status pill styling on the warm "Dawn" palette.
function statusPill(status: string): string {
  if (status === "open") return "border-sage/40 bg-sage/10 text-sage";
  if (status === "locked") return "border-blue/40 bg-blue/10 text-blue";
  if (status === "closed") return "border-gold/40 bg-goldsoft text-gold2";
  return "border-gold/45 bg-goldsoft text-gold2"; // pending
}

function statusLabel(status: string): string {
  if (status === "open") return "Live";
  if (status === "locked") return "Locked";
  if (status === "closed") return "Closed";
  return "Not started";
}

interface LeagueData {
  league: { id: string; name: string; slug: string; commissioner_id: string };
}

export default function TournamentSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const slug = params.slug as string;
  const tournamentId = params.tournamentId as string;

  const config = tournamentConfigs.find((t) => t.id === tournamentId) as TournamentConfig | undefined;

  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [golfers, setGolfers] = useState<DraftGolfer[]>([]);
  const [closeTimeLocal, setCloseTimeLocal] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [currentGolfers, setCurrentGolfers] = useState<{ name: string; espn_id: string; tier_number: number }[]>([]);

  // Format steppers.
  // numTiers genuinely drives the Review Tiers grid + golfer tier assignments, which
  // ARE persisted via the existing /golfers endpoint (each golfer carries a tier_number).
  const [numTiers, setNumTiers] = useState(8);
  // golfersPerTier + countingScores are front-end-only — see TODO(backend) below.
  const [golfersPerTier, setGolfersPerTier] = useState(10);
  const [countingScores, setCountingScores] = useState(5);

  const userId = session?.user?.id;

  const fetchData = useCallback(async () => {
    try {
      const leagueRes = await fetch(`/api/leagues/${slug}`);
      if (!leagueRes.ok) { setError("League not found"); setLoading(false); return; }
      const ld = await leagueRes.json();
      setLeagueData(ld);

      if (userId !== ld.league.commissioner_id) {
        setError("Only the commissioner can manage this league");
        setLoading(false);
        return;
      }

      // Find draft for this tournament in this league
      const draftsRes = await fetch("/api/draft/list");
      if (draftsRes.ok) {
        const allDrafts: Draft[] = await draftsRes.json();
        const d = allDrafts.find((dr) => dr.tournament_id === tournamentId && dr.league_id === ld.league.id);
        if (d) {
          setDraft(d);
          // Fetch full draft data for golfers
          const draftRes = await fetch(`/api/draft/${d.id}`);
          const draftData = await draftRes.json();
          const golfersData = draftData.golfers || [];
          setGolfers(golfersData);
          setCurrentGolfers(golfersData.map((g: DraftGolfer) => ({ name: g.name, espn_id: g.espn_id, tier_number: g.tier_number })));

          // Derive the actual tier count + typical tier size from the real field.
          const tierNums = (golfersData as DraftGolfer[]).map((g) => g.tier_number);
          if (tierNums.length > 0) {
            const maxTier = Math.max(...tierNums);
            setNumTiers(clamp(maxTier, 2, 12));
            setGolfersPerTier(clamp(Math.round(golfersData.length / maxTier), 4, 16));
          }

          // Set close time — default to 15 min before first tee
          // (config is derived from tournamentId, so look it up locally to
          // keep this callback's dependencies to plain primitives)
          const firstTeeTime = tournamentConfigs.find((t) => t.id === tournamentId)?.firstTeeTime;
          if (d.close_time) {
            setCloseTimeLocal(isoToLocalInput(d.close_time as string));
          } else if (firstTeeTime) {
            setCloseTimeLocal(getDefaultCloseTime(firstTeeTime));
          }
        }
      }
    } catch {
      setError("Failed to load data");
    }
    setLoading(false);
  }, [slug, userId, tournamentId]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      (async () => {
        await fetchData();
      })();
    } else if (authStatus === "unauthenticated") {
      router.replace(`/login?callbackUrl=/league/${slug}/manage`);
    }
  }, [authStatus, fetchData, router, slug]);

  const saveAll = async () => {
    if (!draft) return;
    setSaving(true);

    // Save tiers (golfer tier assignments — tier_number drives the draft board)
    if (currentGolfers.length > 0) {
      await fetch(`/api/draft/${draft.id}/golfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          golfers: currentGolfers.map((g) => ({ tier_number: g.tier_number, name: g.name, espn_id: g.espn_id })),
        }),
      });
    }

    // Save close time
    if (closeTimeLocal) {
      const closeTimeISO = new Date(closeTimeLocal).toISOString();
      await fetch(`/api/draft/${draft.id}/close-time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ close_time: closeTimeISO }),
      });
    }

    setSaving(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  // Keep a no-op for TierEditor's onSave (we save everything together)
  const saveTiers = async () => {};

  const startDraft = async () => {
    if (!draft) return;
    setSaving(true);

    await saveAll();

    // Set status to open (only if not already open)
    if (draft.status !== "open") {
      await fetch(`/api/draft/${draft.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "open" }),
      });
    }

    setSaving(false);
    router.push(`/league/${slug}/manage`);
  };

  const changeStatus = async (newStatus: string) => {
    if (!draft) return;
    await fetch(`/api/draft/${draft.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
  };

  if (loading || authStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <p className="text-[13px] text-rose">{error || "Tournament not found"}</p>
          <a href={`/league/${slug}/manage`} className="mt-4 inline-block text-[13px] text-gold2">Back</a>
        </div>
      </div>
    );
  }

  const fieldSize = golfers.length || numTiers * golfersPerTier;
  const startLabel = saving
    ? draft?.status === "pending"
      ? "Starting Draft…"
      : "Saving…"
    : draft?.status === "pending"
      ? "Save & Start Draft"
      : "Save All Changes";

  return (
    <div className="min-h-screen bg-surface">
      {/* Save toast */}
      {showSavedToast && (
        <div className="fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-medium text-[#16201a] shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
          Changes saved
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-edge bg-bg2/90 backdrop-blur-md">
        <div className="mx-auto flex h-[62px] max-w-[1100px] items-center gap-5 px-6">
          <Link href="/home" className="flex items-center gap-3 no-underline">
            <Logo size={38} />
            <b className="font-serif text-[21px] font-semibold text-ink">Juice Tour</b>
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {draft?.status === "open" && (
              <>
                <button
                  onClick={() => changeStatus("pending")}
                  className="px-3 py-1.5 text-xs text-muted transition-colors hover:text-gold2 cursor-pointer"
                >
                  Pause Draft
                </button>
                <button
                  onClick={() => changeStatus("locked")}
                  className="rounded-lg bg-blue/15 px-3 py-1.5 text-xs font-medium text-blue transition-colors hover:bg-blue/25 cursor-pointer"
                >
                  Lock Draft
                </button>
              </>
            )}
            {draft?.status === "locked" && (
              <button
                onClick={() => changeStatus("open")}
                className="px-3 py-1.5 text-xs text-muted transition-colors hover:text-gold2 cursor-pointer"
              >
                Reopen
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-6 pb-[130px]">
        {/* Page header */}
        <div className="pb-6 pt-9">
          <a
            href={`/league/${slug}/manage`}
            className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-gold2 cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Manage League
          </a>
          <div className="eyebrow">Commissioner · Draft Setup</div>
          <h1 className="mt-3 flex flex-wrap items-center gap-3.5 font-serif text-[clamp(34px,5vw,46px)] font-medium leading-none text-ink">
            {config.name} Settings
            {draft && (
              <span
                className={`-translate-y-1 rounded-md border px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] ${statusPill(draft.status)}`}
              >
                {statusLabel(draft.status)}
              </span>
            )}
          </h1>
          {leagueData && (
            <div className="mt-3 text-[13.5px] text-muted">
              {config.dateRange ? `${config.dateRange} · ` : ""}
              {config.venue ? `${config.venue} · ` : ""}
              {leagueData.league.name}
            </div>
          )}
        </div>

        {!draft && (
          <div className="rounded-2xl border border-edge bg-card p-8 text-center">
            <p className="text-[13px] text-muted">No draft has been created for this tournament yet.</p>
            <p className="mt-1 text-[12px] text-faint">Go back and tap &quot;Play This Tournament&quot; to get started.</p>
          </div>
        )}

        {draft && (
          <>
            {/* Draft Format */}
            <div className="rounded-[18px] border border-edge bg-card p-6">
              <h2 className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-ink">Draft Format</h2>
              <p className="mb-5 mt-1 text-[13px] leading-relaxed text-muted">
                Set how your league drafts. Members pick one golfer from every tier — their best counting scores make their team total.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Tiers — drives the Review Tiers grid + golfer tier assignments (persisted). */}
                <FormatStepper
                  label="Tiers"
                  desc="How many tiers golfers are split into. One pick per tier."
                  value={numTiers}
                  min={2}
                  max={12}
                  onChange={(v) => setNumTiers(clamp(v, 2, 12))}
                />

                {/* TODO(backend): golfers-per-tier is not persisted as a config; the field's
                    tier sizes come from however the golfers were populated. Front-end state only. */}
                <FormatStepper
                  label="Golfers per tier"
                  desc="How many golfers fill each tier for members to choose from."
                  value={golfersPerTier}
                  min={4}
                  max={16}
                  onChange={(v) => setGolfersPerTier(clamp(v, 4, 16))}
                />

                {/* TODO(backend): counting is not yet persisted/configurable; scoring uses a hardcoded best-5
                    (see COUNTING_GOLFERS in src/lib/scoring.ts). Rendered as functional front-end state only. */}
                <FormatStepper
                  label="Counting scores"
                  desc="How many of a team's picks count toward their score each round."
                  value={countingScores}
                  min={1}
                  max={numTiers}
                  onChange={(v) => setCountingScores(clamp(v, 1, numTiers))}
                />
              </div>

              {/* Live summary */}
              <div
                className="mt-5 flex flex-wrap items-center gap-3.5 rounded-[13px] border border-gold/25 p-4"
                style={{ background: "linear-gradient(180deg, rgba(201,162,75,0.06), transparent)" }}
              >
                <Logo size={34} arched={false} className="shrink-0" />
                <div className="text-[15px] leading-snug text-text">
                  <span className="font-serif text-[19px] font-medium text-ink">
                    {numTiers} tiers of {golfersPerTier} · best {Math.min(countingScores, numTiers)} of {numTiers} count
                  </span>
                  <br />A <b className="font-semibold text-gold2">{fieldSize}-golfer</b> field. Each member drafts{" "}
                  <b className="font-semibold text-gold2">{numTiers} golfers</b> — one per tier — and their{" "}
                  <b className="font-semibold text-gold2">{Math.min(countingScores, numTiers)} lowest</b> scores count each round.
                </div>
              </div>
            </div>

            {/* Draft Deadline */}
            <div className="mt-5 rounded-[18px] border border-edge bg-card p-6">
              <h2 className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-ink">Draft Deadline</h2>
              <p className="mb-5 mt-1 text-[13px] leading-relaxed text-muted">
                Picks lock at this time. Anyone who hasn&apos;t drafted is auto-assigned their tier favorites.
              </p>
              <div className="max-w-md">
                <span className="mb-2.5 block text-[11px] uppercase tracking-[0.14em] text-faint">
                  Draft closes (date &amp; time)
                </span>
                <div className="flex h-[50px] items-center gap-3 rounded-xl border border-edge bg-bg2 px-4">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <rect x="3" y="5" width="18" height="16" rx="2" stroke="#969D93" strokeWidth="1.7" />
                    <path d="M3 9h18M8 3v4M16 3v4" stroke="#969D93" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                  <input
                    type="datetime-local"
                    value={closeTimeLocal}
                    onChange={(e) => setCloseTimeLocal(e.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent font-sans text-[15px] text-ink outline-none"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
                {config.firstTeeTime && (
                  <p className="mt-3 text-[12.5px] text-faint">
                    First tee time:{" "}
                    <b className="font-medium text-sage">
                      {new Date(config.firstTeeTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </b>{" "}
                    · we recommend closing 15 minutes prior.
                  </p>
                )}
              </div>
            </div>

            {/* Review Tiers */}
            {golfers.length > 0 && (
              <div className="mt-8">
                <TierEditor
                  initialGolfers={golfers.map((g) => ({ name: g.name, espn_id: g.espn_id, tier_number: g.tier_number }))}
                  numTiers={numTiers}
                  onSave={saveTiers}
                  onGolfersChange={setCurrentGolfers}
                  hideTopSaveButton
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Sticky action bar */}
      {draft && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 px-6 pb-6 pt-8"
          style={{ background: "linear-gradient(180deg, transparent, var(--bg2) 38%)" }}
        >
          <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-2.5">
            <button
              onClick={draft.status === "pending" ? startDraft : saveAll}
              disabled={saving}
              className="btn-gold flex h-[58px] w-full max-w-[760px] items-center justify-center gap-2.5 rounded-[14px] text-[16px] font-semibold tracking-[0.01em] transition-transform hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 14px 36px rgba(201,162,75,0.22)" }}
            >
              {startLabel}
              {draft.status === "pending" && !saving && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            {draft.status === "pending" && (
              <div className="text-[12.5px] text-faint">
                This takes the draft live — everyone in the league can start making picks.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface FormatStepperProps {
  label: string;
  desc: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function FormatStepper({ label, desc, value, min, max, onChange }: FormatStepperProps) {
  return (
    <div className="rounded-[14px] border border-edge bg-bg2 p-[18px]">
      <div className="text-[11px] uppercase tracking-[0.14em] text-faint">{label}</div>
      <div className="mt-1 min-h-[32px] text-[12px] leading-snug text-muted">{desc}</div>
      <div className="mt-3 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`Decrease ${label.toLowerCase()}`}
          className="flex h-[42px] w-[38px] shrink-0 items-center justify-center rounded-[10px] border border-edge bg-surface2 text-xl leading-none text-gold2 transition-colors hover:border-gold/50 hover:bg-goldsoft disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!Number.isNaN(v)) onChange(v);
          }}
          className="h-[42px] min-w-0 flex-1 rounded-[10px] border border-edge bg-transparent text-center font-serif text-[26px] font-medium text-ink outline-none transition-colors focus:border-gold/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label={`Increase ${label.toLowerCase()}`}
          className="flex h-[42px] w-[38px] shrink-0 items-center justify-center rounded-[10px] border border-edge bg-surface2 text-xl leading-none text-gold2 transition-colors hover:border-gold/50 hover:bg-goldsoft disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
        >
          +
        </button>
      </div>
    </div>
  );
}
