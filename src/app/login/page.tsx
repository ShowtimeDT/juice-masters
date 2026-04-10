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
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
      <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-8 w-full max-w-sm mx-4">
        <AuthForm callbackUrl="/" />
      </div>
    </div>
  );
}
