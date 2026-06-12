"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { relativeTime } from "@/lib/format";

const POLL_MS = 20_000;
const MAX_LENGTH = 1000;

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

function Avatar({ message }: { message: ChatMessage }) {
  const label = message.team_name || message.display_name || "?";
  return (
    <span className="relative w-9 h-9 rounded-full overflow-hidden bg-avatar ring-1 ring-white/10 shrink-0">
      {message.team_photo ? (
        <Image src={message.team_photo} alt={label} fill className="object-cover" unoptimized />
      ) : (
        <span className="w-full h-full flex items-center justify-center text-gray-500 font-serif font-bold text-sm">
          {label[0]?.toUpperCase()}
        </span>
      )}
    </span>
  );
}

export default function LeagueChat({ leagueId, isMember }: LeagueChatProps) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);

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
    load();
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
        <div className="bg-card rounded-lg border border-edge px-6 py-14 text-center">
          <h2 className="text-white font-serif font-bold text-2xl mb-2">League Chat</h2>
          <p className="text-gray-400 text-sm">
            Chat is for league members. Join the league to get in on the trash talk.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 flex flex-col" style={{ minHeight: "60vh" }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-h-[60vh] space-y-4 pb-4">
        {messages === null ? (
          <div className="flex justify-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">Nothing here yet.</p>
            <p className="text-gray-500 text-xs mt-1">
              Be the first — picks, predictions, gloating. It&apos;s all permanent.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex gap-3">
              <Avatar message={m} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-white text-sm font-semibold">
                    {m.display_name ?? "Former member"}
                  </span>
                  {m.team_name && m.team_name !== m.display_name && (
                    <span className="text-gray-500 text-xs truncate">{m.team_name}</span>
                  )}
                  <span className="text-faint text-[10px]">{relativeTime(m.created_at)}</span>
                </div>
                <p className="text-gray-300 text-sm whitespace-pre-wrap break-words mt-0.5">
                  {m.body}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-edge pt-4">
        {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
        <div className="flex gap-2 items-end">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder="Message the league…"
            className="flex-1 bg-card-inset border border-edge rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-brand"
          />
          <button
            onClick={send}
            disabled={sending || !draft.trim()}
            className="px-5 py-2.5 bg-brand text-black font-semibold text-sm rounded-lg hover:bg-brand-hover transition-colors cursor-pointer disabled:opacity-40 shrink-0"
          >
            Send
          </button>
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-faint text-[10px]">Messages are permanent — no deleting.</span>
          {draft.length > MAX_LENGTH - 100 && (
            <span className="text-faint text-[10px]">
              {MAX_LENGTH - draft.length} characters left
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
