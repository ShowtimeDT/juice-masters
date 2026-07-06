"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TOURNAMENTS } from "@/lib/tournaments";
import { Draft } from "@/lib/draft/types";
import PrivacyCard from "@/components/manage/PrivacyCard";

interface LeagueMember {
  id: number;
  user_id: string | null;
  display_name: string;
  team_name: string | null;
  username: string | null;
}

interface LeagueData {
  league: { id: string; name: string; slug: string; commissioner_id: string; invite_code: string; is_private?: boolean };
  members: LeagueMember[];
}

const tournamentConfigs = TOURNAMENTS.filter((t) => t.id !== "season");

function canFetchField(firstTeeTime: string): boolean {
  if (!firstTeeTime) return false;
  const tee = new Date(firstTeeTime);
  const monday = new Date(tee);
  monday.setDate(monday.getDate() - 3);
  monday.setHours(0, 0, 0, 0);
  return new Date() >= monday;
}

/** First letters of the first two words, uppercased — the gold monogram. */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** The status pill shown next to a draft, styled per the design's color families. */
function StatusPill({ status }: { status: string }) {
  // Map the draft lifecycle onto the design's pill vocabulary.
  const live = status === "open";
  const cls: Record<string, string> = {
    pending: "text-gold2 border-gold/45",
    open: "text-sage border-sage/45",
    closed: "text-gold2 border-gold/45",
    locked: "text-blue border-blue/40",
    final: "text-blue border-blue/40",
    completed: "text-blue border-blue/40",
  };
  const style = cls[status] ?? "text-faint border-edge";
  return (
    <span
      className={`inline-flex items-center gap-[5px] rounded-[5px] border px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[1.3px] ${style}`}
    >
      {live && (
        <i className="h-[5px] w-[5px] rounded-full bg-sage shadow-[0_0_0_3px_rgba(156,203,134,0.2)]" />
      )}
      {status}
    </span>
  );
}

export default function ManageLeaguePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const slug = params.slug as string;

  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

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

      const draftsRes = await fetch("/api/draft/list");
      if (draftsRes.ok) {
        const allDrafts = await draftsRes.json();
        setDrafts(allDrafts.filter((d: Draft) => d.league_id === ld.league.id));
      }
    } catch {
      setError("Failed to load league");
    }
    setLoading(false);
  }, [slug, userId]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      (async () => {
        await fetchData();
      })();
    } else if (authStatus === "unauthenticated") {
      router.replace(`/login?callbackUrl=/league/${slug}/manage`);
    }
  }, [authStatus, fetchData, router, slug]);

  const unlinkMember = async (member: LeagueMember) => {
    if (!leagueData) return;
    if (!confirm(`Unlink ${member.display_name}? They'll need to claim their name again from the invite link.`)) {
      return;
    }
    try {
      const res = await fetch("/api/leagues/members/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ league_id: leagueData.league.id, member_id: member.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to unlink member");
        return;
      }
      fetchData();
    } catch {
      alert("Failed to unlink member");
    }
  };

  const removeMember = async (member: LeagueMember) => {
    if (!leagueData) return;
    if (
      !confirm(
        `Remove ${member.display_name} from the league? This erases their picks ` +
          `and scores from every major and can't be undone.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch("/api/leagues/members/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ league_id: leagueData.league.id, member_id: member.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to remove member");
        return;
      }
      fetchData();
    } catch {
      alert("Failed to remove member");
    }
  };

  const deleteLeague = async () => {
    if (!leagueData) return;
    const typed = prompt(
      `This permanently deletes "${leagueData.league.name}" — all drafts, picks, and standings. ` +
        `Type the league name to confirm:`
    );
    if (typed === null) return;
    if (typed.trim() !== leagueData.league.name) {
      alert("Name didn't match — nothing was deleted.");
      return;
    }
    try {
      const res = await fetch(`/api/leagues/${leagueData.league.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete league");
        return;
      }
      router.replace("/");
    } catch {
      alert("Failed to delete league");
    }
  };

  const fetchField = async (tournamentId: string) => {
    if (!leagueData) return;
    setFetching(tournamentId);
    try {
      const res = await fetch("/api/draft/auto-populate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournament_id: tournamentId, league_id: leagueData.league.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to fetch field");
      } else {
        // Navigate to the tournament settings page
        router.push(`/league/${slug}/manage/${tournamentId}`);
      }
    } catch {
      alert("Failed to fetch field");
    }
    setFetching(null);
  };

  const inviteLink =
    typeof window !== "undefined" && leagueData
      ? `${window.location.origin}/league/${slug}/join/${leagueData.league.invite_code}`
      : "";

  const copyInvite = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading || authStatus === "loading") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose text-sm">{error}</p>
          <a href={`/league/${slug}`} className="text-gold text-sm mt-4 inline-block">Back to league</a>
        </div>
      </div>
    );
  }

  if (!leagueData) return null;

  const memberCount = leagueData.members.length;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-[1040px] px-6 pb-[90px]">
        {/* HEADER */}
        <div className="pt-10 pb-7">
          <a
            href={`/league/${slug}`}
            className="mb-[22px] inline-flex items-center gap-[7px] text-[13px] text-muted transition-colors hover:text-gold2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to league
          </a>
          <div className="eyebrow">Commissioner Tools</div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <h1 className="m-0 flex items-center gap-4 whitespace-nowrap font-serif text-[46px] font-medium leading-none text-ink">
              {leagueData.league.name}
              <span className="inline-flex -translate-y-1.5 items-center gap-[7px] rounded-full border border-gold/45 bg-goldsoft px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[1.6px] text-gold2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 4h10v4a5 5 0 0 1-10 0V4ZM12 13v3M9 20h6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Commissioner
              </span>
            </h1>
          </div>
          <div className="mt-[13px] text-[13.5px] tracking-[0.3px] text-muted">
            {memberCount} member{memberCount !== 1 ? "s" : ""}
          </div>
        </div>

        {/* INVITE + PRIVACY */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.25fr_1fr]">
          {/* Invite & Share */}
          <div className="rounded-[18px] border border-edge bg-card px-[26px] pb-7 pt-[26px]">
            <h2 className="m-0 mb-1 font-sans text-xs font-semibold uppercase tracking-[2px] text-ink">
              Invite &amp; Share
            </h2>
            <p className="m-0 mb-5 text-[13px] leading-normal text-muted">
              Anyone with this link can join the league in one tap.
            </p>
            <div className="mb-[9px] text-[10.5px] uppercase tracking-[1.6px] text-faint">
              Invite link
            </div>
            <div className="flex items-stretch gap-2.5">
              <div className="flex h-[46px] min-w-0 flex-1 items-center rounded-[11px] border border-edge bg-bg2 px-3.5">
                <code className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[12.5px] text-gold2">
                  {inviteLink}
                </code>
              </div>
              <button
                onClick={copyInvite}
                className="inline-flex h-[46px] cursor-pointer items-center justify-center whitespace-nowrap rounded-[11px] px-[18px] text-[13px] font-medium text-[#1A1408] btn-gold transition-transform hover:-translate-y-px"
              >
                {copiedLink ? "Copied" : "Copy link"}
              </button>
            </div>
            <div className="mt-4 flex items-center gap-[9px] text-[13px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-sage" />
              <b className="font-semibold text-ink">{memberCount}</b>&nbsp;member
              {memberCount !== 1 ? "s" : ""} in the league
            </div>
          </div>

          {/* Privacy */}
          <PrivacyCard
            leagueId={leagueData.league.id}
            leagueSlug={leagueData.league.slug}
            onSaved={fetchData}
          />
        </div>

        {/* MEMBERS */}
        <div className="mt-5 rounded-[18px] border border-edge bg-card px-[26px] pb-7 pt-[26px]">
          <h2 className="m-0 mb-1 font-sans text-xs font-semibold uppercase tracking-[2px] text-ink">
            Members
          </h2>
          <p className="m-0 text-[13px] leading-normal text-muted">
            Unclaimed slots appear when someone joins via the link and can claim their name.{" "}
            <b className="text-text">Unlink</b> frees a slot to re-claim;{" "}
            <b className="text-text">Remove</b> deletes the member and erases their picks everywhere.
          </p>
          <div className="mt-5">
            {leagueData.members.map((member) => {
              const isCommish = member.user_id === leagueData.league.commissioner_id;
              const claimed = !!member.user_id;
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3.5 border-t border-line2 px-1 py-3.5 first:border-t-0"
                >
                  <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-goldsoft text-sm font-semibold text-gold2 shadow-[0_0_0_1px_var(--line)]">
                    {initials(member.display_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 text-[15px] font-medium leading-tight text-ink">
                      <span className="truncate">{member.display_name}</span>
                      {isCommish && (
                        <span className="shrink-0 rounded-[5px] border border-gold/45 px-[7px] py-0.5 text-[9px] font-semibold uppercase tracking-[1.4px] text-gold2">
                          Commissioner
                        </span>
                      )}
                    </div>
                    {claimed ? (
                      <div className="mt-[3px] font-mono text-[12.5px] text-sage">
                        Claimed{member.username ? ` · @${member.username}` : ""}
                      </div>
                    ) : (
                      <div className="mt-[3px] text-[12.5px] italic text-faint">Unclaimed</div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-[18px]">
                    {isCommish ? (
                      <span className="text-[13px] text-sage">This is you</span>
                    ) : (
                      <>
                        {member.user_id && (
                          <button
                            onClick={() => unlinkMember(member)}
                            className="cursor-pointer text-[13px] text-muted transition-colors hover:text-gold2"
                          >
                            Unlink
                          </button>
                        )}
                        <button
                          onClick={() => removeMember(member)}
                          className="cursor-pointer text-[13px] text-muted transition-colors hover:text-rose"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Open spot — illustrates how an unclaimed slot appears via the invite link. */}
            <div className="flex items-center gap-3.5 border-t border-line2 px-1 py-3.5">
              <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-dashed border-edge text-faint">
                +
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-medium leading-tight text-muted">Open spot</div>
                <div className="mt-[3px] text-[12.5px] italic text-faint">
                  Waiting to be claimed via invite link
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TOURNAMENTS */}
        <div className="mt-5 rounded-[18px] border border-edge bg-card px-[26px] pb-7 pt-[26px]">
          <h2 className="m-0 mb-1 font-sans text-xs font-semibold uppercase tracking-[2px] text-ink">
            Tournaments
          </h2>
          <p className="m-0 text-[13px] leading-normal text-muted">
            Four majors make a season. Lock a field, tweak settings, or open the next draft.
          </p>
          <div className="mt-[18px] flex flex-col gap-3">
            {tournamentConfigs.map((config, i) => {
              const draft = drafts.find((d) => d.tournament_id === config.id);
              const fieldAvailable = canFetchField(config.firstTeeTime);
              const hasDraft = !!draft;
              const live = draft?.status === "open";

              return (
                <div
                  key={config.id}
                  className={`flex flex-wrap items-center gap-[18px] rounded-[14px] border bg-bg2 px-5 py-4 ${
                    live ? "border-sage/30" : "border-edge"
                  }`}
                >
                  <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg border border-edge bg-card font-serif text-[15px] italic text-gold">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-[11px]">
                      <b className="whitespace-nowrap font-serif text-[21px] font-medium leading-none text-ink">
                        {config.name.replace(/\n/g, " ")}
                      </b>
                      {draft ? (
                        <StatusPill status={draft.status} />
                      ) : (
                        <span className="inline-flex items-center rounded-[5px] border border-edge px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[1.3px] text-faint">
                          {fieldAvailable ? "Needs setup" : "Field TBA"}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 text-[12.5px] text-muted">
                      {config.dates} · {config.venue}
                    </div>
                  </div>
                  <div className="shrink-0 max-md:order-3 max-md:basis-full">
                    {!hasDraft && !fieldAvailable && (
                      <span className="text-[12.5px] italic text-faint">
                        Field not available yet
                      </span>
                    )}
                    {!hasDraft && fieldAvailable && (
                      <button
                        onClick={() => fetchField(config.id)}
                        disabled={fetching === config.id}
                        className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-[10px] px-4 py-2.5 text-[13px] font-semibold text-[#1A1408] btn-gold transition-transform hover:-translate-y-px disabled:opacity-50"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M5 12h14M13 6l6 6-6 6"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {fetching === config.id ? "Setting Up…" : "Set Up Draft"}
                      </button>
                    )}
                    {hasDraft && (
                      <a
                        href={`/league/${slug}/manage/${config.id}`}
                        className="inline-flex items-center gap-2 whitespace-nowrap rounded-[10px] border border-edge bg-surface2 px-[15px] py-[9px] text-[13px] font-medium text-muted no-underline transition-colors hover:border-gold/50 hover:bg-goldsoft hover:text-gold2"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                          <path
                            d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                        Settings
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DANGER ZONE */}
        <div
          className="mt-[30px] flex flex-wrap items-center justify-between gap-6 rounded-[18px] border px-[26px] py-6"
          style={{
            borderColor: "rgba(217,140,106,0.32)",
            background:
              "linear-gradient(180deg, rgba(217,140,106,0.05), transparent), #141E18",
          }}
        >
          <div>
            <h3 className="m-0 mb-1.5 font-sans text-xs font-semibold uppercase tracking-[2px] text-rose">
              Danger Zone
            </h3>
            <p className="m-0 max-w-[62ch] text-[13px] leading-normal text-muted">
              Permanently delete this league, including all drafts, picks, and standings.
              This cannot be undone.
            </p>
          </div>
          <button
            onClick={deleteLeague}
            className="h-[46px] cursor-pointer whitespace-nowrap rounded-[11px] border border-rose/50 bg-transparent px-[18px] text-[13px] font-medium text-rose transition-colors hover:bg-rose/10"
          >
            Delete League
          </button>
        </div>
      </div>
    </div>
  );
}
