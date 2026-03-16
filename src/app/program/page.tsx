"use client";

import { useState, useCallback, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { ExerciseSearch } from "@/components/program/ExerciseSearch";
import { ExerciseRow } from "@/components/program/ExerciseRow";
import { WeekSummaryBar } from "@/components/program/WeekSummaryBar";
import { TrendCharts } from "@/components/program/TrendCharts";
import { RPETableEditor } from "@/components/program/RPETableEditor";
import { OneRMManager } from "@/components/program/OneRMManager";
import {
  type Program,
  type PrescribedExercise,
  type TrainingWeek,
  type TrainingDay,
  type ExercisePR,
  createEmptyProgram,
  calcWeekSummary,
} from "@/lib/program-types";
import {
  DEFAULT_RPE_TABLE,
  calcLoad,
  calcIntensity,
  calcRelativeIntensity,
  type LibraryExercise,
} from "@/lib/training-data";

const STORAGE_KEY = "fitbook-program";

function loadProgram(): Program | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { return null; }
  }
  return null;
}

function saveProgram(program: Program) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(program));
}

export default function ProgramPage() {
  const [program, setProgram] = useState<Program | null>(null);
  const [rpeTable, setRpeTable] = useState<Record<number, number[]>>({ ...DEFAULT_RPE_TABLE });
  const [activeCell, setActiveCell] = useState<{ week: number; day: number } | null>(null);
  const [view, setView] = useState<"table" | "charts">("table");

  // Setup dialog state
  const [showSetup, setShowSetup] = useState(false);
  const [setupName, setSetupName] = useState("New Program");
  const [setupWeeks, setSetupWeeks] = useState(8);
  const [setupDays, setSetupDays] = useState(4);

  useEffect(() => {
    const loaded = loadProgram();
    if (loaded) {
      setProgram(loaded);
    } else {
      setShowSetup(true);
    }
  }, []);

  const updateProgram = useCallback((updated: Program) => {
    setProgram(updated);
    saveProgram(updated);
  }, []);

  const createNew = () => {
    const p = createEmptyProgram(setupName, setupWeeks, setupDays);
    updateProgram(p);
    setShowSetup(false);
  };

  // Get suggestion for an exercise based on previous week
  const getSuggestion = (weekIdx: number, dayIdx: number, exerciseId: string): { sets: number; reps: number; loadKg: number } | null => {
    if (!program || weekIdx === 0) return null;
    const prevWeek = program.weeks[weekIdx - 1];
    const prevDay = prevWeek.days[dayIdx];
    if (!prevDay) return null;
    const prevEx = prevDay.exercises.find((e) => e.exerciseId === exerciseId);
    if (!prevEx) return null;

    const prevLoad = prevEx.actualLoadKg ?? prevEx.loadKg;
    const prevReps = prevEx.actualReps ?? prevEx.reps;
    const prevSets = prevEx.actualSets ?? prevEx.sets;

    return {
      sets: prevSets,
      reps: prevReps,
      loadKg: prevLoad + (program.progressionIncrement || 2.5),
    };
  };

  // Check and register PRs
  const checkPR = (exercise: PrescribedExercise, weekNumber: number): boolean => {
    if (!program) return false;
    const load = exercise.actualLoadKg ?? exercise.loadKg;
    const reps = exercise.actualReps ?? exercise.reps;
    const existing = program.prs.filter((pr) => pr.exerciseId === exercise.exerciseId);
    // PR if heavier at same or more reps, or same weight at more reps
    const isPR = !existing.some((pr) => pr.loadKg >= load && pr.reps >= reps);
    return isPR && load > 0;
  };

  const addExerciseToDay = (weekIdx: number, dayIdx: number, libExercise: LibraryExercise) => {
    if (!program) return;
    const updated = { ...program };
    const weeks = [...updated.weeks];
    const week = { ...weeks[weekIdx] };
    const days = [...week.days];
    const day = { ...days[dayIdx] };

    const oneRM = updated.oneRMs[libExercise.id] || 0;

    const newEx: PrescribedExercise = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      exerciseId: libExercise.id,
      exerciseName: libExercise.name,
      oneRM,
      sets: 3,
      reps: 5,
      intensityPercent: 0,
      loadKg: 0,
      rpe: null,
      relativeIntensity: null,
      notes: "",
      actualSets: null,
      actualReps: null,
      actualLoadKg: null,
      isPR: false,
    };

    day.exercises = [...day.exercises, newEx];
    days[dayIdx] = day;
    week.days = days;
    weeks[weekIdx] = week;
    updated.weeks = weeks;

    // Ensure 1RM entry exists
    if (!updated.oneRMs[libExercise.id]) {
      updated.oneRMs[libExercise.id] = 0;
    }

    updateProgram(updated);
  };

  const addCustomExercise = (name: string) => {
    if (!program) return;
    const id = `custom-${Date.now()}`;
    const custom: LibraryExercise = {
      id,
      name,
      category: "custom",
      muscleGroups: [],
    };
    updateProgram({
      ...program,
      customExercises: [...program.customExercises, custom],
    });
  };

  const updateExercise = (weekIdx: number, dayIdx: number, exIdx: number, ex: PrescribedExercise) => {
    if (!program) return;
    const updated = { ...program };
    const weeks = [...updated.weeks];
    const week = { ...weeks[weekIdx] };
    const days = [...week.days];
    const day = { ...days[dayIdx] };
    const exercises = [...day.exercises];

    // Check for PR
    ex.isPR = checkPR(ex, week.weekNumber);
    if (ex.isPR) {
      const load = ex.actualLoadKg ?? ex.loadKg;
      const reps = ex.actualReps ?? ex.reps;
      updated.prs = [
        ...updated.prs.filter((pr) => pr.exerciseId !== ex.exerciseId || pr.weekNumber !== week.weekNumber),
        {
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          loadKg: load,
          reps,
          weekNumber: week.weekNumber,
          date: new Date().toISOString(),
        },
      ];
    }

    exercises[exIdx] = ex;
    day.exercises = exercises;
    days[dayIdx] = day;
    week.days = days;
    weeks[weekIdx] = week;
    updated.weeks = weeks;
    updateProgram(updated);
  };

  const removeExercise = (weekIdx: number, dayIdx: number, exIdx: number) => {
    if (!program) return;
    const updated = { ...program };
    const weeks = [...updated.weeks];
    const week = { ...weeks[weekIdx] };
    const days = [...week.days];
    const day = { ...days[dayIdx] };
    day.exercises = day.exercises.filter((_, i) => i !== exIdx);
    days[dayIdx] = day;
    week.days = days;
    weeks[weekIdx] = week;
    updated.weeks = weeks;
    updateProgram(updated);
  };

  const updateOneRMs = (oneRMs: Record<string, number>) => {
    if (!program) return;
    // Recalculate all loads
    const updated = { ...program, oneRMs };
    for (const week of updated.weeks) {
      for (const day of week.days) {
        for (const ex of day.exercises) {
          const rm = oneRMs[ex.exerciseId] || 0;
          ex.oneRM = rm;
          if (ex.intensityPercent > 0 && rm > 0) {
            ex.loadKg = calcLoad(rm, ex.intensityPercent);
          }
        }
      }
    }
    updateProgram(updated);
  };

  // Add/remove weeks
  const addWeek = () => {
    if (!program) return;
    const weekNum = program.weeks.length + 1;
    const days: TrainingDay[] = [];
    for (let d = 0; d < program.daysPerWeek; d++) {
      days.push({ id: `w${weekNum}-d${d + 1}`, dayLabel: `Day ${d + 1}`, exercises: [] });
    }
    updateProgram({
      ...program,
      weeks: [...program.weeks, { id: `week-${weekNum}`, weekNumber: weekNum, days }],
    });
  };

  const summaries = program ? program.weeks.map(calcWeekSummary) : [];

  if (!program && !showSetup) return null;

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <Navbar />

      {/* Setup Dialog */}
      {showSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Create Program</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-500 block mb-1">Program Name</label>
                <input
                  type="text"
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm focus:border-bordeaux-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Weeks</label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={setupWeeks}
                    onChange={(e) => setSetupWeeks(parseInt(e.target.value) || 1)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm focus:border-bordeaux-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Days / Week</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={setupDays}
                    onChange={(e) => setSetupDays(Math.min(6, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm focus:border-bordeaux-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-neutral-500 block mb-1">Progression Increment (kg)</label>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  defaultValue={2.5}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm focus:border-bordeaux-500 focus:outline-none"
                />
              </div>
              <button
                onClick={createNew}
                className="w-full bg-bordeaux-600 hover:bg-bordeaux-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Create Program
              </button>
              {program && (
                <button
                  onClick={() => setShowSetup(false)}
                  className="w-full text-neutral-500 hover:text-neutral-300 py-2 text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {program && (
        <div className="max-w-[95vw] mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">{program.name}</h1>
              <p className="text-xs text-neutral-500">
                {program.weeks.length} weeks · {program.daysPerWeek} days/week · {program.progressionIncrement} kg increments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView(view === "table" ? "charts" : "table")}
                className="text-xs border border-neutral-700 rounded-lg px-3 py-1.5 hover:bg-neutral-900 transition-colors"
              >
                {view === "table" ? "Charts" : "Table"}
              </button>
              <button
                onClick={() => setShowSetup(true)}
                className="text-xs border border-neutral-700 rounded-lg px-3 py-1.5 hover:bg-neutral-900 transition-colors"
              >
                New Program
              </button>
              <button
                onClick={addWeek}
                className="text-xs bg-bordeaux-600 hover:bg-bordeaux-700 text-white rounded-lg px-3 py-1.5 transition-colors"
              >
                + Week
              </button>
            </div>
          </div>

          {/* Settings row */}
          <div className="flex items-start gap-6 mb-6 flex-wrap">
            <OneRMManager
              oneRMs={program.oneRMs}
              customExercises={program.customExercises}
              onChange={updateOneRMs}
            />
            <RPETableEditor rpeTable={rpeTable} onChange={setRpeTable} />
          </div>

          {view === "charts" ? (
            <TrendCharts summaries={summaries} prs={program.prs} />
          ) : (
            /* Weekly Table Grid */
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-xs text-neutral-500 p-2 w-24 sticky left-0 bg-black z-10">Week</th>
                    {Array.from({ length: program.daysPerWeek }, (_, i) => (
                      <th key={i} className="text-left text-xs text-neutral-500 p-2 min-w-[280px]">
                        Day {i + 1}
                      </th>
                    ))}
                    <th className="text-left text-xs text-neutral-500 p-2 min-w-[320px]">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {program.weeks.map((week, wIdx) => (
                    <tr key={week.id} className="border-t border-neutral-900">
                      <td className="text-sm font-mono text-neutral-400 p-2 align-top sticky left-0 bg-black z-10">
                        W{week.weekNumber}
                      </td>
                      {week.days.map((day, dIdx) => {
                        const isActive = activeCell?.week === wIdx && activeCell?.day === dIdx;
                        return (
                          <td
                            key={day.id}
                            className={`p-2 align-top border-l border-neutral-900 cursor-pointer transition-colors ${
                              isActive ? "bg-neutral-950" : "hover:bg-neutral-950/50"
                            }`}
                            onClick={() => setActiveCell({ week: wIdx, day: dIdx })}
                          >
                            {/* Exercises */}
                            <div className="space-y-2">
                              {day.exercises.map((ex, eIdx) => (
                                <ExerciseRow
                                  key={ex.id}
                                  exercise={ex}
                                  oneRM={program.oneRMs[ex.exerciseId] || 0}
                                  onChange={(updated) => updateExercise(wIdx, dIdx, eIdx, updated)}
                                  onRemove={() => removeExercise(wIdx, dIdx, eIdx)}
                                  suggestion={getSuggestion(wIdx, dIdx, ex.exerciseId)}
                                />
                              ))}
                            </div>

                            {/* Add exercise */}
                            {isActive && (
                              <div className="mt-2">
                                <ExerciseSearch
                                  customExercises={program.customExercises}
                                  onSelect={(ex) => addExerciseToDay(wIdx, dIdx, ex)}
                                  onAddCustom={addCustomExercise}
                                />
                              </div>
                            )}

                            {day.exercises.length === 0 && !isActive && (
                              <div className="text-xs text-neutral-700 py-4 text-center">
                                Click to add exercises
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-2 align-top border-l border-neutral-900">
                        <WeekSummaryBar summary={summaries[wIdx]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
