"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ClientSummary {
  id: string;
  name: string;
  active: boolean;
  _count: { programs: number; bookings: number };
}

export default function TrainerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
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
      <div className="w-4 h-4 border-2 border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
        <p className="text-[13px] text-neutral-500 mt-0.5">Overview of your clients and programs.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { value: activeClients.length, label: "Active Clients" },
          { value: totalPrograms, label: "Programs" },
          { value: clients.length - activeClients.length, label: "Inactive" },
        ].map((stat) => (
          <div key={stat.label} className="card px-5 py-4">
            <p className="text-2xl font-semibold text-neutral-100 tabular-nums">{stat.value}</p>
            <p className="text-[12px] text-neutral-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-8">
        <Link href="/trainer/clients" className="btn-primary text-[13px]">Manage Clients</Link>
        <Link href="/trainer/schedule" className="btn-secondary text-[13px]">View Schedule</Link>
      </div>

      {/* Client List */}
      <div className="mb-3">
        <h2 className="section-title">Clients</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-4 h-4 border-2 border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="card px-6 py-10 text-center">
          <p className="text-neutral-500 text-sm mb-2">No clients yet</p>
          <Link href="/trainer/clients" className="text-bordeaux-500 text-sm hover:text-bordeaux-400 transition-colors">
            Add your first client
          </Link>
        </div>
      ) : (
        <div className="space-y-px">
          {clients.map((client, i) => (
            <Link
              key={client.id}
              href={`/trainer/clients/${client.id}`}
              className={`flex items-center justify-between px-4 py-3 hover:bg-[#141414] transition-colors group ${
                i === 0 ? "rounded-t-xl" : ""
              } ${i === clients.length - 1 ? "rounded-b-xl" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${client.active ? "bg-emerald-500" : "bg-neutral-700"}`} />
                <span className="text-sm text-neutral-300 group-hover:text-neutral-100 transition-colors">{client.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[12px] text-neutral-600 tabular-nums">{client._count.programs} programs</span>
                <svg className="w-3.5 h-3.5 text-neutral-700 group-hover:text-neutral-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
