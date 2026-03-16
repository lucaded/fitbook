"use client";

import { useState, useRef, useEffect } from "react";
import { EXERCISE_LIBRARY, type LibraryExercise } from "@/lib/training-data";

interface Props {
  customExercises: LibraryExercise[];
  onSelect: (exercise: LibraryExercise) => void;
  onAddCustom: (name: string) => void;
}

export function ExerciseSearch({ customExercises, onSelect, onAddCustom }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const allExercises = [...EXERCISE_LIBRARY, ...customExercises];
  const filtered = query.length > 0
    ? allExercises.filter((e) =>
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.muscleGroups.some((g) => g.toLowerCase().includes(query.toLowerCase()))
      )
    : allExercises;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const categoryLabel: Record<string, string> = {
    powerlifting: "PL",
    bodybuilding: "BB",
    olympic: "OLY",
    custom: "Custom",
  };

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search exercises..."
        className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-bordeaux-500 focus:outline-none"
      />
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => { onSelect(ex); setQuery(""); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex justify-between items-center text-sm"
            >
              <span className="text-neutral-100">{ex.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 uppercase tracking-wider">
                {categoryLabel[ex.category]}
              </span>
            </button>
          ))}
          {filtered.length === 0 && query.length > 0 && (
            <button
              onClick={() => { onAddCustom(query); setQuery(""); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-neutral-800 text-sm text-bordeaux-400"
            >
              + Add &quot;{query}&quot; as custom exercise
            </button>
          )}
        </div>
      )}
    </div>
  );
}
