"use client";

import { signIn } from "next-auth/react";

interface InviteClientProps {
  token: string;
  trainerName: string;
  trainerImage: string | null;
  clientName: string;
  expired: boolean;
  alreadyUsed: boolean;
  alreadyLinked: boolean;
}

export default function InviteClient({
  token,
  trainerName,
  trainerImage,
  clientName,
  expired,
  alreadyUsed,
  alreadyLinked,
}: InviteClientProps) {
  const hasError = expired || alreadyUsed || alreadyLinked;

  const handleSignIn = () => {
    // Store the invite token so after OAuth we can accept it
    sessionStorage.setItem("fitbook-invite-token", token);
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="card p-8">
          <div className="text-center mb-8">
            <img
              src="/icons/fitbook-app-icon.svg"
              alt="FitBook"
              className="w-16 h-16 mx-auto mb-4 rounded-2xl"
            />
            <img
              src="/icons/fitbook-logo-dark.svg"
              alt="FitBook"
              className="h-7 mx-auto mb-2"
            />
          </div>

          {hasError ? (
            <div className="text-center">
              {expired && (
                <div>
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-[16px] font-semibold text-neutral-200 mb-2">
                    Invite Expired
                  </h2>
                  <p className="text-[14px] text-neutral-500">
                    This invite link has expired. Ask your trainer to send a new one.
                  </p>
                </div>
              )}
              {alreadyUsed && !expired && (
                <div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-[16px] font-semibold text-neutral-200 mb-2">
                    Invite Already Used
                  </h2>
                  <p className="text-[14px] text-neutral-500">
                    This invite has already been accepted. Sign in to access your account.
                  </p>
                  <button
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    className="mt-6 w-full flex items-center justify-center gap-3 bg-[#0e0e0e] border border-[#1e1e1e] rounded-xl px-5 py-3 text-neutral-300 text-[14px] hover:bg-[#161616] hover:border-[#282828] transition-all duration-200"
                  >
                    Sign in with Google
                  </button>
                </div>
              )}
              {alreadyLinked && !alreadyUsed && !expired && (
                <div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-[16px] font-semibold text-neutral-200 mb-2">
                    Account Already Connected
                  </h2>
                  <p className="text-[14px] text-neutral-500">
                    This client profile is already linked to an account. Sign in to access it.
                  </p>
                  <button
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    className="mt-6 w-full flex items-center justify-center gap-3 bg-[#0e0e0e] border border-[#1e1e1e] rounded-xl px-5 py-3 text-neutral-300 text-[14px] hover:bg-[#161616] hover:border-[#282828] transition-all duration-200"
                  >
                    Sign in with Google
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              {trainerImage && (
                <img
                  src={trainerImage}
                  alt={trainerName}
                  className="w-12 h-12 rounded-full mx-auto mb-3 border border-[#282828]"
                />
              )}
              <h2 className="text-[16px] font-semibold text-neutral-200 mb-1">
                {trainerName}
              </h2>
              <p className="text-[14px] text-neutral-500 mb-1">
                has invited you to FitBook
              </p>
              <p className="text-[14px] text-neutral-400 mb-6">
                as <span className="text-neutral-200 font-medium">{clientName}</span>
              </p>

              <p className="text-[13px] text-neutral-600 mb-6">
                Sign in with Google to access your training programs, track your progress, and communicate with your trainer.
              </p>

              <button
                onClick={handleSignIn}
                className="w-full flex items-center justify-center gap-3 bg-[#0e0e0e] border border-[#1e1e1e] rounded-xl px-5 py-3 text-neutral-300 text-[14px] hover:bg-[#161616] hover:border-[#282828] transition-all duration-200"
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-neutral-700 text-[12px] mt-6">
          Antonio De Donno Personal Training
        </p>
      </div>
    </div>
  );
}
