"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/Toast";

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
  const { toast } = useToast();
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
    toast(t("clientAdded") || `${form.name} added`);
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
      <p className="text-[14px] text-neutral-500 mb-6 sm:mb-8">{t("clientsSub")}</p>

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
            className="input-field pl-11 pr-9 text-[14px]"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-300 transition-colors p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      )}

      {/* Add Client Form */}
      {showAdd && (
        <div className="card p-5 sm:p-6 mb-6 animate-in">
          <h3 className="text-[15px] font-semibold text-neutral-200 mb-5">{t("newClient")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <div>
              <label className="label">{t("name")} *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field" placeholder={t("name")} autoFocus />
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
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
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
        <div className="card px-6 py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-[#161616] border border-[#1e1e1e] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <p className="text-neutral-400 text-[14px] mb-1">{t("noClientsYet")}</p>
          <p className="text-[13px] text-neutral-600 mb-4">{t("clickAddClient")}</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-[13px] mx-auto">
            {t("addClient")}
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-[#181818]">
          {filtered.map((client) => (
            <Link key={client.id} href={`/trainer/clients/${client.id}`}
              className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 hover:bg-[#151515] transition-all duration-200 group active:bg-[#181818]">
              <div className="flex items-center gap-3.5">
                <div className={`w-2 h-2 rounded-full shrink-0 ${client.active ? "bg-emerald-500" : "bg-neutral-700"}`} />
                <div>
                  <p className="text-[14px] text-neutral-200 group-hover:text-neutral-50 transition-colors">{client.name}</p>
                  {client.email && <p className="text-[12px] sm:text-[13px] text-neutral-600 mt-0.5">{client.email}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-5">
                <span className="text-[12px] sm:text-[13px] text-neutral-600 tabular-nums">{client._count.programs} {t("programs").toLowerCase()}</span>
                <svg className="w-4 h-4 text-neutral-700 group-hover:text-neutral-500 transition-colors hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
