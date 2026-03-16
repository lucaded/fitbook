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
    <nav className="bg-neutral-950 border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-14 items-center">
          <div className="flex items-center gap-6">
            <Link href="/trainer" className="text-lg font-bold text-bordeaux-500 tracking-tight">
              FitBook
            </Link>
            <div className="flex items-center gap-1">
              {links.map((link) => {
                const active = link.exact
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm px-3 py-1.5 rounded transition-colors ${
                      active
                        ? "bg-neutral-800 text-white"
                        : "text-neutral-400 hover:text-neutral-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {session && (
            <div className="flex items-center gap-3">
              {session.user?.image && (
                <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
              )}
              <span className="text-sm text-neutral-400">{session.user?.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors ml-2"
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
