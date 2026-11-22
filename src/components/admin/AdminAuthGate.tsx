import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  KeyRound,
  Loader2,
  LogOut,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { usePortfolioData } from '../../context/PortfolioDataContext';

interface AdminAuthGateProps {
  onReturnPortfolio: () => void;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({ onReturnPortfolio }) => {
  const {
    user,
    authReady,
    roleChecking,
    authError,
    signInWithGoogle,
    signOutAdmin,
    clearAuthError,
  } = usePortfolioData();

  const [signingIn, setSigningIn] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setSigningIn(false);
    }
  };

  const handleCopyUid = async () => {
    if (!user?.uid) return;
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      window.setTimeout(() => setCopiedUid(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  if (!authReady || roleChecking) {
    return (
      <div className="min-h-full bg-[#f8fafc] text-[#0f172a] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-8 text-center shadow-sm">
          <div className="mx-auto w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-4">
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 m-0">
            Verifying administrator session
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 m-0">
            Checking Google identity and database access permissions...
          </p>
        </div>
      </div>
    );
  }

  // Signed in, but not authorized (either unverified email or not in admin roster)
  if (user) {
    const emailUnverified = !user.emailVerified;
    return (
      <div className="min-h-full bg-[#f8fafc] text-[#0f172a] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-7 sm:p-8 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
              <ShieldAlert className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 m-0">
                Access Denied
              </h1>
              <p className="mt-1 text-sm text-slate-600 m-0 leading-relaxed">
                {emailUnverified
                  ? 'Your Google account email is not verified. Only verified accounts can access the administration workspace.'
                  : 'This Google account is not on the authorized portfolio administrator roster.'}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 font-medium">Signed-in account</span>
              <span className="font-mono-tech font-medium text-slate-900 truncate">
                {user.email ?? 'Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
              <span className="text-slate-500 font-medium">Account UID</span>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono-tech text-slate-700 truncate max-w-[190px]">
                  {user.uid}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors shrink-0"
                >
                  {copiedUid ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500 leading-relaxed m-0">
            If you need access, share your Account UID above with the Super Admin so they can authorize your account in Security &amp; Access.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={signOutAdmin}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sign Out &amp; Switch Account</span>
            </button>
            <button
              type="button"
              onClick={onReturnPortfolio}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back to Portfolio</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Signed out — Zero-Trust Google Auth Gate
  return (
    <div className="min-h-full bg-[#f8fafc] text-[#0f172a] flex flex-col justify-between p-6 sm:p-10">
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={onReturnPortfolio}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Portfolio</span>
        </button>

        <span className="font-mono-tech text-xs text-slate-500">
          Portfolio Admin Console
        </span>
      </div>

      <div className="my-auto py-10 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-7 sm:p-8 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-5">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">
            Admin Sign In
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed m-0">
            Sign in with an authorized Google account to manage projects, visual works, profile links, and security permissions.
          </p>

          {authError && (
            <div
              role="alert"
              className="mt-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 flex items-start justify-between gap-3"
            >
              <span>{authError}</span>
              <button
                type="button"
                onClick={clearAuthError}
                className="text-red-600 font-semibold hover:underline cursor-pointer shrink-0 bg-transparent border-0 p-0"
              >
                Dismiss
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={signingIn}
            onClick={handleGoogleSignIn}
            className="mt-6 w-full inline-flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 cursor-pointer transition-colors"
          >
            {signingIn ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.64Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.87-3c-1.07.72-2.44 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.29 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.29a12 12 0 0 0 0 10.8l4-3.1Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.6l4 3.1c.94-2.84 3.59-4.95 6.71-4.95Z"
                />
              </svg>
            )}
            <span>{signingIn ? 'Opening Google Sign-In...' : 'Continue with Google'}</span>
          </button>

          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5 text-xs text-slate-500">
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>Database-enforced role verification on every write</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
              <span>Immutable append-only audit log for all admin changes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto text-center text-xs text-slate-400">
        Unauthorized access attempts are blocked at the database layer.
      </div>
    </div>
  );
};
