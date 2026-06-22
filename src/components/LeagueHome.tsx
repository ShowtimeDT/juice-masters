"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import PasswordInput from "@/components/ui/PasswordInput";
import AppTopBar from "@/components/leagues/AppTopBar";
import { leagueMonogram } from "@/components/leagues/leagueCrest";

interface League {
  id: string;
  name: string;
  slug: string;
  is_commissioner: boolean;
}

const INPUT_SHELL =
  "flex items-center h-[50px] flex-1 min-w-0 rounded-xl border border-edge bg-bg2 px-[15px] transition-colors focus-within:border-gold/50";
const FIELD = "flex-1 min-w-0 bg-transparent border-0 outline-none text-ink text-[15px] placeholder:text-faint";
const LBL = "mb-2 text-[10.5px] uppercase tracking-[1.6px] text-faint";
const GOLD_BTN =
  "btn-gold flex h-[50px] items-center justify-center rounded-xl px-[22px] text-sm font-semibold transition-transform hover:-translate-y-px disabled:opacity-50 cursor-pointer";

/** Logged-in home: the user's leagues plus join/create. */
export default function LeagueHome() {
  const { data: session } = useSession();
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinPrivate, setJoinPrivate] = useState(false);
  const [joinLeagueId, setJoinLeagueId] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [createPrivate, setCreatePrivate] = useState(false);
  const [createPassword, setCreatePassword] = useState("");
  const [createError, setCreateError] = useState("");
  const joinInputRef = useRef<HTMLInputElement>(null);

  // Landing-page CTAs route here after sign-in with ?create=1 / ?join=1.
  // (window.location avoids the useSearchParams Suspense requirement.)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "1") setShowCreate(true);
    if (params.get("join") === "1") joinInputRef.current?.focus();
  }, [loading]);

  // Members land in their league, not on this picker. Skipped when the
  // visit is intentional: ?home=1 (league switcher), ?create=1 / ?join=1
  // (landing CTAs), or when the user has no leagues yet.
  useEffect(() => {
    if (loading || leagues.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("home") === "1" || params.get("create") === "1" || params.get("join") === "1") {
      return;
    }
    let target = leagues[0].slug;
    try {
      const last = localStorage.getItem("lastLeagueSlug");
      if (last && leagues.some((l) => l.slug === last)) target = last;
    } catch {
      // private browsing — first league it is
    }
    router.replace(`/league/${target}`);
  }, [loading, leagues, router]);

  const fetchLeagues = async () => {
    try {
      const res = await fetch("/api/leagues/my");
      if (res.ok) {
        const data = await res.json();
        setLeagues(data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeagues();
  }, []);

  const createLeague = async () => {
    if (!newLeagueName.trim()) return;
    if (createPrivate && createPassword.length < 4) {
      setCreateError("Private leagues need a password (at least 4 characters)");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/leagues/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLeagueName,
          is_private: createPrivate,
          password: createPrivate ? createPassword : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/league/${data.slug}`);
      } else {
        setCreateError(data.error || "Failed to create league");
      }
    } catch {
      setCreateError("Failed to create league");
    }
    setCreating(false);
  };

  const joinLeague = async () => {
    const ref = joinPrivate ? joinLeagueId.trim() : joinCode.trim();
    if (!ref) return;
    setJoinError("");
    try {
      const payload = joinPrivate
        ? { leagueRef: ref, password: joinPassword }
        : { inviteCode: ref };
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.error || "Invalid invite code");
        return;
      }
      router.push(`/league/${data.league.slug}`);
    } catch {
      setJoinError("Failed to join league");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  const firstName = (session?.user?.name || "").split(" ")[0] || "there";

  /* ---- The join card (invite code + expandable private ID/password) ---- */
  const joinCard = (
    <div className="flex flex-col">
      <div className={LBL}>Invite code</div>
      <div className="flex items-stretch gap-2.5">
        <div className={INPUT_SHELL}>
          <input
            ref={joinInputRef}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter invite code"
            maxLength={24}
            onKeyDown={(e) => e.key === "Enter" && !joinPrivate && joinLeague()}
            className={`${FIELD} font-mono uppercase tracking-[1px] placeholder:font-sans placeholder:normal-case placeholder:tracking-normal`}
          />
        </div>
        <button onClick={joinLeague} className={GOLD_BTN}>
          Join
        </button>
      </div>

      <button
        onClick={() => setJoinPrivate((v) => !v)}
        className={`mt-3.5 inline-flex items-center gap-1.5 cursor-pointer text-[12.5px] transition-colors ${
          joinPrivate ? "text-gold2" : "text-muted hover:text-gold2"
        }`}
      >
        Joining a private league? Use league ID + password
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          className={`transition-transform ${joinPrivate ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Conditional render (display show/hide), not a fade */}
      {joinPrivate && (
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          <div>
            <div className={LBL}>League ID</div>
            <div className={INPUT_SHELL}>
              <input
                value={joinLeagueId}
                onChange={(e) => setJoinLeagueId(e.target.value)}
                placeholder="rva-dingos"
                onKeyDown={(e) => e.key === "Enter" && joinLeague()}
                className={FIELD}
              />
            </div>
          </div>
          <div>
            <div className={LBL}>Password</div>
            <PasswordInput value={joinPassword} onChange={setJoinPassword} placeholder="••••••" onEnter={joinLeague} />
          </div>
        </div>
      )}

      {joinError && <p className="mt-2.5 text-xs text-rose">{joinError}</p>}
      <div className="flex-1" />
    </div>
  );

  /* ---- The inline create flow (kept inline; no separate route) ---- */
  const createFlow = showCreate ? (
    <CreateLeaguePanel
      name={newLeagueName}
      setName={setNewLeagueName}
      isPrivate={createPrivate}
      setIsPrivate={setCreatePrivate}
      password={createPassword}
      setPassword={setCreatePassword}
      error={createError}
      creating={creating}
      onSubmit={createLeague}
      onCancel={() => setShowCreate(false)}
    />
  ) : null;

  return (
    <div className="min-h-screen bg-surface">
      <AppTopBar userName={session?.user?.name} onSignOut={() => signOut()} maxWidthClass="max-w-5xl" />

      {leagues.length === 0 ? (
        /* ============================ NO LEAGUE ============================ */
        <>
          <section className="relative overflow-hidden px-6 pb-[30px] pt-[70px] text-center">
            <div
              className="pointer-events-none absolute left-1/2 top-[-40px] h-[460px] w-[760px] -translate-x-1/2"
              style={{ background: "radial-gradient(ellipse, rgba(201,162,75,0.13), transparent 64%)" }}
            />
            <div className="relative mb-[22px] flex justify-center">
              <Logo size={78} />
            </div>
            <div className="eyebrow relative">Welcome, {firstName}</div>
            <h1 className="relative m-0 mt-3.5 font-serif text-[clamp(40px,5.6vw,60px)] font-medium leading-[1.04] text-ink">
              Let&apos;s get you in a <em className="italic text-gold2">league</em>.
            </h1>
            <p className="relative mx-auto mt-[18px] max-w-[48ch] text-[17px] leading-[1.6] text-text">
              Fantasy golf for the four majors. Join your friends with an invite code, or start your own league in
              about a minute.
            </p>
          </section>

          <div className="mx-auto max-w-[1000px] px-6 pb-[90px]">
            {showCreate ? (
              <div className="mt-12">{createFlow}</div>
            ) : (
              <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* JOIN */}
                <div className="flex flex-col rounded-[20px] border border-edge bg-card p-[30px] pb-8">
                  <div className="mb-[18px] flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-goldsoft text-gold2">
                    <JoinIcon />
                  </div>
                  <h2 className="m-0 font-serif text-[27px] font-medium text-ink">Join a League</h2>
                  <p className="mb-[22px] mt-2.5 text-sm leading-[1.55] text-muted">
                    Got an invite from a friend? Drop the code and you&apos;re in.
                  </p>
                  {joinCard}
                </div>

                {/* CREATE */}
                <div
                  className="flex flex-col rounded-[20px] border border-gold/30 p-[30px] pb-8"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(201,162,75,0.05), transparent 40%), var(--surface)",
                  }}
                >
                  <div className="mb-[18px] flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-goldsoft text-gold2">
                    <CreateIcon />
                  </div>
                  <h2 className="m-0 font-serif text-[27px] font-medium text-ink">Start your own</h2>
                  <p className="mb-[22px] mt-2.5 text-sm leading-[1.55] text-muted">
                    Be the commissioner. Name it, set the format, invite your friends.
                  </p>
                  <ul className="m-0 mb-6 flex list-none flex-col gap-[11px] p-0">
                    {[
                      "Custom tiers & scoring — your rules",
                      "One invite link for the whole crew",
                      "Runs all four majors, all season",
                    ].map((perk) => (
                      <li key={perk} className="flex items-start gap-[11px] text-sm leading-[1.4] text-text">
                        <span className="mt-px flex h-5 w-5 flex-none items-center justify-center rounded-full bg-goldsoft text-gold2">
                          <CheckIcon />
                        </span>
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <div className="flex-1" />
                  <button onClick={() => setShowCreate(true)} className={`${GOLD_BTN} w-full`}>
                    Create a League
                  </button>
                </div>
              </div>
            )}

            {/* HOW IT WORKS */}
            {!showCreate && (
              <div className="mt-10 grid grid-cols-1 gap-0 rounded-[18px] border border-edge bg-bg2 p-2 md:grid-cols-3">
                {[
                  { n: "01", b: "Draft 8 of the field", s: "Pick one golfer from every tier before the major tees off." },
                  { n: "02", b: "Best 5 scores count", s: "Your five lowest golfers make your team total each round." },
                  { n: "03", b: "Sweat all weekend", s: "Live standings, league chat, and a season-long race." },
                ].map((step, i) => (
                  <div
                    key={step.n}
                    className={`px-6 py-[22px] ${
                      i === 0 ? "" : "border-t border-line2 md:border-l md:border-t-0"
                    }`}
                  >
                    <div className="font-serif text-[26px] italic leading-none text-gold">{step.n}</div>
                    <b className="mt-2.5 block text-[15px] font-medium text-ink">{step.b}</b>
                    <span className="mt-[5px] block text-[13px] leading-[1.5] text-muted">{step.s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* =========================== LEAGUES HOME =========================== */
        <div className="mx-auto max-w-5xl px-7 pb-[90px]">
          <div className="pb-[26px] pt-11">
            <div className="eyebrow">Your home base</div>
            <h1 className="m-0 mt-3 font-serif text-[46px] font-medium leading-none text-ink max-[720px]:text-[36px]">
              Your Leagues
            </h1>
            <div className="mt-3 text-[13.5px] text-muted">
              {leagues.length} {leagues.length === 1 ? "league" : "leagues"}
              {leagues.some((l) => l.is_commissioner) &&
                ` · commissioner of ${leagues.filter((l) => l.is_commissioner).length}`}
            </div>
          </div>

          {/* League cards */}
          <div className="flex flex-col gap-3">
            {leagues.map((league) => (
              <a
                key={league.id}
                href={`/league/${league.slug}`}
                className="flex items-center gap-[18px] rounded-[15px] border border-edge bg-card px-[22px] py-[18px] no-underline transition-all hover:-translate-y-px hover:border-gold/40 max-[720px]:flex-wrap"
              >
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-goldsoft font-serif text-[19px] font-semibold text-gold2">
                  {leagueMonogram(league.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <b className="block font-serif text-[21px] font-medium leading-[1.15] text-ink">{league.name}</b>
                  {/* TODO(backend): live-major + member count not provided by /api/leagues/my */}
                </div>
                <span
                  className={`flex-none rounded-[5px] px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[1.4px] ${
                    league.is_commissioner
                      ? "border border-gold/45 text-gold2"
                      : "border border-edge text-muted"
                  }`}
                >
                  {league.is_commissioner ? "Commissioner" : "Member"}
                </span>
                {/* TODO(backend): "Your rank" not provided by /api/leagues/my — omitted */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-none text-faint">
                  <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ))}
          </div>

          {/* Join + Create */}
          {showCreate ? (
            <div className="mt-[30px]">{createFlow}</div>
          ) : (
            <div className="mt-[30px] grid grid-cols-1 gap-[18px] md:grid-cols-2">
              <div className="flex flex-col rounded-2xl border border-edge bg-card p-[26px]">
                <div className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-goldsoft text-gold2">
                  <JoinIcon />
                </div>
                <h3 className="m-0 mb-1.5 font-serif text-[23px] font-medium text-ink">Join a league</h3>
                <p className="m-0 mb-5 text-[13.5px] leading-[1.5] text-muted">
                  Got an invite code from a friend? Drop it in.
                </p>
                {joinCard}
              </div>

              <div
                className="flex flex-col rounded-2xl border border-gold/30 p-[26px]"
                style={{
                  background: "linear-gradient(180deg, rgba(201,162,75,0.05), transparent 45%), var(--surface)",
                }}
              >
                <div className="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-goldsoft text-gold2">
                  <CreateIcon />
                </div>
                <h3 className="m-0 mb-1.5 font-serif text-[23px] font-medium text-ink">Start your own</h3>
                <p className="m-0 mb-5 text-[13.5px] leading-[1.5] text-muted">
                  Be the commissioner. Name it, set the format, and invite your crew — all in one flow.
                </p>
                <div className="flex-1" />
                <button onClick={() => setShowCreate(true)} className={`${GOLD_BTN} w-full`}>
                  + Create a League
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================ Create wizard ============================ */

type FormatPreset = "classic" | "big" | "custom";

function CreateLeaguePanel({
  name,
  setName,
  isPrivate,
  setIsPrivate,
  password,
  setPassword,
  error,
  creating,
  onSubmit,
  onCancel,
}: {
  name: string;
  setName: (v: string) => void;
  isPrivate: boolean;
  setIsPrivate: (v: boolean) => void;
  password: string;
  setPassword: (v: string) => void;
  error: string;
  creating: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  // Format is FRONT-END ONLY — there is no backend column for it.
  // TODO(backend): league format not persisted; scoring uses hardcoded best-5.
  const [preset, setPreset] = useState<FormatPreset>("classic");
  const [tiers, setTiers] = useState(8);
  const [perTier, setPerTier] = useState(10);
  const [counting, setCounting] = useState(5);

  const steps = [
    { b: "Basics", s: "Name & privacy" },
    { b: "Format", s: "Tiers & scoring" },
    { b: "Invite", s: "Add your crew" },
  ];

  const renderStepper = (
    label: string,
    value: number,
    set: (n: number) => void,
    min: number,
    max: number,
  ) => (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-[1.2px] text-faint">{label}</div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => set(Math.max(min, value - 1))}
          className="h-10 w-[34px] flex-none cursor-pointer rounded-[9px] border border-edge bg-surface2 text-lg text-gold2 hover:border-gold/50"
        >
          −
        </button>
        <input
          value={value}
          readOnly
          className="h-10 min-w-0 flex-1 rounded-[9px] border border-edge bg-transparent text-center font-serif text-[22px] font-medium text-ink outline-none tnum"
        />
        <button
          onClick={() => set(Math.min(max, value + 1))}
          className="h-10 w-[34px] flex-none cursor-pointer rounded-[9px] border border-edge bg-surface2 text-lg text-gold2 hover:border-gold/50"
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-[18px] border border-edge bg-card md:grid-cols-[240px_1fr]">
      {/* Left rail */}
      <div className="border-b border-edge bg-bg2 px-[22px] py-[26px] md:border-b-0 md:border-r">
        <div className="flex gap-3.5 overflow-x-auto md:flex-col md:gap-0 md:overflow-visible">
          {steps.map((s, i) => {
            const state = i === step ? "on" : i < step ? "done" : "todo";
            return (
              <button
                key={s.b}
                onClick={() => setStep(i)}
                className="flex cursor-pointer items-start gap-[13px] py-1 text-left md:py-3.5"
              >
                <span
                  className={`flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-[13px] tnum ${
                    state === "on"
                      ? "btn-gold border-0 font-semibold"
                      : state === "done"
                        ? "border border-gold/50 bg-goldsoft text-gold2"
                        : "border border-edge text-muted"
                  }`}
                >
                  {state === "done" ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span>
                  <b
                    className={`block text-sm font-medium leading-[1.2] ${
                      state === "todo" ? "text-muted" : "text-ink"
                    }`}
                  >
                    {s.b}
                  </b>
                  <span className="text-[11.5px] text-faint">{s.s}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="px-9 py-[34px] max-[720px]:px-6">
        {/* STEP 1: BASICS */}
        {step === 0 && (
          <div>
            <h2 className="m-0 mb-1.5 font-serif text-[28px] font-medium text-ink">Name your league</h2>
            <p className="m-0 mb-6 text-[13.5px] leading-[1.5] text-muted">
              This is what your friends will see. You can change it anytime.
            </p>
            <div className={LBL}>League name</div>
            <div className={`${INPUT_SHELL} mb-6`}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="The Back Nine"
                onKeyDown={(e) => e.key === "Enter" && setStep(1)}
                className={FIELD}
              />
            </div>

            <div className={LBL}>Visibility</div>
            <div className="mb-[18px] flex gap-2.5">
              {[
                { v: false, b: "Public", s: "Anyone with the link can view standings" },
                { v: true, b: "Private", s: "Members only — needs a password to join by ID" },
              ].map((opt) => (
                <button
                  key={opt.b}
                  onClick={() => setIsPrivate(opt.v)}
                  className={`flex-1 cursor-pointer rounded-xl border px-4 py-[15px] text-left transition-colors ${
                    isPrivate === opt.v
                      ? "border-gold/50 bg-goldsoft"
                      : "border-edge bg-bg2 hover:border-gold/35"
                  }`}
                >
                  <b className={`block text-sm font-semibold ${isPrivate === opt.v ? "text-gold2" : "text-ink"}`}>
                    {opt.b}
                  </b>
                  <span className="text-xs text-muted">{opt.s}</span>
                </button>
              ))}
            </div>

            {isPrivate && (
              <div>
                <div className={LBL}>League password</div>
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder="Members use this to join"
                />
              </div>
            )}

            {error && <p className="mt-3 text-xs text-rose">{error}</p>}

            <div className="mt-7 flex items-center justify-between border-t border-line2 pt-[22px]">
              <button onClick={onCancel} className="cursor-pointer text-[13px] text-muted hover:text-gold2">
                Cancel
              </button>
              <button onClick={() => setStep(1)} className={GOLD_BTN}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FORMAT (front-end only) */}
        {step === 1 && (
          <div>
            <h2 className="m-0 mb-1.5 font-serif text-[28px] font-medium text-ink">Set your format</h2>
            <p className="m-0 mb-6 text-[13.5px] leading-[1.5] text-muted">
              Pick a preset to keep it simple, or go custom. You can still tweak this before the first draft.
            </p>
            {/* TODO(backend): league format not persisted; scoring uses hardcoded best-5. */}
            <div className="flex flex-wrap gap-3">
              {[
                { k: "classic" as const, b: "Classic", s: "8 tiers of 10 · best 5 of 8" },
                { k: "big" as const, b: "Big Field", s: "10 tiers of 8 · best 6 of 10" },
                { k: "custom" as const, b: "Custom", s: "Set it your way" },
              ].map((c) => (
                <button
                  key={c.k}
                  onClick={() => {
                    setPreset(c.k);
                    if (c.k === "classic") {
                      setTiers(8);
                      setPerTier(10);
                      setCounting(5);
                    } else if (c.k === "big") {
                      setTiers(10);
                      setPerTier(8);
                      setCounting(6);
                    }
                  }}
                  className={`min-w-[160px] flex-1 cursor-pointer rounded-[13px] border px-[18px] py-4 text-left transition-colors ${
                    preset === c.k ? "border-gold/55 bg-goldsoft" : "border-edge bg-bg2 hover:border-gold/35"
                  }`}
                >
                  <b className={`block font-serif text-[19px] font-medium ${preset === c.k ? "text-gold2" : "text-ink"}`}>
                    {c.b}
                  </b>
                  <span className="text-xs text-muted">{c.s}</span>
                </button>
              ))}
            </div>

            {preset === "custom" && (
              <div className="mt-[18px] grid grid-cols-1 gap-3.5 border-t border-line2 pt-[18px] md:grid-cols-3">
                {renderStepper("Tiers", tiers, setTiers, 2, 12)}
                {renderStepper("Golfers / tier", perTier, setPerTier, 4, 16)}
                {renderStepper("Counting", counting, setCounting, 1, 8)}
              </div>
            )}

            <div className="mt-7 flex items-center justify-between border-t border-line2 pt-[22px]">
              <button onClick={() => setStep(0)} className="cursor-pointer text-[13px] text-muted hover:text-gold2">
                ← Back
              </button>
              <button onClick={() => setStep(2)} className={GOLD_BTN}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: INVITE */}
        {step === 2 && (
          <div>
            <h2 className="m-0 mb-1.5 font-serif text-[28px] font-medium text-ink">Invite your crew</h2>
            <p className="m-0 mb-6 text-[13.5px] leading-[1.5] text-muted">
              Your invite link is created with the league. Share it once you&apos;re in, or add friends from the
              Manage League page.
            </p>
            {/* TODO(backend): invite link + add-by-email are generated after the league
                exists (create endpoint returns the slug/invite_code); shown here as guidance. */}
            <div className="mb-[22px] flex items-center gap-2.5 rounded-xl border border-dashed border-gold/40 bg-bg2 px-4 py-[13px]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-none">
                <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" stroke="#E2C079" strokeWidth="1.7" strokeLinecap="round" />
                <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" stroke="#E2C079" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <code className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[12.5px] text-gold2">
                A shareable invite link is created with your league
              </code>
            </div>

            {error && <p className="mb-3 text-xs text-rose">{error}</p>}

            <div className="mt-7 flex items-center justify-between border-t border-line2 pt-[22px]">
              <button onClick={() => setStep(1)} className="cursor-pointer text-[13px] text-muted hover:text-gold2">
                ← Back
              </button>
              <button onClick={onSubmit} disabled={creating} className={GOLD_BTN}>
                {creating ? "Creating…" : "Create league →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- icons ---- */
function JoinIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CreateIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7 5H4.5v1.5A2.5 2.5 0 0 0 7 9M17 5h2.5v1.5A2.5 2.5 0 0 1 17 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 13v3M9 20h6M10 20l.5-4M14 20l-.5-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
