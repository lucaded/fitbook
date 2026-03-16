"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  _count: { programs: number; bookings: number };
}

export default function ClientsPage() {
  const { t } = useI18n();
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
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold tracking-tight">{t("clients")}</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-[14px]">
          {showAdd ? t("cancel") : t("addClient")}
        </button>
      </div>
      <p className="text-[14px] text-neutral-500 mb-8">{t("clientsSub")}</p>

      {/* Search */}
      {clients.length > 0 && (
        <div className="relative mb-6">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="input-field pl-11 text-[14px]"
          />
        </div>
      )}

      {/* Add Client Form */}
      {showAdd && (
        <div className="card p-6 mb-8">
          <h3 className="text-[15px] font-semibold text-neutral-200 mb-5">{t("newClient")}</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="label">{t("name")} *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field" placeholder={t("name")} />
            </div>
            <div>
              <label className="label">{t("email")}</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field" placeholder="email@example.com" />
            </div>
            <div>
              <label className="label">{t("phone")}</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field" placeholder="+39..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">{t("heightCm")}</label>
              <input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="label">{t("weightKg")}</label>
              <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="label">{t("goals")}</label>
              <textarea value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} rows={2}
                className="input-field" />
            </div>
            <div>
              <label className="label">{t("injuriesNotes")}</label>
              <textarea value={form.injuries} onChange={(e) => setForm({ ...form, injuries: e.target.value })} rows={2}
                className="input-field" />
            </div>
          </div>
          <button onClick={addClient} disabled={saving || !form.name.trim()} className="btn-primary disabled:opacity-40 text-[14px]">
            {saving ? t("saving") : t("addClient")}
          </button>
        </div>
      )}

      {/* Client List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-neutral-800 border-t-neutral-400 rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="text-neutral-500 text-[14px] mb-2">{t("noClientsYet")}</p>
          <p className="text-[13px] text-neutral-600">{t("clickAddClient")}</p>
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-[#181818]">
          {filtered.map((client) => (
            <Link key={client.id} href={`/trainer/clients/${client.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-[#151515] transition-all duration-200 group">
              <div className="flex items-center gap-3.5">
                <div className={`w-2 h-2 rounded-full ${client.active ? "bg-emerald-500" : "bg-neutral-700"}`} />
                <div>
                  <p className="text-[14px] text-neutral-200 group-hover:text-neutral-50 transition-colors">{client.name}</p>
                  {client.email && <p className="text-[13px] text-neutral-600 mt-0.5">{client.email}</p>}
                </div>
              </div>
              <div className="flex items-center gap-5">
                <span className="text-[13px] text-neutral-600 tabular-nums">{client._count.programs} {t("programs").toLowerCase()}</span>
                <svg className="w-4 h-4 text-neutral-700 group-hover:text-neutral-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && search && (
            <div className="text-center py-8 text-[14px] text-neutral-600">{t("noClientsMatch")} &quot;{search}&quot;</div>
          )}
        </div>
      )}
    </div>
  );
}
