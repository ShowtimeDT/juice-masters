import type { Metadata } from "next";
import ScreenPlaceholder from "@/components/ui/ScreenPlaceholder";

export const metadata: Metadata = { title: "Notifications" };

// TODO(backend): Notifications have no table/API/generation logic yet. The top-bar
// bell and the Profile/Settings rows link here as the entry point; the full inbox
// (Today / Earlier groups, color-coded icons, mark-all-read, deep links) ships once
// the backend exists. See design_handoff_juice_tour_app "Notifications".
export default function NotificationsPage() {
  return (
    <ScreenPlaceholder
      eyebrow="Notifications"
      title="Your inbox is on the way"
      body="Score alerts, draft reminders, chat mentions and final results will land here."
      note="Coming soon — the notifications backend isn't built yet."
    />
  );
}
