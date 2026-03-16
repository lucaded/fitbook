"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  EXERCISE_LIBRARY,
  DEFAULT_RPE_TABLE,
  RPE_VALUES,
  REP_RANGE,
  calcLoad,
  calcIntensity,
  calcRelativeIntensity,
  getMaxPercentForReps,
  type LibraryExercise,
} from "@/lib/training-data";

interface ProgramExercise {
  id: string;
  dayId: string;
  exerciseName: string;
  exerciseId: string;
  order: number;
  sets: number;
  reps: number;
  intensityPercent: number | null;
  loadKg: number | null;
  rpe: number | null;
  notes: string | null;
  actualSets: number | null;
  actualReps: number | null;
  actualLoadKg: number | null;
}

interface ProgramDay {
  id: string;
  dayNumber: number;
  label: string | null;
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
  progressionIncrement: number;
  oneRMs: Record<string, number>;
  status: string;
  client: { id: string; name: string };
  weeks: ProgramWeek[];
}

export default function ProgramEditorPage() {
  const params = useParams();
  const router = useRouter();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCell, setActiveCell] = useState<{ week: number; day: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [customExName, setCustomExName] = useState("");
  const [showRPETable, setShowRPETable] = useState(false);
  const [showOneRMs, setShowOneRMs] = useState(false);
  const [rpeTable, setRpeTable] = useState<Record<number, number[]>>({ ...DEFAULT_RPE_TABLE });
  const [view, setView] = useState<"table" | "summary">("table");

  const loadProgram = useCallback(() => {
    fetch(`/api/programs/${params.programId}`)
      .then((r) => r.json())
      .then((data) => { setProgram(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.programId]);

  useEffect(() => { loadProgram(); }, [loadProgram]);

  // Save oneRMs to DB
  const saveOneRMs = async (oneRMs: Record<string, number>) => {
    if (!program) return;
    setProgram({ ...program, oneRMs });
    await fetch(`/api/programs/${program.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oneRMs }),
    });
  };

  // Add exercise to a day
  const addExercise = async (weekIdx: number, dayIdx: number, libEx: LibraryExercise) => {
    if (!program) return;
    const day = program.weeks[weekIdx].days[dayIdx];
    const oneRM = program.oneRMs[libEx.id] || 0;

    // Get suggestion from previous week
    const suggestion = getSuggestion(weekIdx, dayIdx, libEx.id);

    const body = {
      dayId: day.id,
      exerciseName: libEx.name,
      exerciseId: libEx.id,
      order: day.exercises.length,
      sets: suggestion?.sets || 3,
      reps: suggestion?.reps || 5,
      intensityPercent: suggestion?.intensityPercent || null,
      loadKg: suggestion?.loadKg || null,
    };

    setSaving(true);
    const res = await fetch(`/api/programs/${program.id}/exercises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const exercise = await res.json();

    // Update local state
    const updated = { ...program };
    updated.weeks = [...updated.weeks];
    updated.weeks[weekIdx] = { ...updated.weeks[weekIdx] };
    updated.weeks[weekIdx].days = [...updated.weeks[weekIdx].days];
    updated.weeks[weekIdx].days[dayIdx] = {
      ...updated.weeks[weekIdx].days[dayIdx],
      exercises: [...updated.weeks[weekIdx].days[dayIdx].exercises, exercise],
    };
    setProgram(updated);

    // Ensure 1RM entry exists
    if (!updated.oneRMs[libEx.id]) {
      saveOneRMs({ ...updated.oneRMs, [libEx.id]: 0 });
    }

    setSearchQuery("");
    setShowSearch(false);
    setSaving(false);
  };

  // Update exercise
  const updateExercise = async (weekIdx: number, dayIdx: number, exIdx: number, fields: Partial<ProgramExercise>) => {
    if (!program) return;
    const ex = program.weeks[weekIdx].days[dayIdx].exercises[exIdx];
    const oneRM = program.oneRMs[ex.exerciseId] || 0;

    const updated = { ...ex, ...fields };

    // Auto-calc load from intensity
    if ("intensityPercent" in fields && fields.intensityPercent && oneRM > 0) {
      updated.loadKg = calcLoad(oneRM, fields.intensityPercent);
    }
    // Auto-calc intensity from load
    if ("loadKg" in fields && fields.loadKg && oneRM > 0) {
      updated.intensityPercent = calcIntensity(oneRM, fields.loadKg);
    }

    // Update local state immediately
    const prog = { ...program };
    prog.weeks = [...prog.weeks];
    prog.weeks[weekIdx] = { ...prog.weeks[weekIdx] };
    prog.weeks[weekIdx].days = [...prog.weeks[weekIdx].days];
    prog.weeks[weekIdx].days[dayIdx] = {
      ...prog.weeks[weekIdx].days[dayIdx],
      exercises: prog.weeks[weekIdx].days[dayIdx].exercises.map((e, i) =>
        i === exIdx ? updated : e
      ),
    };
    setProgram(prog);

    // Save to DB (debounced)
    await fetch(`/api/programs/${program.id}/exercises`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: ex.id,
        sets: updated.sets,
        reps: updated.reps,
        intensityPercent: updated.intensityPercent,
        loadKg: updated.loadKg,
        rpe: updated.rpe,
        notes: updated.notes,
        actualSets: updated.actualSets,
        actualReps: updated.actualReps,
        actualLoadKg: updated.actualLoadKg,
      }),
    });
  };

  // Remove exercise
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

    await fetch(`/api/programs/${program.id}/exercises?exerciseId=${ex.id}`, {
      method: "DELETE",
    });
  };

  // Get suggestion from previous week's same day/exercise
  const getSuggestion = (weekIdx: number, dayIdx: number, exerciseId: string) => {
    if (!program || weekIdx === 0) return null;
    const prevDay = program.weeks[weekIdx - 1]?.days[dayIdx];
    if (!prevDay) return null;
    const prevEx = prevDay.exercises.find((e) => e.exerciseId === exerciseId);
    if (!prevEx) return null;

    const prevLoad = prevEx.actualLoadKg ?? prevEx.loadKg ?? 0;
    const prevReps = prevEx.actualReps ?? prevEx.reps;
    const prevSets = prevEx.actualSets ?? prevEx.sets;
    const oneRM = program.oneRMs[exerciseId] || 0;
    const newLoad = prevLoad + (program.progressionIncrement || 2.5);
    const newIntensity = oneRM > 0 ? calcIntensity(oneRM, newLoad) : (prevEx.intensityPercent || null);

    return {
      sets: prevSets,
      reps: prevReps,
      loadKg: newLoad,
      intensityPercent: newIntensity,
    };
  };

  // Calc relative intensity
  const getRI = (intensityPercent: number | null, reps: number) => {
    if (!intensityPercent || reps < 1 || reps > 10) return null;
    return Math.round(calcRelativeIntensity(intensityPercent, reps, rpeTable) * 10) / 10;
  };

  // Week summaries
  const getWeekSummary = (week: ProgramWeek) => {
    let totalVolume = 0, totalReps = 0, weightedIntSum = 0, weightedIntDenom = 0;
    for (const day of week.days) {
      for (const ex of day.exercises) {
        const s = ex.actualSets ?? ex.sets;
        const r = ex.actualReps ?? ex.reps;
        const l = ex.actualLoadKg ?? ex.loadKg ?? 0;
        totalVolume += s * r * l;
        totalReps += s * r;
        if (ex.intensityPercent) {
          weightedIntSum += ex.intensityPercent * s * r;
          weightedIntDenom += s * r;
        }
      }
    }
    return {
      totalVolume,
      totalReps,
      avgIntensity: weightedIntDenom > 0 ? Math.round(weightedIntSum / weightedIntDenom * 10) / 10 : 0,
    };
  };

  // Add custom exercise
  const addCustomExercise = (name: string) => {
    const libEx: LibraryExercise = {
      id: `custom-${Date.now()}`,
      name,
      category: "custom",
      muscleGroups: [],
    };
    if (activeCell) {
      addExercise(activeCell.week, activeCell.day, libEx);
    }
    setCustomExName("");
  };

  // Exercise search
  const allExercises = EXERCISE_LIBRARY;
  const filtered = searchQuery.length > 0
    ? allExercises.filter((e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.muscleGroups.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allExercises;

  const categoryLabel: Record<string, string> = {
    powerlifting: "PL",
    bodybuilding: "BB",
    olympic: "OLY",
    custom: "Custom",
  };

  if (loading) return <div className="text-neutral-600 py-8">Loading program...</div>;
  if (!program) return <div className="text-red-500 py-8">Program not found</div>;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
          <Link href="/trainer/clients" className="hover:text-neutral-300">Clients</Link>
          <span>/</span>
          <Link href={`/trainer/clients/${program.client.id}`} className="hover:text-neutral-300">
            {program.client.name}
          </Link>
          <span>/</span>
          <span className="text-neutral-300">{program.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{program.name}</h1>
            <p className="text-xs text-neutral-500 mt-1">
              {program.client.name} · {program.weeks.length} weeks · {program.daysPerWeek} days/week · {program.progressionIncrement} kg increments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(view === "table" ? "summary" : "table")}
              className="text-xs border border-neutral-700 rounded px-3 py-1.5 hover:bg-neutral-900 transition-colors"
            >
              {view === "table" ? "Summary" : "Table"}
            </button>
            <button
              onClick={() => setShowOneRMs(!showOneRMs)}
              className="text-xs border border-neutral-700 rounded px-3 py-1.5 hover:bg-neutral-900 transition-colors"
            >
              1RM Values
            </button>
            <button
              onClick={() => setShowRPETable(!showRPETable)}
              className="text-xs border border-neutral-700 rounded px-3 py-1.5 hover:bg-neutral-900 transition-colors"
            >
              RPE Table
            </button>
          </div>
        </div>
      </div>

      {/* 1RM Manager */}
      {showOneRMs && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-neutral-300 mb-3">1RM Values (kg)</h3>
          <p className="text-[10px] text-neutral-600 mb-3">Set 1RM for each exercise. Load and intensity auto-calculate from these.</p>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(program.oneRMs).map(([exId, rm]) => {
              const ex = allExercises.find((e) => e.id === exId);
              return (
                <div key={exId} className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 flex-1 truncate">{ex?.name || exId}</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={rm || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      saveOneRMs({ ...program.oneRMs, [exId]: val });
                    }}
                    className="w-20 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-100 focus:border-bordeaux-500 focus:outline-none text-right"
                  />
                  <span className="text-[10px] text-neutral-600">kg</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RPE Table */}
      {showRPETable && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 mb-4 overflow-x-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-neutral-300">RPE Chart — %1RM by Reps</h3>
            <button
              onClick={() => setRpeTable({ ...DEFAULT_RPE_TABLE })}
              className="text-[10px] text-neutral-600 hover:text-neutral-400"
            >
              Reset defaults
            </button>
          </div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left text-neutral-500 p-1 w-16">RPE</th>
                {REP_RANGE.map((r) => (
                  <th key={r} className="text-center text-neutral-500 p-1">{r} rep{r > 1 ? "s" : ""}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RPE_VALUES.map((rpe) => (
                <tr key={rpe} className={rpe >= 9 ? "bg-red-900/10" : rpe >= 8 ? "bg-yellow-900/10" : "bg-green-900/10"}>
                  <td className="font-mono text-neutral-300 p-1 font-medium">{rpe}</td>
                  {rpeTable[rpe].map((val, i) => (
                    <td key={i} className="p-0.5">
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => {
                          const newTable = { ...rpeTable };
                          newTable[rpe] = [...newTable[rpe]];
                          newTable[rpe][i] = parseInt(e.target.value) || 0;
                          setRpeTable(newTable);
                        }}
                        className="w-full text-center bg-transparent border border-neutral-800 rounded px-1 py-0.5 text-neutral-200 focus:border-bordeaux-500 focus:outline-none"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "summary" ? (
        /* Week Summaries */
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
      ) : (
        /* Table View */
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-xs text-neutral-500 p-2 w-16 sticky left-0 bg-black z-10">Week</th>
                {Array.from({ length: program.daysPerWeek }, (_, i) => (
                  <th key={i} className="text-left text-xs text-neutral-500 p-2 min-w-[300px]">Day {i + 1}</th>
                ))}
                <th className="text-left text-xs text-neutral-500 p-2 w-64">Summary</th>
              </tr>
            </thead>
            <tbody>
              {program.weeks.map((week, wIdx) => {
                const summary = getWeekSummary(week);
                return (
                  <tr key={week.id} className="border-t border-neutral-900 align-top">
                    <td className="text-sm font-mono text-neutral-400 p-2 sticky left-0 bg-black z-10">
                      W{week.weekNumber}
                    </td>
                    {week.days.map((day, dIdx) => {
                      const isActive = activeCell?.week === wIdx && activeCell?.day === dIdx;
                      return (
                        <td
                          key={day.id}
                          className={`p-2 border-l border-neutral-900 cursor-pointer transition-colors ${
                            isActive ? "bg-neutral-950" : "hover:bg-neutral-950/50"
                          }`}
                          onClick={() => {
                            setActiveCell({ week: wIdx, day: dIdx });
                            setShowSearch(false);
                            setSearchQuery("");
                          }}
                        >
                          <div className="space-y-1.5">
                            {day.exercises.map((ex, eIdx) => {
                              const oneRM = program.oneRMs[ex.exerciseId] || 0;
                              const ri = getRI(ex.intensityPercent, ex.reps);
                              const suggestion = getSuggestion(wIdx, dIdx, ex.exerciseId);

                              return (
                                <div key={ex.id} className="bg-neutral-900/50 border border-neutral-800 rounded p-2.5 hover:border-neutral-700 transition-colors">
                                  {/* Exercise header */}
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-medium text-neutral-100">{ex.exerciseName}</span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); removeExercise(wIdx, dIdx, eIdx); }}
                                      className="text-neutral-700 hover:text-red-500 text-[10px] transition-colors"
                                    >
                                      ×
                                    </button>
                                  </div>

                                  {/* Suggestion */}
                                  {suggestion && day.exercises.length > 0 && !ex.loadKg && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateExercise(wIdx, dIdx, eIdx, {
                                          sets: suggestion.sets,
                                          reps: suggestion.reps,
                                          loadKg: suggestion.loadKg,
                                          intensityPercent: suggestion.intensityPercent,
                                        });
                                      }}
                                      className="text-[10px] text-bordeaux-400 hover:text-bordeaux-300 mb-1.5 block"
                                    >
                                      Suggest: {suggestion.sets}×{suggestion.reps} @ {suggestion.loadKg} kg
                                      {suggestion.intensityPercent ? ` (${suggestion.intensityPercent}%)` : ""}
                                    </button>
                                  )}

                                  {/* Inputs grid */}
                                  <div className="grid grid-cols-6 gap-1.5 text-[11px]">
                                    <div>
                                      <label className="text-neutral-600 block">Sets</label>
                                      <input
                                        type="number" min={1}
                                        value={ex.sets}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { sets: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-100 focus:border-bordeaux-500 focus:outline-none text-center"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-neutral-600 block">Reps</label>
                                      <input
                                        type="number" min={1}
                                        value={ex.reps}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { reps: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-100 focus:border-bordeaux-500 focus:outline-none text-center"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-neutral-600 block">%1RM</label>
                                      <input
                                        type="number" min={0} max={100} step={0.5}
                                        value={ex.intensityPercent ?? ""}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { intensityPercent: parseFloat(e.target.value) || null })}
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-100 focus:border-bordeaux-500 focus:outline-none text-center"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-neutral-600 block">kg</label>
                                      <input
                                        type="number" min={0} step={2.5}
                                        value={ex.loadKg ?? ""}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { loadKg: parseFloat(e.target.value) || null })}
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-100 focus:border-bordeaux-500 focus:outline-none text-center"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-neutral-600 block">RPE</label>
                                      <select
                                        value={ex.rpe ?? ""}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { rpe: e.target.value ? parseFloat(e.target.value) : null })}
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-0.5 py-1 text-neutral-100 focus:border-bordeaux-500 focus:outline-none text-center"
                                      >
                                        <option value="">—</option>
                                        {RPE_VALUES.map((v) => <option key={v} value={v}>{v}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-neutral-600 block">RI%</label>
                                      <div className="px-1.5 py-1 text-neutral-500 text-center">
                                        {ri ? `${ri}%` : "—"}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Meta line */}
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-600">
                                    {oneRM > 0 && <span>1RM: {oneRM} kg</span>}
                                    {ex.loadKg && ex.sets > 0 && ex.reps > 0 && (
                                      <span>Vol: {(ex.sets * ex.reps * ex.loadKg).toLocaleString()} kg</span>
                                    )}
                                  </div>

                                  {/* Actuals */}
                                  <details className="mt-1" onClick={(e) => e.stopPropagation()}>
                                    <summary className="text-[10px] text-neutral-700 cursor-pointer hover:text-neutral-500">
                                      Log actuals
                                    </summary>
                                    <div className="grid grid-cols-3 gap-1.5 mt-1.5 text-[11px]">
                                      <div>
                                        <label className="text-neutral-600 block">Sets</label>
                                        <input
                                          type="number" min={0}
                                          value={ex.actualSets ?? ""}
                                          onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { actualSets: e.target.value ? parseInt(e.target.value) : null })}
                                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-100 focus:border-bordeaux-500 focus:outline-none text-center"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-neutral-600 block">Reps</label>
                                        <input
                                          type="number" min={0}
                                          value={ex.actualReps ?? ""}
                                          onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { actualReps: e.target.value ? parseInt(e.target.value) : null })}
                                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-100 focus:border-bordeaux-500 focus:outline-none text-center"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-neutral-600 block">kg</label>
                                        <input
                                          type="number" min={0} step={2.5}
                                          value={ex.actualLoadKg ?? ""}
                                          onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { actualLoadKg: e.target.value ? parseFloat(e.target.value) : null })}
                                          className="w-full bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-neutral-100 focus:border-bordeaux-500 focus:outline-none text-center"
                                        />
                                      </div>
                                    </div>
                                  </details>

                                  {/* Notes */}
                                  <input
                                    type="text"
                                    placeholder="Notes..."
                                    value={ex.notes || ""}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => updateExercise(wIdx, dIdx, eIdx, { notes: e.target.value || null })}
                                    className="mt-1 w-full bg-transparent border-b border-neutral-800/50 text-[10px] text-neutral-500 placeholder-neutral-800 focus:border-bordeaux-500 focus:outline-none pb-0.5"
                                  />
                                </div>
                              );
                            })}
                          </div>

                          {/* Add exercise button / search */}
                          {isActive && (
                            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                              {!showSearch ? (
                                <button
                                  onClick={() => setShowSearch(true)}
                                  className="w-full text-xs text-neutral-600 hover:text-bordeaux-400 border border-dashed border-neutral-800 hover:border-bordeaux-800 rounded py-2 transition-colors"
                                >
                                  + Add Exercise
                                </button>
                              ) : (
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search exercises..."
                                    autoFocus
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:border-bordeaux-500 focus:outline-none"
                                  />
                                  <div className="max-h-48 overflow-y-auto bg-neutral-900 border border-neutral-800 rounded">
                                    {filtered.slice(0, 20).map((ex) => (
                                      <button
                                        key={ex.id}
                                        onClick={() => addExercise(wIdx, dIdx, ex)}
                                        className="w-full text-left px-2.5 py-1.5 hover:bg-neutral-800 flex justify-between items-center text-xs"
                                      >
                                        <span className="text-neutral-200">{ex.name}</span>
                                        <span className="text-[9px] px-1 py-0.5 rounded bg-neutral-800 text-neutral-500 uppercase">
                                          {categoryLabel[ex.category]}
                                        </span>
                                      </button>
                                    ))}
                                    {filtered.length === 0 && searchQuery && (
                                      <button
                                        onClick={() => addCustomExercise(searchQuery)}
                                        className="w-full text-left px-2.5 py-1.5 hover:bg-neutral-800 text-xs text-bordeaux-400"
                                      >
                                        + Add &quot;{searchQuery}&quot; as custom exercise
                                      </button>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                                    className="text-[10px] text-neutral-600 hover:text-neutral-400"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {day.exercises.length === 0 && !isActive && (
                            <div className="text-[10px] text-neutral-700 py-4 text-center">
                              Click to add exercises
                            </div>
                          )}
                        </td>
                      );
                    })}
                    {/* Week summary column */}
                    <td className="p-2 border-l border-neutral-900 align-top">
                      <div className="text-[11px] space-y-1.5 bg-neutral-950 rounded p-2.5 border border-neutral-800">
                        <div><span className="text-neutral-600">Volume</span> <span className="text-neutral-300 font-mono ml-1">{summary.totalVolume.toLocaleString()} kg</span></div>
                        <div><span className="text-neutral-600">Reps</span> <span className="text-neutral-300 font-mono ml-1">{summary.totalReps}</span></div>
                        <div><span className="text-neutral-600">Avg %</span> <span className="text-neutral-300 font-mono ml-1">{summary.avgIntensity > 0 ? `${summary.avgIntensity}%` : "—"}</span></div>
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
