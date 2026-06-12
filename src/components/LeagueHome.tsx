"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface League {
  id: string;
  name: string;
  slug: string;
  is_commissioner: boolean;
}

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
    if (!joinCode.trim()) return;
    setJoinError("");
    try {
      const payload = joinPrivate
        ? { leagueRef: joinCode.trim(), password: joinPassword }
        : { inviteCode: joinCode.trim() };
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
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-card-inset border-b border-edge px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-white font-serif text-xl font-bold">Juice Tour</h1>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs">{session?.user?.name}</span>
            <button
              onClick={() => signOut()}
              className="text-gray-500 text-xs hover:text-white transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h2 className="text-white font-semibold text-lg">Your Leagues</h2>

        {leagues.length === 0 ? (
          <div className="bg-card rounded-lg border border-edge p-8 text-center">
            <p className="text-gray-400 text-sm mb-2">You&apos;re not in any leagues yet.</p>
            <p className="text-gray-500 text-xs">Create a league or join one with an invite code.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leagues.map((league) => (
              <a
                key={league.id}
                href={`/league/${league.slug}`}
                className="block bg-card rounded-lg border border-edge hover:border-edge-hover transition-colors p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold text-sm">{league.name}</h3>
                  {league.is_commissioner && (
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-brand/20 text-brand">
                      Commissioner
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Join league */}
        <div className="bg-card rounded-lg border border-edge p-4">
          <h3 className="text-white font-semibold text-sm mb-3">Join a League</h3>
          <div className="flex gap-2">
            <input
              ref={joinInputRef}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder={joinPrivate ? "League ID (from the league\u2019s URL)" : "Enter invite code"}
              className="flex-1 bg-card-inset border border-edge rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand"
              onKeyDown={(e) => e.key === "Enter" && joinLeague()}
            />
            <button
              onClick={joinLeague}
              className="px-4 py-2 bg-brand text-black font-semibold text-sm rounded-lg hover:bg-brand-hover transition-colors cursor-pointer"
            >
              Join
            </button>
          </div>
          {joinPrivate && (
            <input
              type="password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              placeholder="League password"
              maxLength={72}
              onKeyDown={(e) => e.key === "Enter" && joinLeague()}
              className="mt-2 w-full bg-card-inset border border-edge rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand"
            />
          )}
          <button
            onClick={() => setJoinPrivate(!joinPrivate)}
            className="mt-2 text-gray-500 text-xs hover:text-brand transition-colors cursor-pointer"
          >
            {joinPrivate
              ? "Have an invite code instead?"
              : "Joining a private league? Use the league ID and password"}
          </button>
          {joinError && <p className="text-red-400 text-xs mt-2">{joinError}</p>}
        </div>

        {/* Create league */}
        {showCreate ? (
          <div className="bg-card rounded-lg border border-edge p-4">
            <h3 className="text-white font-semibold text-sm mb-3">Create a League</h3>
            <div className="flex gap-2">
              <input
                value={newLeagueName}
                onChange={(e) => setNewLeagueName(e.target.value)}
                placeholder="League name"
                onKeyDown={(e) => e.key === "Enter" && createLeague()}
                className="flex-1 bg-card-inset border border-edge rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand"
              />
              <button
                onClick={createLeague}
                disabled={creating}
                className="px-4 py-2 bg-brand text-black font-semibold text-sm rounded-lg hover:bg-brand-hover transition-colors cursor-pointer disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              {[
                { value: false, label: "Public", hint: "Anyone with the link can view standings" },
                { value: true, label: "Private", hint: "Members only — needs a league password" },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setCreatePrivate(opt.value)}
                  className={`flex-1 px-3 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    createPrivate === opt.value
                      ? "border-brand bg-card-inset"
                      : "border-edge hover:border-edge-hover"
                  }`}
                >
                  <span className="block text-white text-xs font-semibold">{opt.label}</span>
                  <span className="block text-gray-500 text-[10px] mt-0.5">{opt.hint}</span>
                </button>
              ))}
            </div>
            {createPrivate && (
              <input
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="League password (members will use this to join)"
                maxLength={72}
                className="mt-2 w-full bg-card-inset border border-edge rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand"
              />
            )}
            {createError && <p className="text-red-400 text-xs mt-2">{createError}</p>}
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="text-gray-400 text-sm hover:text-brand transition-colors cursor-pointer"
          >
            + Create a new league
          </button>
        )}
      </main>
    </div>
  );
}
