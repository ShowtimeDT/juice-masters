"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export interface LeagueMember {
  id: number;
  user_id: string | null;
  display_name: string;
  team_name: string | null;
  team_photo: string | null;
}

interface TeamIdentityCardProps {
  leagueId: string;
  member: LeagueMember | null;
  onUpdated: () => void;
}

/** Downscale an image file to a square JPEG data URL (~30KB). */
async function fileToTeamPhoto(file: File, size = 256): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  // Cover-crop to a square from the center.
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function TeamIdentityCard({ leagueId, member, onUpdated }: TeamIdentityCardProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!member) return null;

  const teamName = member.team_name || `${member.display_name}'s Team`;

  const saveName = async () => {
    if (!nameDraft.trim() || nameDraft.trim() === teamName) {
      setEditingName(false);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/leagues/team-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ league_id: leagueId, team_name: nameDraft.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Couldn't save the name");
      } else {
        setEditingName(false);
        onUpdated();
      }
    } catch {
      setError("Couldn't save the name");
    }
    setSaving(false);
  };

  const uploadPhoto = async (file: File) => {
    setSaving(true);
    setError("");
    try {
      const photo = await fileToTeamPhoto(file);
      const res = await fetch("/api/leagues/team-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ league_id: leagueId, photo }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Couldn't upload the photo");
      } else {
        onUpdated();
      }
    } catch {
      setError("Couldn't read that image — try a JPEG or PNG");
    }
    setSaving(false);
  };

  return (
    <div className="bg-card rounded-2xl border border-edge px-[26px] py-[22px] flex items-center gap-[22px]">
      {/* Team photo */}
      <button
        onClick={() => fileRef.current?.click()}
        className="relative w-[76px] h-[76px] rounded-2xl overflow-hidden bg-surface2 shadow-[0_0_0_1px_var(--line)] shrink-0 cursor-pointer group"
        title="Change team photo"
      >
        {member.team_photo ? (
          <Image src={member.team_photo} alt={teamName} fill className="object-cover" unoptimized />
        ) : (
          <span className="w-full h-full flex items-center justify-center text-gold2 font-serif font-semibold text-3xl">
            {teamName[0]?.toUpperCase()}
          </span>
        )}
        <span className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/50 text-ink text-[10px] uppercase tracking-wider font-semibold">
          Change
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadPhoto(file);
          e.target.value = "";
        }}
      />

      {/* Name + owner */}
      <div className="min-w-0 flex-1">
        {editingName ? (
          <div className="flex gap-2 items-center">
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              maxLength={120}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") setEditingName(false);
              }}
              className="flex-1 min-w-0 bg-card-inset border border-edge rounded-lg px-3 py-2 text-ink text-[30px] leading-none font-serif font-semibold focus:outline-none focus:border-gold"
            />
            <button
              onClick={saveName}
              disabled={saving}
              className="px-4 py-2 btn-gold font-semibold text-xs rounded-lg cursor-pointer disabled:opacity-50 shrink-0"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-[11px] min-w-0">
            <h2 className="font-serif font-semibold text-[30px] leading-none text-ink truncate">{teamName}</h2>
            <button
              onClick={() => {
                setNameDraft(teamName);
                setEditingName(true);
              }}
              className="text-faint hover:text-gold transition-colors cursor-pointer shrink-0"
              title="Edit team name"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 20h4L19 9l-4-4L4 16v4z" strokeWidth={1.8} strokeLinejoin="round" />
                <path d="M14 6l4 4" strokeWidth={1.8} />
              </svg>
            </button>
          </div>
        )}
        <p className="text-muted text-[13px] tracking-[0.3px] mt-1.5">
          Managed by {member.display_name} · 8 picks · best 5 of 8 count
        </p>
        {error && <p className="text-rose text-xs mt-1">{error}</p>}
      </div>
    </div>
  );
}
