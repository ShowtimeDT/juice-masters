"use client";

export type AppView = "standings" | "team" | "chat";

const TABS: { id: AppView; label: string }[] = [
  { id: "standings", label: "Standings" },
  { id: "team", label: "My Team" },
  { id: "chat", label: "Chat" },
];

interface AppTabsProps {
  active: AppView;
  onSelect: (view: AppView) => void;
}

/** Top-level league navigation: Standings · My Team · Chat. */
export default function AppTabs({ active, onSelect }: AppTabsProps) {
  return (
    <nav className="bg-surface border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                onClick={() => onSelect(tab.id)}
                className={`px-5 sm:px-7 py-3.5 text-sm font-semibold tracking-wide transition-colors cursor-pointer border-b-2 ${
                  isActive
                    ? "text-white border-brand"
                    : "text-gray-500 border-transparent hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function isAppView(value: string | null): value is AppView {
  return value === "standings" || value === "team" || value === "chat";
}
