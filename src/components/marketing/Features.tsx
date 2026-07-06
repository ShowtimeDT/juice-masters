import MyTeamFeature from "./MyTeamFeature";
import ChatFeature from "./ChatFeature";
import { GhostButton, LINKS } from "./buttons";

export default function Features() {
  return (
    <>
      {/* MY TEAM */}
      <section id="features" className="pb-[104px] pt-10">
        <div className="mx-auto max-w-[1140px] px-6 sm:px-10">
          <div className="grid grid-cols-1 items-center gap-[60px] lg:grid-cols-2">
            <div>
              <div className="eyebrow">Your team</div>
              <h2 className="mt-4 font-serif text-[clamp(30px,3.6vw,44px)] font-medium leading-[1.04] text-ink">
                Eight picks. Every shot tracked.
              </h2>
              <p className="mt-4 text-[16.5px] leading-[1.62] text-muted">
                Draft your roster by tier, then watch it live — hole-by-hole
                scorecards, round-by-round breakdowns, and your five counting
                scores marked in gold. Birdies glow green, doubles bite red.
                You’ll know exactly who’s carrying you.
              </p>
            </div>
            <MyTeamFeature />
          </div>
        </div>
      </section>

      {/* CHAT (reversed) */}
      <section className="pb-[104px] pt-10">
        <div className="mx-auto max-w-[1140px] px-6 sm:px-10">
          <div className="grid grid-cols-1 items-center gap-[60px] lg:grid-cols-2">
            <div className="lg:order-1">
              <ChatFeature />
            </div>
            <div className="lg:order-2">
              <div className="eyebrow">League chat</div>
              <h2 className="mt-4 font-serif text-[clamp(30px,3.6vw,44px)] font-medium leading-[1.04] text-ink">
                Talk your game. Permanently.
              </h2>
              <p className="mt-4 text-[16.5px] leading-[1.62] text-muted">
                Every league gets a built-in chat with a live Pulse of
                storylines while a major is on. Call your shots, roast the bad
                picks — and because nothing deletes, the receipts last all
                season.
              </p>
              <div className="mt-7">
                <GhostButton href={LINKS.signIn}>Peek inside</GhostButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
