/**
 * Birdie tiebreaker bar. Fills to `birdiesSoFar / guess` — the closest guess
 * shows the fullest bar (do NOT invert). Color is passed in (the panel grades
 * it gold→rose by closeness).
 */
interface BirdieBarProps {
  birdiesSoFar: number;
  guess: number;
  color: string;
}

export default function BirdieBar({ birdiesSoFar, guess, color }: BirdieBarProps) {
  const pct = guess > 0 ? Math.min(100, Math.round((birdiesSoFar / guess) * 100)) : 0;
  return (
    <span className="block h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
      <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </span>
  );
}
