"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const links = [
  { href: "/trainer", label: "Dashboard", exact: true },
  { href: "/trainer/clients", label: "Clients", exact: false },
  { href: "/trainer/schedule", label: "Schedule", exact: false },
];

export function TrainerNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-14 items-center">
          <div className="flex items-center gap-8">
            <Link href="/trainer" className="text-lg font-bold tracking-tight">
              <span className="text-bordeaux-500">Fit</span><span className="text-white">Book</span>
            </Link>
            <div className="flex items-center gap-0.5">
              {links.map((link) => {
                const active = link.exact
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative text-sm px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
                      active
                        ? "text-white bg-neutral-800/60"
                        : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/30"
                    }`}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-bordeaux-500 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {session && (
            <div className="flex items-center gap-3">
              {session.user?.image && (
                <img src={session.user.image} alt="" className="w-7 h-7 rounded-full ring-1 ring-neutral-700" />
              )}
              <span className="text-sm text-neutral-400 hidden sm:inline">{session.user?.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors ml-1"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
