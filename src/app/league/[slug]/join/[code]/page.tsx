"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AuthForm from "@/components/auth/AuthForm";

interface MemberSlot {
  id: number;
  display_name: string;
  user_id: string | null;
}

function FullScreenCenter({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      {children}
    </div>
  );
}

export default function JoinLeaguePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const code = params.code as string;
  const slug = params.slug as string;

  const [unclaimed, setUnclaimed] = useState<MemberSlot[] | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [showAuth, setShowAuth] = useState(false);

  // Load the league's unclaimed member slots so a returning player can
  // claim their name (and their past results) instead of joining as new.
  const loadMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/leagues/${slug}`);
      if (!res.ok) {
        setUnclaimed([]);
        return;
      }
      const data = await res.json();
      const members: MemberSlot[] = data.members || [];
      setUnclaimed(members.filter((m) => m.user_id === null));
    } catch {
      setUnclaimed([]);
    }
  }, [slug]);

  useEffect(() => {
    if (status === "authenticated" && unclaimed === null) {
      loadMembers();
    }
  }, [status, unclaimed, loadMembers]);

  const join = async (claimMemberId?: number) => {
    setJoining(true);
    setError("");
    try {
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code, claimMemberId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join league");
        setJoining(false);
        // The slot may have been claimed since the list loaded — refresh it.
        if (res.status === 409) loadMembers();
        return;
      }

      router.replace(`/league/${slug}`);
    } catch {
      setError("Failed to join league");
      setJoining(false);
    }
  };

  if (status === "loading" || joining || (status === "authenticated" && unclaimed === null)) {
    return (
      <FullScreenCenter>
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400 text-sm">{joining ? "Joining league..." : "Loading..."}</p>
        </div>
      </FullScreenCenter>
    );
  }

  if (!session) {
    return (
      <FullScreenCenter>
        <div className="bg-card rounded-lg border border-edge p-8 w-full max-w-sm mx-4">
          {showAuth ? (
            <AuthForm onSuccess={() => window.location.reload()} />
          ) : (
            <div className="text-center">
              <h2 className="text-white font-serif text-2xl font-bold mb-2">Join League</h2>
              <p className="text-gray-400 text-sm mb-6">Sign in or create an account to join this league.</p>
              <button
                onClick={() => setShowAuth(true)}
                className="w-full py-3 bg-brand text-black font-semibold text-sm rounded-lg hover:bg-brand-hover transition-colors cursor-pointer"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </FullScreenCenter>
    );
  }

  return (
    <FullScreenCenter>
      <div className="bg-card rounded-lg border border-edge p-8 w-full max-w-sm mx-4">
        <h2 className="text-white font-serif text-2xl font-bold mb-2 text-center">Join League</h2>

        {error && <p className="text-red-400 text-xs text-center mb-4">{error}</p>}

        {unclaimed && unclaimed.length > 0 ? (
          <>
            <p className="text-gray-400 text-sm mb-4 text-center">
              Are you one of these existing members? Claim your name to keep your past results.
            </p>
            <div className="space-y-2 mb-5 max-h-64 overflow-y-auto">
              {unclaimed.map((m) => (
                <button
                  key={m.id}
                  onClick={() => join(m.id)}
                  className="w-full px-4 py-2.5 bg-card-inset border border-edge rounded-lg text-gray-200 text-sm text-left hover:border-brand transition-colors cursor-pointer"
                >
                  {m.display_name}
                </button>
              ))}
            </div>
            <button
              onClick={() => join()}
              className="w-full py-3 bg-brand text-black font-semibold text-sm rounded-lg hover:bg-brand-hover transition-colors cursor-pointer"
            >
              No, I&apos;m new — join as {session.user?.name}
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-6 text-center">
              Join as <span className="text-white">{session.user?.name}</span>?
            </p>
            <button
              onClick={() => join()}
              className="w-full py-3 bg-brand text-black font-semibold text-sm rounded-lg hover:bg-brand-hover transition-colors cursor-pointer"
            >
              Join League
            </button>
          </>
        )}

        <div className="text-center mt-4">
          <Link href={`/league/${slug}`} className="text-gray-500 text-xs hover:text-white transition-colors">
            Cancel
          </Link>
        </div>
      </div>
    </FullScreenCenter>
  );
}
