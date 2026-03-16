"use client";

import { DEFAULT_RPE_TABLE, RPE_VALUES, REP_RANGE } from "@/lib/training-data";
import { useState } from "react";

interface Props {
  rpeTable: Record<number, number[]>;
  onChange: (table: Record<number, number[]>) => void;
}

export function RPETableEditor({ rpeTable, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const updateCell = (rpe: number, repIndex: number, value: number) => {
    const newTable = { ...rpeTable };
    newTable[rpe] = [...newTable[rpe]];
    newTable[rpe][repIndex] = value;
    onChange(newTable);
  };

  const reset = () => onChange({ ...DEFAULT_RPE_TABLE });

  const rpeColor = (rpe: number) => {
    if (rpe >= 9.5) return "bg-red-900/30";
    if (rpe >= 8.5) return "bg-orange-900/30";
    if (rpe >= 7.5) return "bg-yellow-900/30";
    return "bg-green-900/30";
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-neutral-500 hover:text-neutral-300 underline"
      >
        {open ? "Hide" : "Edit"} RPE Table
      </button>

      {open && (
        <div className="mt-3 overflow-x-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-400">RPE Chart — %1RM by Reps</span>
            <button onClick={reset} className="text-[10px] text-neutral-600 hover:text-neutral-400">
              Reset to defaults
            </button>
          </div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left text-neutral-500 p-1">RPE</th>
                {REP_RANGE.map((r) => (
                  <th key={r} className="text-center text-neutral-500 p-1">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RPE_VALUES.map((rpe) => (
                <tr key={rpe} className={rpeColor(rpe)}>
                  <td className="font-mono text-neutral-300 p-1 font-medium">{rpe}</td>
                  {rpeTable[rpe].map((val, i) => (
                    <td key={i} className="p-0.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={val}
                        onChange={(e) => updateCell(rpe, i, parseInt(e.target.value) || 0)}
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
    </div>
  );
}
