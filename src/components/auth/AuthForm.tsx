"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

interface AuthFormProps {
  onSuccess?: () => void;
  callbackUrl?: string;
}

export default function AuthForm({ onSuccess, callbackUrl = "/" }: AuthFormProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        // Create account first
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to create account");
          setLoading(false);
          return;
        }
      }

      // Sign in
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && (
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[#5a5e5a] font-semibold block mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (shown on leaderboard)"
              required={isSignup}
              className="w-full bg-[#111314] border border-[#3a3e3a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#C8A951] transition-colors"
            />
          </div>
        )}

        <div>
          <label className="text-[10px] uppercase tracking-wider text-[#5a5e5a] font-semibold block mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full bg-[#111314] border border-[#3a3e3a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#C8A951] transition-colors"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-[#5a5e5a] font-semibold block mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignup ? "At least 6 characters" : "Your password"}
            required
            minLength={isSignup ? 6 : undefined}
            className="w-full bg-[#111314] border border-[#3a3e3a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#C8A951] transition-colors"
          />
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#C8A951] text-black font-semibold text-sm rounded-lg hover:bg-[#d4b96a] transition-colors disabled:opacity-50 cursor-pointer"
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
