"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ClientDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  height: number | null;
  weight: number | null;
  goals: string | null;
  injuries: string | null;
  notes: string | null;
  active: boolean;
  programs: {
    id: string;
    name: string;
    daysPerWeek: number;
    status: string;
    createdAt: string;
  }[];
  prs: {
    id: string;
    exerciseName: string;
    loadKg: number;
    reps: number;
    date: string;
  }[];
  bookings: {
    id: string;
    date: string;
    status: string;
    type: string;
  }[];
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", height: "", weight: "", goals: "", injuries: "", notes: "" });

  const [showNewProgram, setShowNewProgram] = useState(false);
  const [progForm, setProgForm] = useState({ name: "", weeks: "8", daysPerWeek: "4" });
  const [templates, setTemplates] = useState<{ id: string; name: string; daysPerWeek: number; client: { name: string }; _count: { weeks: number } }[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const loadClient = () => {
    fetch(`/api/clients/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setClient(data);
        setForm({
          name: data.name || "", email: data.email || "", phone: data.phone || "",
          height: data.height?.toString() || "", weight: data.weight?.toString() || "",
          goals: data.goals || "", injuries: data.injuries || "", notes: data.notes || "",
        });
        setLoading(false);
      });
  };

  useEffect(() => { loadClient(); }, [params.id]);

  useEffect(() => {
    if (showNewProgram && templates.length === 0) {
      fetch("/api/templates").then((r) => r.json()).then(setTemplates).catch(() => {});
    }
  }, [showNewProgram]);

  const saveClient = async () => {
    await fetch(`/api/clients/${params.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEditing(false);
    loadClient();
  };

  const createProgram = async () => {
    if (!progForm.name.trim()) return;
    if (selectedTemplate) {
      await fetch("/api/templates", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: params.id, name: progForm.name, weeks: parseInt(progForm.weeks), sourceProgramId: selectedTemplate }),
      });
    } else {
      await fetch("/api/programs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: params.id, name: progForm.name, weeks: parseInt(progForm.weeks), daysPerWeek: parseInt(progForm.daysPerWeek) }),
      });
    }
    setShowNewProgram(false);
    setProgForm({ name: "", weeks: "8", daysPerWeek: "4" });
    setSelectedTemplate("");
    loadClient();
  };

  const deleteClient = async () => {
    if (!confirm("Delete this client and all their data?")) return;
    await fetch(`/api/clients/${params.id}`, { method: "DELETE" });
    router.push("/trainer/clients");
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-4 h-4 border-2 border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
    </div>
  );
  if (!client) return <p className="text-red-500 py-8">Client not found</p>;

  const statusStyles: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-400",
    COMPLETED: "bg-blue-500/10 text-blue-400",
    DRAFT: "bg-neutral-500/10 text-neutral-500",
  };

  // Best PR per exercise
  const bestPRs = new Map<string, typeof client.prs[0]>();
  for (const pr of client.prs) {
    const existing = bestPRs.get(pr.exerciseName);
    if (!existing || pr.loadKg > existing.loadKg) bestPRs.set(pr.exerciseName, pr);
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-neutral-600 mb-4">
        <Link href="/trainer/clients" className="hover:text-neutral-400 transition-colors">Clients</Link>
        <span className="text-neutral-700">/</span>
        <span className="text-neutral-400">{client.name}</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight">{client.name}</h1>
          <div className={`w-2 h-2 rounded-full ${client.active ? "bg-emerald-500" : "bg-neutral-700"}`} />
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setEditing(!editing)} className="btn-ghost text-[12px]">
            {editing ? "Cancel" : "Edit"}
          </button>
          <button onClick={deleteClient} className="btn-ghost text-[12px] text-neutral-600 hover:text-red-400">
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Client Info */}
        <div className="col-span-1 space-y-4">
          <div className="card p-5">
            <h2 className="section-title mb-4">Info</h2>
            {editing ? (
              <div className="space-y-2.5">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Name" />
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="Email" />
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="Phone" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className="input-field" placeholder="Height cm" />
                  <input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="input-field" placeholder="Weight kg" />
                </div>
                <textarea value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} rows={2} className="input-field" placeholder="Goals" />
                <textarea value={form.injuries} onChange={(e) => setForm({ ...form, injuries: e.target.value })} rows={2} className="input-field" placeholder="Injuries" />
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="input-field" placeholder="Notes" />
                <button onClick={saveClient} className="btn-primary w-full text-[13px]">Save</button>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {[
                  { label: "Email", value: client.email },
                  { label: "Phone", value: client.phone },
                  { label: "Height", value: client.height ? `${client.height} cm` : null },
                  { label: "Weight", value: client.weight ? `${client.weight} kg` : null },
                  { label: "Goals", value: client.goals },
                  { label: "Injuries", value: client.injuries },
                  { label: "Notes", value: client.notes },
                ].filter((f) => f.value).map((field) => (
                  <div key={field.label}>
                    <span className="text-[11px] text-neutral-600">{field.label}</span>
                    <p className="text-neutral-300 text-[13px] mt-0.5">{field.value}</p>
                  </div>
                ))}
                {!client.email && !client.phone && !client.goals && (
                  <p className="text-neutral-600 text-[12px]">No details yet. Click Edit to add.</p>
                )}
              </div>
            )}
          </div>

          {/* PRs */}
          {bestPRs.size > 0 && (
            <div className="card p-5">
              <h2 className="section-title mb-3">Personal Records</h2>
              <div className="space-y-2.5">
                {Array.from(bestPRs.values()).map((pr) => (
                  <div key={pr.id} className="flex justify-between items-center">
                    <span className="text-[13px] text-neutral-300">{pr.exerciseName}</span>
                    <span className="text-[13px] text-neutral-100 tabular-nums">{pr.loadKg} <span className="text-neutral-600">kg x</span> {pr.reps}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Programs */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Programs</h2>
            <button onClick={() => setShowNewProgram(!showNewProgram)} className="btn-primary text-[12px] py-1.5">
              {showNewProgram ? "Cancel" : "New Program"}
            </button>
          </div>

          {showNewProgram && (
            <div className="card p-5 mb-4">
              {templates.length > 0 && (
                <div className="mb-4">
                  <label className="label">Start from template</label>
                  <select value={selectedTemplate}
                    onChange={(e) => {
                      setSelectedTemplate(e.target.value);
                      const t = templates.find((tp) => tp.id === e.target.value);
                      if (t) setProgForm((f) => ({ ...f, daysPerWeek: t.daysPerWeek.toString(), weeks: t._count.weeks.toString() }));
                    }}
                    className="input-field">
                    <option value="">Blank program</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.client.name}) — {t.daysPerWeek}d/wk, {t._count.weeks}wk</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="label">Program Name</label>
                  <input type="text" value={progForm.name} onChange={(e) => setProgForm({ ...progForm, name: e.target.value })}
                    className="input-field" placeholder="e.g., Hypertrophy Block 1" />
                </div>
                <div>
                  <label className="label">Weeks</label>
                  <input type="number" min={1} max={52} value={progForm.weeks}
                    onChange={(e) => setProgForm({ ...progForm, weeks: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label">Days / Week</label>
                  <input type="number" min={1} max={6} value={progForm.daysPerWeek}
                    onChange={(e) => setProgForm({ ...progForm, daysPerWeek: e.target.value })}
                    className="input-field" disabled={!!selectedTemplate} />
                </div>
              </div>
              <button onClick={createProgram} disabled={!progForm.name.trim()} className="btn-primary disabled:opacity-40 text-[13px]">
                {selectedTemplate ? "Create from Template" : "Create Program"}
              </button>
            </div>
          )}

          {client.programs.length === 0 ? (
            <div className="card px-6 py-10 text-center text-neutral-500 text-sm">
              No programs yet. Create one to get started.
            </div>
          ) : (
            <div className="card overflow-hidden divide-y divide-[#1e1e1e]">
              {client.programs.map((prog) => (
                <Link key={prog.id}
                  href={`/trainer/clients/${client.id}/programs/${prog.id}`}
                  className="block px-5 py-4 hover:bg-[#181818] transition-colors group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-200 group-hover:text-white transition-colors">{prog.name}</p>
                      <p className="text-[12px] text-neutral-600 mt-0.5">
                        {prog.daysPerWeek} days/week · {new Date(prog.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${statusStyles[prog.status] || statusStyles.DRAFT}`}>
                        {prog.status}
                      </span>
                      <svg className="w-3.5 h-3.5 text-neutral-700 group-hover:text-neutral-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
