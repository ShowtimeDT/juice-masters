import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

export const metadata: Metadata = { title: "Off the fairway" };

/** Branded 404 — "out of bounds" golf scene. */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface text-text flex flex-col">
      <div className="p-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 w-max">
          <Logo size={34} />
          <b className="font-serif font-semibold text-xl text-ink">Juice Tour</b>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center text-center px-6 pb-20 relative overflow-hidden">
        <div
          className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: 720,
            height: 480,
            background: "radial-gradient(ellipse, rgba(201,162,75,0.1), transparent 64%)",
          }}
        />
        <div className="relative max-w-[480px]">
          <div className="w-[210px] h-[150px] mx-auto mb-3">
            <svg width="210" height="150" viewBox="0 0 210 150" fill="none">
              <text
                x="105"
                y="118"
                textAnchor="middle"
                fontFamily="Cormorant Garamond, serif"
                fontWeight="600"
                fontSize="130"
                fill="#1B2620"
              >
                404
              </text>
              <line x1="150" y1="118" x2="150" y2="40" stroke="#C9A24B" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M150 42 L182 50 L150 60 Z" fill="#E2C079" />
              <ellipse cx="156" cy="118" rx="20" ry="5" fill="#19241D" stroke="#2A3A2E" strokeWidth="1.5" />
              <path
                d="M40 120 Q70 70 120 96"
                stroke="#C9A24B"
                strokeWidth="2"
                strokeDasharray="1 9"
                strokeLinecap="round"
                opacity="0.6"
              />
              <circle cx="40" cy="120" r="8" fill="#EDEDE3" />
            </svg>
          </div>

          <h1 className="font-serif font-medium text-[34px] text-ink leading-[1.1]">
            That shot sailed out of bounds.
          </h1>
          <p className="text-base text-muted mt-3.5 mx-auto max-w-[38ch] leading-relaxed">
            We couldn&apos;t find the page you&apos;re looking for — it may have moved, or the link
            is mis-hit. Let&apos;s get you back on the fairway.
          </p>

          <div className="flex gap-3 justify-center mt-7 flex-wrap">
            <Link
              href="/"
              className="btn-gold inline-flex items-center h-[50px] px-[22px] rounded-xl font-semibold text-sm hover:-translate-y-px transition-transform"
            >
              Back to the app
            </Link>
            <Link
              href="/?home=1"
              className="inline-flex items-center h-[50px] px-[22px] rounded-xl font-semibold text-sm border border-gold/50 text-gold2 hover:bg-goldsoft transition-colors"
            >
              Your leagues
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
