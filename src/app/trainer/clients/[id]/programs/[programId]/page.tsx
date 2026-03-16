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

// Save status type
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

  // Save indicator helper
  const markSaving = () => {
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
  };
  const markSaved = () => {
    setSaveStatus("saved");
    saveTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const saveOneRMs = async (oneRMs: Record<string, number>) => {
    if (!program) return;
    setProgram({ ...program, oneRMs });
    markSaving();
    await fetch(`/api/programs/${program.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oneRMs }),
    });
    markSaved();
  };

  // === COPY WEEK ===
  const copyWeek = async (sourceWeekIdx: number, targetWeekIdx: number) => {
    if (!program) return;
    markSaving();
    await fetch(`/api/programs/${program.id}/copy-week`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceWeekId: program.weeks[sourceWeekIdx].id,
        targetWeekId: program.weeks[targetWeekIdx].id,
      }),
    });
    markSaved();
    loadProgram();
  };

  // === COPY EXERCISE TO ALL WEEKS ===
  const copyExerciseToAllWeeks = async (ex: ProgramExercise, dayNumber: number) => {
    if (!program) return;
    markSaving();
    const res = await fetch(`/api/programs/${program.id}/copy-exercise`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseId: ex.exerciseId, exerciseName: ex.exerciseName,
        dayNumber, sets: ex.sets, reps: ex.reps,
        intensityPercent: ex.intensityPercent, loadKg: ex.loadKg, rpe: ex.rpe,
      }),
    });
    const data = await res.json();
    markSaved();
    loadProgram();
  };

  // === COMPLETE DAY ===
  const completeDay = async (dayId: string) => {
    if (!program) return;
    markSaving();
    await fetch(`/api/programs/${program.id}/complete-day`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayId }),
    });
    markSaved();
    loadProgram();
  };

  // === DAY LABEL ===
  const saveDayLabel = async (dayId: string, label: string) => {
    markSaving();
    await fetch(`/api/programs/${program!.id}/day-label`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayId, label }),
    });
    // Update local
    if (program) {
      const prog = { ...program };
      for (const week of prog.weeks) {
        for (const day of week.days) {
          if (day.id === dayId) day.label = label || null;
        }
      }
      setProgram(prog);
    }
    setEditingLabel(null);
    markSaved();
  };

  // === ADD/REMOVE DAYS ===
  const addDay = async () => {
    if (!program) return;
    markSaving();
    await fetch(`/api/programs/${program.id}/days`, { method: "POST" });
    markSaved();
    loadProgram();
  };
  const removeDay = async () => {
    if (!program || program.daysPerWeek <= 1) return;
    if (!confirm(`Remove Day ${program.daysPerWeek} from all weeks?`)) return;
    markSaving();
    await fetch(`/api/programs/${program.id}/days`, { method: "DELETE" });
    markSaved();
    loadProgram();
  };

  // === ADD EXERCISE ===
  const addExercise = async (weekIdx: number, dayIdx: number, libEx: LibraryExercise) => {
    if (!program) return;
    const day = program.weeks[weekIdx].days[dayIdx];
    const suggestion = getSuggestion(weekIdx, dayIdx, libEx.id);

    markSaving();
    const res = await fetch(`/api/programs/${program.id}/exercises`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayId: day.id, exerciseName: libEx.name, exerciseId: libEx.id,
        order: day.exercises.length,
        sets: suggestion?.sets || 3, reps: suggestion?.reps || 5,
        intensityPercent: suggestion?.intensityPercent || null,
        loadKg: suggestion?.loadKg || null,
      }),
    });
    const exercise = await res.json();

    const updated = { ...program };
    updated.weeks = [...updated.weeks];
    updated.weeks[weekIdx] = { ...updated.weeks[weekIdx] };
    updated.weeks[weekIdx].days = [...updated.weeks[weekIdx].days];
    updated.weeks[weekIdx].days[dayIdx] = {
      ...updated.weeks[weekIdx].days[dayIdx],
      exercises: [...updated.weeks[weekIdx].days[dayIdx].exercises, exercise],
    };
    if (!updated.oneRMs[libEx.id]) {
      updated.oneRMs = { ...updated.oneRMs, [libEx.id]: 0 };
      fetch(`/api/programs/${program.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oneRMs: updated.oneRMs }),
      });
    }
    setProgram(updated);
    setSearchQuery(""); setShowSearch(false);
    markSaved();
  };

  // === UPDATE EXERCISE ===
  const updateExercise = async (weekIdx: number, dayIdx: number, exIdx: number, fields: Partial<ProgramExercise>) => {
    if (!program) return;
    const ex = program.weeks[weekIdx].days[dayIdx].exercises[exIdx];
    const oneRM = program.oneRMs[ex.exerciseId] || 0;
    const updated = { ...ex, ...fields };

    if ("intensityPercent" in fields && fields.intensityPercent && oneRM > 0)
      updated.loadKg = calcLoad(oneRM, fields.intensityPercent);
    if ("loadKg" in fields && fields.loadKg && oneRM > 0)
      updated.intensityPercent = calcIntensity(oneRM, fields.loadKg);

    const prog = { ...program };
    prog.weeks = [...prog.weeks];
    prog.weeks[weekIdx] = { ...prog.weeks[weekIdx] };
    prog.weeks[weekIdx].days = [...prog.weeks[weekIdx].days];
    prog.weeks[weekIdx].days[dayIdx] = {
      ...prog.weeks[weekIdx].days[dayIdx],
      exercises: prog.weeks[weekIdx].days[dayIdx].exercises.map((e, i) => i === exIdx ? updated : e),
    };
    setProgram(prog);

    markSaving();
    await fetch(`/api/programs/${program.id}/exercises`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: ex.id, sets: updated.sets, reps: updated.reps,
        intensityPercent: updated.intensityPercent, loadKg: updated.loadKg,
        rpe: updated.rpe, notes: updated.notes,
        actualSets: updated.actualSets, actualReps: updated.actualReps, actualLoadKg: updated.actualLoadKg,
      }),
    });
    markSaved();
  };

  // === REMOVE EXERCISE ===
  const removeExercise = async (weekIdx: number, dayIdx: number, exIdx: number) => {
    if (!program) return;
    const ex = program.weeks[weekIdx].days[dayIdx].exercises[exIdx];
    const prog = { ...program };
    prog.weeks = [...prog.weeks];
    prog.weeks[weekIdx] = { ...prog.weeks[weekIdx] };
    prog.weeks[weekIdx].days = [...prog.weeks[weekIdx].days];
    prog.weeks[weekIdx].days[dayIdx] = {
      ...prog.weeks[weekIdx].days[dayIdx],
      exercises: prog.weeks[weekIdx].days[dayIdx].exercises.filter((_, i) => i !== exIdx),
    };
    setProgram(prog);
    await fetch(`/api/programs/${program.id}/exercises?exerciseId=${ex.id}`, { method: "DELETE" });
  };

  // === SUGGESTIONS ===
  const getSuggestion = (weekIdx: number, dayIdx: number, exerciseId: string) => {
    if (!program || weekIdx === 0) return null;
    const prevDay = program.weeks[weekIdx - 1]?.days[dayIdx];
    if (!prevDay) return null;
    const prevEx = prevDay.exercises.find((e) => e.exerciseId === exerciseId);
    if (!prevEx) return null;
    const prevLoad = prevEx.actualLoadKg ?? prevEx.loadKg ?? 0;
    const oneRM = program.oneRMs[exerciseId] || 0;
    const newLoad = Math.round((prevLoad + (program.progressionIncrement || 2.5)) / 2.5) * 2.5;
    return {
      sets: prevEx.actualSets ?? prevEx.sets,
      reps: prevEx.actualReps ?? prevEx.reps,
      loadKg: newLoad,
      intensityPercent: oneRM > 0 ? calcIntensity(oneRM, newLoad) : (prevEx.intensityPercent || null),
    };
  };

  const getRI = (pct: number | null, reps: number) => {
    if (!pct || reps < 1 || reps > 10) return null;
    return Math.round(calcRelativeIntensity(pct, reps, rpeTable) * 10) / 10;
  };

  // === WEEK SUMMARY ===
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

  // === PRINT ===
  const printProgram = () => {
    window.print();
  };

  const allExercises = EXERCISE_LIBRARY;
  const filtered = searchQuery.length > 0
    ? allExercises.filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.muscleGroups.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase())))
    : allExercises;
  const catLabel: Record<string, string> = { powerlifting: "PL", bodybuilding: "BB", olympic: "OLY", custom: "Custom" };

  // Chart data
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

  if (loading) return <div className="text-neutral-600 py-8">Loading program...</div>;
  if (!program) return <div className="text-red-500 py-8">Program not found</div>;

  const peakVol = summaries.reduce((a, b) => b.totalVolume > a.totalVolume ? b : a, summaries[0]);
  const peakInt = summaries.reduce((a, b) => b.avgIntensity > a.avgIntensity ? b : a, summaries[0]);

  return (
    <div className="min-h-screen print:bg-white print:text-black">
      {/* Header */}
      <div className="mb-4 print:mb-2">
        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1 print:hidden">
          <Link href="/trainer/clients" className="hover:text-neutral-300">Clients</Link>
          <span>/</span>
          <Link href={`/trainer/clients/${program.client.id}`} className="hover:text-neutral-300">{program.client.name}</Link>
          <span>/</span>
          <span className="text-neutral-300">{program.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold print:text-xl">{program.name} <span className="text-neutral-500 font-normal text-base">— {program.client.name}</span></h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {program.weeks.length} weeks · {program.daysPerWeek} days/week · {program.progressionIncrement} kg increments
              {saveStatus === "saving" && <span className="ml-3 text-yellow-500">Saving...</span>}
              {saveStatus === "saved" && <span className="ml-3 text-green-500">Saved</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button onClick={addDay} className="text-xs bg-bordeaux-700 hover:bg-bordeaux-600 text-white rounded px-3 py-1.5 transition-colors">+ Day</button>
            {program.daysPerWeek > 1 && (
              <button onClick={removeDay} className="text-xs border border-neutral-700 text-neutral-400 rounded px-3 py-1.5 hover:bg-neutral-900">− Day</button>
            )}
            <div className="w-px h-5 bg-neutral-800 mx-1" />
            {(["table", "summary", "charts"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`text-xs rounded px-3 py-1.5 transition-colors ${view === v ? "bg-neutral-800 text-white" : "border border-neutral-700 hover:bg-neutral-900 text-neutral-400"}`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
            <button onClick={() => setShowRPETable(!showRPETable)} className="text-xs border border-neutral-700 rounded px-3 py-1.5 hover:bg-neutral-900 text-neutral-400">RPE</button>
            <button onClick={printProgram} className="text-xs border border-neutral-700 rounded px-3 py-1.5 hover:bg-neutral-900 text-neutral-400">Print</button>
          </div>
        </div>
      </div>

      {/* 1RM Bar */}
      {Object.keys(program.oneRMs).length > 0 && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 mb-4 print:hidden">
          <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">1RM (kg)</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(program.oneRMs).map(([exId, rm]) => (
              <div key={exId} className="flex items-center gap-1 bg-neutral-900 rounded px-2.5 py-1.5 border border-neutral-800">
                <span className="text-[11px] text-neutral-300">{allExercises.find((e) => e.id === exId)?.name || exId}</span>
                <input type="number" min={0} step={2.5} value={rm || ""}
                  onChange={(e) => saveOneRMs({ ...program.oneRMs, [exId]: parseFloat(e.target.value) || 0 })}
                  className="w-14 bg-neutral-950 border border-neutral-700 rounded px-1.5 py-0.5 text-xs text-white font-mono focus:border-bordeaux-500 focus:outline-none text-center" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RPE Table */}
      {showRPETable && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 mb-4 overflow-x-auto print:hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-neutral-300">RPE Chart — %1RM by Reps</h3>
            <button onClick={() => setRpeTable({ ...DEFAULT_RPE_TABLE })} className="text-[10px] text-neutral-600 hover:text-neutral-400">Reset</button>
          </div>
          <table className="w-full text-xs border-collapse">
            <thead><tr><th className="text-left text-neutral-500 p-1 w-16">RPE</th>
              {REP_RANGE.map((r) => <th key={r} className="text-center text-neutral-500 p-1">{r}</th>)}
            </tr></thead>
            <tbody>{RPE_VALUES.map((rpe) => (
              <tr key={rpe} className={rpe >= 9 ? "bg-red-900/10" : rpe >= 8 ? "bg-yellow-900/10" : "bg-green-900/10"}>
                <td className="font-mono text-neutral-300 p-1 font-medium">{rpe}</td>
                {rpeTable[rpe].map((val, i) => (
                  <td key={i} className="p-0.5"><input type="number" value={val}
                    onChange={(e) => { const t = { ...rpeTable }; t[rpe] = [...t[rpe]]; t[rpe][i] = parseInt(e.target.value) || 0; setRpeTable(t); }}
                    className="w-full text-center bg-transparent border border-neutral-800 rounded px-1 py-0.5 text-neutral-200 focus:border-bordeaux-500 focus:outline-none" /></td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* === CHARTS VIEW === */}
      {view === "charts" && summaries.length > 0 && (
        <div className="space-y-6 print:hidden">
          <div>
            <h3 className="text-sm font-medium text-neutral-400 mb-2">Volume (kg) by Week</h3>
            <div className="h-48 bg-neutral-950 rounded-lg border border-neutral-800 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={addTrend(summaries.map((s) => ({ week: s.weekNumber, value: s.totalVolume })))} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="week" tick={{ fill: "#666", fontSize: 11 }} tickFormatter={(v) => `W${v}`} />
                  <YAxis tick={{ fill: "#666", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#171717", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="value" stroke="#7a1b3e" strokeWidth={2} dot={{ fill: "#7a1b3e", r: 3 }} name="Volume" />
                  <Line type="monotone" dataKey="trend" stroke="#555" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Trend" />
                  {peakVol && <ReferenceDot x={peakVol.weekNumber} y={peakVol.totalVolume} r={6} fill="#a3254f" stroke="#fff" strokeWidth={2} />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-400 mb-2">Avg Intensity (%1RM) by Week</h3>
            <div className="h-48 bg-neutral-950 rounded-lg border border-neutral-800 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={addTrend(summaries.map((s) => ({ week: s.weekNumber, value: s.avgIntensity })))} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="week" tick={{ fill: "#666", fontSize: 11 }} tickFormatter={(v) => `W${v}`} />
                  <YAxis tick={{ fill: "#666", fontSize: 11 }} domain={[50, 100]} />
                  <Tooltip contentStyle={{ background: "#171717", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="value" stroke="#d4a855" strokeWidth={2} dot={{ fill: "#d4a855", r: 3 }} name="Avg %1RM" />
                  <Line type="monotone" dataKey="trend" stroke="#555" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Trend" />
                  {peakInt && <ReferenceDot x={peakInt.weekNumber} y={peakInt.avgIntensity} r={6} fill="#d4a855" stroke="#fff" strokeWidth={2} />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
              <h4 className="text-xs text-neutral-500 mb-2">Peak Volume</h4>
              <p className="text-lg font-mono text-bordeaux-400">W{peakVol?.weekNumber} — {peakVol?.totalVolume.toLocaleString()} kg</p>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
              <h4 className="text-xs text-neutral-500 mb-2">Peak Intensity</h4>
              <p className="text-lg font-mono text-yellow-400">W{peakInt?.weekNumber} — {peakInt?.avgIntensity}%</p>
            </div>
          </div>
        </div>
      )}

      {/* === SUMMARY VIEW === */}
      {view === "summary" && (
        <div className="space-y-2">
          {program.weeks.map((week) => {
            const s = getWeekSummary(week);
            return (
              <div key={week.id} className="flex items-center gap-4 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3">
                <span className="text-sm font-mono text-neutral-400 w-12">W{week.weekNumber}</span>
                <div className="flex-1 grid grid-cols-3 gap-4 text-xs">
                  <div><span className="text-neutral-500">Volume</span> <span className="text-neutral-200 font-mono ml-1">{s.totalVolume.toLocaleString()} kg</span></div>
                  <div><span className="text-neutral-500">Reps</span> <span className="text-neutral-200 font-mono ml-1">{s.totalReps}</span></div>
                  <div><span className="text-neutral-500">Avg %1RM</span> <span className="text-neutral-200 font-mono ml-1">{s.avgIntensity > 0 ? `${s.avgIntensity}%` : "—"}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* === TABLE VIEW === */}
      {view === "table" && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-xs text-neutral-500 p-2 w-20 sticky left-0 bg-black z-10 print:bg-white">Week</th>
                {Array.from({ length: program.daysPerWeek }, (_, i) => {
                  const firstWeekDay = program.weeks[0]?.days[i];
                  const label = firstWeekDay?.label;
                  return (
                    <th key={i} className="text-left text-xs text-neutral-500 p-2 min-w-[280px] print:min-w-0">
                      {editingLabel?.dayId === firstWeekDay?.id ? (
                        <input type="text" autoFocus value={editingLabel.value}
                          onChange={(e) => setEditingLabel({ ...editingLabel, value: e.target.value })}
                          onBlur={() => saveDayLabel(firstWeekDay.id, editingLabel.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveDayLabel(firstWeekDay.id, editingLabel.value); }}
                          className="bg-neutral-900 border border-bordeaux-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none w-32" />
                      ) : (
                        <span className="cursor-pointer hover:text-neutral-300"
                          onClick={() => setEditingLabel({ dayId: firstWeekDay?.id || "", value: label || "" })}>
                          {label || `Day ${i + 1}`}
                          <span className="text-neutral-700 ml-1 text-[9px]">edit</span>
                        </span>
                      )}
                    </th>
                  );
                })}
                <th className="text-left text-xs text-neutral-500 p-2 w-52 print:hidden">Summary</th>
              </tr>
            </thead>
            <tbody>
              {program.weeks.map((week, wIdx) => {
                const summary = getWeekSummary(week);
                const hasExercises = week.days.some((d) => d.exercises.length > 0);
                return (
                  <tr key={week.id} className="border-t border-neutral-900 align-top print:break-inside-avoid">
                    <td className="text-sm font-mono text-neutral-400 p-2 sticky left-0 bg-black z-10 print:bg-white">
                      <div>W{week.weekNumber}</div>
                      {/* Copy week buttons */}
                      <div className="mt-1 space-y-0.5 print:hidden">
                        {wIdx > 0 && !hasExercises && (
                          <button onClick={() => copyWeek(wIdx - 1, wIdx)}
                            className="text-[9px] text-bordeaux-400 hover:text-bordeaux-300 block">
                            ← Copy W{week.weekNumber - 1}
                          </button>
                        )}
                        {wIdx < program.weeks.length - 1 && hasExercises && (
                          <button onClick={() => copyWeek(wIdx, wIdx + 1)}
                            className="text-[9px] text-neutral-600 hover:text-neutral-400 block">
                            Copy → W{week.weekNumber + 1}
                          </button>
                        )}
                      </div>
                    </td>
                    {week.days.map((day, dIdx) => {
                      const isActive = activeCell?.week === wIdx && activeCell?.day === dIdx;
                      const dayComplete = day.exercises.length > 0 && day.exercises.every((e) => e.actualSets !== null);
                      return (
                        <td key={day.id}
                          className={`p-2 border-l border-neutral-900 cursor-pointer transition-colors ${isActive ? "bg-neutral-950" : "hover:bg-neutral-950/50"} ${dayComplete ? "bg-green-950/10" : ""}`}
                          onClick={() => { setActiveCell({ week: wIdx, day: dIdx }); setShowSearch(false); setSearchQuery(""); }}>

                          <div className="space-y-1.5">
                            {day.exercises.map((ex, eIdx) => {
                              const oneRM = program.oneRMs[ex.exerciseId] || 0;
                              const ri = getRI(ex.intensityPercent, ex.reps);
                              const suggestion = getSuggestion(wIdx, dIdx, ex.exerciseId);

                              return (
                                <div key={ex.id} className={`bg-neutral-900/50 border rounded p-2 transition-colors ${ex.actualSets !== null ? "border-green-900/30" : "border-neutral-800 hover:border-neutral-700"}`}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-neutral-100">{ex.exerciseName}</span>
                                    <div className="flex items-center gap-1.5 print:hidden">
                                      <button onClick={(e) => { e.stopPropagation(); copyExerciseToAllWeeks(ex, day.dayNumber); }}
                                        className="text-[9px] text-neutral-700 hover:text-bordeaux-400" title="Copy to all weeks">
                                        ⇊ all
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); removeExercise(wIdx, dIdx, eIdx); }}
                                        className="text-neutral-700 hover:text-red-500 text-[10px]">×</button>
                                    </div>
                                  </div>

                                  {suggestion && !ex.loadKg && (
                                    <button onClick={(e) => { e.stopPropagation(); updateExercise(wIdx, dIdx, eIdx, suggestion); }}
                                      className="text-[9px] text-bordeaux-400 hover:text-bordeaux-300 mb-1 block print:hidden">
                                      Suggest: {suggestion.sets}×{suggestion.reps} @ {suggestion.loadKg} kg
                                    </button>
                                  )}

                                  <div className="grid grid-cols-6 gap-1 text-[11px]">
                                    {[
                                      { label: "Sets", val: ex.sets, key: "sets", parse: parseInt },
                                      { label: "Reps", val: ex.reps, key: "reps", parse: parseInt },
                                      { label: "%1RM", val: ex.intensityPercent, key: "intensityPercent", parse: parseFloat },
                                      { label: "kg", val: ex.loadKg, key: "loadKg", parse: parseFloat },
                                    ].map(({ label, val, key, parse }) => (
                                      <div key={key}>
                                        <label className="text-neutral-600 block">{label}</label>
                                        <input type="number" value={val ?? ""} onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { [key]: e.target.value ? parse(e.target.value) : null } as any)}
                                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-1 py-0.5 text-neutral-100 focus:border-bordeaux-500 focus:outline-none text-center print:border-gray-300" />
                                      </div>
                                    ))}
                                    <div>
                                      <label className="text-neutral-600 block">RPE</label>
                                      <select value={ex.rpe ?? ""} onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { rpe: e.target.value ? parseFloat(e.target.value) : null })}
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-0 py-0.5 text-neutral-100 focus:border-bordeaux-500 focus:outline-none text-center print:border-gray-300">
                                        <option value="">—</option>
                                        {RPE_VALUES.map((v) => <option key={v} value={v}>{v}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-neutral-600 block">RI%</label>
                                      <div className="px-1 py-0.5 text-neutral-500 text-center">{ri ? `${ri}%` : "—"}</div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 mt-0.5 text-[9px] text-neutral-600">
                                    {oneRM > 0 && <span>1RM: {oneRM}kg</span>}
                                    {ex.loadKg && ex.sets > 0 && ex.reps > 0 && <span>Vol: {(ex.sets * ex.reps * ex.loadKg).toLocaleString()}kg</span>}
                                  </div>

                                  <details className="mt-0.5 print:hidden" onClick={(e) => e.stopPropagation()}>
                                    <summary className="text-[9px] text-neutral-700 cursor-pointer hover:text-neutral-500">Log actuals</summary>
                                    <div className="grid grid-cols-3 gap-1 mt-1 text-[11px]">
                                      {[
                                        { label: "Sets", val: ex.actualSets, key: "actualSets", parse: parseInt },
                                        { label: "Reps", val: ex.actualReps, key: "actualReps", parse: parseInt },
                                        { label: "kg", val: ex.actualLoadKg, key: "actualLoadKg", parse: parseFloat },
                                      ].map(({ label, val, key, parse }) => (
                                        <div key={key}>
                                          <label className="text-neutral-600 block">{label}</label>
                                          <input type="number" value={val ?? ""}
                                            onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { [key]: e.target.value ? parse(e.target.value) : null } as any)}
                                            className="w-full bg-neutral-900 border border-neutral-800 rounded px-1 py-0.5 text-neutral-100 focus:border-bordeaux-500 focus:outline-none text-center" />
                                        </div>
                                      ))}
                                    </div>
                                  </details>

                                  <input type="text" placeholder="Notes..." value={ex.notes || ""}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { notes: e.target.value || null })}
                                    className="mt-0.5 w-full bg-transparent border-b border-neutral-800/50 text-[9px] text-neutral-500 placeholder-neutral-800 focus:border-bordeaux-500 focus:outline-none pb-0.5 print:hidden" />
                                </div>
                              );
                            })}
                          </div>

                          {/* Actions */}
                          {isActive && (
                            <div className="mt-2 space-y-1 print:hidden" onClick={(e) => e.stopPropagation()}>
                              {!showSearch ? (
                                <div className="flex gap-1">
                                  <button onClick={() => setShowSearch(true)}
                                    className="flex-1 text-xs text-neutral-600 hover:text-bordeaux-400 border border-dashed border-neutral-800 hover:border-bordeaux-800 rounded py-1.5 transition-colors">
                                    + Add Exercise
                                  </button>
                                  {day.exercises.length > 0 && !dayComplete && (
                                    <button onClick={() => completeDay(day.id)}
                                      className="text-[10px] bg-green-900/30 text-green-400 border border-green-900/50 rounded px-2 py-1.5 hover:bg-green-900/50 transition-colors">
                                      ✓ Complete
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search exercises..." autoFocus
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:border-bordeaux-500 focus:outline-none" />
                                  <div className="max-h-48 overflow-y-auto bg-neutral-900 border border-neutral-800 rounded">
                                    {filtered.slice(0, 20).map((ex) => (
                                      <button key={ex.id} onClick={() => addExercise(wIdx, dIdx, ex)}
                                        className="w-full text-left px-2.5 py-1.5 hover:bg-neutral-800 flex justify-between items-center text-xs">
                                        <span className="text-neutral-200">{ex.name}</span>
                                        <span className="text-[9px] px-1 py-0.5 rounded bg-neutral-800 text-neutral-500 uppercase">{catLabel[ex.category]}</span>
                                      </button>
                                    ))}
                                    {filtered.length === 0 && searchQuery && (
                                      <button onClick={() => addCustomExercise(searchQuery)}
                                        className="w-full text-left px-2.5 py-1.5 hover:bg-neutral-800 text-xs text-bordeaux-400">
                                        + Add &quot;{searchQuery}&quot; as custom exercise
                                      </button>
                                    )}
                                  </div>
                                  <button onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                                    className="text-[10px] text-neutral-600 hover:text-neutral-400">Cancel</button>
                                </div>
                              )}
                            </div>
                          )}

                          {day.exercises.length === 0 && !isActive && (
                            <div className="text-[10px] text-neutral-700 py-3 text-center">Click to add</div>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-2 border-l border-neutral-900 align-top print:hidden">
                      <div className="text-[11px] space-y-1 bg-neutral-950 rounded p-2 border border-neutral-800">
                        <div><span className="text-neutral-600">Vol</span> <span className="text-neutral-300 font-mono ml-1">{summary.totalVolume.toLocaleString()} kg</span></div>
                        <div><span className="text-neutral-600">Reps</span> <span className="text-neutral-300 font-mono ml-1">{summary.totalReps}</span></div>
                        <div><span className="text-neutral-600">%</span> <span className="text-neutral-300 font-mono ml-1">{summary.avgIntensity > 0 ? `${summary.avgIntensity}%` : "—"}</span></div>
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
