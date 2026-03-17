"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

interface ClientSummary {
  id: string;
  name: string;
  active: boolean;
  _count: { programs: number; bookings: number };
}

interface WeeklyPulse {
  sessionsBooked: number;
  sessionsCompleted: number;
  programsActive: number;
  exercisesLogged: number;
}

export default function TrainerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState<WeeklyPulse | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => { setClients(data); setLoading(false); })
      .catch(() => setLoading(false));
    fetch("/api/trainer/weekly-pulse")
      .then((r) => r.json())
      .then((data) => { if (!data.error) setPulse(data); })
      .catch(() => {});
  }, []);

  const activeClients = clients.filter((c) => c.active);
  const totalPrograms = clients.reduce((s, c) => s + c._count.programs, 0);

  if (status === "loading") return (
    <div className="space-y-10">
      <div><div className="h-6 w-36 bg-neutral-800 rounded animate-pulse" /><div className="h-4 w-56 bg-neutral-800 rounded animate-pulse mt-2" /></div>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[1, 2, 3].map((i) => <div key={i} className="card px-4 sm:px-6 py-4 sm:py-5"><div className="h-8 w-12 bg-neutral-800 rounded animate-pulse" /><div className="h-3 w-20 bg-neutral-800 rounded animate-pulse mt-2" /></div>)}
      </div>
      <div className="card overflow-hidden divide-y divide-[#181818]">
        {[1, 2, 3].map((i) => <div key={i} className="flex items-center gap-3.5 px-5 py-4"><div className="w-2 h-2 rounded-full bg-neutral-800 animate-pulse" /><div className="h-4 w-32 bg-neutral-800 rounded animate-pulse" /></div>)}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-xl font-bold tracking-tight">{t("dashboard")}</h1>
        <p className="text-[14px] text-neutral-500 mt-1">{t("dashboardSub")}</p>
      </div>

      {/* Weekly Pulse */}
      {pulse && (
        <div className="bg-[#111] border border-[#181818] rounded-2xl px-5 py-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-neutral-200">{t("weeklyPulse")}</h2>
            <span className="text-[12px] text-neutral-600">{(() => {
              const now = new Date();
              const day = now.getDay();
              const diffToMonday = day === 0 ? -6 : 1 - day;
              const mon = new Date(now); mon.setDate(now.getDate() + diffToMonday);
              const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
              const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
              return `${fmt(mon)}\u2013${fmt(sun)}`;
            })()}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xl font-bold text-neutral-100 tabular-nums">
                {pulse.sessionsCompleted}<span className="text-neutral-600 text-[14px] font-normal">/{pulse.sessionsBooked}</span>
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">{t("sessionsCompleted")}</p>
            </div>
            <div>
              <p className="text-xl font-bold text-neutral-100 tabular-nums">{pulse.programsActive}</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">{t("programsActive")}</p>
            </div>
            <div>
              <p className="text-xl font-bold text-neutral-100 tabular-nums">{pulse.exercisesLogged}</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">{t("exercisesLogged")}</p>
            </div>
          </div>
          <p className="text-[12px] text-neutral-600 mt-3 italic">
            {pulse.sessionsBooked === 0
              ? t("pulseStart")
              : pulse.sessionsCompleted / pulse.sessionsBooked >= 0.75
                ? t("pulseGreat")
                : t("pulseGood")}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-10">
        {[
          { value: activeClients.length, label: t("activeClients") },
          { value: totalPrograms, label: t("programs") },
          { value: clients.length - activeClients.length, label: t("inactive") },
        ].map((stat) => (
          <div key={stat.label} className="card px-4 sm:px-6 py-4 sm:py-5">
            <p className="text-2xl sm:text-3xl font-bold text-neutral-100 tabular-nums">{stat.value}</p>
            <p className="text-[12px] sm:text-[13px] text-neutral-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-10">
        <Link href="/trainer/clients" className="btn-primary text-[14px]">{t("manageClients")}</Link>
        <Link href="/trainer/schedule" className="btn-secondary text-[14px]">{t("viewSchedule")}</Link>
      </div>

      {/* Client List */}
      <div className="mb-4">
        <h2 className="section-title">{t("clients")}</h2>
      </div>

      {loading ? (
        <div className="card overflow-hidden divide-y divide-[#181818]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3.5">
                <div className="w-2 h-2 rounded-full bg-neutral-800 animate-pulse" />
                <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse" />
              </div>
              <div className="h-3 w-16 bg-neutral-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <div className="w-12 h-12 rounded-full bg-[#161616] border border-[#1e1e1e] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <p className="text-neutral-400 text-[14px] mb-1">{t("noClientsYet")}</p>
          <p className="text-[13px] text-neutral-600 mb-4">{t("clickAddClient") || "Add your first client to get started"}</p>
          <Link href="/trainer/clients" className="btn-primary text-[13px]">
            {t("addFirstClient") || t("addClient")}
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-[#181818]">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/trainer/clients/${client.id}`}
              className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 hover:bg-[#151515] active:bg-[#181818] transition-all duration-200 group"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-2 h-2 rounded-full ${client.active ? "bg-emerald-500" : "bg-neutral-700"}`} />
                <span className="text-[14px] text-neutral-300 group-hover:text-neutral-50 transition-colors">{client.name}</span>
              </div>
              <div className="flex items-center gap-5">
                <span className="text-[13px] text-neutral-600 tabular-nums">{client._count.programs} {t("programs").toLowerCase()}</span>
                <svg className="w-4 h-4 text-neutral-700 group-hover:text-neutral-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
