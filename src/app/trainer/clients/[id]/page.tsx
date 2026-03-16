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

  // New program form
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
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          height: data.height?.toString() || "",
          weight: data.weight?.toString() || "",
          goals: data.goals || "",
          injuries: data.injuries || "",
          notes: data.notes || "",
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
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEditing(false);
    loadClient();
  };

  const createProgram = async () => {
    if (!progForm.name.trim()) return;
    if (selectedTemplate) {
      // Create from template
      await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: params.id,
          name: progForm.name,
          weeks: parseInt(progForm.weeks),
          sourceProgramId: selectedTemplate,
        }),
      });
    } else {
      await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: params.id,
          name: progForm.name,
          weeks: parseInt(progForm.weeks),
          daysPerWeek: parseInt(progForm.daysPerWeek),
        }),
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

  if (loading) return <p className="text-neutral-600 text-sm py-8">Loading...</p>;
  if (!client) return <p className="text-red-500 py-8">Client not found</p>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/trainer/clients" className="text-neutral-600 hover:text-neutral-400 text-sm">
            ← Clients
          </Link>
          <span className="text-neutral-700">/</span>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="text-xs text-neutral-500 mt-0.5">Client profile, programs, and personal records.</p>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full mt-1 ${client.active ? "bg-green-500" : "bg-neutral-600"}`} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs border border-neutral-700 rounded-lg px-3 py-1.5 hover:bg-neutral-900 transition-colors"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={deleteClient}
            className="text-xs border border-red-900/50 text-red-400 rounded-lg px-3 py-1.5 hover:bg-red-950 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Client Info */}
        <div className="col-span-1">
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 space-y-3">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Info</h2>

            {editing ? (
              <div className="space-y-2">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
                  placeholder="Name"
                />
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
                  placeholder="Email"
                />
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
                  placeholder="Phone"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
                    placeholder="Height cm"
                  />
                  <input
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
                    placeholder="Weight kg"
                  />
                </div>
                <textarea
                  value={form.goals}
                  onChange={(e) => setForm({ ...form, goals: e.target.value })}
                  rows={2}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
                  placeholder="Goals"
                />
                <textarea
                  value={form.injuries}
                  onChange={(e) => setForm({ ...form, injuries: e.target.value })}
                  rows={2}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
                  placeholder="Injuries"
                />
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
                  placeholder="Notes"
                />
                <button
                  onClick={saveClient}
                  className="w-full bg-bordeaux-700 hover:bg-bordeaux-600 text-white text-sm py-1.5 rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {client.email && (
                  <div><span className="text-neutral-500">Email:</span> <span className="text-neutral-300">{client.email}</span></div>
                )}
                {client.phone && (
                  <div><span className="text-neutral-500">Phone:</span> <span className="text-neutral-300">{client.phone}</span></div>
                )}
                {client.height && (
                  <div><span className="text-neutral-500">Height:</span> <span className="text-neutral-300">{client.height} cm</span></div>
                )}
                {client.weight && (
                  <div><span className="text-neutral-500">Weight:</span> <span className="text-neutral-300">{client.weight} kg</span></div>
                )}
                {client.goals && (
                  <div><span className="text-neutral-500">Goals:</span> <p className="text-neutral-300 mt-0.5">{client.goals}</p></div>
                )}
                {client.injuries && (
                  <div><span className="text-neutral-500">Injuries:</span> <p className="text-neutral-300 mt-0.5">{client.injuries}</p></div>
                )}
                {client.notes && (
                  <div><span className="text-neutral-500">Notes:</span> <p className="text-neutral-300 mt-0.5">{client.notes}</p></div>
                )}
              </div>
            )}
          </div>

          {/* PRs */}
          {client.prs.length > 0 && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 mt-4">
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Personal Records</h2>
              <div className="space-y-1.5">
                {client.prs.map((pr) => (
                  <div key={pr.id} className="flex justify-between text-xs">
                    <span className="text-neutral-300">{pr.exerciseName}</span>
                    <span className="text-bordeaux-400 font-mono">{pr.loadKg} kg × {pr.reps}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Programs */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Programs</h2>
            <button
              onClick={() => setShowNewProgram(!showNewProgram)}
              className="text-xs bg-bordeaux-700 hover:bg-bordeaux-600 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              {showNewProgram ? "Cancel" : "+ New Program"}
            </button>
          </div>

          {showNewProgram && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 mb-4">
              {/* Template selector */}
              {templates.length > 0 && (
                <div className="mb-3">
                  <label className="text-xs text-neutral-500 block mb-1">Start from template (optional)</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => {
                      setSelectedTemplate(e.target.value);
                      const t = templates.find((tp) => tp.id === e.target.value);
                      if (t) setProgForm((f) => ({ ...f, daysPerWeek: t.daysPerWeek.toString(), weeks: t._count.weeks.toString() }));
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
                  >
                    <option value="">Blank program</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.client.name}) — {t.daysPerWeek}d/wk, {t._count.weeks}wk
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Program Name</label>
                  <input
                    type="text"
                    value={progForm.name}
                    onChange={(e) => setProgForm({ ...progForm, name: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
                    placeholder="e.g., Hypertrophy Block 1"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Weeks</label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={progForm.weeks}
                    onChange={(e) => setProgForm({ ...progForm, weeks: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Days / Week</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={progForm.daysPerWeek}
                    onChange={(e) => setProgForm({ ...progForm, daysPerWeek: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
                    disabled={!!selectedTemplate}
                  />
                </div>
              </div>
              <button
                onClick={createProgram}
                disabled={!progForm.name.trim()}
                className="bg-bordeaux-700 hover:bg-bordeaux-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                {selectedTemplate ? "Create from Template" : "Create Program"}
              </button>
            </div>
          )}

          {client.programs.length === 0 ? (
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-8 text-center text-neutral-500 text-sm">
              No programs yet. Create one to start building {client.name}&apos;s training.
            </div>
          ) : (
            <div className="space-y-2">
              {client.programs.map((prog) => (
                <Link
                  key={prog.id}
                  href={`/trainer/clients/${client.id}/programs/${prog.id}`}
                  className="block bg-neutral-950 border border-neutral-800 rounded-lg px-5 py-4 hover:border-bordeaux-800 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium group-hover:text-white">{prog.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {prog.daysPerWeek} days/week · Created {new Date(prog.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider ${
                        prog.status === "ACTIVE" ? "bg-green-900/30 text-green-400" :
                        prog.status === "COMPLETED" ? "bg-blue-900/30 text-blue-400" :
                        "bg-neutral-800 text-neutral-500"
                      }`}>
                        {prog.status}
                      </span>
                      <span className="text-xs text-neutral-700 group-hover:text-bordeaux-400">Open →</span>
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
