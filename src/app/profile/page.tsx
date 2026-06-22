"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import TopBrandBar from "@/components/profile/TopBrandBar";
import { TOURNAMENTS } from "@/lib/tournaments";

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

const majors = TOURNAMENTS.filter((t) => t.id !== "season");
const monthOf = (dates: string) => dates.slice(0, 3);

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    document.title = "Profile · Juice Tour";
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/profile");
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const name = session?.user?.name ?? "Your profile";
  const mono = session?.user?.name ? initials(session.user.name) : "?";

  // TODO(backend): there's no account-level `username` in the session/JWT and no
  // /api/me endpoint to read it. Show the display name; leave the handle blank
  // rather than inventing one. Account Settings notes the same gap.
  const handle = "";

  return (
    <div className="min-h-screen bg-surface">
      <TopBrandBar monogram={mono} monogramVariant="gold" />

      <div className="mx-auto max-w-[1080px] px-7 pb-[90px]">
        {/* HERO */}
        <div className="relative flex items-center gap-6 overflow-hidden pt-11 pb-[30px] flex-wrap">
          <div
            className="pointer-events-none absolute -left-10 -top-10 h-[300px] w-[420px]"
            style={{
              background:
                "radial-gradient(ellipse, rgba(201,162,75,0.12), transparent 66%)",
            }}
          />
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full font-serif text-[40px] font-semibold text-[#1A1408] shadow-[0_0_0_1px_var(--line),0_14px_30px_rgba(201,162,75,0.15)] btn-gold">
            {mono}
          </div>
          <div className="relative min-w-0 flex-1">
            <h1 className="m-0 flex items-center gap-3 font-serif text-[42px] font-medium leading-none text-ink">
              {name}
            </h1>
            {handle ? (
              <div className="mt-2 font-mono text-[13px] text-gold2">@{handle}</div>
            ) : null}
            <div className="mt-1.5 text-[12.5px] text-muted">
              Drafting majors on the Juice Tour
            </div>
          </div>
        </div>

        {/* SEASON STATS */}
        {/* TODO(backend): no account-level season-stats endpoint/hook is available
            here. Render the real layout with graceful "—" placeholders rather than
            inventing API calls. */}
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <Stat value="—" label="Majors played" detail="2026 season" />
          <Stat value="—" label="Best finish" detail="Across your leagues" />
          <Stat value="—" label="Season rank" detail="All majors" />
          <Stat value="—" label="Top-3 finishes" detail="Across all leagues" />
        </div>

        {/* SEASON MAJORS STRIP */}
        <div className="mt-[34px]">
          <div className="mx-1 mb-3.5 flex items-baseline justify-between">
            <h2 className="m-0 font-sans text-xs font-semibold uppercase tracking-[2px] text-ink">
              2026 Season
            </h2>
          </div>
          {/* TODO(backend): per-major results (finish position / live / draft state)
              need an account-scoped season feed that doesn't exist yet. The four
              majors render with neutral "—" states. */}
          <div className="overflow-hidden rounded-2xl border border-edge bg-card">
            {majors.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-4 border-t border-line2 px-[22px] py-4 first:border-t-0"
              >
                <span className="w-[34px] shrink-0 font-serif text-sm italic text-gold">
                  {monthOf(m.dates)}
                </span>
                <div className="min-w-0 flex-1">
                  <b className="block font-serif text-[19px] font-medium leading-[1.15] text-ink">
                    {m.shortName}
                  </b>
                  <span className="text-xs text-faint">{m.venue}</span>
                </div>
                <span className="shrink-0 font-sans text-[13px] italic text-faint">
                  —
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ACCOUNT */}
        <div className="mt-[34px]">
          <div className="mx-1 mb-3.5 flex items-baseline justify-between">
            <h2 className="m-0 font-sans text-xs font-semibold uppercase tracking-[2px] text-ink">
              Account
            </h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-edge bg-card">
            <AccountRow
              href="/?home=1"
              title="Your leagues"
              sub="Switch, join, or create a league"
              icon={
                <path
                  d="M7 4h10v4a5 5 0 0 1-10 0V4ZM12 13v3M9 20h6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              }
            />
            <AccountRow
              href="/notifications"
              title="Notifications"
              sub="Draft reminders, score alerts, chat"
              icon={
                <path
                  d="M6.5 17V11a5.5 5.5 0 0 1 11 0v6l1.5 2H5l1.5-2ZM10 20a2 2 0 0 0 4 0"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              }
            />
            <AccountRow
              href="/settings"
              title="Display name & handle"
              sub={name}
              icon={
                <>
                  <circle cx="12" cy="8.5" r="3.6" stroke="currentColor" strokeWidth="1.7" />
                  <path
                    d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </>
              }
            />
            <AccountRow
              href="/?home=1"
              title="How scoring works"
              sub="Tiers, counting scores, tiebreakers"
              icon={
                <>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
                  <path
                    d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.6-.9 1.2v.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="16.5" r="1" fill="currentColor" />
                </>
              }
            />
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full cursor-pointer items-center gap-3.5 border-t border-line2 px-[22px] py-4 text-left transition-colors hover:bg-white/[0.02]"
            >
              <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-rose/10 text-rose">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M15 5l-3-2-3 2M9 19l3 2 3-2M16 8l3 4-3 4M8 8l-3 4 3 4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-[14.5px] font-medium leading-tight text-rose">
                  Sign out
                </b>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, detail }: { value: string; label: string; detail: string }) {
  return (
    <div className="rounded-[15px] border border-edge bg-card px-[22px] py-5">
      <div className="font-serif text-[38px] font-medium leading-none text-gold tnum">
        {value}
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-[1.4px] text-muted">{label}</div>
      <div className="mt-[3px] text-[11.5px] text-faint">{detail}</div>
    </div>
  );
}

function AccountRow({
  href,
  title,
  sub,
  icon,
}: {
  href: string;
  title: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3.5 border-t border-line2 px-[22px] py-4 no-underline transition-colors first:border-t-0 hover:bg-white/[0.02]"
    >
      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-surface2 text-gold2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          {icon}
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-[14.5px] font-medium leading-tight text-ink">{title}</b>
        <span className="text-[12.5px] text-muted">{sub}</span>
      </span>
      <svg className="text-faint" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 5l7 7-7 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}
