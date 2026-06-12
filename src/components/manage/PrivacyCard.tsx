"use client";

import { useEffect, useState } from "react";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import PasswordInput from "@/components/ui/PasswordInput";

interface PrivacyCardProps {
  leagueId: string;
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
export default function PrivacyCard({ leagueId, onSaved }: PrivacyCardProps) {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);

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
      <div className="bg-card rounded-lg border border-edge p-4">
        <h2 className="text-white font-bold text-sm uppercase tracking-wide mb-3">
          League Privacy
        </h2>
        <div className="h-10 rounded-lg bg-card-inset animate-pulse" />
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
    <div className="bg-card rounded-lg border border-edge p-4">
      <h2 className="text-white font-bold text-sm uppercase tracking-wide mb-3">League Privacy</h2>

      <div className="flex items-center gap-3">
        <ToggleSwitch checked={isPrivate} onChange={setIsPrivate} disabled={saving} />
        <div>
          <p className="text-gray-200 text-sm font-semibold">
            {isPrivate ? "Private league" : "Public league"}
          </p>
          <p className="text-gray-500 text-xs">
            {isPrivate
              ? "Only members can see this league. The invite link still works; joining by league ID requires the password."
              : "Anyone with the link can view standings. Only members can chat or play."}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-gray-400 text-xs uppercase tracking-wide block mb-1.5">
          League password
        </label>
        <div className="flex flex-wrap items-center gap-2">
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
            className="px-4 py-2 bg-brand text-black font-semibold text-xs rounded-lg hover:bg-brand-hover transition-colors cursor-pointer disabled:opacity-40"
          >
            {saving ? "Saving…" : justSaved && !dirty ? "Saved ✓" : "Save"}
          </button>
        </div>
        {passwordTooShort && (
          <p className="text-gray-500 text-xs mt-1.5">
            Passwords need at least {MIN_PASSWORD} characters.
          </p>
        )}
        {missingPassword && (
          <p className="text-gray-500 text-xs mt-1.5">
            Set a league password to make the league private.
          </p>
        )}
        {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
      </div>
    </div>
  );
}
