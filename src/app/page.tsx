"use client";

import { useSession } from "next-auth/react";
import LandingPage from "@/components/marketing/LandingPage";
import LeagueHome from "@/components/LeagueHome";

export default function Home() {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return <LandingPage />;
  }

  return <LeagueHome />;
}
