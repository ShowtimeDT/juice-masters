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
      <div className="relative bg-[#1e2124] rounded-lg border border-[#3a3e3a] p-8 w-full max-w-sm mx-4">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-white cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <AuthForm onSuccess={onSuccess} />
      </div>
    </div>
  );
}
