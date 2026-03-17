"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/Toast";
import { ConfirmModal } from "@/components/ConfirmModal";

interface ProgramExercise {
  id: string;
  actualSets: number | null;
  actualReps: number | null;
  actualLoadKg: number | null;
}

interface ProgramDay {
  id: string;
  dayNumber: number;
  exercises: ProgramExercise[];
}

interface ProgramWeek {
  id: string;
  weekNumber: number;
  days: ProgramDay[];
}

interface Program {
  id: string;
  name: string;
  daysPerWeek: number;
  status: string;
  createdAt: string;
  weeks: ProgramWeek[];
}

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
  programs: Program[];
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

function computeConsistency(program: Program): { weekCompleted: boolean[]; streak: number } {
  const weekCompleted = program.weeks
    .sort((a, b) => a.weekNumber - b.weekNumber)
    .map((week) =>
      week.days.some((day) =>
        day.exercises.some((ex) => ex.actualSets != null)
      )
    );

  // Count streak backwards from last completed week
  let streak = 0;
  for (let i = weekCompleted.length - 1; i >= 0; i--) {
    if (weekCompleted[i]) {
      streak++;
    } else {
      // Only break if there's a completed week after this gap
      if (streak > 0) break;
    }
  }

  return { weekCompleted, streak };
}

function ConsistencyIndicator({ program }: { program: Program }) {
  const { t } = useI18n();
  const { weekCompleted, streak } = computeConsistency(program);

  if (program.weeks.length === 0) return null;

  const completedCount = weekCompleted.filter(Boolean).length;
  if (completedCount === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-3 mb-2">
        {streak > 0 && (
          <span className="text-[12px] text-emerald-400 font-medium">
            {streak} {streak === 1 ? t("weekStreak") : t("weeksStreak")}
          </span>
        )}
        <span className="text-[11px] text-neutral-600">
          {completedCount}/{weekCompleted.length} {t("weeksCompleted")}
        </span>
      </div>
      <div className="flex gap-[3px] flex-wrap">
        {weekCompleted.map((completed, i) => (
          <div
            key={i}
            title={`${t("week")} ${i + 1}`}
            className={`w-3 h-3 rounded-[3px] transition-colors ${
              completed
                ? "bg-emerald-500/70"
                : "bg-neutral-800 border border-neutral-700/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const { toast } = useToast();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", height: "", weight: "", goals: "", injuries: "", notes: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    setSaving(true);
    await fetch(`/api/clients/${params.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setEditing(false);
    toast(t("changesSaved") || "Changes saved");
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
    toast(t("programCreated") || "Program created");
    loadClient();
  };

  const deleteClient = async () => {
    await fetch(`/api/clients/${params.id}`, { method: "DELETE" });
    toast(t("clientDeleted") || "Client deleted", "info");
    router.push("/trainer/clients");
  };

  const relativeDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return t("today") || "Today";
    if (days === 1) return t("yesterday") || "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return d.toLocaleDateString();
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-40 bg-neutral-800 rounded animate-pulse" />
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-800 animate-pulse" />
        </div>
        <div className="h-8 w-24 bg-neutral-800 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card p-6 space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-neutral-800 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />)}
        </div>
        <div className="sm:col-span-2 card p-6 space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-14 bg-neutral-800 rounded animate-pulse" />)}
        </div>
      </div>
    </div>
  );
  if (!client) return <p className="text-red-500 py-8">{t("clientNotFound")}</p>;

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
      <div className="flex items-center gap-2 text-[14px] text-neutral-600 mb-5">
        <Link href="/trainer/clients" className="hover:text-neutral-300 transition-colors">{t("clients")}</Link>
        <span className="text-neutral-700">/</span>
        <span className="text-neutral-300">{client.name}</span>
      </div>

      <div className="flex items-center justify-between mb-6 sm:mb-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">{client.name}</h1>
          <div className={`w-2.5 h-2.5 rounded-full ${client.active ? "bg-emerald-500" : "bg-neutral-700"}`} />
        </div>
        <div className="flex gap-1 sm:gap-2">
          <button onClick={() => setEditing(!editing)} className="btn-ghost text-[13px]">
            {editing ? t("cancel") : t("edit")}
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="btn-ghost text-[13px] text-neutral-600 hover:text-red-400">
            {t("delete")}
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title={t("deleteClient") || "Delete client"}
          message={t("deleteClientMsg") || `Are you sure you want to delete ${client.name}? This will also delete all their programs and bookings.`}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          destructive
          onConfirm={() => { setShowDeleteConfirm(false); deleteClient(); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
        {/* Client Info */}
        <div className="col-span-1 space-y-5">
          <div className="card p-6">
            <h2 className="section-title mb-5">{t("info")}</h2>
            {editing ? (
              <div className="space-y-3 animate-in">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder={t("name")} />
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder={t("email")} />
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder={t("phone")} />
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className="input-field" placeholder={t("heightCm")} />
                  <input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="input-field" placeholder={t("weightKg")} />
                </div>
                <textarea value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} rows={2} className="input-field" placeholder={t("goals")} />
                <textarea value={form.injuries} onChange={(e) => setForm({ ...form, injuries: e.target.value })} rows={2} className="input-field" placeholder={t("injuries")} />
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="input-field" placeholder={t("notes")} />
                <button onClick={saveClient} disabled={saving} className="btn-primary w-full text-[14px] disabled:opacity-40">
                  {saving ? t("saving") || "Saving..." : t("save")}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-[14px]">
                {[
                  { label: t("email"), value: client.email },
                  { label: t("phone"), value: client.phone },
                  { label: t("height"), value: client.height ? `${client.height} cm` : null },
                  { label: t("weight"), value: client.weight ? `${client.weight} kg` : null },
                  { label: t("goals"), value: client.goals },
                  { label: t("injuries"), value: client.injuries },
                  { label: t("notes"), value: client.notes },
                ].filter((f) => f.value).map((field) => (
                  <div key={field.label}>
                    <span className="text-[12px] text-neutral-600">{field.label}</span>
                    <p className="text-neutral-300 text-[14px] mt-0.5">{field.value}</p>
                  </div>
                ))}
                {!client.email && !client.phone && !client.goals && (
                  <p className="text-neutral-600 text-[13px]">{t("noDetailsYet")}</p>
                )}
              </div>
            )}
          </div>

          {/* PRs */}
          {bestPRs.size > 0 && (
            <div className="card p-6">
              <h2 className="section-title mb-4">{t("personalRecords")}</h2>
              <div className="space-y-3">
                {Array.from(bestPRs.values()).map((pr) => (
                  <div key={pr.id} className="flex justify-between items-center">
                    <span className="text-[14px] text-neutral-300">{pr.exerciseName}</span>
                    <span className="text-[14px] text-neutral-100 tabular-nums">{pr.loadKg} <span className="text-neutral-600">kg</span> × {pr.reps}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Programs */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">{t("programs")}</h2>
            <button onClick={() => setShowNewProgram(!showNewProgram)} className="btn-primary text-[13px] py-2">
              {showNewProgram ? t("cancel") : t("newProgram")}
            </button>
          </div>

          {showNewProgram && (
            <div className="card p-6 mb-5 animate-in">
              {templates.length > 0 && (
                <div className="mb-5">
                  <label className="label">{t("startFromTemplate")}</label>
                  <select value={selectedTemplate}
                    onChange={(e) => {
                      setSelectedTemplate(e.target.value);
                      const tpl = templates.find((tp) => tp.id === e.target.value);
                      if (tpl) setProgForm((f) => ({ ...f, daysPerWeek: tpl.daysPerWeek.toString(), weeks: tpl._count.weeks.toString() }));
                    }}
                    className="input-field">
                    <option value="">{t("blankProgram")}</option>
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>{tpl.name} ({tpl.client.name}) — {tpl.daysPerWeek}d/wk, {tpl._count.weeks}wk</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
                <div>
                  <label className="label">{t("programName")}</label>
                  <input type="text" value={progForm.name} onChange={(e) => setProgForm({ ...progForm, name: e.target.value })}
                    className="input-field" placeholder="e.g., Hypertrophy Block 1" />
                </div>
                <div>
                  <label className="label">{t("weeks")}</label>
                  <input type="number" min={1} max={52} value={progForm.weeks}
                    onChange={(e) => setProgForm({ ...progForm, weeks: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label">{t("daysPerWeek")}</label>
                  <input type="number" min={1} max={6} value={progForm.daysPerWeek}
                    onChange={(e) => setProgForm({ ...progForm, daysPerWeek: e.target.value })}
                    className="input-field" disabled={!!selectedTemplate} />
                </div>
              </div>
              <button onClick={createProgram} disabled={!progForm.name.trim()} className="btn-primary disabled:opacity-40 text-[14px]">
                {selectedTemplate ? t("createFromTemplate") : t("createProgram")}
              </button>
            </div>
          )}

          {client.programs.length === 0 ? (
            <div className="card px-6 py-14 text-center">
              <div className="w-12 h-12 rounded-full bg-[#161616] border border-[#1e1e1e] flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-neutral-400 text-[14px] mb-1">{t("noProgramsYet")}</p>
              <p className="text-[13px] text-neutral-600 mb-4">{t("createFirstProgram") || "Create a training program to get started"}</p>
              <button onClick={() => setShowNewProgram(true)} className="btn-primary text-[13px] mx-auto">
                {t("newProgram")}
              </button>
            </div>
          ) : (
            <div className="card overflow-hidden divide-y divide-[#181818]">
              {client.programs.map((prog) => (
                <Link key={prog.id}
                  href={`/trainer/clients/${client.id}/programs/${prog.id}`}
                  className="block px-5 sm:px-6 py-4 sm:py-5 hover:bg-[#151515] active:bg-[#181818] transition-all duration-200 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-medium text-neutral-200 group-hover:text-white transition-colors">{prog.name}</p>
                      <p className="text-[13px] text-neutral-600 mt-1">
                        {prog.daysPerWeek} {t("daysPerWeek").toLowerCase()}  ·  {relativeDate(prog.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`pill ${statusStyles[prog.status] || statusStyles.DRAFT}`}>
                        {prog.status}
                      </span>
                      <svg className="w-4 h-4 text-neutral-700 group-hover:text-neutral-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  {(() => {
                    const allEx = prog.weeks.flatMap(w => w.days.flatMap(d => d.exercises));
                    const total = allEx.length;
                    const done = allEx.filter(e => e.actualSets != null).length;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    return total > 0 ? (
                      <div className="mt-2.5 flex items-center gap-2.5">
                        <div className="flex-1 h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500/70 transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-neutral-600 tabular-nums shrink-0">{pct}%</span>
                      </div>
                    ) : null;
                  })()}
                  <ConsistencyIndicator program={prog} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
