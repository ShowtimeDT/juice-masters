import Logo from "@/components/ui/Logo";
import ProductShot from "./ProductShot";
import { GoldButton, GhostButton, LINKS } from "./buttons";

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-[70px] pt-[150px] text-center sm:px-10">
      {/* Gold radial glow behind the emblem */}
      <div
        className="pointer-events-none absolute left-1/2 top-[-12%] h-[520px] w-[760px] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse, rgba(201,162,75,0.14), transparent 64%)",
        }}
      />

      <div className="relative mx-auto max-w-[1140px]">
        {/* Dawn emblem */}
        <div className="mb-[26px] flex flex-col items-center">
          <Logo size={92} />
          <span className="mt-2 text-[11px] font-medium uppercase tracking-[3px] text-muted">
            Four Majors
          </span>
        </div>

        <h1 className="font-serif text-[clamp(52px,7vw,92px)] font-medium leading-[1.02] tracking-[-0.5px] text-ink">
          Fantasy golf
          <br />
          for the <em className="italic font-medium text-gold2">majors</em>.
        </h1>

        <p className="mx-auto mt-[26px] max-w-[40ch] text-[18.5px] leading-[1.62] text-text">
          Draft a team of eight pros with your friends before each major, then
          sweat every putt together — live scoring, season-long bragging rights,
          zero spreadsheets.
        </p>

        <div className="mt-[34px] flex flex-wrap justify-center gap-[14px]">
          <GoldButton href={LINKS.create}>Create a League</GoldButton>
          <GhostButton href={LINKS.join}>Join a League</GhostButton>
        </div>

        <p className="mt-5 text-[13px] tracking-[0.3px] text-faint">
          Sign in with Google or email · Free to play
        </p>

        {/* Product shot — the real Standings cards in an app window */}
        <AppFrame />
      </div>
    </section>
  );
}

/**
 * Browser-chrome "app window" wrapping the real Standings demo. The window bar
 * carries the Dawn mark, wordmark, and the Standings/My Team/Chat tabs; the
 * body renders <ProductShot/> — the live Standings board built from the same
 * DEMO_STANDINGS as the rest of the marketing demo.
 */
function AppFrame() {
  return (
    <div
      className="relative mx-auto mt-[62px] max-w-[980px] overflow-hidden rounded-[18px] border border-edge bg-surface text-left"
      style={{
        boxShadow:
          "0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,162,75,0.06)",
      }}
    >
      <div className="flex h-[54px] items-center justify-between gap-6 border-b border-edge bg-bg2/60 px-[22px]">
        <div className="flex items-center gap-2.5">
          <Logo size={24} arched={false} />
          <b className="whitespace-nowrap font-serif text-[17px] font-semibold text-ink">
            Juice Tour
          </b>
        </div>
        <div className="hidden h-[54px] items-stretch gap-[22px] sm:flex">
          <span className="flex items-center border-b-2 border-gold text-[12.5px] font-medium text-ink">
            Standings
          </span>
          <span className="flex items-center text-[12.5px] text-muted">
            My Team
          </span>
          <span className="flex items-center text-[12.5px] text-muted">Chat</span>
        </div>
      </div>

      <ProductShot />
    </div>
  );
}
