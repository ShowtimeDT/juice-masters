"use client";

import { useEffect, useState } from "react";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import PasswordInput from "@/components/ui/PasswordInput";

interface PrivacyCardProps {
  leagueId: string;
  /** The human-friendly league ID members type to join (the URL slug). */
  leagueSlug: string;
  /** Called after a successful save so the parent can refresh league data. */
  onSaved: () => void;
}

interface PrivacySettings {
  is_private: boolean;
  password: string | null;
  has_password: boolean;
}

const MIN_PASSWORD = 4;

/**
 * Commissioner privacy controls: a Private toggle plus the league password,
 * always on display (masked, with an eye icon — the password is a shared
 * join code, recoverable by the commissioner).
 */
export default function PrivacyCard({ leagueId, leagueSlug, onSaved }: PrivacyCardProps) {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const copyLeagueId = () => {
    navigator.clipboard.writeText(leagueSlug).catch(() => {});
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/leagues/settings?league_id=${leagueId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PrivacySettings | null) => {
        if (cancelled || !data) return;
        setSettings(data);
        setIsPrivate(data.is_private);
        setPassword(data.password ?? "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [leagueId]);

  if (!settings) {
    return (
      <div className="rounded-[18px] border border-edge bg-card px-[26px] pb-7 pt-[26px]">
        <h2 className="m-0 mb-1 font-sans text-xs font-semibold uppercase tracking-[2px] text-ink">
          Privacy &amp; Access
        </h2>
        <p className="m-0 mb-5 text-[13px] text-muted">Control who can find and join.</p>
        <div className="h-[46px] animate-pulse rounded-[11px] bg-bg2" />
      </div>
    );
  }

  const savedPassword = settings.password ?? "";
  const dirty = isPrivate !== settings.is_private || password !== savedPassword;
  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD;
  // Going (or staying) private needs a password on file or in the box.
  const missingPassword = isPrivate && !password && !settings.has_password;
  const canSave = dirty && !saving && !passwordTooShort && !missingPassword;

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/leagues/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          league_id: leagueId,
          is_private: isPrivate,
          password: password !== savedPassword && password ? password : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
      } else {
        setSettings({
          is_private: isPrivate,
          password: password || settings.password,
          has_password: settings.has_password || !!password,
        });
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2500);
        onSaved();
      }
    } catch {
      setError("Failed to save");
    }
    setSaving(false);
  };

  return (
    <div className="rounded-[18px] border border-edge bg-card px-[26px] pb-7 pt-[26px]">
      <h2 className="m-0 mb-1 font-sans text-xs font-semibold uppercase tracking-[2px] text-ink">
        Privacy &amp; Access
      </h2>
      <p className="m-0 mb-5 text-[13px] text-muted">Control who can find and join.</p>

      <div className="mb-5 flex items-start gap-3.5">
        <ToggleSwitch checked={isPrivate} onChange={setIsPrivate} disabled={saving} />
        <div>
          <b className="block text-sm font-semibold leading-tight text-ink">
            {isPrivate ? "Private league" : "Public league"}
          </b>
          <span className="mt-[3px] block text-[12.5px] leading-normal text-muted">
            {isPrivate
              ? "Only members can see it. The invite link still works; joining by ID requires the password."
              : "Anyone with the link can view standings. Only members can chat or play."}
          </span>
        </div>
      </div>

      <div>
        <div className="mb-[9px] text-[10.5px] uppercase tracking-[1.6px] text-faint">
          League password
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder={
              settings.has_password && !savedPassword
                ? "Password set under the old system — type a new one to view it here"
                : "League password"
            }
            disabled={saving}
          />
          <button
            onClick={save}
            disabled={!canSave}
            className="inline-flex h-[46px] cursor-pointer items-center justify-center whitespace-nowrap rounded-[11px] border border-edge bg-transparent px-[18px] text-[13px] font-medium text-text transition-colors hover:border-gold/50 hover:text-gold2 disabled:opacity-40"
          >
            {saving ? "Saving…" : justSaved && !dirty ? "Saved" : "Save"}
          </button>
        </div>
        {passwordTooShort && (
          <p className="mt-1.5 text-xs text-muted">
            Passwords need at least {MIN_PASSWORD} characters.
          </p>
        )}
        {missingPassword && (
          <p className="mt-1.5 text-xs text-muted">
            Set a league password to make the league private.
          </p>
        )}
        {error && <p className="mt-1.5 text-xs text-rose">{error}</p>}
      </div>

      {/* League ID — the other half of the join combo */}
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line2 pt-[18px]">
        <span className="text-[10.5px] uppercase tracking-[1.6px] text-faint">League ID</span>
        <code className="rounded-lg border border-gold/30 bg-goldsoft px-[11px] py-[5px] font-mono text-[13px] text-gold2">
          {leagueSlug}
        </code>
        <button
          onClick={copyLeagueId}
          className="cursor-pointer text-[12.5px] text-muted transition-colors hover:text-gold2"
        >
          {copiedId ? "Copied" : "Copy"}
        </button>
        <p className="mt-1.5 w-full text-xs text-muted">
          Members can join with this league ID plus the password — or just use the invite link.
        </p>
      </div>
    </div>
  );
}
