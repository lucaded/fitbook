"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useI18n } from "@/lib/i18n";
import { Guide } from "./Guide";

export function TrainerNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { locale, setLocale, t } = useI18n();
  const [showGuide, setShowGuide] = useState(false);

  // Show guide on first visit
  useEffect(() => {
    const seen = localStorage.getItem("fitbook-guide-seen");
    if (!seen) setShowGuide(true);
  }, []);

  const closeGuide = () => {
    setShowGuide(false);
    localStorage.setItem("fitbook-guide-seen", "1");
  };

  const links = [
    { href: "/trainer", label: t("home"), exact: true },
    { href: "/trainer/clients", label: t("clients"), exact: false },
    { href: "/trainer/schedule", label: t("schedule"), exact: false },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-[#181818]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center gap-4 sm:gap-10">
              <Link href="/trainer" className="text-[17px] font-bold tracking-tight text-neutral-50">
                FitBook
              </Link>
              <div className="flex items-center gap-0.5 sm:gap-1">
                {links.map((link) => {
                  const active = link.exact
                    ? pathname === link.href
                    : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`text-[13px] sm:text-[14px] px-3 sm:px-4 py-1.5 rounded-full transition-all duration-200 ${
                        active
                          ? "text-neutral-50 bg-[#1a1a1a]"
                          : "text-neutral-500 hover:text-neutral-200"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Guide button */}
              <button
                onClick={() => setShowGuide(true)}
                className="text-[13px] text-neutral-600 hover:text-neutral-300 px-2.5 py-1 rounded-full hover:bg-[#161616] transition-all duration-200"
                title={locale === "it" ? "Guida" : "Guide"}
              >
                ?
              </button>

              {/* Language toggle */}
              <div className="flex bg-[#111] rounded-full p-0.5 border border-[#1c1c1c]">
                <button
                  onClick={() => setLocale("en")}
                  className={`text-[12px] rounded-full px-2.5 py-0.5 transition-all duration-200 ${locale === "en" ? "bg-[#1e1e1e] text-neutral-200" : "text-neutral-600 hover:text-neutral-400"}`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLocale("it")}
                  className={`text-[12px] rounded-full px-2.5 py-0.5 transition-all duration-200 ${locale === "it" ? "bg-[#1e1e1e] text-neutral-200" : "text-neutral-600 hover:text-neutral-400"}`}
                >
                  IT
                </button>
              </div>

              {session && (
                <>
                  {session.user?.image && (
                    <img src={session.user.image} alt="" className="w-7 h-7 rounded-full ring-2 ring-[#1e1e1e]" />
                  )}
                  <span className="text-[14px] text-neutral-500 hidden sm:inline">{session.user?.name}</span>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="text-[13px] text-neutral-600 hover:text-neutral-400 transition-colors ml-1 sm:ml-2 hidden sm:inline"
                  >
                    {t("signOut")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showGuide && <Guide onClose={closeGuide} />}
    </>
  );
}
