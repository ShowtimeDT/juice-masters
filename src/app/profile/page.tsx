import type { Metadata } from "next";
import ScreenPlaceholder from "@/components/ui/ScreenPlaceholder";

export const metadata: Metadata = { title: "Profile" };

// Placeholder — the full Profile screen (season stats, four-major strip, account rows)
// is reskinned in Phase 2. See design_handoff_juice_tour_app "Profile".
export default function ProfilePage() {
  return (
    <ScreenPlaceholder
      eyebrow="Profile"
      title="Your profile"
      body="Season stats, your four-major results, and account shortcuts will live here."
      note="Being reskinned next."
    />
  );
}
