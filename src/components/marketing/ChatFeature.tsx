interface ChatMsg {
  you?: boolean;
  initials?: string;
  name?: string;
  handle?: string;
  text: string;
}

const MESSAGES: ChatMsg[] = [
  { initials: "AG", name: "Ari G", handle: "Ari G", text: "anyone else watching Fleetwood cook 🔥" },
  { initials: "ES", name: "Eric S", handle: "SlickRic", text: "my whole roster missed the cut lol" },
  { you: true, text: "skill issue" },
  { initials: "JP", name: "JT P", handle: "JT’s Squad", text: "Scheffler +2 is criminal" },
  { you: true, text: "Free Scottie" },
];

/** Chat product card — your messages in gold "you" bubbles, others dark. */
export default function ChatFeature() {
  return (
    <div className="overflow-hidden rounded-[16px] border border-edge bg-card shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col gap-3.5 px-[22px] py-5">
        {MESSAGES.map((m, i) =>
          m.you ? (
            <div key={i} className="ml-auto flex max-w-[84%] flex-col items-end">
              <div className="w-fit max-w-full rounded-[14px] rounded-tr-[5px] border border-gold/[0.32] bg-gold/[0.13] px-[13px] py-2 text-[14px] leading-[1.4] text-ink">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={i} className="flex max-w-[84%] gap-[11px]">
              <span className="mt-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-goldsoft text-[12px] font-semibold text-gold2">
                {m.initials}
              </span>
              <div>
                <div className="mb-[5px] text-[12.5px] font-semibold text-ink">
                  {m.name}
                  <span className="ml-1.5 text-[11px] font-normal text-gold">
                    {m.handle}
                  </span>
                </div>
                <div className="w-fit max-w-full rounded-[14px] rounded-tl-[5px] border border-edge bg-surface2 px-[13px] py-2 text-[14px] leading-[1.4] text-text">
                  {m.text}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
