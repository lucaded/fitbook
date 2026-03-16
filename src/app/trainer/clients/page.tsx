"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  _count: { programs: number; bookings: number };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", height: "", weight: "", goals: "", injuries: "" });
  const [saving, setSaving] = useState(false);

  const loadClients = () => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => { setClients(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadClients(); }, []);

  const addClient = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", email: "", phone: "", height: "", weight: "", goals: "", injuries: "" });
    setShowAdd(false);
    setSaving(false);
    loadClients();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Clients</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-bordeaux-700 hover:bg-bordeaux-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          {showAdd ? "Cancel" : "+ Add Client"}
        </button>
      </div>
      <p className="text-sm text-neutral-500 mb-6">Add and manage your clients. Click a client to view their profile and programs.</p>

      {/* Add Client Form */}
      {showAdd && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-medium text-neutral-300 mb-3">New Client</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs text-neutral-500 block mb-1">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none" placeholder="Client name" />
            </div>
            <div>
              <label className="text-xs text-neutral-500 block mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none" placeholder="email@example.com" />
            </div>
            <div>
              <label className="text-xs text-neutral-500 block mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none" placeholder="+39..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-neutral-500 block mb-1">Height (cm)</label>
              <input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-500 block mb-1">Weight (kg)</label>
              <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-neutral-500 block mb-1">Goals</label>
              <textarea value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} rows={2}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none" placeholder="Training goals..." />
            </div>
            <div>
              <label className="text-xs text-neutral-500 block mb-1">Injuries / Notes</label>
              <textarea value={form.injuries} onChange={(e) => setForm({ ...form, injuries: e.target.value })} rows={2}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none" placeholder="Any injuries or relevant info..." />
            </div>
          </div>
          <button onClick={addClient} disabled={saving || !form.name.trim()}
            className="bg-bordeaux-700 hover:bg-bordeaux-600 disabled:opacity-50 text-white text-sm px-5 py-2 rounded-lg transition-colors">
            {saving ? "Saving..." : "Add Client"}
          </button>
        </div>
      )}

      {/* Client List */}
      {loading ? (
        <p className="text-neutral-600 text-sm">Loading...</p>
      ) : clients.length === 0 ? (
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-8 text-center">
          <p className="text-neutral-500 mb-2">No clients yet</p>
          <p className="text-xs text-neutral-600">Click &quot;+ Add Client&quot; to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <Link key={client.id} href={`/trainer/clients/${client.id}`}
              className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-lg px-5 py-4 hover:border-neutral-700 transition-colors group">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${client.active ? "bg-green-500" : "bg-neutral-600"}`} />
                <div>
                  <p className="text-sm font-medium group-hover:text-white transition-colors">{client.name}</p>
                  {client.email && <p className="text-xs text-neutral-600">{client.email}</p>}
                </div>
              </div>
              <div className="flex items-center gap-5 text-xs text-neutral-500">
                <span>{client._count.programs} programs</span>
                <span className="text-neutral-700 group-hover:text-neutral-500">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
