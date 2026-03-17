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

export default function TrainerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => { setClients(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const activeClients = clients.filter((c) => c.active);
  const totalPrograms = clients.reduce((s, c) => s + c._count.programs, 0);

  if (status === "loading") return (
    <div className="flex items-center justify-center py-20">
      <div className="w-5 h-5 border-2 border-neutral-800 border-t-neutral-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-xl font-bold tracking-tight">{t("dashboard")}</h1>
        <p className="text-[14px] text-neutral-500 mt-1">{t("dashboardSub")}</p>
      </div>

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
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-neutral-800 border-t-neutral-400 rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="text-neutral-500 text-[14px] mb-2">{t("noClientsYet")}</p>
          <Link href="/trainer/clients" className="text-bordeaux-500 text-[14px] hover:text-bordeaux-400 transition-colors">
            {t("addFirstClient")}
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-[#181818]">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/trainer/clients/${client.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-[#151515] transition-all duration-200 group"
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
