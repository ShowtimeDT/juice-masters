"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import TopBrandBar from "@/components/profile/TopBrandBar";
import NotificationToggles from "@/components/settings/NotificationToggles";

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

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    document.title = "Account settings · Juice Tour";
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/settings");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.name) setDisplayName(session.user.name);
  }, [session?.user?.name]);

  // The username lives only in the database (not the session), so load it once.
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => {
        if (me?.username) setUsername(me.username);
      })
      .catch(() => {});
  }, [status]);

  async function saveProfile() {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName, username }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveMessage({ ok: false, text: data.error ?? "Failed to save changes" });
        return;
      }
      if (data.username) setUsername(data.username);
      // Pull the new display name into the session JWT so the whole app
      // (top bar, monogram) reflects it without a re-login.
      await updateSession();
      setSaveMessage({ ok: true, text: "Profile saved" });
    } catch {
      setSaveMessage({ ok: false, text: "Failed to save changes" });
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const email = session?.user?.email ?? "";
  const mono = session?.user?.name ? initials(session.user.name) : "?";

  return (
    <div className="min-h-screen bg-surface">
      <TopBrandBar monogram={mono} maxWidth={760} />

      <div className="mx-auto max-w-[760px] px-7 pb-[90px]">
        {/* HEAD */}
        <div className="pt-[38px] pb-[26px]">
          <a
            href="/profile"
            className="mb-5 inline-flex items-center gap-[7px] text-[13px] text-muted no-underline transition-colors hover:text-gold2"
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
            Back to Profile
          </a>
          <div className="eyebrow">Account</div>
          <h1 className="mt-3 mb-0 font-serif text-[42px] font-medium leading-none text-ink">
            Settings
          </h1>
        </div>

        {/* PROFILE CARD */}
        <div className="mb-[18px] rounded-2xl border border-edge bg-card px-[26px] py-6">
          <h2 className="m-0 mb-[18px] font-sans text-xs font-semibold uppercase tracking-[2px] text-ink">
            Profile
          </h2>

          <div className="mb-[22px] flex items-center gap-[18px]">
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full font-serif text-[30px] font-semibold text-[#1A1408] shadow-[0_0_0_1px_var(--line)] btn-gold">
              {mono}
            </div>
            <div>
              {/* TODO(backend): no avatar upload endpoint — keep the gold monogram. */}
              <div className="text-[13px] text-gold2">Change photo</div>
              <div className="mt-[3px] text-xs text-faint">Or keep your gold monogram</div>
            </div>
          </div>

          <Field label="Display name">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={120}
              className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none"
            />
          </Field>

          <Field label="Username">
            <span className="font-mono text-sm text-faint">@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              maxLength={30}
              className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
            />
          </Field>
          <div className="mt-2 text-xs text-faint">
            Your handle is how leaguemates see you in chat and standings. 3–30 letters,
            numbers, or underscores.
          </div>

          <div className="mt-[18px]">
            <div className="mb-[9px] text-[10.5px] uppercase tracking-[1.6px] text-faint">
              Email
            </div>
            <div className="flex h-[50px] items-center gap-2.5 rounded-[11px] border border-edge bg-bg2 px-[15px] opacity-70">
              <input
                value={email}
                readOnly
                className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none"
              />
              <span className="text-faint">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.7" />
                </svg>
              </span>
            </div>
          </div>

          <div className="mt-[18px] flex items-center gap-3">
            <button
              type="button"
              disabled={saving || displayName.trim().length === 0}
              onClick={saveProfile}
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-[11px] px-[22px] text-sm font-semibold text-[#1A1408] btn-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <a
              href="/profile"
              className="inline-flex h-12 items-center justify-center rounded-[11px] border border-edge px-[22px] text-sm font-semibold text-text no-underline transition-colors hover:border-gold/50 hover:text-gold2"
            >
              Cancel
            </a>
            {saveMessage && (
              <span className={`text-[13px] ${saveMessage.ok ? "text-under" : "text-rose"}`}>
                {saveMessage.text}
              </span>
            )}
          </div>
        </div>

        {/* NOTIFICATIONS CARD */}
        <div className="mb-[18px] rounded-2xl border border-edge bg-card px-[26px] py-6">
          <h2 className="m-0 mb-[18px] font-sans text-xs font-semibold uppercase tracking-[2px] text-ink">
            Notifications
          </h2>
          <NotificationToggles />
        </div>

        {/* SIGN OUT EVERYWHERE */}
        <div
          className="flex items-center justify-between gap-[18px] rounded-2xl border px-[26px] py-[18px]"
          style={{
            borderColor: "rgba(217,140,106,0.3)",
            background:
              "linear-gradient(180deg, rgba(217,140,106,0.04), transparent)",
          }}
        >
          <div>
            <b className="text-sm font-semibold text-rose">Sign out everywhere</b>
            <p className="m-0 mt-[3px] text-[12.5px] text-muted">
              End all active sessions on every device.
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="h-11 cursor-pointer whitespace-nowrap rounded-[10px] border border-rose/50 bg-transparent px-[18px] text-[13px] font-medium text-rose transition-colors hover:bg-rose/10"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-[18px]">
      <div className="mb-[9px] text-[10.5px] uppercase tracking-[1.6px] text-faint">
        {label}
      </div>
      <div className="flex h-[50px] items-center gap-2.5 rounded-[11px] border border-edge bg-bg2 px-[15px] transition-colors focus-within:border-gold/50">
        {children}
      </div>
    </div>
  );
}
