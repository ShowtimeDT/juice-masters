/**
 * "Thru" indicator — a conic-gradient ring filling holesPlayed/18 of the circle.
 * "F" (finished) renders a bordered gold "F" chip instead. Accepts the raw
 * `thru` value from GolferScore ("F", a hole number like "14", or "-").
 */
interface ProgressRingProps {
  thru: string;
  size?: number;
  /** Slightly lighter inner disc on the viewer's own (gold-tinted) card. */
  you?: boolean;
}

export default function ProgressRing({ thru, size = 30, you = false }: ProgressRingProps) {
  if (thru === "F") {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full border-[1.5px] border-gold/55 text-gold2 font-semibold tracking-[0.5px]"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        F
      </span>
    );
  }

  const holes = Number.parseInt(thru, 10);
  const deg = Number.isFinite(holes) ? Math.round((holes / 18) * 360) : 0;
  const label = Number.isFinite(holes) ? String(holes) : "–";
  const innerBg = you ? "#15201A" : "var(--surface)";

  return (
    <span
      className="relative inline-flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--gold) ${deg}deg, rgba(255,255,255,0.09) 0)`,
      }}
    >
      <span
        className="absolute rounded-full"
        style={{ inset: 2.5, background: innerBg }}
      />
      <span
        className="relative font-semibold text-ink tnum"
        style={{ fontSize: size * 0.37 }}
      >
        {label}
      </span>
    </span>
  );
}
