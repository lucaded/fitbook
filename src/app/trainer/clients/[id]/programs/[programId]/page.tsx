"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot,
} from "recharts";
import {
  EXERCISE_LIBRARY, DEFAULT_RPE_TABLE, RPE_VALUES, REP_RANGE,
  calcLoad, calcIntensity, calcRelativeIntensity, type LibraryExercise,
} from "@/lib/training-data";
import { useI18n } from "@/lib/i18n";

interface ProgramExercise {
  id: string; dayId: string; exerciseName: string; exerciseId: string; order: number;
  sets: number; reps: number; intensityPercent: number | null; loadKg: number | null;
  rpe: number | null; notes: string | null;
  actualSets: number | null; actualReps: number | null; actualLoadKg: number | null;
}
interface ProgramDay { id: string; dayNumber: number; label: string | null; exercises: ProgramExercise[]; }
interface ProgramWeek { id: string; weekNumber: number; days: ProgramDay[]; }
interface Program {
  id: string; name: string; daysPerWeek: number; progressionIncrement: number;
  oneRMs: Record<string, number>; status: string;
  client: { id: string; name: string }; weeks: ProgramWeek[];
}

type SaveStatus = "idle" | "saving" | "saved";

export default function ProgramEditorPage() {
  const params = useParams();
  const { t } = useI18n();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [activeCell, setActiveCell] = useState<{ week: number; day: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showRPETable, setShowRPETable] = useState(false);
  const [rpeTable, setRpeTable] = useState<Record<number, number[]>>({ ...DEFAULT_RPE_TABLE });
  const [view, setView] = useState<"table" | "summary" | "charts">("table");
  const [editingLabel, setEditingLabel] = useState<{ dayId: string; value: string } | null>(null);
  const saveTimer = useRef<NodeJS.Timeout>(undefined);

  const loadProgram = useCallback(() => {
    fetch(`/api/programs/${params.programId}`)
      .then((r) => r.json())
      .then((data) => { setProgram(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.programId]);

  useEffect(() => { loadProgram(); }, [loadProgram]);

  const markSaving = () => { setSaveStatus("saving"); if (saveTimer.current) clearTimeout(saveTimer.current); };
  const markSaved = () => { setSaveStatus("saved"); saveTimer.current = setTimeout(() => setSaveStatus("idle"), 2000); };

  const saveOneRMs = async (oneRMs: Record<string, number>) => {
    if (!program) return;
    setProgram({ ...program, oneRMs });
    markSaving();
    await fetch(`/api/programs/${program.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oneRMs }) });
    markSaved();
  };

  const copyWeek = async (sourceWeekIdx: number, targetWeekIdx: number) => {
    if (!program) return; markSaving();
    await fetch(`/api/programs/${program.id}/copy-week`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceWeekId: program.weeks[sourceWeekIdx].id, targetWeekId: program.weeks[targetWeekIdx].id }) });
    markSaved(); loadProgram();
  };

  const copyExerciseToAllWeeks = async (ex: ProgramExercise, dayNumber: number) => {
    if (!program) return; markSaving();
    await fetch(`/api/programs/${program.id}/copy-exercise`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId: ex.exerciseId, exerciseName: ex.exerciseName, dayNumber, sets: ex.sets, reps: ex.reps, intensityPercent: ex.intensityPercent, loadKg: ex.loadKg, rpe: ex.rpe }) });
    markSaved(); loadProgram();
  };

  const completeDay = async (dayId: string) => {
    if (!program) return; markSaving();
    await fetch(`/api/programs/${program.id}/complete-day`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dayId }) });
    markSaved(); loadProgram();
  };

  const saveDayLabel = async (dayId: string, label: string) => {
    markSaving();
    await fetch(`/api/programs/${program!.id}/day-label`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dayId, label }) });
    if (program) { const prog = { ...program }; for (const week of prog.weeks) for (const day of week.days) if (day.id === dayId) day.label = label || null; setProgram(prog); }
    setEditingLabel(null); markSaved();
  };

  const addDay = async () => { if (!program) return; markSaving(); await fetch(`/api/programs/${program.id}/days`, { method: "POST" }); markSaved(); loadProgram(); };
  const removeDay = async () => {
    if (!program || program.daysPerWeek <= 1) return;
    if (!confirm(`Remove Day ${program.daysPerWeek} from all weeks?`)) return;
    markSaving(); await fetch(`/api/programs/${program.id}/days`, { method: "DELETE" }); markSaved(); loadProgram();
  };

  const addExercise = async (weekIdx: number, dayIdx: number, libEx: LibraryExercise) => {
    if (!program) return;
    const day = program.weeks[weekIdx].days[dayIdx];
    const suggestion = getSuggestion(weekIdx, dayIdx, libEx.id);
    markSaving();
    const res = await fetch(`/api/programs/${program.id}/exercises`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayId: day.id, exerciseName: libEx.name, exerciseId: libEx.id, order: day.exercises.length, sets: suggestion?.sets || libEx.defaults?.sets || 3, reps: suggestion?.reps || libEx.defaults?.reps || 5, rpe: libEx.defaults?.rpe || null, intensityPercent: suggestion?.intensityPercent || null, loadKg: suggestion?.loadKg || null }) });
    const exercise = await res.json();
    const updated = { ...program }; updated.weeks = [...updated.weeks]; updated.weeks[weekIdx] = { ...updated.weeks[weekIdx] };
    updated.weeks[weekIdx].days = [...updated.weeks[weekIdx].days];
    updated.weeks[weekIdx].days[dayIdx] = { ...updated.weeks[weekIdx].days[dayIdx], exercises: [...updated.weeks[weekIdx].days[dayIdx].exercises, exercise] };
    if (!updated.oneRMs[libEx.id]) {
      updated.oneRMs = { ...updated.oneRMs, [libEx.id]: 0 };
      fetch(`/api/programs/${program.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oneRMs: updated.oneRMs }) });
    }
    setProgram(updated); setSearchQuery(""); setShowSearch(false); markSaved();
  };

  const updateExercise = async (weekIdx: number, dayIdx: number, exIdx: number, fields: Partial<ProgramExercise>) => {
    if (!program) return;
    const ex = program.weeks[weekIdx].days[dayIdx].exercises[exIdx];
    const oneRM = program.oneRMs[ex.exerciseId] || 0;
    const updated = { ...ex, ...fields };
    if ("intensityPercent" in fields && fields.intensityPercent && oneRM > 0) updated.loadKg = calcLoad(oneRM, fields.intensityPercent);
    if ("loadKg" in fields && fields.loadKg && oneRM > 0) updated.intensityPercent = calcIntensity(oneRM, fields.loadKg);
    const prog = { ...program }; prog.weeks = [...prog.weeks]; prog.weeks[weekIdx] = { ...prog.weeks[weekIdx] };
    prog.weeks[weekIdx].days = [...prog.weeks[weekIdx].days];
    prog.weeks[weekIdx].days[dayIdx] = { ...prog.weeks[weekIdx].days[dayIdx], exercises: prog.weeks[weekIdx].days[dayIdx].exercises.map((e, i) => i === exIdx ? updated : e) };
    setProgram(prog); markSaving();
    await fetch(`/api/programs/${program.id}/exercises`, { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ex.id, sets: updated.sets, reps: updated.reps, intensityPercent: updated.intensityPercent, loadKg: updated.loadKg, rpe: updated.rpe, notes: updated.notes, actualSets: updated.actualSets, actualReps: updated.actualReps, actualLoadKg: updated.actualLoadKg }) });
    markSaved();
  };

  const removeExercise = async (weekIdx: number, dayIdx: number, exIdx: number) => {
    if (!program) return;
    const ex = program.weeks[weekIdx].days[dayIdx].exercises[exIdx];
    const prog = { ...program }; prog.weeks = [...prog.weeks]; prog.weeks[weekIdx] = { ...prog.weeks[weekIdx] };
    prog.weeks[weekIdx].days = [...prog.weeks[weekIdx].days];
    prog.weeks[weekIdx].days[dayIdx] = { ...prog.weeks[weekIdx].days[dayIdx], exercises: prog.weeks[weekIdx].days[dayIdx].exercises.filter((_, i) => i !== exIdx) };
    setProgram(prog);
    await fetch(`/api/programs/${program.id}/exercises?exerciseId=${ex.id}`, { method: "DELETE" });
  };

  const getSuggestion = (weekIdx: number, dayIdx: number, exerciseId: string) => {
    if (!program || weekIdx === 0) return null;
    const prevDay = program.weeks[weekIdx - 1]?.days[dayIdx]; if (!prevDay) return null;
    const prevEx = prevDay.exercises.find((e) => e.exerciseId === exerciseId); if (!prevEx) return null;
    const prevLoad = prevEx.actualLoadKg ?? prevEx.loadKg ?? 0;
    const oneRM = program.oneRMs[exerciseId] || 0;
    const newLoad = Math.round((prevLoad + (program.progressionIncrement || 2.5)) / 2.5) * 2.5;
    return { sets: prevEx.actualSets ?? prevEx.sets, reps: prevEx.actualReps ?? prevEx.reps, loadKg: newLoad,
      intensityPercent: oneRM > 0 ? calcIntensity(oneRM, newLoad) : (prevEx.intensityPercent || null) };
  };

  const getRI = (pct: number | null, reps: number) => {
    if (!pct || reps < 1 || reps > 10) return null;
    return Math.round(calcRelativeIntensity(pct, reps, rpeTable) * 10) / 10;
  };

  const getWeekSummary = (week: ProgramWeek) => {
    let vol = 0, reps = 0, wIntS = 0, wIntD = 0;
    for (const d of week.days) for (const ex of d.exercises) {
      const s = ex.actualSets ?? ex.sets, r = ex.actualReps ?? ex.reps, l = ex.actualLoadKg ?? ex.loadKg ?? 0;
      vol += s * r * l; reps += s * r;
      if (ex.intensityPercent) { wIntS += ex.intensityPercent * s * r; wIntD += s * r; }
    }
    return { weekNumber: week.weekNumber, totalVolume: vol, totalReps: reps, avgIntensity: wIntD > 0 ? Math.round(wIntS / wIntD * 10) / 10 : 0 };
  };

  const addCustomExercise = (name: string) => {
    if (activeCell) addExercise(activeCell.week, activeCell.day, { id: `custom-${Date.now()}`, name, category: "custom", muscleGroups: [], defaults: { sets: 3, reps: 10 } });
  };

  // Format exercise summary — clean, no @ symbol
  const formatExSummary = (ex: ProgramExercise) => {
    const parts: string[] = [`${ex.sets} × ${ex.reps}`];
    if (ex.loadKg) parts.push(`${Math.round(ex.loadKg * 10) / 10} kg`);
    else if (ex.intensityPercent) parts.push(`${Math.round(ex.intensityPercent)}%`);
    if (ex.rpe) parts.push(`RPE ${Math.round(ex.rpe * 2) / 2}`);
    return parts.join("  ·  ");
  };

  const allExercises = EXERCISE_LIBRARY;
  const filtered = searchQuery.length > 0
    ? allExercises.filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.muscleGroups.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase())))
    : allExercises;
  const catLabel: Record<string, string> = { powerlifting: "PL", bodybuilding: "BB", olympic: "OLY", custom: "Custom" };

  const summaries = program ? program.weeks.map(getWeekSummary) : [];
  const linReg = (data: { x: number; y: number }[]) => {
    const n = data.length; if (n < 2) return { slope: 0, intercept: data[0]?.y ?? 0 };
    const sX = data.reduce((a, d) => a + d.x, 0), sY = data.reduce((a, d) => a + d.y, 0);
    const sXY = data.reduce((a, d) => a + d.x * d.y, 0), sX2 = data.reduce((a, d) => a + d.x * d.x, 0);
    return { slope: (n * sXY - sX * sY) / (n * sX2 - sX * sX), intercept: (sY - (n * sXY - sX * sY) / (n * sX2 - sX * sX) * sX) / n };
  };
  const addTrend = (data: { week: number; value: number }[]) => {
    const r = linReg(data.map((d) => ({ x: d.week, y: d.value })));
    return data.map((d) => ({ ...d, trend: Math.round(r.slope * d.week + r.intercept) }));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-5 h-5 border-2 border-neutral-800 border-t-neutral-400 rounded-full animate-spin" />
    </div>
  );
  if (!program) return <div className="text-red-500 py-8">{t("programNotFound")}</div>;

  const peakVol = summaries.reduce((a, b) => b.totalVolume > a.totalVolume ? b : a, summaries[0]);
  const peakInt = summaries.reduce((a, b) => b.avgIntensity > a.avgIntensity ? b : a, summaries[0]);

  return (
    <div className="print:bg-white print:text-black">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[14px] text-neutral-600 mb-5 print:hidden">
        <Link href="/trainer/clients" className="hover:text-neutral-300 transition-colors">{t("clients")}</Link>
        <span className="text-neutral-700">/</span>
        <Link href={`/trainer/clients/${program.client.id}`} className="hover:text-neutral-300 transition-colors">{program.client.name}</Link>
        <span className="text-neutral-700">/</span>
        <span className="text-neutral-300">{program.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight print:text-base">{program.name}</h1>
            <span className="text-[13px] sm:text-[14px] text-neutral-500">{program.client.name}</span>
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-[12px] text-amber-500/70">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />{t("saving")}
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1.5 text-[12px] text-emerald-500/70">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{t("saved")}
              </span>
            )}
          </div>
          <p className="text-[13px] text-neutral-600 mt-1 tabular-nums">
            {program.weeks.length} {t("weeks").toLowerCase()}  ·  {program.daysPerWeek} {t("daysPerWeek").toLowerCase()}  ·  +{program.progressionIncrement} kg
          </p>
        </div>
        <div className="flex items-center gap-1.5 print:hidden flex-wrap">
          <button onClick={addDay} className="text-[13px] font-medium text-bordeaux-400 hover:text-bordeaux-300 bg-bordeaux-500/[0.08] hover:bg-bordeaux-500/[0.14] px-3.5 py-1.5 rounded-full transition-all duration-200">{t("addDay")}</button>
          {program.daysPerWeek > 1 && <button onClick={removeDay} className="text-[13px] text-neutral-600 hover:text-neutral-400 px-3 py-1.5 rounded-full transition-colors">{t("removeDay")}</button>}
          <div className="w-px h-5 bg-[#1e1e1e] mx-1 hidden sm:block" />
          <div className="flex bg-[#111] rounded-full p-0.5 border border-[#1c1c1c]">
            {(["table", "summary", "charts"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`text-[12px] rounded-full px-3.5 py-1 transition-all duration-200 ${view === v ? "bg-[#1e1e1e] text-neutral-200 shadow-sm" : "text-neutral-600 hover:text-neutral-400"}`}>
                {t(v)}
              </button>
            ))}
          </div>
          <button onClick={() => setShowRPETable(!showRPETable)}
            className={`text-[12px] rounded-full px-3.5 py-1 transition-all duration-200 ml-1 ${showRPETable ? "bg-[#1e1e1e] text-neutral-200" : "text-neutral-600 hover:text-neutral-400"}`}>RPE</button>
          <button onClick={() => window.print()} className="text-[12px] text-neutral-600 hover:text-neutral-400 px-3 py-1 rounded-full transition-colors hidden sm:inline">{t("print")}</button>
        </div>
      </div>

      {/* 1RM Bar — collapsible */}
      {Object.keys(program.oneRMs).length > 0 && (
        <details className="mb-6 print:hidden group/rm">
          <summary className="text-[13px] text-neutral-600 cursor-pointer hover:text-neutral-400 transition-colors select-none mb-3">
            {t("oneRMValues")} <span className="text-neutral-700 ml-1">({Object.values(program.oneRMs).filter(v => v > 0).length} {t("set")})</span>
          </summary>
          <div className="flex flex-wrap gap-2">
            {Object.entries(program.oneRMs).map(([exId, rm]) => (
              <div key={exId} className="flex items-center gap-2 bg-[#111] rounded-xl px-3 py-1.5 border border-[#1a1a1a]">
                <span className="text-[13px] text-neutral-500">{allExercises.find((e) => e.id === exId)?.name || exId}</span>
                <input type="number" min={0} step={2.5} value={rm || ""}
                  onChange={(e) => saveOneRMs({ ...program.oneRMs, [exId]: parseFloat(e.target.value) || 0 })}
                  className="w-16 bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg px-2 py-1 text-[13px] text-white tabular-nums focus:border-bordeaux-700/60 focus:outline-none text-center" />
              </div>
            ))}
          </div>
        </details>
      )}

      {/* RPE Table */}
      {showRPETable && (
        <div className="card p-5 mb-6 overflow-x-auto print:hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-medium text-neutral-300">{t("rpeChart")}</h3>
            <button onClick={() => setRpeTable({ ...DEFAULT_RPE_TABLE })} className="text-[12px] text-neutral-600 hover:text-neutral-400 transition-colors">{t("resetDefaults")}</button>
          </div>
          <table className="w-full text-[12px] border-collapse">
            <thead><tr><th className="text-left text-neutral-600 p-1.5 w-14">RPE</th>
              {REP_RANGE.map((r) => <th key={r} className="text-center text-neutral-600 p-1.5">{r}</th>)}
            </tr></thead>
            <tbody>{RPE_VALUES.map((rpe) => (
              <tr key={rpe}>
                <td className="tabular-nums text-neutral-400 p-1.5 font-medium">{rpe}</td>
                {rpeTable[rpe].map((val, i) => (
                  <td key={i} className="p-0.5"><input type="number" value={val}
                    onChange={(e) => { const t = { ...rpeTable }; t[rpe] = [...t[rpe]]; t[rpe][i] = parseInt(e.target.value) || 0; setRpeTable(t); }}
                    className="w-full text-center bg-transparent border border-[#1a1a1a] rounded-lg px-1 py-1 text-neutral-300 focus:border-bordeaux-700/60 focus:outline-none tabular-nums" /></td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* CHARTS */}
      {view === "charts" && summaries.length > 0 && (
        <div className="space-y-6 print:hidden">
          {[
            { title: t("volume"), data: summaries.map((s) => ({ week: s.weekNumber, value: s.totalVolume })), color: "#6b3345", peak: peakVol, peakVal: peakVol?.totalVolume, suffix: " kg" },
            { title: t("avgIntensity"), data: summaries.map((s) => ({ week: s.weekNumber, value: s.avgIntensity })), color: "#b08d57", peak: peakInt, peakVal: peakInt?.avgIntensity, suffix: "%", domain: [50, 100] as [number, number] },
          ].map(({ title, data, color, peak, peakVal, suffix, domain }) => (
            <div key={title}>
              <h3 className="text-[14px] font-medium text-neutral-400 mb-3">{title}</h3>
              <div className="h-48 card p-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={addTrend(data)} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#151515" />
                    <XAxis dataKey="week" tick={{ fill: "#444", fontSize: 11 }} tickFormatter={(v) => `W${v}`} />
                    <YAxis tick={{ fill: "#444", fontSize: 11 }} domain={domain} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, fontSize: 12 }} />
                    <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} name={title} />
                    <Line type="monotone" dataKey="trend" stroke="#282828" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Trend" />
                    {peak && <ReferenceDot x={peak.weekNumber} y={peakVal} r={5} fill={color} stroke="#fff" strokeWidth={1.5} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="card p-4 sm:p-5">
              <p className="text-[12px] text-neutral-600">{t("peakVolume")}</p>
              <p className="text-base sm:text-lg font-semibold tabular-nums text-neutral-200 mt-1">W{peakVol?.weekNumber}  ·  {peakVol?.totalVolume.toLocaleString()} kg</p>
            </div>
            <div className="card p-4 sm:p-5">
              <p className="text-[12px] text-neutral-600">{t("peakIntensity")}</p>
              <p className="text-base sm:text-lg font-semibold tabular-nums text-neutral-200 mt-1">W{peakInt?.weekNumber}  ·  {peakInt?.avgIntensity}%</p>
            </div>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      {view === "summary" && (
        <div className="card overflow-hidden divide-y divide-[#181818]">
          {program.weeks.map((week) => {
            const s = getWeekSummary(week);
            const volPct = peakVol && peakVol.totalVolume > 0 ? (s.totalVolume / peakVol.totalVolume) * 100 : 0;
            return (
              <div key={week.id} className="flex items-center gap-3 sm:gap-5 px-4 sm:px-5 py-3.5">
                <span className="text-[14px] tabular-nums text-neutral-500 w-10 sm:w-12 font-medium shrink-0">W{week.weekNumber}</span>
                <div className="flex-1 relative hidden sm:block">
                  <div className="h-2 bg-[#151515] rounded-full overflow-hidden">
                    <div className="h-full bg-bordeaux-700/40 rounded-full transition-all duration-500" style={{ width: `${volPct}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 sm:gap-8 text-[12px] sm:text-[13px] flex-1 sm:flex-none sm:w-80 text-right">
                  <div><span className="text-neutral-600">{t("vol")} </span><span className="text-neutral-300 tabular-nums">{s.totalVolume.toLocaleString()}</span></div>
                  <div><span className="text-neutral-600">{t("reps")} </span><span className="text-neutral-300 tabular-nums">{s.totalReps}</span></div>
                  <div><span className="text-neutral-600">{t("int")} </span><span className="text-neutral-300 tabular-nums">{s.avgIntensity > 0 ? `${s.avgIntensity}%` : "—"}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE — Mobile card view */}
      {view === "table" && (
        <div className="sm:hidden space-y-4">
          {program.weeks.map((week, wIdx) => {
            const hasExercises = week.days.some((d) => d.exercises.length > 0);
            return (
              <div key={week.id} className="card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#181818] bg-[#0e0e0e]">
                  <span className="text-[14px] font-medium text-neutral-400 tabular-nums">W{week.weekNumber}</span>
                  <div className="flex gap-2">
                    {wIdx > 0 && !hasExercises && (
                      <button onClick={() => copyWeek(wIdx - 1, wIdx)} className="text-[12px] text-bordeaux-500/60 hover:text-bordeaux-400 transition-colors">Copy W{week.weekNumber - 1}</button>
                    )}
                  </div>
                </div>
                {week.days.map((day, dIdx) => {
                  const isActive = activeCell?.week === wIdx && activeCell?.day === dIdx;
                  const dayComplete = day.exercises.length > 0 && day.exercises.every((e) => e.actualSets !== null);
                  const dayLabel = program.weeks[0]?.days[dIdx]?.label || `Day ${dIdx + 1}`;
                  return (
                    <div key={day.id}
                      className={`px-4 py-3 border-b border-[#111] last:border-b-0 ${isActive ? "bg-[#0f0f0f]" : ""} ${dayComplete ? "bg-emerald-950/5" : ""}`}
                      onClick={() => { setActiveCell({ week: wIdx, day: dIdx }); setShowSearch(false); setSearchQuery(""); }}>
                      <p className="text-[12px] text-neutral-500 font-medium mb-2">{dayLabel}</p>
                      <div className="space-y-1.5">
                        {day.exercises.map((ex, eIdx) => {
                          const oneRM = program.oneRMs[ex.exerciseId] || 0;
                          const suggestion = getSuggestion(wIdx, dIdx, ex.exerciseId);
                          const hasActuals = ex.actualSets !== null;
                          return (
                            <div key={ex.id} className={`rounded-xl px-3 py-2.5 transition-all duration-200 ${
                              hasActuals ? "bg-emerald-500/[0.04] border border-emerald-500/10" : "bg-[#111] border border-[#181818]"
                            }`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <span className="text-[13px] font-semibold text-neutral-100 block">{ex.exerciseName}</span>
                                  <span className="text-[12px] text-neutral-500 tabular-nums mt-0.5 block">{formatExSummary(ex)}</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); removeExercise(wIdx, dIdx, eIdx); }}
                                  className="text-neutral-700 hover:text-red-400 text-[16px] transition-colors leading-none mt-0.5 shrink-0 p-1">×</button>
                              </div>
                              {suggestion && !ex.loadKg && (
                                <button onClick={(e) => { e.stopPropagation(); updateExercise(wIdx, dIdx, eIdx, suggestion); }}
                                  className="text-[11px] text-bordeaux-500/70 hover:text-bordeaux-400 mt-1 block transition-colors">
                                  {t("apply")}: {suggestion.sets} × {suggestion.reps} · {suggestion.loadKg} kg
                                </button>
                              )}
                              {isActive && (
                                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                                  <div className="grid grid-cols-4 gap-1.5 text-[12px]">
                                    {[
                                      { label: t("sets"), val: ex.sets, key: "sets", parse: parseInt },
                                      { label: t("reps"), val: ex.reps, key: "reps", parse: parseInt },
                                      { label: "%1RM", val: ex.intensityPercent, key: "intensityPercent", parse: parseFloat },
                                      { label: t("kg"), val: ex.loadKg, key: "loadKg", parse: parseFloat },
                                    ].map(({ label, val, key, parse }) => (
                                      <div key={key}>
                                        <label className="text-[10px] text-neutral-600 mb-0.5 block">{label}</label>
                                        <input type="number" value={val ?? ""}
                                          onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { [key]: e.target.value ? parse(e.target.value) : null } as any)}
                                          className="w-full bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-1.5 py-1.5 text-neutral-200 focus:border-bordeaux-700/60 focus:outline-none text-center tabular-nums" />
                                      </div>
                                    ))}
                                  </div>
                                  <div className="grid grid-cols-3 gap-1.5 mt-1.5 text-[12px]">
                                    <div>
                                      <label className="text-[10px] text-neutral-600 mb-0.5 block">RPE</label>
                                      <select value={ex.rpe ?? ""}
                                        onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { rpe: e.target.value ? parseFloat(e.target.value) : null })}
                                        className="w-full bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-0 py-1.5 text-neutral-200 focus:border-bordeaux-700/60 focus:outline-none text-center">
                                        <option value="">—</option>
                                        {RPE_VALUES.map((v) => <option key={v} value={v}>{v}</option>)}
                                      </select>
                                    </div>
                                    <div className="col-span-2">
                                      <label className="text-[10px] text-neutral-600 mb-0.5 block">{t("notes")}</label>
                                      <input type="text" value={ex.notes || ""} placeholder="..."
                                        onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { notes: e.target.value || null })}
                                        className="w-full bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-2 py-1.5 text-neutral-300 focus:border-bordeaux-700/60 focus:outline-none text-[11px]" />
                                    </div>
                                  </div>
                                  <div className="mt-2.5 pt-2.5 border-t border-[#181818]">
                                    <p className="text-[10px] text-neutral-600 mb-1.5 font-medium uppercase tracking-wider">{t("actuals")}</p>
                                    <div className="grid grid-cols-3 gap-1.5 text-[12px]">
                                      {[
                                        { label: t("sets"), val: ex.actualSets, key: "actualSets", parse: parseInt },
                                        { label: t("reps"), val: ex.actualReps, key: "actualReps", parse: parseInt },
                                        { label: t("kg"), val: ex.actualLoadKg, key: "actualLoadKg", parse: parseFloat },
                                      ].map(({ label, val, key, parse }) => (
                                        <div key={key}>
                                          <input type="number" value={val ?? ""} placeholder={label}
                                            onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { [key]: e.target.value ? parse(e.target.value) : null } as any)}
                                            className="w-full bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-1.5 py-1.5 text-neutral-200 placeholder-neutral-700 focus:border-bordeaux-700/60 focus:outline-none text-center tabular-nums" />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 mt-2.5 text-[11px]">
                                    <button onClick={(e) => { e.stopPropagation(); copyExerciseToAllWeeks(ex, day.dayNumber); }}
                                      className="text-neutral-600 hover:text-bordeaux-400 transition-colors">{t("copyToAllWeeks")}</button>
                                    {oneRM > 0 && <span className="text-neutral-700">1RM {oneRM} kg</span>}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {/* Add exercise / search */}
                      {isActive && (
                        <div className="mt-2.5 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                          {!showSearch ? (
                            <div className="flex gap-2">
                              <button onClick={() => setShowSearch(true)}
                                className="flex-1 text-[12px] text-neutral-600 hover:text-neutral-300 border border-dashed border-[#1c1c1c] hover:border-[#303030] rounded-xl py-2.5 transition-all duration-200">
                                {t("addExercise")}
                              </button>
                              {day.exercises.length > 0 && !dayComplete && (
                                <button onClick={() => completeDay(day.id)}
                                  className="text-[11px] bg-emerald-500/[0.06] text-emerald-500/70 border border-emerald-500/10 rounded-xl px-3.5 py-2.5 hover:bg-emerald-500/10 transition-all duration-200">
                                  {t("complete")}
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t("searchExercises")} autoFocus className="input-field text-[13px] py-2.5" />
                              <div className="max-h-60 overflow-y-auto card divide-y divide-[#181818]">
                                {filtered.slice(0, 15).map((ex) => (
                                  <button key={ex.id} onClick={() => addExercise(wIdx, dIdx, ex)}
                                    className="w-full text-left px-3 py-3 hover:bg-[#161616] flex justify-between items-center text-[13px] transition-colors">
                                    <div className="min-w-0">
                                      <span className="text-neutral-300">{ex.name}</span>
                                      {ex.defaults && (
                                        <span className="text-[11px] text-neutral-600 ml-2 tabular-nums">
                                          {ex.defaults.sets}×{ex.defaults.reps}{ex.defaults.rpe ? ` RPE ${ex.defaults.rpe}` : ""}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-neutral-600 uppercase tracking-wider shrink-0 ml-2">{catLabel[ex.category]}</span>
                                  </button>
                                ))}
                                {filtered.length === 0 && searchQuery && (
                                  <button onClick={() => addCustomExercise(searchQuery)}
                                    className="w-full text-left px-3 py-3 hover:bg-[#161616] text-[13px] text-bordeaux-400">
                                    + {t("addAsCustom")} &quot;{searchQuery}&quot;
                                  </button>
                                )}
                              </div>
                              <button onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                                className="text-[12px] text-neutral-700 hover:text-neutral-500 transition-colors py-1">{t("cancel")}</button>
                            </div>
                          )}
                        </div>
                      )}
                      {day.exercises.length === 0 && !isActive && (
                        <div className="text-[12px] text-neutral-700 py-4 text-center border border-dashed border-[#181818] rounded-xl">
                          {t("clickToAdd")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE — Desktop */}
      {view === "table" && (
        <div className="overflow-x-auto -mx-6 px-6 hidden sm:block">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[12px] text-neutral-600 p-2.5 w-16 sticky left-0 bg-[#0a0a0a] z-10 print:bg-white"></th>
                {Array.from({ length: program.daysPerWeek }, (_, i) => {
                  const firstWeekDay = program.weeks[0]?.days[i];
                  const label = firstWeekDay?.label;
                  return (
                    <th key={i} className="text-left text-[13px] text-neutral-400 p-2.5 min-w-[230px] print:min-w-0 font-medium">
                      {editingLabel?.dayId === firstWeekDay?.id ? (
                        <input type="text" autoFocus value={editingLabel.value}
                          onChange={(e) => setEditingLabel({ ...editingLabel, value: e.target.value })}
                          onBlur={() => saveDayLabel(firstWeekDay.id, editingLabel.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveDayLabel(firstWeekDay.id, editingLabel.value); }}
                          className="bg-[#111] border border-bordeaux-700/50 rounded-lg px-2.5 py-1 text-[13px] text-white focus:outline-none w-32" />
                      ) : (
                        <span className="cursor-pointer hover:text-neutral-200 transition-colors group/label"
                          onClick={() => setEditingLabel({ dayId: firstWeekDay?.id || "", value: label || "" })}>
                          {label || `Day ${i + 1}`}
                          <span className="text-neutral-700 ml-2 text-[10px] opacity-0 group-hover/label:opacity-100 transition-opacity">edit</span>
                        </span>
                      )}
                    </th>
                  );
                })}
                <th className="text-left text-[12px] text-neutral-600 p-2.5 w-44 print:hidden font-normal">{t("summary")}</th>
              </tr>
            </thead>
            <tbody>
              {program.weeks.map((week, wIdx) => {
                const summary = getWeekSummary(week);
                const hasExercises = week.days.some((d) => d.exercises.length > 0);
                return (
                  <tr key={week.id} className="border-t border-[#141414] align-top print:break-inside-avoid">
                    <td className="text-[14px] tabular-nums text-neutral-600 p-2.5 sticky left-0 bg-[#0a0a0a] z-10 print:bg-white font-medium">
                      <div>W{week.weekNumber}</div>
                      <div className="mt-1.5 space-y-1 print:hidden">
                        {wIdx > 0 && !hasExercises && (
                          <button onClick={() => copyWeek(wIdx - 1, wIdx)} className="text-[11px] text-bordeaux-500/60 hover:text-bordeaux-400 block transition-colors">Copy W{week.weekNumber - 1}</button>
                        )}
                        {wIdx < program.weeks.length - 1 && hasExercises && (
                          <button onClick={() => copyWeek(wIdx, wIdx + 1)} className="text-[11px] text-neutral-700 hover:text-neutral-500 block transition-colors">Copy to W{week.weekNumber + 1}</button>
                        )}
                      </div>
                    </td>
                    {week.days.map((day, dIdx) => {
                      const isActive = activeCell?.week === wIdx && activeCell?.day === dIdx;
                      const dayComplete = day.exercises.length > 0 && day.exercises.every((e) => e.actualSets !== null);
                      return (
                        <td key={day.id}
                          className={`p-2 border-l border-[#111] cursor-pointer transition-all duration-200 ${isActive ? "bg-[#0f0f0f]" : "hover:bg-[#0d0d0d]"} ${dayComplete ? "bg-emerald-950/5" : ""}`}
                          onClick={() => { setActiveCell({ week: wIdx, day: dIdx }); setShowSearch(false); setSearchQuery(""); }}>

                          <div className="space-y-1.5">
                            {day.exercises.map((ex, eIdx) => {
                              const oneRM = program.oneRMs[ex.exerciseId] || 0;
                              const suggestion = getSuggestion(wIdx, dIdx, ex.exerciseId);
                              const hasActuals = ex.actualSets !== null;
                              return (
                                <div key={ex.id} className={`rounded-xl px-3 py-2.5 transition-all duration-200 group/ex ${
                                  hasActuals ? "bg-emerald-500/[0.04] border border-emerald-500/10" : "bg-[#111] border border-[#181818]"
                                }`}>
                                  {/* Row 1: Name + clean summary */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <span className="text-[13px] font-semibold text-neutral-100 block">{ex.exerciseName}</span>
                                      <span className="text-[12px] text-neutral-500 tabular-nums mt-0.5 block">
                                        {formatExSummary(ex)}
                                      </span>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); removeExercise(wIdx, dIdx, eIdx); }}
                                      className="text-neutral-800 hover:text-red-400 text-[13px] transition-colors leading-none opacity-0 group-hover/ex:opacity-100 print:hidden mt-0.5 shrink-0">×</button>
                                  </div>

                                  {/* Suggestion */}
                                  {suggestion && !ex.loadKg && (
                                    <button onClick={(e) => { e.stopPropagation(); updateExercise(wIdx, dIdx, eIdx, suggestion); }}
                                      className="text-[11px] text-bordeaux-500/70 hover:text-bordeaux-400 mt-1 block print:hidden transition-colors">
                                      {t("apply")}: {suggestion.sets} × {suggestion.reps} · {suggestion.loadKg} kg
                                    </button>
                                  )}

                                  {/* Row 2: Editable fields */}
                                  {isActive && (
                                    <div className="mt-3 print:hidden" onClick={(e) => e.stopPropagation()}>
                                      <div className="grid grid-cols-4 gap-1.5 text-[12px]">
                                        {[
                                          { label: t("sets"), val: ex.sets, key: "sets", parse: parseInt },
                                          { label: t("reps"), val: ex.reps, key: "reps", parse: parseInt },
                                          { label: "%1RM", val: ex.intensityPercent, key: "intensityPercent", parse: parseFloat },
                                          { label: t("kg"), val: ex.loadKg, key: "loadKg", parse: parseFloat },
                                        ].map(({ label, val, key, parse }) => (
                                          <div key={key}>
                                            <label className="text-[10px] text-neutral-600 mb-0.5 block">{label}</label>
                                            <input type="number" value={val ?? ""}
                                              onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { [key]: e.target.value ? parse(e.target.value) : null } as any)}
                                              className="w-full bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-1.5 py-1 text-neutral-200 focus:border-bordeaux-700/60 focus:outline-none text-center tabular-nums" />
                                          </div>
                                        ))}
                                      </div>
                                      <div className="grid grid-cols-3 gap-1.5 mt-1.5 text-[12px]">
                                        <div>
                                          <label className="text-[10px] text-neutral-600 mb-0.5 block">RPE</label>
                                          <select value={ex.rpe ?? ""}
                                            onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { rpe: e.target.value ? parseFloat(e.target.value) : null })}
                                            className="w-full bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-0 py-1 text-neutral-200 focus:border-bordeaux-700/60 focus:outline-none text-center">
                                            <option value="">—</option>
                                            {RPE_VALUES.map((v) => <option key={v} value={v}>{v}</option>)}
                                          </select>
                                        </div>
                                        <div className="col-span-2">
                                          <label className="text-[10px] text-neutral-600 mb-0.5 block">{t("notes")}</label>
                                          <input type="text" value={ex.notes || ""} placeholder="..."
                                            onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { notes: e.target.value || null })}
                                            className="w-full bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-2 py-1 text-neutral-300 focus:border-bordeaux-700/60 focus:outline-none text-[11px]" />
                                        </div>
                                      </div>
                                      {/* Actuals */}
                                      <div className="mt-2.5 pt-2.5 border-t border-[#181818]">
                                        <p className="text-[10px] text-neutral-600 mb-1.5 font-medium uppercase tracking-wider">{t("actuals")}</p>
                                        <div className="grid grid-cols-3 gap-1.5 text-[12px]">
                                          {[
                                            { label: t("sets"), val: ex.actualSets, key: "actualSets", parse: parseInt },
                                            { label: t("reps"), val: ex.actualReps, key: "actualReps", parse: parseInt },
                                            { label: t("kg"), val: ex.actualLoadKg, key: "actualLoadKg", parse: parseFloat },
                                          ].map(({ label, val, key, parse }) => (
                                            <div key={key}>
                                              <input type="number" value={val ?? ""} placeholder={label}
                                                onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { [key]: e.target.value ? parse(e.target.value) : null } as any)}
                                                className="w-full bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-1.5 py-1 text-neutral-200 placeholder-neutral-700 focus:border-bordeaux-700/60 focus:outline-none text-center tabular-nums" />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      {/* Actions */}
                                      <div className="flex items-center gap-3 mt-2.5 text-[11px]">
                                        <button onClick={(e) => { e.stopPropagation(); copyExerciseToAllWeeks(ex, day.dayNumber); }}
                                          className="text-neutral-600 hover:text-bordeaux-400 transition-colors">{t("copyToAllWeeks")}</button>
                                        {oneRM > 0 && <span className="text-neutral-700">1RM {oneRM} kg</span>}
                                        {ex.loadKg && ex.sets > 0 && ex.reps > 0 && <span className="text-neutral-700">Vol {(ex.sets * ex.reps * ex.loadKg).toLocaleString()} kg</span>}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Actions */}
                          {isActive && (
                            <div className="mt-2.5 space-y-1.5 print:hidden" onClick={(e) => e.stopPropagation()}>
                              {!showSearch ? (
                                <div className="flex gap-2">
                                  <button onClick={() => setShowSearch(true)}
                                    className="flex-1 text-[12px] text-neutral-600 hover:text-neutral-300 border border-dashed border-[#1c1c1c] hover:border-[#303030] rounded-xl py-2 transition-all duration-200">
                                    {t("addExercise")}
                                  </button>
                                  {day.exercises.length > 0 && !dayComplete && (
                                    <button onClick={() => completeDay(day.id)}
                                      className="text-[11px] bg-emerald-500/[0.06] text-emerald-500/70 border border-emerald-500/10 rounded-xl px-3.5 py-2 hover:bg-emerald-500/10 transition-all duration-200">
                                      {t("complete")}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t("searchExercises")} autoFocus className="input-field text-[13px] py-2" />
                                  <div className="max-h-48 overflow-y-auto card divide-y divide-[#181818]">
                                    {filtered.slice(0, 15).map((ex) => (
                                      <button key={ex.id} onClick={() => addExercise(wIdx, dIdx, ex)}
                                        className="w-full text-left px-3 py-2.5 hover:bg-[#161616] flex justify-between items-center text-[13px] transition-colors">
                                        <div className="min-w-0">
                                          <span className="text-neutral-300">{ex.name}</span>
                                          {ex.defaults && (
                                            <span className="text-[11px] text-neutral-600 ml-2 tabular-nums">
                                              {ex.defaults.sets}×{ex.defaults.reps}{ex.defaults.rpe ? ` RPE ${ex.defaults.rpe}` : ""}
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[10px] text-neutral-600 uppercase tracking-wider shrink-0 ml-2">{catLabel[ex.category]}</span>
                                      </button>
                                    ))}
                                    {filtered.length === 0 && searchQuery && (
                                      <button onClick={() => addCustomExercise(searchQuery)}
                                        className="w-full text-left px-3 py-2.5 hover:bg-[#161616] text-[13px] text-bordeaux-400">
                                        + {t("addAsCustom")} &quot;{searchQuery}&quot;
                                      </button>
                                    )}
                                  </div>
                                  <button onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                                    className="text-[11px] text-neutral-700 hover:text-neutral-500 transition-colors">{t("cancel")}</button>
                                </div>
                              )}
                            </div>
                          )}

                          {day.exercises.length === 0 && !isActive && (
                            <div className="text-[12px] text-neutral-700 py-5 text-center border border-dashed border-[#181818] rounded-xl">
                              {t("clickToAdd")}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-2.5 border-l border-[#111] align-top print:hidden">
                      <div className="text-[12px] space-y-1.5 card p-3.5">
                        <div className="flex justify-between"><span className="text-neutral-600">{t("vol")}</span><span className="text-neutral-400 tabular-nums">{summary.totalVolume.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-neutral-600">{t("reps")}</span><span className="text-neutral-400 tabular-nums">{summary.totalReps}</span></div>
                        <div className="flex justify-between"><span className="text-neutral-600">{t("int")}</span><span className="text-neutral-400 tabular-nums">{summary.avgIntensity > 0 ? `${summary.avgIntensity}%` : "—"}</span></div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
