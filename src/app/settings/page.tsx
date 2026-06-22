import type { Metadata } from "next";
import ScreenPlaceholder from "@/components/ui/ScreenPlaceholder";

export const metadata: Metadata = { title: "Account settings" };

// Placeholder — the full Account Settings screen (edit profile, notification toggles,
// sign-out-everywhere) is reskinned in Phase 2. See design_handoff "Account Settings".
export default function SettingsPage() {
  return (
    <ScreenPlaceholder
      eyebrow="Account settings"
      title="Account settings"
      body="Edit your profile and choose which notifications you receive."
      note="Being reskinned next."
    />
  );
}
