"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AppTabs from "@/components/AppTabs";
import LeagueSwitcher from "@/components/LeagueSwitcher";
import AccountMenu from "@/components/AccountMenu";
import NotificationBell from "@/components/ui/NotificationBell";
import Dashboard from "@/components/dashboard/Dashboard";

interface MyLeague {
  id: string;
  name: string;
  slug: string;
  is_commissioner: boolean;
}

/** The personal Dashboard — a home base that sits above any single league. */
export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [leagues, setLeagues] = useState<MyLeague[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/home");
  }, [status, router]);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/leagues/my")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (Array.isArray(d)) setLeagues(d);
      })
      .catch(() => {});
  }, [session?.user]);

  // The league the top-bar tabs/switcher point into: last visited, else the first.
  const lastSlug = typeof window !== "undefined" ? window.localStorage.getItem("lastLeagueSlug") : null;
  const primary = leagues.find((l) => l.slug === lastSlug) ?? leagues[0] ?? null;

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <AppTabs active="home" leagueSlug={primary?.slug}>
        {primary && (
          <LeagueSwitcher
            currentName={primary.name}
            currentSlug={primary.slug}
            leagues={leagues}
            manageHref={primary.is_commissioner ? `/league/${primary.slug}/manage` : null}
          />
        )}
        <NotificationBell />
        <AccountMenu loginCallbackUrl="/home" />
      </AppTabs>

      <Dashboard />
    </div>
  );
}
