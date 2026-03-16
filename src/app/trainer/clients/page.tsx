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
  const [search, setSearch] = useState("");

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

  const filtered = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.email && c.email.toLowerCase().includes(q)) || (c.phone && c.phone.includes(q));
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-semibold tracking-tight">Clients</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-[13px]">
          {showAdd ? "Cancel" : "Add Client"}
        </button>
      </div>
      <p className="text-[13px] text-neutral-500 mb-6">Manage your clients. Click to view profile and programs.</p>

      {/* Search */}
      {clients.length > 0 && (
        <div className="relative mb-5">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="input-field pl-9 text-[13px]"
          />
        </div>
      )}

      {/* Add Client Form */}
      {showAdd && (
        <div className="card p-5 mb-6">
          <h3 className="text-sm font-medium text-neutral-200 mb-4">New Client</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="label">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field" placeholder="Client name" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field" placeholder="email@example.com" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field" placeholder="+39..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="label">Height (cm)</label>
              <input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="label">Goals</label>
              <textarea value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} rows={2}
                className="input-field" placeholder="Training goals..." />
            </div>
            <div>
              <label className="label">Injuries / Notes</label>
              <textarea value={form.injuries} onChange={(e) => setForm({ ...form, injuries: e.target.value })} rows={2}
                className="input-field" placeholder="Any injuries or relevant info..." />
            </div>
          </div>
          <button onClick={addClient} disabled={saving || !form.name.trim()} className="btn-primary disabled:opacity-40 text-[13px]">
            {saving ? "Saving..." : "Add Client"}
          </button>
        </div>
      )}

      {/* Client List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-4 h-4 border-2 border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="card px-6 py-10 text-center">
          <p className="text-neutral-500 text-sm mb-2">No clients yet</p>
          <p className="text-xs text-neutral-600">Click &quot;Add Client&quot; to get started</p>
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-[#1e1e1e]">
          {filtered.map((client) => (
            <Link key={client.id} href={`/trainer/clients/${client.id}`}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-[#181818] transition-colors group">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${client.active ? "bg-emerald-500" : "bg-neutral-700"}`} />
                <div>
                  <p className="text-sm text-neutral-200 group-hover:text-white transition-colors">{client.name}</p>
                  {client.email && <p className="text-[12px] text-neutral-600 mt-0.5">{client.email}</p>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[12px] text-neutral-600 tabular-nums">{client._count.programs} programs</span>
                <svg className="w-3.5 h-3.5 text-neutral-700 group-hover:text-neutral-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && search && (
            <div className="text-center py-6 text-[13px] text-neutral-600">No clients match &quot;{search}&quot;</div>
          )}
        </div>
      )}
    </div>
  );
}
