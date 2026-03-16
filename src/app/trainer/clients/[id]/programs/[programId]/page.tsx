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
      body: JSON.stringify({ dayId: day.id, exerciseName: libEx.name, exerciseId: libEx.id, order: day.exercises.length, sets: suggestion?.sets || 3, reps: suggestion?.reps || 5, intensityPercent: suggestion?.intensityPercent || null, loadKg: suggestion?.loadKg || null }) });
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
    if (activeCell) addExercise(activeCell.week, activeCell.day, { id: `custom-${Date.now()}`, name, category: "custom", muscleGroups: [] });
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
      <div className="w-4 h-4 border-2 border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
    </div>
  );
  if (!program) return <div className="text-red-500 py-8">Program not found</div>;

  const peakVol = summaries.reduce((a, b) => b.totalVolume > a.totalVolume ? b : a, summaries[0]);
  const peakInt = summaries.reduce((a, b) => b.avgIntensity > a.avgIntensity ? b : a, summaries[0]);

  return (
    <div className="print:bg-white print:text-black">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-neutral-600 mb-4 print:hidden">
        <Link href="/trainer/clients" className="hover:text-neutral-400 transition-colors">Clients</Link>
        <span className="text-neutral-700">/</span>
        <Link href={`/trainer/clients/${program.client.id}`} className="hover:text-neutral-400 transition-colors">{program.client.name}</Link>
        <span className="text-neutral-700">/</span>
        <span className="text-neutral-400">{program.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight print:text-base">{program.name}</h1>
            <span className="text-[13px] text-neutral-500">{program.client.name}</span>
            {/* Save status */}
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-[11px] text-amber-500/70">
                <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />Saving
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-[11px] text-emerald-500/70">Saved</span>
            )}
          </div>
          <p className="text-[12px] text-neutral-600 mt-0.5 tabular-nums">
            {program.weeks.length} weeks · {program.daysPerWeek} days/week · +{program.progressionIncrement} kg/week
          </p>
        </div>
        <div className="flex items-center gap-1 print:hidden">
          <button onClick={addDay} className="btn-primary text-[11px] py-1 px-2.5">+ Day</button>
          {program.daysPerWeek > 1 && <button onClick={removeDay} className="btn-ghost text-[11px]">- Day</button>}
          <div className="w-px h-4 bg-[#222] mx-1" />
          {(["table", "summary", "charts"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`text-[11px] rounded-md px-2.5 py-1 transition-colors ${view === v ? "bg-[#1a1a1a] text-neutral-200" : "text-neutral-600 hover:text-neutral-400"}`}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
          <button onClick={() => setShowRPETable(!showRPETable)}
            className={`text-[11px] rounded-md px-2.5 py-1 transition-colors ${showRPETable ? "bg-[#1a1a1a] text-neutral-200" : "text-neutral-600 hover:text-neutral-400"}`}>RPE</button>
          <button onClick={() => window.print()} className="btn-ghost text-[11px]">Print</button>
        </div>
      </div>

      {/* 1RM Bar — collapsible */}
      {Object.keys(program.oneRMs).length > 0 && (
        <details className="mb-4 print:hidden group/rm">
          <summary className="text-[11px] text-neutral-600 cursor-pointer hover:text-neutral-400 transition-colors select-none mb-2">
            1RM values <span className="text-neutral-700">({Object.values(program.oneRMs).filter(v => v > 0).length} exercises)</span>
          </summary>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(program.oneRMs).map(([exId, rm]) => (
              <div key={exId} className="flex items-center gap-1.5 bg-[#111] rounded-lg px-2.5 py-1 border border-[#1a1a1a]">
                <span className="text-[11px] text-neutral-500">{allExercises.find((e) => e.id === exId)?.name || exId}</span>
                <input type="number" min={0} step={2.5} value={rm || ""}
                  onChange={(e) => saveOneRMs({ ...program.oneRMs, [exId]: parseFloat(e.target.value) || 0 })}
                  className="w-14 bg-[#0c0c0c] border border-[#1e1e1e] rounded px-1 py-0.5 text-[12px] text-white tabular-nums focus:border-bordeaux-700 focus:outline-none text-center" />
              </div>
            ))}
          </div>
        </details>
      )}

      {/* RPE Table */}
      {showRPETable && (
        <div className="card p-4 mb-4 overflow-x-auto print:hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] text-neutral-300">RPE Chart — %1RM by Reps</h3>
            <button onClick={() => setRpeTable({ ...DEFAULT_RPE_TABLE })} className="text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors">Reset</button>
          </div>
          <table className="w-full text-[11px] border-collapse">
            <thead><tr><th className="text-left text-neutral-600 p-1 w-14">RPE</th>
              {REP_RANGE.map((r) => <th key={r} className="text-center text-neutral-600 p-1">{r}</th>)}
            </tr></thead>
            <tbody>{RPE_VALUES.map((rpe) => (
              <tr key={rpe}>
                <td className="tabular-nums text-neutral-400 p-1 font-medium">{rpe}</td>
                {rpeTable[rpe].map((val, i) => (
                  <td key={i} className="p-0.5"><input type="number" value={val}
                    onChange={(e) => { const t = { ...rpeTable }; t[rpe] = [...t[rpe]]; t[rpe][i] = parseInt(e.target.value) || 0; setRpeTable(t); }}
                    className="w-full text-center bg-transparent border border-[#1e1e1e] rounded px-1 py-0.5 text-neutral-300 focus:border-bordeaux-700 focus:outline-none tabular-nums" /></td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* CHARTS */}
      {view === "charts" && summaries.length > 0 && (
        <div className="space-y-5 print:hidden">
          {[
            { title: "Volume (kg)", data: summaries.map((s) => ({ week: s.weekNumber, value: s.totalVolume })), color: "#6b3345", peak: peakVol, peakVal: peakVol?.totalVolume, suffix: " kg" },
            { title: "Avg Intensity (%1RM)", data: summaries.map((s) => ({ week: s.weekNumber, value: s.avgIntensity })), color: "#b08d57", peak: peakInt, peakVal: peakInt?.avgIntensity, suffix: "%", domain: [50, 100] as [number, number] },
          ].map(({ title, data, color, peak, peakVal, suffix, domain }) => (
            <div key={title}>
              <h3 className="text-[13px] text-neutral-400 mb-2">{title}</h3>
              <div className="h-44 card p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={addTrend(data)} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#161616" />
                    <XAxis dataKey="week" tick={{ fill: "#444", fontSize: 10 }} tickFormatter={(v) => `W${v}`} />
                    <YAxis tick={{ fill: "#444", fontSize: 10 }} domain={domain} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #222", borderRadius: 8, fontSize: 11 }} />
                    <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={{ fill: color, r: 2.5 }} name={title} />
                    <Line type="monotone" dataKey="trend" stroke="#333" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Trend" />
                    {peak && <ReferenceDot x={peak.weekNumber} y={peakVal} r={5} fill={color} stroke="#fff" strokeWidth={1.5} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <p className="text-[11px] text-neutral-600">Peak Volume</p>
              <p className="text-base tabular-nums text-neutral-200 mt-0.5">W{peakVol?.weekNumber} — {peakVol?.totalVolume.toLocaleString()} kg</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-neutral-600">Peak Intensity</p>
              <p className="text-base tabular-nums text-neutral-200 mt-0.5">W{peakInt?.weekNumber} — {peakInt?.avgIntensity}%</p>
            </div>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      {view === "summary" && (
        <div className="card overflow-hidden divide-y divide-[#1e1e1e]">
          {program.weeks.map((week) => {
            const s = getWeekSummary(week);
            const volPct = peakVol && peakVol.totalVolume > 0 ? (s.totalVolume / peakVol.totalVolume) * 100 : 0;
            return (
              <div key={week.id} className="flex items-center gap-4 px-5 py-3">
                <span className="text-[13px] tabular-nums text-neutral-500 w-10">W{week.weekNumber}</span>
                {/* Volume bar */}
                <div className="flex-1 relative">
                  <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className="h-full bg-bordeaux-700/50 rounded-full transition-all duration-500" style={{ width: `${volPct}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 text-[12px] w-80 text-right">
                  <div><span className="text-neutral-600">Vol </span><span className="text-neutral-300 tabular-nums">{s.totalVolume.toLocaleString()}</span></div>
                  <div><span className="text-neutral-600">Reps </span><span className="text-neutral-300 tabular-nums">{s.totalReps}</span></div>
                  <div><span className="text-neutral-600">% </span><span className="text-neutral-300 tabular-nums">{s.avgIntensity > 0 ? `${s.avgIntensity}` : "—"}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE */}
      {view === "table" && (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[11px] text-neutral-600 p-2 w-16 sticky left-0 bg-[#0c0c0c] z-10 print:bg-white"></th>
                {Array.from({ length: program.daysPerWeek }, (_, i) => {
                  const firstWeekDay = program.weeks[0]?.days[i];
                  const label = firstWeekDay?.label;
                  return (
                    <th key={i} className="text-left text-[12px] text-neutral-500 p-2 min-w-[220px] print:min-w-0 font-normal">
                      {editingLabel?.dayId === firstWeekDay?.id ? (
                        <input type="text" autoFocus value={editingLabel.value}
                          onChange={(e) => setEditingLabel({ ...editingLabel, value: e.target.value })}
                          onBlur={() => saveDayLabel(firstWeekDay.id, editingLabel.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveDayLabel(firstWeekDay.id, editingLabel.value); }}
                          className="bg-[#111] border border-bordeaux-700 rounded px-2 py-0.5 text-[12px] text-white focus:outline-none w-28" />
                      ) : (
                        <span className="cursor-pointer hover:text-neutral-300 transition-colors group/label"
                          onClick={() => setEditingLabel({ dayId: firstWeekDay?.id || "", value: label || "" })}>
                          {label || `Day ${i + 1}`}
                          <span className="text-neutral-700 ml-1.5 text-[9px] opacity-0 group-hover/label:opacity-100 transition-opacity">edit</span>
                        </span>
                      )}
                    </th>
                  );
                })}
                <th className="text-left text-[11px] text-neutral-600 p-2 w-44 print:hidden font-normal">Summary</th>
              </tr>
            </thead>
            <tbody>
              {program.weeks.map((week, wIdx) => {
                const summary = getWeekSummary(week);
                const hasExercises = week.days.some((d) => d.exercises.length > 0);
                return (
                  <tr key={week.id} className="border-t border-[#161616] align-top print:break-inside-avoid">
                    <td className="text-[13px] tabular-nums text-neutral-600 p-2 sticky left-0 bg-[#0c0c0c] z-10 print:bg-white">
                      <div>W{week.weekNumber}</div>
                      <div className="mt-1 space-y-0.5 print:hidden">
                        {wIdx > 0 && !hasExercises && (
                          <button onClick={() => copyWeek(wIdx - 1, wIdx)} className="text-[9px] text-bordeaux-500/60 hover:text-bordeaux-400 block transition-colors">Copy W{week.weekNumber - 1}</button>
                        )}
                        {wIdx < program.weeks.length - 1 && hasExercises && (
                          <button onClick={() => copyWeek(wIdx, wIdx + 1)} className="text-[9px] text-neutral-700 hover:text-neutral-500 block transition-colors">Copy to W{week.weekNumber + 1}</button>
                        )}
                      </div>
                    </td>
                    {week.days.map((day, dIdx) => {
                      const isActive = activeCell?.week === wIdx && activeCell?.day === dIdx;
                      const dayComplete = day.exercises.length > 0 && day.exercises.every((e) => e.actualSets !== null);
                      return (
                        <td key={day.id}
                          className={`p-2 border-l border-[#131313] cursor-pointer transition-colors duration-100 ${isActive ? "bg-[#111]" : "hover:bg-[#0f0f0f]"} ${dayComplete ? "bg-emerald-950/5" : ""}`}
                          onClick={() => { setActiveCell({ week: wIdx, day: dIdx }); setShowSearch(false); setSearchQuery(""); }}>

                          <div className="space-y-1">
                            {day.exercises.map((ex, eIdx) => {
                              const oneRM = program.oneRMs[ex.exerciseId] || 0;
                              const suggestion = getSuggestion(wIdx, dIdx, ex.exerciseId);
                              const hasActuals = ex.actualSets !== null;
                              return (
                                <div key={ex.id} className={`rounded-lg px-2.5 py-2 transition-colors group/ex ${
                                  hasActuals ? "bg-emerald-500/[0.03] border border-emerald-500/10" : "bg-[#111] border border-[#1a1a1a]"
                                }`}>
                                  {/* Row 1: Name + quick summary */}
                                  <div className="flex items-center justify-between">
                                    <span className="text-[12px] font-medium text-neutral-200">{ex.exerciseName}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] text-neutral-500 tabular-nums">
                                        {ex.sets}x{ex.reps}
                                        {ex.loadKg ? ` @ ${ex.loadKg}kg` : ex.intensityPercent ? ` @ ${ex.intensityPercent}%` : ""}
                                        {ex.rpe ? ` RPE${ex.rpe}` : ""}
                                      </span>
                                      <button onClick={(e) => { e.stopPropagation(); removeExercise(wIdx, dIdx, eIdx); }}
                                        className="text-neutral-800 hover:text-red-400 text-[11px] transition-colors leading-none opacity-0 group-hover/ex:opacity-100 print:hidden">x</button>
                                    </div>
                                  </div>

                                  {/* Suggestion */}
                                  {suggestion && !ex.loadKg && (
                                    <button onClick={(e) => { e.stopPropagation(); updateExercise(wIdx, dIdx, eIdx, suggestion); }}
                                      className="text-[10px] text-bordeaux-500/70 hover:text-bordeaux-400 mt-0.5 block print:hidden transition-colors">
                                      Apply: {suggestion.sets}x{suggestion.reps} @ {suggestion.loadKg}kg
                                    </button>
                                  )}

                                  {/* Row 2: Editable fields — compact inline */}
                                  {isActive && (
                                    <div className="mt-2 print:hidden" onClick={(e) => e.stopPropagation()}>
                                      <div className="grid grid-cols-4 gap-1 text-[11px]">
                                        {[
                                          { label: "Sets", val: ex.sets, key: "sets", parse: parseInt },
                                          { label: "Reps", val: ex.reps, key: "reps", parse: parseInt },
                                          { label: "%1RM", val: ex.intensityPercent, key: "intensityPercent", parse: parseFloat },
                                          { label: "kg", val: ex.loadKg, key: "loadKg", parse: parseFloat },
                                        ].map(({ label, val, key, parse }) => (
                                          <div key={key}>
                                            <label className="text-[9px] text-neutral-600">{label}</label>
                                            <input type="number" value={val ?? ""}
                                              onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { [key]: e.target.value ? parse(e.target.value) : null } as any)}
                                              className="w-full bg-[#0c0c0c] border border-[#1e1e1e] rounded px-1 py-0.5 text-neutral-200 focus:border-bordeaux-700 focus:outline-none text-center tabular-nums" />
                                          </div>
                                        ))}
                                      </div>
                                      <div className="grid grid-cols-3 gap-1 mt-1 text-[11px]">
                                        <div>
                                          <label className="text-[9px] text-neutral-600">RPE</label>
                                          <select value={ex.rpe ?? ""}
                                            onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { rpe: e.target.value ? parseFloat(e.target.value) : null })}
                                            className="w-full bg-[#0c0c0c] border border-[#1e1e1e] rounded px-0 py-0.5 text-neutral-200 focus:border-bordeaux-700 focus:outline-none text-center">
                                            <option value="">—</option>
                                            {RPE_VALUES.map((v) => <option key={v} value={v}>{v}</option>)}
                                          </select>
                                        </div>
                                        <div className="col-span-2">
                                          <label className="text-[9px] text-neutral-600">Notes</label>
                                          <input type="text" value={ex.notes || ""} placeholder="..."
                                            onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { notes: e.target.value || null })}
                                            className="w-full bg-[#0c0c0c] border border-[#1e1e1e] rounded px-1.5 py-0.5 text-neutral-300 focus:border-bordeaux-700 focus:outline-none text-[10px]" />
                                        </div>
                                      </div>
                                      {/* Actuals row */}
                                      <div className="grid grid-cols-3 gap-1 mt-1.5 pt-1.5 border-t border-[#1a1a1a] text-[11px]">
                                        <div className="col-span-3 text-[9px] text-neutral-600 mb-0.5">Actuals</div>
                                        {[
                                          { label: "Sets", val: ex.actualSets, key: "actualSets", parse: parseInt },
                                          { label: "Reps", val: ex.actualReps, key: "actualReps", parse: parseInt },
                                          { label: "kg", val: ex.actualLoadKg, key: "actualLoadKg", parse: parseFloat },
                                        ].map(({ label, val, key, parse }) => (
                                          <div key={key}>
                                            <input type="number" value={val ?? ""} placeholder={label}
                                              onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { [key]: e.target.value ? parse(e.target.value) : null } as any)}
                                              className="w-full bg-[#0c0c0c] border border-[#1e1e1e] rounded px-1 py-0.5 text-neutral-200 placeholder-neutral-700 focus:border-bordeaux-700 focus:outline-none text-center tabular-nums" />
                                          </div>
                                        ))}
                                      </div>
                                      {/* Actions */}
                                      <div className="flex items-center gap-2 mt-1.5 text-[9px]">
                                        <button onClick={(e) => { e.stopPropagation(); copyExerciseToAllWeeks(ex, day.dayNumber); }}
                                          className="text-neutral-600 hover:text-bordeaux-500 transition-colors">Copy to all weeks</button>
                                        {oneRM > 0 && <span className="text-neutral-700">1RM {oneRM}kg</span>}
                                        {ex.loadKg && ex.sets > 0 && ex.reps > 0 && <span className="text-neutral-700">Vol {(ex.sets * ex.reps * ex.loadKg).toLocaleString()}kg</span>}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Actions */}
                          {isActive && (
                            <div className="mt-2 space-y-1 print:hidden" onClick={(e) => e.stopPropagation()}>
                              {!showSearch ? (
                                <div className="flex gap-1.5">
                                  <button onClick={() => setShowSearch(true)}
                                    className="flex-1 text-[11px] text-neutral-700 hover:text-neutral-400 border border-dashed border-[#1e1e1e] hover:border-[#333] rounded-lg py-1.5 transition-colors">
                                    + Exercise
                                  </button>
                                  {day.exercises.length > 0 && !dayComplete && (
                                    <button onClick={() => completeDay(day.id)}
                                      className="text-[10px] bg-emerald-500/[0.06] text-emerald-500/70 border border-emerald-500/10 rounded-lg px-2.5 py-1.5 hover:bg-emerald-500/10 transition-colors">
                                      Complete
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search exercises..." autoFocus className="input-field text-[12px] py-1.5" />
                                  <div className="max-h-44 overflow-y-auto card divide-y divide-[#1e1e1e]">
                                    {filtered.slice(0, 15).map((ex) => (
                                      <button key={ex.id} onClick={() => addExercise(wIdx, dIdx, ex)}
                                        className="w-full text-left px-2.5 py-2 hover:bg-[#181818] flex justify-between items-center text-[12px] transition-colors">
                                        <span className="text-neutral-300">{ex.name}</span>
                                        <span className="text-[9px] text-neutral-600 uppercase">{catLabel[ex.category]}</span>
                                      </button>
                                    ))}
                                    {filtered.length === 0 && searchQuery && (
                                      <button onClick={() => addCustomExercise(searchQuery)}
                                        className="w-full text-left px-2.5 py-2 hover:bg-[#181818] text-[12px] text-bordeaux-500">
                                        + Add &quot;{searchQuery}&quot; as custom
                                      </button>
                                    )}
                                  </div>
                                  <button onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                                    className="text-[10px] text-neutral-700 hover:text-neutral-500 transition-colors">Cancel</button>
                                </div>
                              )}
                            </div>
                          )}

                          {day.exercises.length === 0 && !isActive && (
                            <div className="text-[10px] text-neutral-700 py-4 text-center border border-dashed border-[#1a1a1a] rounded-lg">
                              + Click to add exercises
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-2 border-l border-[#131313] align-top print:hidden">
                      <div className="text-[11px] space-y-1 card p-2.5">
                        <div className="flex justify-between"><span className="text-neutral-600">Vol</span><span className="text-neutral-400 tabular-nums">{summary.totalVolume.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-neutral-600">Reps</span><span className="text-neutral-400 tabular-nums">{summary.totalReps}</span></div>
                        <div className="flex justify-between"><span className="text-neutral-600">%</span><span className="text-neutral-400 tabular-nums">{summary.avgIntensity > 0 ? `${summary.avgIntensity}` : "—"}</span></div>
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
