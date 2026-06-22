import Link from "next/link";
import Logo from "@/components/ui/Logo";

interface ScreenPlaceholderProps {
  eyebrow?: string;
  title: string;
  body: string;
  /** Optional secondary note, e.g. a backend-pending caveat. */
  note?: string;
  backHref?: string;
  backLabel?: string;
}

/**
 * Shared branded placeholder for screens whose backend isn't built yet
 * (e.g. Notifications) or that are reskinned in a later phase.
 */
export default function ScreenPlaceholder({
  eyebrow,
  title,
  body,
  note,
  backHref = "/",
  backLabel = "Back to the app",
}: ScreenPlaceholderProps) {
  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6 opacity-90">
          <Logo size={72} />
        </div>
        {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
        <h1 className="font-serif font-medium text-4xl text-ink mb-3">{title}</h1>
        <p className="text-text text-[15px] leading-relaxed">{body}</p>
        {note && <p className="text-faint text-xs mt-4">{note}</p>}
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 mt-8 rounded-full border border-gold/40 bg-goldsoft px-5 py-2.5 text-[13px] text-gold2 hover:border-gold/70 transition-colors"
        >
          {backLabel}
        </Link>
      </div>
    </main>
  );
}
