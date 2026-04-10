"use client";

import { useState } from "react";

interface PasswordGateProps {
  onAuthenticated: (password: string) => void;
}

export default function PasswordGate({ onAuthenticated }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();

    if (data.authorized) {
      sessionStorage.setItem("adminPassword", password);
      onAuthenticated(password);
    } else {
      setError("Invalid password");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
      <div className="bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-8 w-full max-w-sm">
        <h1 className="text-white font-serif text-2xl font-bold text-center mb-6">
          Juice Tour Admin
        </h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full bg-[#111314] border border-[#3a3e3a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#C8A951] transition-colors"
          />
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full mt-4 py-3 bg-[#C8A951] text-black font-semibold text-sm rounded-lg hover:bg-[#d4b96a] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Checking..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
