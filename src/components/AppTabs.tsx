"use client";

import { useRef, useState, type ReactNode } from "react";
import { useOutsideClick } from "@/lib/useOutsideClick";

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

/**
 * Top-level league navigation: Standings · My Team · Chat.
 * Inline tabs on desktop; a hamburger menu on phones to leave room for
 * the league switcher and account menu.
 */
export default function AppTabs({ active, onSelect, children }: AppTabsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(menuRef, () => setMenuOpen(false), menuOpen);

  const activeLabel = TABS.find((tab) => tab.id === active)?.label ?? "";

  return (
    <nav className="bg-surface border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-1">
          {/* Phone: hamburger + current page name */}
          <div className="relative sm:hidden" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 py-3.5 pr-2 text-sm font-semibold text-white cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {activeLabel}
            </button>

            {menuOpen && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-edge rounded-lg shadow-lg z-50 min-w-[10rem]">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onSelect(tab.id);
                      setMenuOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer first:rounded-t-lg last:rounded-b-lg ${
                      tab.id === active
                        ? "text-white bg-white/5"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop: inline tabs */}
          <div className="hidden sm:flex gap-1">
            {TABS.map((tab) => {
              const isActive = tab.id === active;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelect(tab.id)}
                  className={`px-7 py-3.5 text-sm font-semibold tracking-wide transition-colors cursor-pointer border-b-2 ${
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
