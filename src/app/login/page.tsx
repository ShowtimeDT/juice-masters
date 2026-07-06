"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";
import Logo from "@/components/ui/Logo";

/** Only same-origin relative paths — never an external redirect target. */
function safeCallbackUrl(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [callbackUrl, setCallbackUrl] = useState("/");

  // (window.location avoids the useSearchParams Suspense requirement.)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCallbackUrl(safeCallbackUrl(params.get("callbackUrl")));
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  if (status === "authenticated") return null;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="flex items-center justify-between px-[30px] py-[22px]">
        <Link href="/" className="flex items-center gap-[11px] no-underline">
          <Logo size={34} />
          <b className="font-serif text-xl font-semibold text-ink">Juice Tour</b>
        </Link>
        <Link href="/" className="text-[13px] text-muted no-underline transition-colors hover:text-gold2">
          ← Back to site
        </Link>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 pb-[70px] pt-5">
        <div
          className="pointer-events-none absolute left-1/2 top-[30%] h-[520px] w-[760px] -translate-x-1/2 -translate-y-1/2"
          style={{
            background: "radial-gradient(ellipse, rgba(201,162,75,0.12), transparent 64%)",
          }}
        />
        <div className="relative w-full max-w-[430px]">
          <div className="mb-[22px] flex justify-center">
            <Logo size={72} />
          </div>
          <AuthForm callbackUrl={callbackUrl} />
        </div>
      </div>
    </div>
  );
}
