"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

interface ProgramExercise {
  id: string;
  actualSets: number | null;
  actualReps: number | null;
  actualLoadKg: number | null;
}

interface ProgramDay {
  id: string;
  dayNumber: number;
  label: string | null;
  exercises: ProgramExercise[];
}

interface ProgramWeek {
  id: string;
  weekNumber: number;
  days: ProgramDay[];
}

interface Program {
  id: string;
  name: string;
  status: string;
  daysPerWeek: number;
  weeks: ProgramWeek[];
}

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  notes: string | null;
}

interface ClientData {
  id: string;
  name: string;
  paidUntil: string | null;
  programs: Program[];
  bookings: Booking[];
}

function getCompletionPercent(program: Program): number {
  let total = 0;
  let completed = 0;
  for (const week of program.weeks) {
    for (const day of week.days) {
      for (const ex of day.exercises) {
        total++;
        if (ex.actualSets != null || ex.actualReps != null || ex.actualLoadKg != null) {
          completed++;
        }
      }
    }
  }
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

function SubscriptionBanner({ paidUntil, t }: { paidUntil: string | null; t: (key: any) => string }) {
  if (!paidUntil) return null;

  const expiry = new Date(paidUntil);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const graceDays = 5;

  if (diffDays > graceDays) {
    // Active
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-3.5 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[14px] text-emerald-400">
            {t("subscriptionActive")} {expiry.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>
    );
  }

  if (diffDays > -graceDays) {
    // Within grace period (could be slightly past or about to expire)
    const daysLeft = Math.max(0, diffDays + graceDays);
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-3.5 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[14px] text-amber-400">
            {t("subscriptionExpiring")}
            {daysLeft > 0 && ` (${daysLeft}d)`}
          </span>
        </div>
      </div>
    );
  }

  // Past grace period
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-3.5 mb-6">
      <div className="flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-[14px] text-red-400">
          {t("subscriptionExpired")} — {t("contactTrainer")}
        </span>
      </div>
    </div>
  );
}

function isSubscriptionBlocked(paidUntil: string | null): boolean {
  if (!paidUntil) return false;
  const expiry = new Date(paidUntil);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays <= -5;
}

export default function ClientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/client/me")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => {
        setClientData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="space-y-10">
        <div>
          <div className="h-6 w-48 bg-neutral-800 rounded animate-pulse" />
          <div className="h-4 w-64 bg-neutral-800 rounded animate-pulse mt-2" />
        </div>
        <div className="h-16 bg-neutral-800/50 rounded-2xl animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card px-5 py-4">
              <div className="h-4 w-40 bg-neutral-800 rounded animate-pulse" />
              <div className="h-2 w-full bg-neutral-800 rounded-full animate-pulse mt-3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !clientData) {
    return (
      <div className="card px-6 py-14 text-center">
        <p className="text-neutral-400 text-[14px]">{error || "Could not load your profile."}</p>
      </div>
    );
  }

  const blocked = isSubscriptionBlocked(clientData.paidUntil);
  const activePrograms = clientData.programs.filter((p) => p.status === "ACTIVE");

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">
          {t("welcome")}, {clientData.name}
        </h1>
      </div>

      {/* Subscription banner */}
      <SubscriptionBanner paidUntil={clientData.paidUntil} t={t} />

      {/* Programs */}
      {!blocked && (
        <div className="mb-10">
          <h2 className="section-title mb-4">{t("myPrograms")}</h2>
          {activePrograms.length === 0 ? (
            <div className="card px-6 py-10 text-center">
              <p className="text-[14px] text-neutral-500">{t("noProgramsYet")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activePrograms.map((program) => {
                const pct = getCompletionPercent(program);
                return (
                  <div
                    key={program.id}
                    className="card px-4 sm:px-5 py-4 hover:bg-[#151515] transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[14px] text-neutral-200 font-medium">{program.name}</span>
                      <span className="text-[12px] text-neutral-500 tabular-nums">{pct}% {t("completion")}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[12px] text-neutral-600">
                        {program.weeks.length} {t("weeks").toLowerCase()}
                      </span>
                      <span className="text-[12px] text-neutral-600">
                        {program.daysPerWeek} {t("daysPerWeek").toLowerCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {blocked && (
        <div className="mb-10">
          <div className="card px-6 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-[14px] text-neutral-400">{t("subscriptionExpired")}</p>
            <p className="text-[13px] text-neutral-600 mt-1">{t("contactTrainer")}</p>
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      <div>
        <h2 className="section-title mb-4">{t("upcomingSessions")}</h2>
        {clientData.bookings.length === 0 ? (
          <div className="card px-6 py-10 text-center">
            <p className="text-[14px] text-neutral-500">{t("noUpcomingSessions")}</p>
          </div>
        ) : (
          <div className="card overflow-hidden divide-y divide-[#181818]">
            {clientData.bookings.map((booking) => {
              const date = new Date(booking.date);
              const start = new Date(booking.startTime);
              const end = new Date(booking.endTime);
              const fmtDate = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
              const fmtTime = `${start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;

              return (
                <div key={booking.id} className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-2 h-2 rounded-full ${
                      booking.status === "CONFIRMED" ? "bg-emerald-500" :
                      booking.status === "PENDING" ? "bg-amber-500" :
                      "bg-neutral-600"
                    }`} />
                    <div>
                      <span className="text-[14px] text-neutral-300">{fmtDate}</span>
                      <p className="text-[12px] text-neutral-600 mt-0.5">{fmtTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] text-neutral-600 capitalize">{booking.type.toLowerCase()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
