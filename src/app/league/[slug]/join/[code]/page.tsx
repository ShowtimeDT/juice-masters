"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AuthForm from "@/components/auth/AuthForm";

export default function JoinLeaguePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const code = params.code as string;
  const slug = params.slug as string;

  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && !joining) {
      joinLeague();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const joinLeague = async () => {
    setJoining(true);
    try {
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join league");
        setJoining(false);
        return;
      }

      router.replace(`/league/${slug}`);
    } catch {
      setError("Failed to join league");
      setJoining(false);
    }
  };

  if (status === "loading" || joining) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400 text-sm">{joining ? "Joining league..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="bg-card rounded-lg border border-edge p-8 w-full max-w-sm mx-4">
          {showAuth ? (
            <AuthForm onSuccess={() => joinLeague()} />
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <a href={`/league/${slug}`} className="text-brand text-sm mt-4 inline-block hover:text-white">
            Go to league
          </a>
        </div>
      </div>
    );
  }

  return null;
}
