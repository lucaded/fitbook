"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";

/* ── Types ── */
interface ProgramExercise {
  id: string;
  dayId: string;
  exerciseName: string;
  exerciseId: string;
  variant: string | null;
  order: number;
  sets: number;
  reps: number;
  loadKg: number | null;
  rpe: number | null;
  notes: string | null;
  actualSets: number | null;
  actualReps: number | null;
  actualLoadKg: number | null;
  actualRpe: number | null;
  clientNotes: string | null;
  repDurationSec: number | null;
}

interface ProgramDay {
  id: string;
  dayNumber: number;
  label: string | null;
  notes: string | null;
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
  weeks: ProgramWeek[];
}

type SaveStatus = "idle" | "saving" | "saved";

/* ── Velocity sparkline component ── */
function VelocitySparkline({
  dataPoints,
  label,
}: {
  dataPoints: { week: number; value: number }[];
  label: string;
}) {
  if (dataPoints.length < 2) return null;
  const max = Math.max(...dataPoints.map((d) => d.value));
  const min = Math.min(...dataPoints.map((d) => d.value));
  const range = max - min || 1;

  return (
    <div className="mt-2">
      <p className="text-[11px] text-neutral-600 mb-1">{label}</p>
      <div className="flex items-end gap-[3px] h-8">
        {dataPoints.map((dp, i) => {
          const pct = ((dp.value - min) / range) * 100;
          const height = Math.max(pct, 12);
          const isLast = i === dataPoints.length - 1;
          const improving =
            i > 0 ? dp.value > dataPoints[i - 1].value : false;
          return (
            <div key={dp.week} className="relative group flex items-end" style={{ height: "100%" }}>
              <div
                className={`w-[6px] rounded-sm transition-all ${
                  isLast
                    ? "bg-emerald-500"
                    : improving
                    ? "bg-emerald-700/60"
                    : "bg-neutral-700"
                }`}
                style={{ height: `${height}%` }}
              />
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-neutral-800 text-[10px] text-neutral-300 px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                W{dp.week}: {dp.value.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function ClientProgramPage() {
  const params = useParams();
  const { t } = useI18n();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [showRepSpeed, setShowRepSpeed] = useState<Record<string, boolean>>({});
  const saveTimer = useRef<NodeJS.Timeout>(undefined);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const fetchProgram = useCallback(() => {
    fetch(`/api/client/programs/${params.programId}`)
      .then(async (r) => {
        if (r.status === 403) {
          const data = await r.json();
          setError(data.error === "subscriptionRequired" ? "subscriptionRequired" : "forbidden");
          setLoading(false);
          return;
        }
        if (!r.ok) {
          setError("notFound");
          setLoading(false);
          return;
        }
        const data = await r.json();
        setProgram(data);
        setLoading(false);
      })
      .catch(() => {
        setError("notFound");
        setLoading(false);
      });
  }, [params.programId]);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  const markSaving = () => {
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
  };
  const markSaved = () => {
    setSaveStatus("saved");
    saveTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
  };

  /* Save a single field for an exercise, debounced */
  const saveField = (
    exerciseId: string,
    field: string,
    value: string | number | null
  ) => {
    if (!program) return;

    // Optimistically update local state
    const prog = { ...program };
    prog.weeks = prog.weeks.map((w) => ({
      ...w,
      days: w.days.map((d) => ({
        ...d,
        exercises: d.exercises.map((ex) =>
          ex.id === exerciseId ? { ...ex, [field]: value } : ex
        ),
      })),
    }));
    setProgram(prog);

    // Debounce the API call
    const timerKey = `${exerciseId}-${field}`;
    if (debounceTimers.current[timerKey]) {
      clearTimeout(debounceTimers.current[timerKey]);
    }
    debounceTimers.current[timerKey] = setTimeout(async () => {
      markSaving();
      await fetch(`/api/client/programs/${program.id}/log`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId, [field]: value }),
      });
      markSaved();
    }, 600);
  };

  const isExerciseLogged = (ex: ProgramExercise) =>
    ex.actualSets != null ||
    ex.actualReps != null ||
    ex.actualLoadKg != null ||
    ex.actualRpe != null;

  /* Build velocity data for an exercise across weeks */
  const getVelocityData = (exerciseId: string) => {
    if (!program) return [];
    const points: { week: number; value: number }[] = [];
    for (const week of program.weeks) {
      for (const day of week.days) {
        for (const ex of day.exercises) {
          if (
            ex.exerciseId === exerciseId &&
            ex.repDurationSec &&
            ex.repDurationSec > 0
          ) {
            const load = ex.actualLoadKg ?? ex.loadKg ?? 0;
            if (load > 0) {
              // Higher ratio = more load per second = better
              points.push({
                week: week.weekNumber,
                value: Math.round((load / ex.repDurationSec) * 100) / 100,
              });
            }
          }
        }
      }
    }
    return points;
  };

  /* ── Render ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-neutral-800 border-t-neutral-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error === "subscriptionRequired") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-neutral-300 font-medium">{t("subscriptionRequired")}</p>
        <p className="text-[13px] text-neutral-600">{t("contactTrainer")}</p>
      </div>
    );
  }

  if (!program) {
    return <div className="text-red-500 py-8">{t("programNotFound")}</div>;
  }

  // Display weeks newest-first
  const weeksDesc = [...program.weeks].reverse();

  // Completion stats
  const allEx = program.weeks.flatMap((w) =>
    w.days.flatMap((d) => d.exercises)
  );
  const totalEx = allEx.length;
  const doneEx = allEx.filter((e) => e.actualSets != null).length;
  const completionPct = totalEx > 0 ? Math.round((doneEx / totalEx) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-bold tracking-tight">{program.name}</h1>
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-[12px] text-amber-500/70">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {t("saving")}
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-[12px] text-emerald-500/70">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {t("logSaved")}
            </span>
          )}
        </div>
        <p className="text-[13px] text-neutral-600 mt-1 tabular-nums">
          {program.weeks.length} {t("weeks").toLowerCase()} &middot;{" "}
          {program.daysPerWeek} {t("daysPerWeek").toLowerCase()}
        </p>
        {totalEx > 0 && (
          <div className="mt-2 flex items-center gap-2.5">
            <div className="w-32 h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="text-[12px] text-neutral-500 tabular-nums">
              {completionPct}% {t("complete").toLowerCase()}
            </span>
          </div>
        )}
      </div>

      {/* Weeks */}
      <div className="space-y-6">
        {weeksDesc.map((week) => (
          <div key={week.id} id={`week-${week.weekNumber}`}>
            {/* Week header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[14px] font-semibold text-neutral-300 tabular-nums">
                {t("week")} {week.weekNumber}
              </span>
              {(() => {
                const wEx = week.days.flatMap((d) => d.exercises);
                const wTotal = wEx.length;
                const wDone = wEx.filter((e) => e.actualSets != null).length;
                if (wTotal === 0) return null;
                if (wDone === wTotal)
                  return (
                    <span className="text-emerald-500 text-[12px]">
                      <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  );
                return (
                  <span className="text-[11px] text-neutral-600 tabular-nums">
                    {wDone}/{wTotal}
                  </span>
                );
              })()}
            </div>

            {/* Days */}
            <div className="space-y-4">
              {week.days.map((day) => (
                <div
                  key={day.id}
                  className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl overflow-hidden"
                >
                  {/* Day header */}
                  <div className="px-4 py-2.5 border-b border-[#151515] flex items-center justify-between">
                    <span className="text-[13px] font-medium text-neutral-400">
                      {day.label || `Day ${day.dayNumber}`}
                    </span>
                    {(() => {
                      const dEx = day.exercises;
                      const dDone = dEx.filter(
                        (e) => e.actualSets != null
                      ).length;
                      if (dEx.length === 0) return null;
                      if (dDone === dEx.length)
                        return (
                          <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        );
                      return (
                        <span className="text-[11px] text-neutral-600 tabular-nums">
                          {dDone}/{dEx.length}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Day notes from trainer */}
                  {day.notes && (
                    <div className="px-4 py-2 bg-[#111] border-b border-[#151515]">
                      <p className="text-[12px] text-neutral-500 italic">
                        {day.notes}
                      </p>
                    </div>
                  )}

                  {/* Exercises */}
                  <div className="divide-y divide-[#151515]">
                    {day.exercises.map((ex) => {
                      const isExpanded = expandedExercise === ex.id;
                      const logged = isExerciseLogged(ex);
                      const velocityData = getVelocityData(ex.exerciseId);
                      const showSpeed =
                        showRepSpeed[ex.id] || ex.repDurationSec != null;

                      return (
                        <div key={ex.id}>
                          {/* Exercise header — tap to expand */}
                          <button
                            onClick={() =>
                              setExpandedExercise(
                                isExpanded ? null : ex.id
                              )
                            }
                            className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#111] transition-colors"
                          >
                            {/* Logged indicator */}
                            <div
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                logged
                                  ? "bg-emerald-500"
                                  : "bg-neutral-800"
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[14px] text-neutral-200 font-medium truncate">
                                  {ex.exerciseName}
                                </span>
                                {ex.variant && (
                                  <span className="text-[11px] text-neutral-600 shrink-0">
                                    {ex.variant}
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] text-neutral-500 tabular-nums mt-0.5">
                                {ex.sets} &times; {ex.reps}
                                {ex.loadKg
                                  ? ` @ ${Math.round(ex.loadKg * 10) / 10} ${t("kg")}`
                                  : ""}
                                {ex.rpe
                                  ? `  RPE ${Math.round(ex.rpe * 2) / 2}`
                                  : ""}
                              </p>
                            </div>
                            <svg
                              className={`w-4 h-4 text-neutral-600 shrink-0 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>

                          {/* Expanded logging area */}
                          {isExpanded && (
                            <div className="px-4 pb-4 space-y-3">
                              {/* Trainer notes */}
                              {ex.notes && (
                                <div className="bg-[#111] rounded-lg px-3 py-2">
                                  <p className="text-[11px] text-neutral-600 mb-0.5">
                                    {t("notes")}
                                  </p>
                                  <p className="text-[12px] text-neutral-400">
                                    {ex.notes}
                                  </p>
                                </div>
                              )}

                              {/* Prescribed summary */}
                              <div className="bg-[#0a0a0a] rounded-lg px-3 py-2 border border-[#1a1a1a]">
                                <p className="text-[11px] text-neutral-600 mb-1">
                                  {t("prescribed")}
                                </p>
                                <p className="text-[13px] text-neutral-400 tabular-nums">
                                  {ex.sets} &times; {ex.reps}
                                  {ex.loadKg
                                    ? ` @ ${Math.round(ex.loadKg * 10) / 10} ${t("kg")}`
                                    : ""}
                                  {ex.rpe
                                    ? ` \u00B7 RPE ${Math.round(ex.rpe * 2) / 2}`
                                    : ""}
                                </p>
                              </div>

                              {/* Actuals input */}
                              <div>
                                <p className="text-[11px] text-neutral-500 font-medium mb-2">
                                  {t("yourLog")}
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                  {/* Sets */}
                                  <div>
                                    <label className="text-[10px] text-neutral-600 block mb-1">
                                      {t("sets")}
                                    </label>
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      min={0}
                                      placeholder={String(ex.sets)}
                                      value={ex.actualSets ?? ""}
                                      onChange={(e) =>
                                        saveField(
                                          ex.id,
                                          "actualSets",
                                          e.target.value === ""
                                            ? null
                                            : Number(e.target.value)
                                        )
                                      }
                                      className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg px-2.5 py-2 text-[13px] text-white tabular-nums focus:border-emerald-700/60 focus:outline-none text-center"
                                    />
                                  </div>
                                  {/* Reps */}
                                  <div>
                                    <label className="text-[10px] text-neutral-600 block mb-1">
                                      {t("reps")}
                                    </label>
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      min={0}
                                      placeholder={String(ex.reps)}
                                      value={ex.actualReps ?? ""}
                                      onChange={(e) =>
                                        saveField(
                                          ex.id,
                                          "actualReps",
                                          e.target.value === ""
                                            ? null
                                            : Number(e.target.value)
                                        )
                                      }
                                      className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg px-2.5 py-2 text-[13px] text-white tabular-nums focus:border-emerald-700/60 focus:outline-none text-center"
                                    />
                                  </div>
                                  {/* Load */}
                                  <div>
                                    <label className="text-[10px] text-neutral-600 block mb-1">
                                      {t("kg")}
                                    </label>
                                    <input
                                      type="number"
                                      inputMode="decimal"
                                      min={0}
                                      step={0.5}
                                      placeholder={
                                        ex.loadKg
                                          ? String(
                                              Math.round(ex.loadKg * 10) / 10
                                            )
                                          : "—"
                                      }
                                      value={ex.actualLoadKg ?? ""}
                                      onChange={(e) =>
                                        saveField(
                                          ex.id,
                                          "actualLoadKg",
                                          e.target.value === ""
                                            ? null
                                            : Number(e.target.value)
                                        )
                                      }
                                      className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg px-2.5 py-2 text-[13px] text-white tabular-nums focus:border-emerald-700/60 focus:outline-none text-center"
                                    />
                                  </div>
                                  {/* RPE */}
                                  <div>
                                    <label className="text-[10px] text-neutral-600 block mb-1">
                                      RPE
                                    </label>
                                    <input
                                      type="number"
                                      inputMode="decimal"
                                      min={1}
                                      max={10}
                                      step={0.5}
                                      placeholder={
                                        ex.rpe
                                          ? String(
                                              Math.round(ex.rpe * 2) / 2
                                            )
                                          : "—"
                                      }
                                      value={ex.actualRpe ?? ""}
                                      onChange={(e) =>
                                        saveField(
                                          ex.id,
                                          "actualRpe",
                                          e.target.value === ""
                                            ? null
                                            : Number(e.target.value)
                                        )
                                      }
                                      className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg px-2.5 py-2 text-[13px] text-white tabular-nums focus:border-emerald-700/60 focus:outline-none text-center"
                                    />
                                  </div>
                                </div>

                                {/* Rep speed — optional, revealed by + button */}
                                {!showSpeed && (
                                  <button
                                    onClick={() =>
                                      setShowRepSpeed((prev) => ({
                                        ...prev,
                                        [ex.id]: true,
                                      }))
                                    }
                                    className="mt-2 text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors flex items-center gap-1"
                                  >
                                    <span className="w-4 h-4 rounded-full border border-neutral-700 flex items-center justify-center text-[10px]">
                                      +
                                    </span>
                                    {t("repSpeedSec")}
                                  </button>
                                )}

                                {showSpeed && (
                                  <div className="mt-2">
                                    <label className="text-[10px] text-neutral-600 block mb-1">
                                      {t("repSpeedSec")}
                                    </label>
                                    <input
                                      type="number"
                                      inputMode="decimal"
                                      min={0}
                                      step={0.1}
                                      placeholder="—"
                                      value={ex.repDurationSec ?? ""}
                                      onChange={(e) =>
                                        saveField(
                                          ex.id,
                                          "repDurationSec",
                                          e.target.value === ""
                                            ? null
                                            : Number(e.target.value)
                                        )
                                      }
                                      className="w-24 bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg px-2.5 py-2 text-[13px] text-white tabular-nums focus:border-emerald-700/60 focus:outline-none text-center"
                                    />
                                  </div>
                                )}

                                {/* Client notes */}
                                <div className="mt-2">
                                  <label className="text-[10px] text-neutral-600 block mb-1">
                                    {t("clientNote")}
                                  </label>
                                  <textarea
                                    rows={2}
                                    placeholder={t("clientNotePlaceholder")}
                                    value={ex.clientNotes ?? ""}
                                    onChange={(e) =>
                                      saveField(
                                        ex.id,
                                        "clientNotes",
                                        e.target.value || null
                                      )
                                    }
                                    className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg px-2.5 py-2 text-[13px] text-neutral-300 focus:border-emerald-700/60 focus:outline-none resize-none"
                                  />
                                </div>

                                {/* Velocity sparkline */}
                                {velocityData.length >= 2 && (
                                  <VelocitySparkline
                                    dataPoints={velocityData}
                                    label={t("velocity")}
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
