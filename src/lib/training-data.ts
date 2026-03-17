// RPE Chart: RPE (rows) × Reps (columns) → %1RM
// From Antonio's chart. Editable by user.
export const DEFAULT_RPE_TABLE: Record<number, number[]> = {
  // RPE: [1rep, 2rep, 3rep, 4rep, 5rep, 6rep, 7rep, 8rep, 9rep, 10rep]
  10:   [100, 96, 92, 89, 86, 84, 81, 79, 76, 74],
  9.5:  [98, 94, 91, 88, 85, 82, 80, 77, 75, 72],
  9:    [96, 92, 89, 86, 84, 81, 79, 76, 74, 71],
  8.5:  [94, 91, 88, 85, 82, 80, 77, 75, 72, 69],
  8:    [92, 89, 86, 84, 81, 79, 76, 74, 71, 68],
  7.5:  [91, 88, 85, 82, 80, 77, 75, 72, 69, 67],
  7:    [89, 86, 84, 81, 79, 76, 74, 71, 68, 65],
  6.5:  [87, 85, 82, 80, 77, 75, 72, 69, 67, 64],
  6:    [86, 84, 81, 79, 76, 74, 71, 68, 65, 62],
};

export const RPE_VALUES = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6];
export const REP_RANGE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Get max %1RM possible for a given rep count (RPE 10 row)
export function getMaxPercentForReps(
  reps: number,
  rpeTable: Record<number, number[]> = DEFAULT_RPE_TABLE
): number {
  if (reps < 1 || reps > 10) return 100;
  return rpeTable[10][reps - 1];
}

// Get %1RM for given reps and RPE
export function getPercentForRepsAndRPE(
  reps: number,
  rpe: number,
  rpeTable: Record<number, number[]> = DEFAULT_RPE_TABLE
): number | null {
  if (reps < 1 || reps > 10) return null;
  const row = rpeTable[rpe];
  if (!row) return null;
  return row[reps - 1];
}

// Calculate Relative Intensity = prescribed %1RM / max %1RM for that rep count
export function calcRelativeIntensity(
  prescribedPercent: number,
  reps: number,
  rpeTable: Record<number, number[]> = DEFAULT_RPE_TABLE
): number {
  const maxPercent = getMaxPercentForReps(reps, rpeTable);
  if (maxPercent === 0) return 0;
  return (prescribedPercent / maxPercent) * 100;
}

// Calculate load from intensity and 1RM
export function calcLoad(oneRM: number, intensityPercent: number): number {
  return Math.round((oneRM * intensityPercent) / 100 * 2) / 2; // round to nearest 0.5 kg
}

// Calculate intensity from load and 1RM
export function calcIntensity(oneRM: number, loadKg: number): number {
  if (oneRM === 0) return 0;
  return Math.round((loadKg / oneRM) * 1000) / 10; // 1 decimal
}

// Exercise library categories
export type ExerciseCategory = "powerlifting" | "bodybuilding" | "olympic" | "custom";

export interface ExerciseDefaults {
  sets: number;
  reps: number;
  rpe?: number;
}

export interface LibraryExercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroups: string[];
  defaults?: ExerciseDefaults;
}

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Powerlifting — heavy compounds: lower reps, higher RPE
  { id: "squat", name: "Back Squat", category: "powerlifting", muscleGroups: ["quads", "glutes", "core"], defaults: { sets: 5, reps: 3, rpe: 8 } },
  { id: "front-squat", name: "Front Squat", category: "powerlifting", muscleGroups: ["quads", "core"], defaults: { sets: 4, reps: 4, rpe: 7.5 } },
  { id: "pause-squat", name: "Pause Squat", category: "powerlifting", muscleGroups: ["quads", "glutes", "core"], defaults: { sets: 3, reps: 3, rpe: 7.5 } },
  { id: "pin-squat", name: "Pin Squat", category: "powerlifting", muscleGroups: ["quads", "glutes"], defaults: { sets: 3, reps: 3, rpe: 8 } },
  { id: "bench", name: "Bench Press", category: "powerlifting", muscleGroups: ["chest", "triceps", "shoulders"], defaults: { sets: 5, reps: 4, rpe: 8 } },
  { id: "close-grip-bench", name: "Close Grip Bench Press", category: "powerlifting", muscleGroups: ["triceps", "chest"], defaults: { sets: 3, reps: 5, rpe: 8 } },
  { id: "pause-bench", name: "Pause Bench Press", category: "powerlifting", muscleGroups: ["chest", "triceps"], defaults: { sets: 3, reps: 3, rpe: 7.5 } },
  { id: "spoto-press", name: "Spoto Press", category: "powerlifting", muscleGroups: ["chest", "triceps"], defaults: { sets: 3, reps: 4, rpe: 7.5 } },
  { id: "floor-press", name: "Floor Press", category: "powerlifting", muscleGroups: ["triceps", "chest"], defaults: { sets: 3, reps: 5, rpe: 8 } },
  { id: "deadlift", name: "Deadlift", category: "powerlifting", muscleGroups: ["back", "glutes", "hamstrings"], defaults: { sets: 4, reps: 3, rpe: 8 } },
  { id: "sumo-deadlift", name: "Sumo Deadlift", category: "powerlifting", muscleGroups: ["glutes", "quads", "back"], defaults: { sets: 4, reps: 3, rpe: 8 } },
  { id: "deficit-deadlift", name: "Deficit Deadlift", category: "powerlifting", muscleGroups: ["back", "hamstrings"], defaults: { sets: 3, reps: 3, rpe: 7.5 } },
  { id: "block-pull", name: "Block Pull", category: "powerlifting", muscleGroups: ["back", "glutes"], defaults: { sets: 3, reps: 3, rpe: 8 } },
  { id: "rdl", name: "Romanian Deadlift", category: "powerlifting", muscleGroups: ["hamstrings", "glutes", "back"], defaults: { sets: 3, reps: 8, rpe: 7 } },
  { id: "good-morning", name: "Good Morning", category: "powerlifting", muscleGroups: ["hamstrings", "back"], defaults: { sets: 3, reps: 8, rpe: 7 } },
  { id: "overhead-press", name: "Overhead Press", category: "powerlifting", muscleGroups: ["shoulders", "triceps"], defaults: { sets: 4, reps: 5, rpe: 8 } },

  // Bodybuilding — moderate to high reps, moderate RPE
  { id: "incline-bench", name: "Incline Bench Press", category: "bodybuilding", muscleGroups: ["chest", "shoulders"], defaults: { sets: 3, reps: 8, rpe: 8 } },
  { id: "db-bench", name: "Dumbbell Bench Press", category: "bodybuilding", muscleGroups: ["chest", "triceps"], defaults: { sets: 3, reps: 10, rpe: 8 } },
  { id: "incline-db-bench", name: "Incline Dumbbell Press", category: "bodybuilding", muscleGroups: ["chest", "shoulders"], defaults: { sets: 3, reps: 10, rpe: 8 } },
  { id: "chest-fly", name: "Chest Fly", category: "bodybuilding", muscleGroups: ["chest"], defaults: { sets: 3, reps: 12 } },
  { id: "cable-fly", name: "Cable Fly", category: "bodybuilding", muscleGroups: ["chest"], defaults: { sets: 3, reps: 15 } },
  { id: "barbell-row", name: "Barbell Row", category: "bodybuilding", muscleGroups: ["back", "biceps"], defaults: { sets: 4, reps: 6, rpe: 8 } },
  { id: "db-row", name: "Dumbbell Row", category: "bodybuilding", muscleGroups: ["back", "biceps"], defaults: { sets: 3, reps: 10, rpe: 8 } },
  { id: "cable-row", name: "Cable Row", category: "bodybuilding", muscleGroups: ["back", "biceps"], defaults: { sets: 3, reps: 12 } },
  { id: "lat-pulldown", name: "Lat Pulldown", category: "bodybuilding", muscleGroups: ["back", "biceps"], defaults: { sets: 3, reps: 10 } },
  { id: "pull-up", name: "Pull-Up", category: "bodybuilding", muscleGroups: ["back", "biceps"], defaults: { sets: 4, reps: 6, rpe: 8 } },
  { id: "chin-up", name: "Chin-Up", category: "bodybuilding", muscleGroups: ["back", "biceps"], defaults: { sets: 3, reps: 8, rpe: 8 } },
  { id: "t-bar-row", name: "T-Bar Row", category: "bodybuilding", muscleGroups: ["back"], defaults: { sets: 3, reps: 8, rpe: 8 } },
  { id: "face-pull", name: "Face Pull", category: "bodybuilding", muscleGroups: ["rear delts", "traps"], defaults: { sets: 3, reps: 15 } },
  { id: "lateral-raise", name: "Lateral Raise", category: "bodybuilding", muscleGroups: ["shoulders"], defaults: { sets: 3, reps: 12 } },
  { id: "front-raise", name: "Front Raise", category: "bodybuilding", muscleGroups: ["shoulders"], defaults: { sets: 3, reps: 12 } },
  { id: "rear-delt-fly", name: "Rear Delt Fly", category: "bodybuilding", muscleGroups: ["rear delts"], defaults: { sets: 3, reps: 15 } },
  { id: "db-shoulder-press", name: "Dumbbell Shoulder Press", category: "bodybuilding", muscleGroups: ["shoulders", "triceps"], defaults: { sets: 3, reps: 8, rpe: 8 } },
  { id: "arnold-press", name: "Arnold Press", category: "bodybuilding", muscleGroups: ["shoulders"], defaults: { sets: 3, reps: 10 } },
  { id: "barbell-curl", name: "Barbell Curl", category: "bodybuilding", muscleGroups: ["biceps"], defaults: { sets: 3, reps: 10 } },
  { id: "db-curl", name: "Dumbbell Curl", category: "bodybuilding", muscleGroups: ["biceps"], defaults: { sets: 3, reps: 12 } },
  { id: "hammer-curl", name: "Hammer Curl", category: "bodybuilding", muscleGroups: ["biceps", "forearms"], defaults: { sets: 3, reps: 12 } },
  { id: "preacher-curl", name: "Preacher Curl", category: "bodybuilding", muscleGroups: ["biceps"], defaults: { sets: 3, reps: 10 } },
  { id: "cable-curl", name: "Cable Curl", category: "bodybuilding", muscleGroups: ["biceps"], defaults: { sets: 3, reps: 12 } },
  { id: "tricep-pushdown", name: "Tricep Pushdown", category: "bodybuilding", muscleGroups: ["triceps"], defaults: { sets: 3, reps: 12 } },
  { id: "overhead-tricep", name: "Overhead Tricep Extension", category: "bodybuilding", muscleGroups: ["triceps"], defaults: { sets: 3, reps: 12 } },
  { id: "skull-crusher", name: "Skull Crusher", category: "bodybuilding", muscleGroups: ["triceps"], defaults: { sets: 3, reps: 10 } },
  { id: "dip", name: "Dip", category: "bodybuilding", muscleGroups: ["chest", "triceps"], defaults: { sets: 3, reps: 8, rpe: 8 } },
  { id: "leg-press", name: "Leg Press", category: "bodybuilding", muscleGroups: ["quads", "glutes"], defaults: { sets: 3, reps: 10, rpe: 8 } },
  { id: "hack-squat", name: "Hack Squat", category: "bodybuilding", muscleGroups: ["quads"], defaults: { sets: 3, reps: 10, rpe: 8 } },
  { id: "leg-extension", name: "Leg Extension", category: "bodybuilding", muscleGroups: ["quads"], defaults: { sets: 3, reps: 12 } },
  { id: "leg-curl", name: "Leg Curl", category: "bodybuilding", muscleGroups: ["hamstrings"], defaults: { sets: 3, reps: 12 } },
  { id: "hip-thrust", name: "Hip Thrust", category: "bodybuilding", muscleGroups: ["glutes"], defaults: { sets: 3, reps: 10, rpe: 8 } },
  { id: "bulgarian-split", name: "Bulgarian Split Squat", category: "bodybuilding", muscleGroups: ["quads", "glutes"], defaults: { sets: 3, reps: 8, rpe: 7.5 } },
  { id: "lunge", name: "Lunge", category: "bodybuilding", muscleGroups: ["quads", "glutes"], defaults: { sets: 3, reps: 10 } },
  { id: "calf-raise", name: "Calf Raise", category: "bodybuilding", muscleGroups: ["calves"], defaults: { sets: 4, reps: 15 } },
  { id: "shrug", name: "Shrug", category: "bodybuilding", muscleGroups: ["traps"], defaults: { sets: 3, reps: 12 } },
  { id: "ab-crunch", name: "Ab Crunch", category: "bodybuilding", muscleGroups: ["core"], defaults: { sets: 3, reps: 15 } },
  { id: "hanging-leg-raise", name: "Hanging Leg Raise", category: "bodybuilding", muscleGroups: ["core"], defaults: { sets: 3, reps: 10 } },
  { id: "plank", name: "Plank", category: "bodybuilding", muscleGroups: ["core"], defaults: { sets: 3, reps: 1 } },
  { id: "cable-crunch", name: "Cable Crunch", category: "bodybuilding", muscleGroups: ["core"], defaults: { sets: 3, reps: 15 } },

  // Olympic lifts — low reps, technical
  { id: "clean", name: "Clean", category: "olympic", muscleGroups: ["full body"], defaults: { sets: 5, reps: 2 } },
  { id: "power-clean", name: "Power Clean", category: "olympic", muscleGroups: ["full body"], defaults: { sets: 5, reps: 3 } },
  { id: "hang-clean", name: "Hang Clean", category: "olympic", muscleGroups: ["full body"], defaults: { sets: 4, reps: 3 } },
  { id: "clean-pull", name: "Clean Pull", category: "olympic", muscleGroups: ["back", "traps"], defaults: { sets: 4, reps: 3 } },
  { id: "snatch", name: "Snatch", category: "olympic", muscleGroups: ["full body"], defaults: { sets: 5, reps: 2 } },
  { id: "power-snatch", name: "Power Snatch", category: "olympic", muscleGroups: ["full body"], defaults: { sets: 5, reps: 2 } },
  { id: "hang-snatch", name: "Hang Snatch", category: "olympic", muscleGroups: ["full body"], defaults: { sets: 4, reps: 2 } },
  { id: "snatch-pull", name: "Snatch Pull", category: "olympic", muscleGroups: ["back", "traps"], defaults: { sets: 4, reps: 3 } },
  { id: "jerk", name: "Jerk", category: "olympic", muscleGroups: ["shoulders", "legs"], defaults: { sets: 5, reps: 2 } },
  { id: "push-jerk", name: "Push Jerk", category: "olympic", muscleGroups: ["shoulders", "legs"], defaults: { sets: 4, reps: 3 } },
  { id: "split-jerk", name: "Split Jerk", category: "olympic", muscleGroups: ["shoulders", "legs"], defaults: { sets: 5, reps: 2 } },
  { id: "clean-and-jerk", name: "Clean & Jerk", category: "olympic", muscleGroups: ["full body"], defaults: { sets: 5, reps: 1 } },
  { id: "snatch-grip-dl", name: "Snatch Grip Deadlift", category: "olympic", muscleGroups: ["back", "hamstrings"], defaults: { sets: 3, reps: 5, rpe: 7.5 } },
  { id: "overhead-squat", name: "Overhead Squat", category: "olympic", muscleGroups: ["quads", "shoulders", "core"], defaults: { sets: 3, reps: 5, rpe: 7 } },
];
