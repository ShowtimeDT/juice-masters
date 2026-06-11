"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthForm from "@/components/auth/AuthForm";

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
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="bg-card rounded-lg border border-edge p-8 w-full max-w-sm mx-4">
        <AuthForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
