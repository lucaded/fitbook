"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-neutral-950 border-b border-neutral-800">
      <div className="max-w-[95vw] mx-auto px-4">
        <div className="flex justify-between h-14 items-center">
          <Link href="/" className="text-lg font-bold text-bordeaux-500 tracking-tight">
            FitBook
          </Link>

          <div className="flex items-center gap-5">
            <Link href="/program" className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors">
              Program
            </Link>
            {session ? (
              <>
                <Link href="/bookings" className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors">
                  Bookings
                </Link>
                <Link href="/training" className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors">
                  Training
                </Link>
                <Link href="/profile" className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors">
                  Profile
                </Link>
                <div className="flex items-center gap-2 pl-3 border-l border-neutral-800">
                  {session.user.image && (
                    <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
                  )}
                  <button
                    onClick={() => signOut()}
                    className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-bordeaux-700 text-white px-4 py-1.5 rounded text-sm hover:bg-bordeaux-600 transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
