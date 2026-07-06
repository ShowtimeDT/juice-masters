"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AuthForm from "@/components/auth/AuthForm";
import Logo from "@/components/ui/Logo";
import Headshot from "@/components/ui/Headshot";
import { leagueMonogram } from "@/components/leagues/leagueCrest";

interface MemberSlot {
  id: number;
  display_name: string;
  team_name: string | null;
  user_id: string | null;
  username?: string | null;
}

interface LeagueInfo {
  name: string;
  slug: string;
  is_private?: boolean;
  commissioner_id?: string | null;
}

/** The identity the joiner picked: a claimable slot, or brand-new. */
type Selection = MemberSlot | "new";

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {children}
    </div>
  );
}

function GlowCenter({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 pb-[70px] pt-5">
      <div
        className="pointer-events-none absolute left-1/2 top-[34%] h-[480px] w-[720px] -translate-x-1/2 -translate-y-1/2"
        style={{ background: "radial-gradient(ellipse, rgba(201,162,75,0.12), transparent 64%)" }}
      />
      <div className="relative w-full max-w-[460px]">{children}</div>
    </div>
  );
}

export default function JoinLeaguePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const code = params.code as string;
  const slug = params.slug as string;

  const [league, setLeague] = useState<LeagueInfo | null>(null);
  const [members, setMembers] = useState<MemberSlot[]>([]);
  const [unclaimed, setUnclaimed] = useState<MemberSlot[] | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [teamName, setTeamName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [showAuth, setShowAuth] = useState(false);

  const myId = session?.user?.id;

  // Load the league's unclaimed member slots so a returning player can
  // claim their name (and their past results) instead of joining as new.
  const loadMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/leagues/${slug}?code=${encodeURIComponent(code)}`);
      if (!res.ok) {
        setUnclaimed([]);
        return;
      }
      const data = await res.json();
      if (data.league) setLeague(data.league);
      const all: MemberSlot[] = data.members || [];

      // Already in this league on the signed-in account? Skip the whole
      // join/claim flow and go straight to their team — returning should be
      // seamless. (Leave `unclaimed` null so the loader stays during nav.)
      if (myId && all.some((m) => m.user_id === myId)) {
        router.replace(`/league/${slug}`);
        return;
      }

      setMembers(all);
      setUnclaimed(all.filter((m) => m.user_id === null));
    } catch {
      setUnclaimed([]);
    }
  }, [slug, code, myId, router]);

  useEffect(() => {
    if (status === "authenticated" && unclaimed === null) {
      (async () => {
        await loadMembers();
      })();
    }
  }, [status, unclaimed, loadMembers]);

  const choose = (sel: Selection) => {
    setSelection(sel);
    setError("");
    if (sel === "new") {
      setTeamName(`${session?.user?.name ?? "My"}'s Team`);
    } else {
      setTeamName(sel.team_name || sel.display_name);
    }
  };

  const join = async () => {
    if (!selection) return;
    setJoining(true);
    setError("");
    try {
      const claimMemberId = selection === "new" ? undefined : selection.id;
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code, claimMemberId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join league");
        setJoining(false);
        setSelection(null);
        // The slot may have been claimed since the list loaded — refresh it.
        if (res.status === 409) loadMembers();
        return;
      }

      // Save their chosen team name (best-effort; the default is fine).
      if (teamName.trim() && data.league?.id) {
        await fetch("/api/leagues/team-name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ league_id: data.league.id, team_name: teamName.trim() }),
        }).catch(() => {});
      }

      router.replace(`/league/${slug}`);
    } catch {
      setError("Failed to join league");
      setJoining(false);
    }
  };

  const topBar = (
    <div className="flex items-center justify-between px-[30px] py-[22px]">
      <Link href="/home" className="flex items-center gap-[11px] no-underline">
        <Logo size={34} />
        <b className="font-serif text-xl font-semibold text-ink">Juice Tour</b>
      </Link>
      {session?.user?.name && (
        <div className="flex items-center gap-2.5">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-goldsoft text-xs font-semibold text-gold2 shadow-[0_0_0_1px_var(--line)]">
            {(session.user.name[0] || "?").toUpperCase()}
          </span>
          <span className="text-[12.5px] text-text">{session.user.name}</span>
        </div>
      )}
    </div>
  );

  if (status === "loading" || joining || (status === "authenticated" && unclaimed === null)) {
    return (
      <PageShell>
        {topBar}
        <GlowCenter>
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            <p className="text-sm text-muted">{joining ? "Joining league…" : "Loading…"}</p>
          </div>
        </GlowCenter>
      </PageShell>
    );
  }

  if (!session) {
    return (
      <PageShell>
        {topBar}
        <GlowCenter>
          {showAuth ? (
            // callbackUrl brings Google sign-ins back to this join page;
            // email sign-ins reload in place via onSuccess.
            <div className="mb-[22px] flex flex-col items-center">
              <Logo size={64} className="mb-4" />
              <AuthForm
                callbackUrl={`/league/${slug}/join/${code}`}
                onSuccess={() => window.location.reload()}
              />
            </div>
          ) : (
            <div className="rounded-[20px] border border-edge bg-card p-8 text-center">
              <div className="mb-4 flex justify-center">
                <Logo size={56} />
              </div>
              <h1 className="m-0 font-serif text-[28px] font-medium text-ink">You&apos;ve been invited</h1>
              <p className="mx-auto mt-2 mb-6 max-w-[34ch] text-sm text-muted">
                Sign in or create an account to join this league.
              </p>
              <button
                onClick={() => setShowAuth(true)}
                className="btn-gold flex h-[54px] w-full cursor-pointer items-center justify-center rounded-[13px] text-base font-semibold transition-transform hover:-translate-y-px"
              >
                Continue
              </button>
            </div>
          )}
        </GlowCenter>
      </PageShell>
    );
  }

  const leagueName = league?.name || slug;
  const shortName = leagueName.split(/\s+/).slice(-1)[0] || leagueName;
  const commissioner = league?.commissioner_id
    ? members.find((m) => m.user_id === league.commissioner_id)
    : undefined;
  const stack = members.slice(0, 4);
  const overflow = Math.max(0, members.length - stack.length);
  const namedMembers = members
    .filter((m) => m.user_id)
    .slice(0, 3)
    .map((m) => m.display_name.split(/\s+/)[0]);

  return (
    <PageShell>
      {topBar}
      <GlowCenter>
        <div className="mb-[18px] text-center text-[11px] uppercase tracking-[3px] text-gold">
          You&apos;ve been invited
        </div>

        <div
          className="overflow-hidden rounded-[20px] border border-edge"
          style={{ background: "linear-gradient(180deg, rgba(201,162,75,0.06), transparent 50%), var(--surface)" }}
        >
          {/* Hero */}
          <div className="flex flex-col items-center border-b border-edge px-7 pb-6 pt-[30px] text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-goldsoft font-serif text-[27px] font-semibold text-gold2 shadow-[0_0_0_1px_var(--line)]">
              {leagueMonogram(leagueName)}
            </div>
            <h1 className="m-0 mt-4 font-serif text-[32px] font-medium leading-[1.1] text-ink">{leagueName}</h1>
            {commissioner && (
              <div className="mt-[7px] text-[13px] text-muted">Commissioner · {commissioner.display_name}</div>
            )}
            {league?.is_private && (
              <div className="mt-[13px] inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-[11px] py-[5px] text-[10.5px] uppercase tracking-[1.4px] text-gold2">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
                </svg>
                Private league
              </div>
            )}
          </div>

          {/* Stats — members is real; format/majors are fixed app facts */}
          <div className="grid grid-cols-3">
            {[
              { b: String(members.length), s: "Members" },
              // TODO(backend): league format not stored; app scores best-5.
              { b: "8×10", s: "Tiers · best 5" },
              { b: "4", s: "Majors" },
            ].map((st, i) => (
              <div key={st.s} className={`px-3.5 py-[18px] text-center ${i === 0 ? "" : "border-l border-line2"}`}>
                <b className="block font-serif text-[26px] font-medium leading-none text-gold tnum">{st.b}</b>
                <span className="mt-1.5 block text-[10.5px] uppercase tracking-[1.2px] text-muted">{st.s}</span>
              </div>
            ))}
          </div>

          {/* Member avatar stack */}
          {members.length > 0 && (
            <div className="flex items-center gap-2.5 border-t border-line2 px-6 py-[18px]">
              <div className="flex">
                {stack.map((m, i) => (
                  <span key={m.id} className={i === 0 ? "" : "-ml-2"}>
                    <span className="ring-2 ring-card rounded-full inline-flex">
                      <Headshot name={m.display_name} size={32} />
                    </span>
                  </span>
                ))}
                {overflow > 0 && (
                  <span className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface2 text-[11px] font-semibold text-gold2 ring-2 ring-card">
                    +{overflow}
                  </span>
                )}
              </div>
              {namedMembers.length > 0 && (
                <div className="text-[13px] text-muted">
                  <b className="font-medium text-ink">{namedMembers.join(", ")}</b>
                  {members.length > namedMembers.length
                    ? ` and ${members.length - namedMembers.length} other${members.length - namedMembers.length === 1 ? "" : "s"} are in`
                    : " are in"}
                </div>
              )}
            </div>
          )}

          {/* Action area — preserves the existing claim / team-name flow */}
          <div className="border-t border-line2 px-6 py-5">
            {error && <p className="mb-4 text-center text-xs text-rose">{error}</p>}

            {selection !== null ? (
              /* Step 2: name your team, then join */
              <>
                <p className="mb-1 text-center text-sm text-muted">
                  {selection === "new"
                    ? `Joining as ${session.user?.name}`
                    : `Claiming ${selection.display_name}`}
                </p>
                <p className="mb-4 text-center text-[10px] uppercase tracking-[1.6px] text-faint">
                  Name your team — you can change it any time
                </p>
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  maxLength={120}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && join()}
                  className="mb-4 h-[50px] w-full rounded-xl border border-edge bg-bg2 px-[15px] text-[15px] text-ink outline-none transition-colors focus:border-gold/50"
                />
                <button
                  onClick={join}
                  disabled={!teamName.trim()}
                  className="btn-gold flex h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-[13px] text-base font-semibold transition-transform hover:-translate-y-px disabled:opacity-50"
                >
                  Join the {shortName}
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelection(null)}
                  className="mt-3.5 block w-full cursor-pointer text-center text-[13px] text-muted transition-colors hover:text-gold2"
                >
                  ← Back
                </button>
              </>
            ) : unclaimed && unclaimed.length > 0 ? (
              /* Step 1: who are you? */
              <>
                <p className="mb-4 text-center text-sm text-muted">
                  Are you one of these existing members? Claim your name to keep your past results.
                </p>
                <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
                  {unclaimed.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => choose(m)}
                      className="w-full cursor-pointer rounded-xl border border-edge bg-bg2 px-4 py-2.5 text-left text-sm text-text transition-colors hover:border-gold/40"
                    >
                      {m.display_name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => choose("new")}
                  className="btn-gold flex h-[54px] w-full cursor-pointer items-center justify-center rounded-[13px] text-base font-semibold transition-transform hover:-translate-y-px"
                >
                  No, I&apos;m new — join as {session.user?.name}
                </button>
              </>
            ) : (
              <button
                onClick={() => choose("new")}
                className="btn-gold flex h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-[13px] text-base font-semibold transition-transform hover:-translate-y-px"
              >
                Join the {shortName}
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            <Link
              href={`/league/${slug}`}
              className="mt-3.5 block text-center text-[13px] text-muted no-underline transition-colors hover:text-gold2"
            >
              Not now
            </Link>
          </div>
        </div>

        <div className="mt-[18px] text-center text-xs text-faint">
          Joining as <b className="font-medium text-muted">{session.user?.name}</b>
        </div>
      </GlowCenter>
    </PageShell>
  );
}
