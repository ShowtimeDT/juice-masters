"use client";

import { useRef, useState, type ReactNode } from "react";
import { useOutsideClick } from "@/lib/useOutsideClick";
import Logo from "@/components/ui/Logo";

export type AppView = "standings" | "team" | "chat";

const TABS: { id: AppView; label: string }[] = [
  { id: "standings", label: "Standings" },
  { id: "team", label: "My Team" },
  { id: "chat", label: "Chat" },
];

interface AppTabsProps {
  active: AppView;
  onSelect: (view: AppView) => void;
  /** Pulse a dot on My Team — the member has a live draft to pick in. */
  teamBadge?: boolean;
  /** Right-docked controls: the league switcher, notification bell, account chip. */
  children?: ReactNode;
}

function BadgeDot() {
  return <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />;
}

/**
 * The shared Juice Tour top bar (the "Dawn" app shell): 62px, sticky, blurred —
 * Dawn logo + wordmark, the Standings · My Team · Chat tabs, a flexible spacer,
 * then the right cluster (league switcher, bell, account) passed as children.
 * Inline tabs on desktop; a hamburger on phones to leave room for the controls.
 */
export default function AppTabs({ active, onSelect, teamBadge, children }: AppTabsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(menuRef, () => setMenuOpen(false), menuOpen);

  const activeLabel = TABS.find((tab) => tab.id === active)?.label ?? "";

  return (
    <header className="sticky top-0 z-40 bg-bg2/90 backdrop-blur-md border-b border-edge">
      <div className="max-w-[1180px] mx-auto h-[62px] px-5 sm:px-7 flex items-center gap-5 sm:gap-8">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Logo size={38} />
          <b className="font-serif font-semibold text-[21px] text-ink tracking-[0.3px] whitespace-nowrap hidden sm:block">
            Juice Tour
          </b>
        </div>

        {/* Phone: hamburger + current page name */}
        <div className="relative sm:hidden" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 py-3.5 pr-2 text-sm font-medium text-ink cursor-pointer"
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
            {teamBadge && <BadgeDot />}
          </button>

          {menuOpen && (
            <div className="absolute top-full left-0 mt-1 bg-card border border-edge rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] z-50 min-w-[10rem] overflow-hidden">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    onSelect(tab.id);
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex items-center gap-2 ${
                    tab.id === active
                      ? "text-ink bg-white/5"
                      : "text-muted hover:text-ink hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                  {tab.id === "team" && teamBadge && <BadgeDot />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: inline tabs */}
        <nav className="hidden sm:flex items-center gap-7 h-full">
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                onClick={() => onSelect(tab.id)}
                className={`h-full flex items-center gap-1.5 text-sm tracking-[0.3px] border-b-2 cursor-pointer transition-colors ${
                  isActive
                    ? "text-ink font-medium border-gold"
                    : "text-muted font-normal border-transparent hover:text-ink"
                }`}
              >
                {tab.label}
                {tab.id === "team" && teamBadge && <BadgeDot />}
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />

        {children && <div className="flex items-center gap-3 sm:gap-4">{children}</div>}
      </div>
    </header>
  );
}

export function isAppView(value: string | null): value is AppView {
  return value === "standings" || value === "team" || value === "chat";
}
