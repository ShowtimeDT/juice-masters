"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { relativeTime } from "@/lib/format";
import { getTournament, TOURNAMENTS, TournamentId } from "@/lib/tournaments";
import { getTournamentState } from "@/lib/tournament-state";

const POLL_MS = 20_000;
const MAX_LENGTH = 1000;

/** The major currently in play, or null between majors. The League Pulse
 *  right rail only appears while a major is live; otherwise chat is full-width. */
const LIVE_MAJOR: TournamentId | null =
  TOURNAMENTS.find(
    (t) => t.id !== "season" && getTournamentState(t) === "in-progress"
  )?.id ?? null;

interface ChatMessage {
  id: number;
  user_id: string;
  body: string;
  created_at: string;
  display_name: string | null;
  team_name: string | null;
  team_photo: string | null;
}

interface LeagueChatProps {
  leagueId: string;
  isMember: boolean;
}

function initials(label: string): string {
  return label
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Left-bubble avatar for other members — photo or gold-tint initials disc. */
function Avatar({ message }: { message: ChatMessage }) {
  const label = message.team_name || message.display_name || "?";
  return (
    <span className="relative w-9 h-9 rounded-full overflow-hidden bg-goldsoft shrink-0 shadow-[0_0_0_1px_var(--line)] inline-flex items-center justify-center mt-[18px]">
      {message.team_photo ? (
        <Image src={message.team_photo} alt={label} fill className="object-cover" unoptimized />
      ) : (
        <span className="font-sans font-semibold text-[13px] text-gold2">
          {initials(label)}
        </span>
      )}
    </span>
  );
}

export default function LeagueChat({ leagueId, isMember }: LeagueChatProps) {
  const { data: session } = useSession();
  const myName = session?.user?.name ?? null;

  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const didInitialScroll = useRef(false);

  // Grow the composer with its content, up to the design's max height.
  const autoGrow = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/leagues/${leagueId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      // keep whatever we have; next poll retries
    }
  }, [leagueId]);

  useEffect(() => {
    if (!isMember) return;
    (async () => {
      await load();
    })();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [load, isMember]);

  // Scroll to the latest message once on load and after own sends — not on
  // background polls, so reading history isn't interrupted.
  useEffect(() => {
    if (messages && !didInitialScroll.current) {
      didInitialScroll.current = true;
      bottomRef.current?.scrollIntoView();
    }
  }, [messages]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/leagues/${leagueId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't send that");
      } else {
        setMessages((prev) => [...(prev ?? []), data.message]);
        setDraft("");
        if (taRef.current) taRef.current.style.height = "auto";
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
      }
    } catch {
      setError("Couldn't send that");
    }
    setSending(false);
  };

  if (!isMember) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-card rounded-2xl border border-edge px-6 py-14 text-center">
          <h2 className="font-serif font-medium text-ink text-[28px] mb-2">League Chat</h2>
          <p className="text-muted text-sm">
            Chat is for league members. Join the league to get in on the trash talk.
          </p>
        </div>
      </main>
    );
  }

  const showPulse = LIVE_MAJOR !== null;
  const liveLabel = LIVE_MAJOR ? getTournament(LIVE_MAJOR).shortName : null;

  return (
    <div
      className={`max-w-[1180px] mx-auto grid grid-cols-1 ${
        showPulse ? "lg:grid-cols-[1fr_320px]" : ""
      }`}
      style={{ height: "calc(100vh - 62px)" }}
    >
      {/* CHAT */}
      <section className="flex flex-col min-h-0">
        <div className="flex items-center justify-between px-7 py-[18px] border-b border-edge">
          <h2 className="font-serif font-medium text-ink text-[22px] whitespace-nowrap">
            League Chat
          </h2>
          <span className="flex items-center gap-[7px] text-[10.5px] tracking-[1.4px] uppercase text-faint">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            Permanent
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-7 pt-6 pb-2 flex flex-col">
          {messages === null ? (
            <div className="flex justify-center py-16">
              <div className="inline-block w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 m-auto">
              <p className="text-muted text-sm">Nothing here yet.</p>
              <p className="text-faint text-xs mt-1">
                Be the first — picks, predictions, gloating. It&apos;s all permanent.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isYou = Boolean(myName) && m.display_name === myName;
              const team =
                m.team_name && m.team_name !== m.display_name ? m.team_name : null;

              if (isYou) {
                return (
                  <div
                    key={m.id}
                    className="flex flex-col items-end mb-[18px] max-w-[74%] ml-auto"
                  >
                    <div className="flex flex-col items-end gap-[5px]">
                      <div className="text-[14.5px] leading-[1.45] text-ink bg-[rgba(201,162,75,0.13)] border border-[rgba(201,162,75,0.32)] rounded-2xl rounded-tr-[5px] px-[15px] py-[9px] max-w-[560px] w-fit whitespace-pre-wrap break-words">
                        {m.body}
                      </div>
                    </div>
                    <div className="text-[10.5px] text-faint mt-1.5">
                      {relativeTime(m.created_at)}
                    </div>
                  </div>
                );
              }

              return (
                <div key={m.id} className="flex gap-3 mb-[18px] max-w-[74%]">
                  <Avatar message={m} />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                      <b className="text-[13.5px] font-semibold text-ink">
                        {m.display_name ?? "Former member"}
                      </b>
                      {team && (
                        <span className="text-[11px] tracking-[0.3px] text-gold truncate">
                          {team}
                        </span>
                      )}
                      <span className="text-[10.5px] text-faint">
                        {relativeTime(m.created_at)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-[5px]">
                      <div className="text-[14.5px] leading-[1.45] text-text bg-surface2 border border-edge rounded-2xl rounded-tl-[5px] px-[15px] py-[9px] max-w-[560px] w-fit whitespace-pre-wrap break-words">
                        {m.body}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div className="px-7 pt-3.5 pb-[18px] border-t border-edge">
          {error && <p className="text-rose text-xs mb-2">{error}</p>}
          <div className="flex items-end gap-3 bg-card border border-edge rounded-2xl pl-4 pr-2 py-2 transition-colors focus-within:border-gold/50">
            <textarea
              ref={taRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value.slice(0, MAX_LENGTH));
                autoGrow();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Message the league…"
              className="flex-1 bg-transparent border-0 outline-none resize-none text-ink text-[14.5px] font-light leading-[1.5] py-2 max-h-[120px] min-h-[24px] placeholder:text-faint"
            />
            <button
              onClick={send}
              disabled={sending || !draft.trim()}
              className="btn-gold shrink-0 font-medium text-[13.5px] tracking-[0.5px] rounded-[11px] px-[22px] py-[11px] cursor-pointer transition-transform hover:-translate-y-px disabled:opacity-40 disabled:hover:translate-y-0"
            >
              Send
            </button>
          </div>
          <div className="flex justify-between mt-2.5">
            <span className="text-faint text-[11px] tracking-[0.3px] flex-1 text-center">
              Messages are permanent — no deleting.
            </span>
            {draft.length > MAX_LENGTH - 100 && (
              <span className="text-faint text-[11px]">
                {MAX_LENGTH - draft.length} left
              </span>
            )}
          </div>
        </div>
      </section>

      {/* LEAGUE PULSE — only while a major is live */}
      {showPulse && (
        <aside className="hidden lg:flex border-l border-edge flex-col min-h-0">
          <div className="px-6 pt-[22px] pb-4 border-b border-edge">
            <div className="text-[10.5px] tracking-[2.4px] uppercase text-gold">
              League Pulse
            </div>
            <h2 className="font-serif font-medium text-ink text-[24px] mt-1">
              Storylines
            </h2>
            <div className="text-[11.5px] text-faint mt-[5px] tracking-[0.4px]">
              {liveLabel} · Round live
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-[22px] pt-[18px] pb-6">
            <p className="text-[13.5px] leading-[1.5] text-faint">
              Storylines surface here as the round unfolds — leads, missed cuts,
              and tiebreaker swings across the league.
            </p>
          </div>
        </aside>
      )}
    </div>
  );
}
