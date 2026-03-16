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
      <div className="w-5 h-5 border-2 border-bordeaux-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">Overview of your clients and training programs.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { value: activeClients.length, label: "Active Clients", color: "text-bordeaux-400" },
          { value: totalPrograms, label: "Programs", color: "text-white" },
          { value: clients.length - activeClients.length, label: "Inactive", color: "text-neutral-500" },
        ].map((stat) => (
          <div key={stat.label} className="card px-5 py-5">
            <p className={`text-3xl font-bold ${stat.color} tabular-nums`}>{stat.value}</p>
            <p className="text-sm text-neutral-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Link href="/trainer/clients" className="btn-primary">
          Manage Clients
        </Link>
        <Link href="/trainer/schedule" className="btn-secondary">
          View Schedule
        </Link>
      </div>

      {/* Client List */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">Clients</h2>
        <span className="text-xs text-neutral-600">{clients.length} total</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-neutral-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="text-neutral-500 text-sm mb-3">No clients yet</p>
          <Link href="/trainer/clients" className="text-bordeaux-400 text-sm hover:text-bordeaux-300 transition-colors">
            Add your first client
          </Link>
        </div>
      ) : (
        <div className="space-y-1.5">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/trainer/clients/${client.id}`}
              className="flex items-center justify-between card-hover px-5 py-3.5 group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${client.active ? "bg-emerald-400" : "bg-neutral-600"}`} />
                <span className="text-sm font-medium group-hover:text-white transition-colors">{client.name}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <span>{client._count.programs} programs</span>
                <svg className="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
