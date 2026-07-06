"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";

interface AuthFormProps {
  onSuccess?: () => void;
  callbackUrl?: string;
}

const INPUT_SHELL =
  "flex items-center gap-2.5 h-[52px] rounded-xl border border-edge bg-bg2 px-[15px] transition-colors focus-within:border-gold/50";
const INPUT_FIELD =
  "flex-1 min-w-0 bg-transparent border-0 outline-none text-ink text-[15px] placeholder:text-faint";
const LBL = "mb-2 text-[10.5px] uppercase tracking-[1.6px] text-faint";

export default function AuthForm({ onSuccess, callbackUrl = "/" }: AuthFormProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="text-center">
      <h1 className="m-0 font-serif text-[38px] font-medium leading-[1.05] text-ink max-[480px]:text-[32px]">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-3 text-[15px] text-muted">
        {isSignup ? (
          <>
            Join your friends and play{" "}
            <b className="font-medium text-gold2">fantasy golf for the majors</b>.
          </>
        ) : (
          "Sign in to your leagues and pick up where you left off."
        )}
      </p>

      <div className="mt-[30px] text-left">
        {/* OAuth providers — Apple is visual-only (no provider configured). */}
        <div className="flex flex-col gap-[11px]">
          {hasGoogle && (
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl })}
              className="flex h-[52px] cursor-pointer items-center justify-center gap-[11px] rounded-[13px] border border-edge bg-card text-[15px] font-medium text-ink transition-colors hover:border-gold/50 hover:bg-surface2"
            >
              <svg className="h-5 w-5 flex-none" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" />
                <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 015.5 12c0-.73.13-1.43.34-2.1V7.06H2.18a11 11 0 000 9.88l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0012 1 11 11 0 002.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
              </svg>
              Continue with Google
            </button>
          )}
        </div>

        {hasGoogle && (
          <div className="my-[22px] flex items-center gap-3.5">
            <span className="h-px flex-1 bg-edge" />
            <span className="text-[11px] uppercase tracking-[1.6px] text-faint">or with email</span>
            <span className="h-px flex-1 bg-edge" />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* show/hide via conditional render (not a fade), per the design */}
          {isSignup && (
            <div className="mb-4 flex gap-3">
              <div className="min-w-0 flex-1">
                <div className={LBL}>First name</div>
                <div className={INPUT_SHELL}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Daniel"
                    required={isSignup}
                    className={INPUT_FIELD}
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className={LBL}>Username</div>
                <div className={INPUT_SHELL}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                    placeholder="@showtimedt"
                    required={isSignup}
                    minLength={3}
                    className={INPUT_FIELD}
                  />
                </div>
              </div>
            </div>
          )}

          <div className={LBL}>Email</div>
          <div className={`${INPUT_SHELL} mb-4`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-none text-faint">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
              <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              className={INPUT_FIELD}
            />
          </div>

          <div className={LBL}>Password</div>
          <div className={`${INPUT_SHELL} mb-4`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-none text-faint">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.7" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={isSignup ? 6 : undefined}
              className={INPUT_FIELD}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="flex flex-none cursor-pointer text-faint transition-colors hover:text-gold2"
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12s3.5-7 10-7c1.7 0 3.2.5 4.5 1.2M22 12s-3.5 7-10 7c-1.7 0-3.2-.5-4.5-1.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="1.7" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
                </svg>
              )}
            </button>
          </div>

          {error && <p className="mb-3 text-xs text-rose">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold flex h-[54px] w-full cursor-pointer items-center justify-center rounded-[13px] text-base font-semibold transition-transform hover:-translate-y-px disabled:opacity-50"
          >
            {loading ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center text-[13.5px] text-muted">
          {isSignup ? "Already have an account? " : "New to Juice Tour? "}
          <b
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
            className="cursor-pointer font-medium text-gold2"
          >
            {isSignup ? "Sign in" : "Create an account"}
          </b>
        </div>

        {isSignup && (
          <p className="mt-[22px] text-center text-[11.5px] leading-[1.5] text-faint">
            By creating an account you agree to our{" "}
            <a href="#" className="text-muted underline">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="text-muted underline">
              Privacy Policy
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}
