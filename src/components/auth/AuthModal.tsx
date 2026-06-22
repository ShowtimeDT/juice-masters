"use client";

import AuthForm from "./AuthForm";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-edge bg-card p-8">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 cursor-pointer text-faint transition-colors hover:text-gold2"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <AuthForm onSuccess={onSuccess} />
      </div>
    </div>
  );
}
