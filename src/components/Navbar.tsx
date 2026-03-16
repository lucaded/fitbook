"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-xl font-bold text-primary-700">
            FitBook
          </Link>

          {session ? (
            <div className="flex items-center gap-6">
              <Link
                href="/bookings"
                className="text-gray-600 hover:text-primary-600"
              >
                Bookings
              </Link>
              <Link
                href="/training"
                className="text-gray-600 hover:text-primary-600"
              >
                Training
              </Link>
              <Link
                href="/profile"
                className="text-gray-600 hover:text-primary-600"
              >
                Profile
              </Link>
              <div className="flex items-center gap-3">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
