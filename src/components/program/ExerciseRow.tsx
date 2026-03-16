"use client";

import { type PrescribedExercise } from "@/lib/program-types";
import {
  calcLoad,
  calcIntensity,
  calcRelativeIntensity,
  DEFAULT_RPE_TABLE,
  RPE_VALUES,
} from "@/lib/training-data";

interface Props {
  exercise: PrescribedExercise;
  oneRM: number;
  onChange: (updated: PrescribedExercise) => void;
  onRemove: () => void;
  suggestion?: { sets: number; reps: number; loadKg: number } | null;
}

export function ExerciseRow({ exercise, oneRM, onChange, onRemove, suggestion }: Props) {
  const update = (fields: Partial<PrescribedExercise>) => {
    const updated = { ...exercise, ...fields };

    // Auto-calc load from intensity
    if ("intensityPercent" in fields && oneRM > 0) {
      updated.loadKg = calcLoad(oneRM, updated.intensityPercent);
    }
    // Auto-calc intensity from load
    if ("loadKg" in fields && oneRM > 0) {
      updated.intensityPercent = calcIntensity(oneRM, updated.loadKg);
    }
    // Auto-calc relative intensity
    if (updated.intensityPercent > 0 && updated.reps > 0) {
      updated.relativeIntensity = Math.round(
        calcRelativeIntensity(updated.intensityPercent, updated.reps, DEFAULT_RPE_TABLE) * 10
      ) / 10;
    }

    onChange(updated);
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    update({
      sets: suggestion.sets,
      reps: suggestion.reps,
      loadKg: suggestion.loadKg,
      intensityPercent: oneRM > 0 ? calcIntensity(oneRM, suggestion.loadKg) : 0,
    });
  };

  return (
    <div className="group border border-neutral-800 rounded-lg p-3 bg-neutral-950 hover:border-neutral-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-neutral-100">{exercise.exerciseName}</span>
        <div className="flex items-center gap-2">
          {exercise.isPR && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-bordeaux-600 text-white uppercase">
              PR
            </span>
          )}
          <button onClick={onRemove} className="text-neutral-600 hover:text-red-500 text-xs">
            Remove
          </button>
        </div>
      </div>

      {suggestion && (
        <button
          onClick={applySuggestion}
          className="mb-2 text-xs text-bordeaux-400 hover:text-bordeaux-300 underline"
        >
          Suggestion: {suggestion.sets}×{suggestion.reps} @ {suggestion.loadKg} kg
        </button>
      )}

      <div className="grid grid-cols-6 gap-2 text-xs">
        <div>
          <label className="text-neutral-500 block mb-0.5">Sets</label>
          <input
            type="number"
            min={1}
            value={exercise.sets || ""}
            onChange={(e) => update({ sets: parseInt(e.target.value) || 0 })}
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-neutral-500 block mb-0.5">Reps</label>
          <input
            type="number"
            min={1}
            value={exercise.reps || ""}
            onChange={(e) => update({ reps: parseInt(e.target.value) || 0 })}
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-neutral-500 block mb-0.5">%1RM</label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={exercise.intensityPercent || ""}
            onChange={(e) => update({ intensityPercent: parseFloat(e.target.value) || 0 })}
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-neutral-500 block mb-0.5">kg</label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={exercise.loadKg || ""}
            onChange={(e) => update({ loadKg: parseFloat(e.target.value) || 0 })}
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-neutral-500 block mb-0.5">RPE</label>
          <select
            value={exercise.rpe ?? ""}
            onChange={(e) => update({ rpe: e.target.value ? parseFloat(e.target.value) : null })}
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-1 py-1 text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
          >
            <option value="">—</option>
            {RPE_VALUES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-neutral-500 block mb-0.5">RI%</label>
          <div className="px-2 py-1 text-neutral-400 bg-neutral-900 border border-neutral-800 rounded">
            {exercise.relativeIntensity ? `${exercise.relativeIntensity}%` : "—"}
          </div>
        </div>
      </div>

      {/* 1RM display */}
      <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
        <span>1RM: {oneRM > 0 ? `${oneRM} kg` : "not set"}</span>
        {exercise.intensityPercent > 0 && exercise.reps > 0 && (
          <span className="text-neutral-400">
            Vol: {(exercise.sets * exercise.reps * exercise.loadKg).toFixed(0)} kg
          </span>
        )}
      </div>

      {/* Actuals row */}
      <details className="mt-2">
        <summary className="text-xs text-neutral-600 cursor-pointer hover:text-neutral-400">
          Log actuals
        </summary>
        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
          <div>
            <label className="text-neutral-500 block mb-0.5">Actual Sets</label>
            <input
              type="number"
              min={0}
              value={exercise.actualSets ?? ""}
              onChange={(e) => update({ actualSets: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-neutral-500 block mb-0.5">Actual Reps</label>
            <input
              type="number"
              min={0}
              value={exercise.actualReps ?? ""}
              onChange={(e) => update({ actualReps: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-neutral-500 block mb-0.5">Actual kg</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={exercise.actualLoadKg ?? ""}
              onChange={(e) => update({ actualLoadKg: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
            />
          </div>
        </div>
      </details>

      {/* Notes */}
      <input
        type="text"
        placeholder="Notes..."
        value={exercise.notes}
        onChange={(e) => update({ notes: e.target.value })}
        className="mt-2 w-full bg-transparent border-b border-neutral-800 text-xs text-neutral-400 placeholder-neutral-700 focus:border-bordeaux-500 focus:outline-none pb-1"
      />
    </div>
  );
}
