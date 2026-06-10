"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";

interface AuthFormProps {
  onSuccess?: () => void;
  callbackUrl?: string;
}

export default function AuthForm({ onSuccess, callbackUrl = "/" }: AuthFormProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasGoogle, setHasGoogle] = useState(false);

  // Only offer Google when the server actually has it configured.
  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => (r.ok ? r.json() : {}))
      .then((providers: Record<string, unknown>) => setHasGoogle(!!providers?.google))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, username, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to create account");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(isSignup ? "Account created but login failed. Try logging in." : "Invalid email or password");
        setLoading(false);
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = callbackUrl;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-white font-serif text-2xl font-bold text-center mb-6">
        {isSignup ? "Create Account" : "Sign In"}
      </h2>

      {/* OAuth providers */}
      {hasGoogle && (
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl })}
        className="w-full py-3 bg-white text-gray-800 font-semibold text-sm rounded-lg hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" />
          <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 015.5 12c0-.73.13-1.43.34-2.1V7.06H2.18a11 11 0 000 9.88l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0012 1 11 11 0 002.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
        Continue with Google
      </button>
      )}

      {hasGoogle && (
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-edge" />
        <span className="text-faint text-[10px] uppercase tracking-wider">or use email</span>
        <div className="flex-1 h-px bg-edge" />
      </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && (
          <>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-faint font-semibold block mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required={isSignup}
                className="w-full bg-card-inset border border-edge rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-faint font-semibold block mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                placeholder="Choose a username"
                required={isSignup}
                minLength={3}
                className="w-full bg-card-inset border border-edge rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-brand transition-colors"
              />
              <p className="text-gray-600 text-[10px] mt-1">Letters, numbers, and underscores only</p>
            </div>
          </>
        )}

        <div>
          <label className="text-[10px] uppercase tracking-wider text-faint font-semibold block mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full bg-card-inset border border-edge rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-faint font-semibold block mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignup ? "At least 6 characters" : "Your password"}
            required
            minLength={isSignup ? 6 : undefined}
            className="w-full bg-card-inset border border-edge rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-brand text-black font-semibold text-sm rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={() => { setIsSignup(!isSignup); setError(""); }}
          className="text-gray-400 text-sm hover:text-white transition-colors cursor-pointer"
        >
          {isSignup ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
