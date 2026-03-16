import { type ExerciseCategory } from "@/lib/training-data";

export interface PrescribedExercise {
  id: string;
  exerciseId: string;       // references library or custom
  exerciseName: string;
  oneRM: number;            // kg
  sets: number;
  reps: number;
  intensityPercent: number; // %1RM
  loadKg: number;           // auto-calculated or manual
  rpe: number | null;       // optional RPE
  relativeIntensity: number | null; // auto-calculated
  notes: string;
  // Actuals (filled after session)
  actualSets: number | null;
  actualReps: number | null;
  actualLoadKg: number | null;
  isPR: boolean;
}

export interface TrainingDay {
  id: string;
  dayLabel: string;         // e.g., "Day 1", "Upper A"
  exercises: PrescribedExercise[];
}

export interface TrainingWeek {
  id: string;
  weekNumber: number;
  days: TrainingDay[];
}

export interface WeekSummary {
  weekNumber: number;
  totalVolume: number;      // sets × reps × kg
  totalReps: number;
  totalTonnage: number;     // sum of all kg lifted
  avgIntensity: number;     // weighted avg %1RM
}

export interface ExercisePR {
  exerciseId: string;
  exerciseName: string;
  loadKg: number;
  reps: number;
  weekNumber: number;
  date: string;
}

export interface Program {
  id: string;
  name: string;
  daysPerWeek: number;
  weeks: TrainingWeek[];
  oneRMs: Record<string, number>;   // exerciseId → 1RM in kg
  customExercises: { id: string; name: string; category: ExerciseCategory; muscleGroups: string[] }[];
  prs: ExercisePR[];
  progressionIncrement: number;     // default kg increment for suggestions
}

export function createEmptyProgram(name: string, weeks: number, daysPerWeek: number): Program {
  const programWeeks: TrainingWeek[] = [];
  for (let w = 0; w < weeks; w++) {
    const days: TrainingDay[] = [];
    for (let d = 0; d < daysPerWeek; d++) {
      days.push({
        id: `w${w + 1}-d${d + 1}`,
        dayLabel: `Day ${d + 1}`,
        exercises: [],
      });
    }
    programWeeks.push({
      id: `week-${w + 1}`,
      weekNumber: w + 1,
      days,
    });
  }

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    name,
    daysPerWeek,
    weeks: programWeeks,
    oneRMs: {},
    customExercises: [],
    prs: [],
    progressionIncrement: 2.5,
  };
}

export function calcWeekSummary(week: TrainingWeek): WeekSummary {
  let totalVolume = 0;
  let totalReps = 0;
  let totalTonnage = 0;
  let weightedIntensitySum = 0;
  let weightedIntensityDenom = 0;

  for (const day of week.days) {
    for (const ex of day.exercises) {
      const sets = ex.actualSets ?? ex.sets;
      const reps = ex.actualReps ?? ex.reps;
      const load = ex.actualLoadKg ?? ex.loadKg;

      const vol = sets * reps * load;
      totalVolume += vol;
      totalReps += sets * reps;
      totalTonnage += vol;

      if (ex.intensityPercent > 0) {
        weightedIntensitySum += ex.intensityPercent * sets * reps;
        weightedIntensityDenom += sets * reps;
      }
    }
  }

  return {
    weekNumber: week.weekNumber,
    totalVolume,
    totalReps,
    totalTonnage,
    avgIntensity: weightedIntensityDenom > 0
      ? Math.round((weightedIntensitySum / weightedIntensityDenom) * 10) / 10
      : 0,
  };
}
