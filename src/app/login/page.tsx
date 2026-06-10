"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AuthForm from "@/components/auth/AuthForm";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "authenticated") return null;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="bg-card rounded-lg border border-edge p-8 w-full max-w-sm mx-4">
        <AuthForm callbackUrl="/" />
      </div>
    </div>
  );
}
