"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/trainer", label: "Dashboard" },
  { href: "/trainer/clients", label: "Clients" },
  { href: "/trainer/schedule", label: "Schedule" },
  { href: "/program", label: "Program Builder" },
];

export function TrainerNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-neutral-950 border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-14 items-center">
          <Link href="/trainer" className="text-lg font-bold text-bordeaux-500 tracking-tight">
            FitBook
          </Link>
          <div className="flex items-center gap-1">
            {links.map((link) => {
              const active = pathname === link.href || (link.href !== "/trainer" && pathname.startsWith(link.href));
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
      </div>
    </nav>
  );
}
