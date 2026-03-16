"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ClientSummary {
  id: string;
  name: string;
  active: boolean;
  _count: { programs: number; bookings: number };
}

export default function TrainerDashboard() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => { setClients(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const activeClients = clients.filter((c) => c.active);
  const totalPrograms = clients.reduce((s, c) => s + c._count.programs, 0);
  const totalBookings = clients.reduce((s, c) => s + c._count.bookings, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
          <p className="text-3xl font-bold text-bordeaux-500">{activeClients.length}</p>
          <p className="text-sm text-neutral-500 mt-1">Active Clients</p>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
          <p className="text-3xl font-bold text-white">{totalPrograms}</p>
          <p className="text-sm text-neutral-500 mt-1">Programs</p>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
          <p className="text-3xl font-bold text-white">{totalBookings}</p>
          <p className="text-sm text-neutral-500 mt-1">Bookings</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Link
          href="/trainer/clients"
          className="bg-bordeaux-700 hover:bg-bordeaux-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Manage Clients
        </Link>
        <Link
          href="/trainer/schedule"
          className="border border-neutral-700 text-neutral-300 text-sm px-4 py-2 rounded-lg hover:bg-neutral-900 transition-colors"
        >
          View Schedule
        </Link>
        <Link
          href="/program"
          className="border border-neutral-700 text-neutral-300 text-sm px-4 py-2 rounded-lg hover:bg-neutral-900 transition-colors"
        >
          Program Builder
        </Link>
      </div>

      {/* Recent Clients */}
      <h2 className="text-lg font-semibold mb-3">Clients</h2>
      {loading ? (
        <p className="text-neutral-600 text-sm">Loading...</p>
      ) : clients.length === 0 ? (
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 text-center">
          <p className="text-neutral-500 text-sm mb-3">No clients yet</p>
          <Link href="/trainer/clients" className="text-bordeaux-400 text-sm hover:underline">
            Add your first client
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/trainer/clients/${client.id}`}
              className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${client.active ? "bg-green-500" : "bg-neutral-600"}`} />
                <span className="text-sm font-medium">{client.name}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <span>{client._count.programs} programs</span>
                <span>{client._count.bookings} bookings</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
