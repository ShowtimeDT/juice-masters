"use client";

import type { ReactNode } from "react";

export type AppView = "standings" | "team" | "chat";

const TABS: { id: AppView; label: string }[] = [
  { id: "standings", label: "Standings" },
  { id: "team", label: "My Team" },
  { id: "chat", label: "Chat" },
];

interface AppTabsProps {
  active: AppView;
  onSelect: (view: AppView) => void;
  /** Right-docked controls, e.g. the league switcher and account menu. */
  children?: ReactNode;
}

/** Top-level league navigation: Standings · My Team · Chat. */
export default function AppTabs({ active, onSelect, children }: AppTabsProps) {
  return (
    <nav className="bg-surface border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                onClick={() => onSelect(tab.id)}
                className={`px-3 sm:px-7 py-3.5 text-sm font-semibold tracking-wide transition-colors cursor-pointer border-b-2 ${
                  isActive
                    ? "text-white border-brand"
                    : "text-gray-500 border-transparent hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
          {children && (
            <div className="ml-auto flex items-center gap-3 sm:gap-5 pl-2">{children}</div>
          )}
        </div>
      </div>
    </nav>
  );
}

export function isAppView(value: string | null): value is AppView {
  return value === "standings" || value === "team" || value === "chat";
}
