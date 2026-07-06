"use client";

import { useState } from "react";

interface NotificationPref {
  key: string;
  title: string;
  sub: string;
  defaultOn: boolean;
}

const PREFS: NotificationPref[] = [
  {
    key: "draftOpening",
    title: "Draft opening",
    sub: "When a major's field drops and your draft opens",
    defaultOn: true,
  },
  {
    key: "deadlineReminders",
    title: "Draft deadline reminders",
    sub: "A nudge before picks lock if you haven't drafted",
    defaultOn: true,
  },
  {
    key: "scoreAlerts",
    title: "Live score alerts",
    sub: "Big moves on your team — eagles, birdies, the cut line",
    defaultOn: true,
  },
  {
    key: "finalResults",
    title: "Final results",
    sub: "When a major wraps and standings are final",
    defaultOn: true,
  },
  {
    key: "chatMentions",
    title: "Chat mentions",
    sub: "When someone @mentions you in league chat",
    defaultOn: false,
  },
  {
    key: "weeklyDigest",
    title: "Weekly digest email",
    sub: "A season recap every Monday during major weeks",
    defaultOn: false,
  },
];

/**
 * Notification preference toggles. Matches the design's gold-on / dark-off pill.
 *
 * TODO(backend): notification preferences are not persisted yet — there's no
 * notifications table, API, or generation logic. These toggles are visual-only
 * local state. Wire to a real preferences endpoint when the backend exists.
 */
export default function NotificationToggles() {
  const [state, setState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PREFS.map((p) => [p.key, p.defaultOn]))
  );

  return (
    <div>
      {PREFS.map((p) => {
        const on = state[p.key];
        return (
          <div
            key={p.key}
            className="flex items-center gap-4 border-t border-line2 py-[15px] first:border-t-0"
          >
            <div className="min-w-0 flex-1">
              <b className="block text-[14.5px] font-medium leading-tight text-ink">
                {p.title}
              </b>
              <span className="text-[12.5px] text-muted">{p.sub}</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={p.title}
              onClick={() => setState((s) => ({ ...s, [p.key]: !s[p.key] }))}
              className={`relative h-[27px] w-[46px] shrink-0 cursor-pointer rounded-full border transition-colors ${
                on ? "border-gold/50 bg-goldsoft" : "border-edge bg-surface2"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-[21px] w-[21px] rounded-full transition-transform ${
                  on ? "translate-x-[19px] btn-gold" : "bg-muted"
                }`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
