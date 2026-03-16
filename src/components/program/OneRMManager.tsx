"use client";

import { EXERCISE_LIBRARY, type LibraryExercise } from "@/lib/training-data";
import { useState } from "react";

interface Props {
  oneRMs: Record<string, number>;
  customExercises: LibraryExercise[];
  onChange: (oneRMs: Record<string, number>) => void;
}

export function OneRMManager({ oneRMs, customExercises, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const allExercises = [...EXERCISE_LIBRARY, ...customExercises];

  // Only show exercises that are in the program
  const exercisesWithRM = Object.keys(oneRMs);
  const usedExercises = allExercises.filter(
    (e) => exercisesWithRM.includes(e.id)
  );

  const update = (id: string, value: number) => {
    onChange({ ...oneRMs, [id]: value });
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-neutral-500 hover:text-neutral-300 underline"
      >
        {open ? "Hide" : "Manage"} 1RM Values
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-[10px] text-neutral-600">
            Set 1RM for exercises used in the program. Values auto-update when you add exercises.
          </p>
          {usedExercises.length === 0 ? (
            <p className="text-xs text-neutral-600">
              No exercises added yet. Add exercises to set their 1RMs.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {usedExercises.map((ex) => (
                <div key={ex.id} className="flex items-center gap-2">
                  <span className="text-xs text-neutral-300 flex-1 truncate">
                    {ex.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={oneRMs[ex.id] || ""}
                      onChange={(e) =>
                        update(ex.id, parseFloat(e.target.value) || 0)
                      }
                      className="w-20 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-100 focus:border-bordeaux-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-neutral-600">kg</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
