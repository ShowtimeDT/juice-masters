"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";

interface League {
  id: string;
  name: string;
  slug: string;
  is_commissioner: boolean;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetchLeagues();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const fetchLeagues = async () => {
    try {
      const res = await fetch("/api/leagues/my");
      if (res.ok) {
        const data = await res.json();
        setLeagues(data);

        // Auto-redirect if user is in exactly one league
        if (data.length === 1) {
          router.replace(`/league/${data[0].slug}`);
          return;
        }
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const createLeague = async () => {
    if (!newLeagueName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/leagues/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLeagueName }),
      });
      if (res.ok) {
        const league = await res.json();
        router.push(`/league/${league.slug}`);
      }
    } catch {
      // ignore
    }
    setCreating(false);
  };

  const joinLeague = async () => {
    if (!joinCode.trim()) return;
    setJoinError("");
    try {
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: joinCode.trim() }),
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-[#C8A951] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in — show landing with auth
  if (!session) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="w-full max-w-sm mx-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif font-bold text-white uppercase tracking-[0.18em]">
              Juice Tour
            </h1>
            <p className="text-gray-500 text-xs mt-2 uppercase tracking-[0.35em]">
              Pick &apos;Em Golf Majors League
            </p>
          </div>
          <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-8">
            <AuthForm callbackUrl="/" />
          </div>
        </div>
      </div>
    );
  }

  // Logged in — show league selection
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <header className="bg-[#111314] border-b border-[#2a2e2a] px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-white font-serif text-xl font-bold">Juice Tour</h1>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs">{session.user?.name}</span>
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
          <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-8 text-center">
            <p className="text-gray-400 text-sm mb-2">You&apos;re not in any leagues yet.</p>
            <p className="text-gray-500 text-xs">Create a league or join one with an invite code.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leagues.map((league) => (
              <a
                key={league.id}
                href={`/league/${league.slug}`}
                className="block bg-[#1e2124] rounded-lg border border-[#3a3e3a] hover:border-[#4a4e4a] transition-colors p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold text-sm">{league.name}</h3>
                  {league.is_commissioner && (
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-[#C8A951]/20 text-[#C8A951]">
                      Commissioner
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Join league */}
        <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-4">
          <h3 className="text-white font-semibold text-sm mb-3">Join a League</h3>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter invite code"
              className="flex-1 bg-[#111314] border border-[#3a3e3a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C8A951]"
              onKeyDown={(e) => e.key === "Enter" && joinLeague()}
            />
            <button
              onClick={joinLeague}
              className="px-4 py-2 bg-[#C8A951] text-black font-semibold text-sm rounded-lg hover:bg-[#d4b96a] transition-colors cursor-pointer"
            >
              Join
            </button>
          </div>
          {joinError && <p className="text-red-400 text-xs mt-2">{joinError}</p>}
        </div>

        {/* Create league */}
        {showCreate ? (
          <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-4">
            <h3 className="text-white font-semibold text-sm mb-3">Create a League</h3>
            <div className="flex gap-2">
              <input
                value={newLeagueName}
                onChange={(e) => setNewLeagueName(e.target.value)}
                placeholder="League name"
                className="flex-1 bg-[#111314] border border-[#3a3e3a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C8A951]"
                onKeyDown={(e) => e.key === "Enter" && createLeague()}
              />
              <button
                onClick={createLeague}
                disabled={creating}
                className="px-4 py-2 bg-[#C8A951] text-black font-semibold text-sm rounded-lg hover:bg-[#d4b96a] transition-colors cursor-pointer disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="text-gray-400 text-sm hover:text-[#C8A951] transition-colors cursor-pointer"
          >
            + Create a new league
          </button>
        )}
      </main>
    </div>
  );
}
