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
    <div className="bg-card rounded-lg border border-edge p-5 flex items-center gap-5">
      {/* Team photo */}
      <button
        onClick={() => fileRef.current?.click()}
        className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-avatar ring-1 ring-white/10 shrink-0 cursor-pointer group"
        title="Change team photo"
      >
        {member.team_photo ? (
          <Image src={member.team_photo} alt={teamName} fill className="object-cover" unoptimized />
        ) : (
          <span className="w-full h-full flex items-center justify-center text-gray-500 font-serif font-bold text-3xl">
            {teamName[0]?.toUpperCase()}
          </span>
        )}
        <span className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/50 text-white text-[10px] uppercase tracking-wider font-semibold">
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
              className="flex-1 min-w-0 bg-card-inset border border-edge rounded-lg px-3 py-2 text-white text-lg font-serif focus:outline-none focus:border-brand"
            />
            <button
              onClick={saveName}
              disabled={saving}
              className="px-3 py-2 bg-brand text-black font-semibold text-xs rounded-lg hover:bg-brand-hover cursor-pointer disabled:opacity-50 shrink-0"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-white font-serif font-bold text-2xl truncate">{teamName}</h2>
            <button
              onClick={() => {
                setNameDraft(teamName);
                setEditingName(true);
              }}
              className="text-gray-500 hover:text-brand transition-colors cursor-pointer shrink-0"
              title="Edit team name"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          </div>
        )}
        <p className="text-gray-500 text-xs mt-1">Managed by {member.display_name}</p>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>
    </div>
  );
}
