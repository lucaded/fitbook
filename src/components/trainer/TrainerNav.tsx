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
    <nav className="sticky top-0 z-50 bg-[#0c0c0c]/90 backdrop-blur-md border-b border-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-12 items-center">
          <div className="flex items-center gap-8">
            <Link href="/trainer" className="text-[15px] font-semibold tracking-tight text-neutral-100">
              FitBook
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
                    className={`text-[13px] px-3 py-1 rounded-md transition-colors duration-150 ${
                      active
                        ? "text-neutral-100 bg-[#1a1a1a]"
                        : "text-neutral-500 hover:text-neutral-300"
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
                <img src={session.user.image} alt="" className="w-6 h-6 rounded-full" />
              )}
              <span className="text-[13px] text-neutral-500 hidden sm:inline">{session.user?.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-[12px] text-neutral-600 hover:text-neutral-400 transition-colors ml-1"
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
