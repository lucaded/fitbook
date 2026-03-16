"use client";

import { type WeekSummary } from "@/lib/program-types";

interface Props {
  summary: WeekSummary;
}

export function WeekSummaryBar({ summary }: Props) {
  return (
    <div className="flex items-center gap-4 text-xs px-3 py-2 bg-neutral-900 rounded-lg border border-neutral-800">
      <div>
        <span className="text-neutral-500">Volume</span>{" "}
        <span className="text-neutral-200 font-mono">
          {summary.totalVolume.toLocaleString()} kg
        </span>
      </div>
      <div className="w-px h-4 bg-neutral-800" />
      <div>
        <span className="text-neutral-500">Reps</span>{" "}
        <span className="text-neutral-200 font-mono">{summary.totalReps}</span>
      </div>
      <div className="w-px h-4 bg-neutral-800" />
      <div>
        <span className="text-neutral-500">Tonnage</span>{" "}
        <span className="text-neutral-200 font-mono">
          {summary.totalTonnage.toLocaleString()} kg
        </span>
      </div>
      <div className="w-px h-4 bg-neutral-800" />
      <div>
        <span className="text-neutral-500">Avg %1RM</span>{" "}
        <span className="text-neutral-200 font-mono">
          {summary.avgIntensity > 0 ? `${summary.avgIntensity}%` : "—"}
        </span>
      </div>
    </div>
  );
}
