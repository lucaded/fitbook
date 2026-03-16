"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { type WeekSummary, type ExercisePR } from "@/lib/program-types";

interface Props {
  summaries: WeekSummary[];
  prs: ExercisePR[];
}

// Simple linear regression for trend line
function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0]?.y ?? 0 };
  const sumX = data.reduce((s, d) => s + d.x, 0);
  const sumY = data.reduce((s, d) => s + d.y, 0);
  const sumXY = data.reduce((s, d) => s + d.x * d.y, 0);
  const sumX2 = data.reduce((s, d) => s + d.x * d.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function addTrendLine(
  data: { week: number; value: number }[]
): { week: number; value: number; trend: number }[] {
  const reg = linearRegression(data.map((d) => ({ x: d.week, y: d.value })));
  return data.map((d) => ({
    ...d,
    trend: Math.round(reg.slope * d.week + reg.intercept),
  }));
}

const BORDEAUX = "#7a1b3e";
const BORDEAUX_LIGHT = "#a3254f";

export function TrendCharts({ summaries, prs }: Props) {
  if (summaries.length === 0) {
    return (
      <div className="text-neutral-600 text-sm text-center py-8">
        Add exercises to see trend charts
      </div>
    );
  }

  const volumeData = addTrendLine(
    summaries.map((s) => ({ week: s.weekNumber, value: s.totalVolume }))
  );
  const intensityData = addTrendLine(
    summaries.map((s) => ({ week: s.weekNumber, value: s.avgIntensity }))
  );

  // Find peak weeks
  const peakVolWeek = summaries.reduce((a, b) => (b.totalVolume > a.totalVolume ? b : a), summaries[0]);
  const peakIntWeek = summaries.reduce((a, b) => (b.avgIntensity > a.avgIntensity ? b : a), summaries[0]);

  const chartProps = {
    margin: { top: 5, right: 20, bottom: 5, left: 10 },
  };

  const tooltipStyle = {
    contentStyle: { background: "#171717", border: "1px solid #333", borderRadius: 8, fontSize: 12 },
    labelStyle: { color: "#999" },
  };

  return (
    <div className="space-y-6">
      {/* Volume over weeks */}
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-2">Volume (kg) by Week</h3>
        <div className="h-48 bg-neutral-950 rounded-lg border border-neutral-800 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={volumeData} {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="week" tick={{ fill: "#666", fontSize: 11 }} tickFormatter={(v) => `W${v}`} />
              <YAxis tick={{ fill: "#666", fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={BORDEAUX} strokeWidth={2} dot={{ fill: BORDEAUX, r: 3 }} name="Volume" />
              <Line type="monotone" dataKey="trend" stroke="#555" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Trend" />
              {peakVolWeek && (
                <ReferenceDot
                  x={peakVolWeek.weekNumber}
                  y={peakVolWeek.totalVolume}
                  r={6}
                  fill={BORDEAUX_LIGHT}
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Intensity over weeks */}
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-2">Avg Intensity (%1RM) by Week</h3>
        <div className="h-48 bg-neutral-950 rounded-lg border border-neutral-800 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={intensityData} {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="week" tick={{ fill: "#666", fontSize: 11 }} tickFormatter={(v) => `W${v}`} />
              <YAxis tick={{ fill: "#666", fontSize: 11 }} domain={[50, 100]} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke="#d4a855" strokeWidth={2} dot={{ fill: "#d4a855", r: 3 }} name="Avg %1RM" />
              <Line type="monotone" dataKey="trend" stroke="#555" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Trend" />
              {peakIntWeek && (
                <ReferenceDot
                  x={peakIntWeek.weekNumber}
                  y={peakIntWeek.avgIntensity}
                  r={6}
                  fill="#d4a855"
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PR Timeline */}
      {prs.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-neutral-400 mb-2">PR Timeline</h3>
          <div className="space-y-1">
            {prs.map((pr, i) => (
              <div key={i} className="flex items-center gap-3 text-xs px-3 py-1.5 bg-neutral-950 rounded border border-neutral-800">
                <span className="text-bordeaux-400 font-mono">W{pr.weekNumber}</span>
                <span className="text-neutral-200 font-medium">{pr.exerciseName}</span>
                <span className="text-neutral-400">{pr.loadKg} kg × {pr.reps}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
