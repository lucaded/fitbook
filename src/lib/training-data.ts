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

export interface LibraryExercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroups: string[];
}

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Powerlifting
  { id: "squat", name: "Back Squat", category: "powerlifting", muscleGroups: ["quads", "glutes", "core"] },
  { id: "front-squat", name: "Front Squat", category: "powerlifting", muscleGroups: ["quads", "core"] },
  { id: "pause-squat", name: "Pause Squat", category: "powerlifting", muscleGroups: ["quads", "glutes", "core"] },
  { id: "pin-squat", name: "Pin Squat", category: "powerlifting", muscleGroups: ["quads", "glutes"] },
  { id: "bench", name: "Bench Press", category: "powerlifting", muscleGroups: ["chest", "triceps", "shoulders"] },
  { id: "close-grip-bench", name: "Close Grip Bench Press", category: "powerlifting", muscleGroups: ["triceps", "chest"] },
  { id: "pause-bench", name: "Pause Bench Press", category: "powerlifting", muscleGroups: ["chest", "triceps"] },
  { id: "spoto-press", name: "Spoto Press", category: "powerlifting", muscleGroups: ["chest", "triceps"] },
  { id: "floor-press", name: "Floor Press", category: "powerlifting", muscleGroups: ["triceps", "chest"] },
  { id: "deadlift", name: "Deadlift", category: "powerlifting", muscleGroups: ["back", "glutes", "hamstrings"] },
  { id: "sumo-deadlift", name: "Sumo Deadlift", category: "powerlifting", muscleGroups: ["glutes", "quads", "back"] },
  { id: "deficit-deadlift", name: "Deficit Deadlift", category: "powerlifting", muscleGroups: ["back", "hamstrings"] },
  { id: "block-pull", name: "Block Pull", category: "powerlifting", muscleGroups: ["back", "glutes"] },
  { id: "rdl", name: "Romanian Deadlift", category: "powerlifting", muscleGroups: ["hamstrings", "glutes", "back"] },
  { id: "good-morning", name: "Good Morning", category: "powerlifting", muscleGroups: ["hamstrings", "back"] },
  { id: "overhead-press", name: "Overhead Press", category: "powerlifting", muscleGroups: ["shoulders", "triceps"] },

  // Bodybuilding
  { id: "incline-bench", name: "Incline Bench Press", category: "bodybuilding", muscleGroups: ["chest", "shoulders"] },
  { id: "db-bench", name: "Dumbbell Bench Press", category: "bodybuilding", muscleGroups: ["chest", "triceps"] },
  { id: "incline-db-bench", name: "Incline Dumbbell Press", category: "bodybuilding", muscleGroups: ["chest", "shoulders"] },
  { id: "chest-fly", name: "Chest Fly", category: "bodybuilding", muscleGroups: ["chest"] },
  { id: "cable-fly", name: "Cable Fly", category: "bodybuilding", muscleGroups: ["chest"] },
  { id: "barbell-row", name: "Barbell Row", category: "bodybuilding", muscleGroups: ["back", "biceps"] },
  { id: "db-row", name: "Dumbbell Row", category: "bodybuilding", muscleGroups: ["back", "biceps"] },
  { id: "cable-row", name: "Cable Row", category: "bodybuilding", muscleGroups: ["back", "biceps"] },
  { id: "lat-pulldown", name: "Lat Pulldown", category: "bodybuilding", muscleGroups: ["back", "biceps"] },
  { id: "pull-up", name: "Pull-Up", category: "bodybuilding", muscleGroups: ["back", "biceps"] },
  { id: "chin-up", name: "Chin-Up", category: "bodybuilding", muscleGroups: ["back", "biceps"] },
  { id: "t-bar-row", name: "T-Bar Row", category: "bodybuilding", muscleGroups: ["back"] },
  { id: "face-pull", name: "Face Pull", category: "bodybuilding", muscleGroups: ["rear delts", "traps"] },
  { id: "lateral-raise", name: "Lateral Raise", category: "bodybuilding", muscleGroups: ["shoulders"] },
  { id: "front-raise", name: "Front Raise", category: "bodybuilding", muscleGroups: ["shoulders"] },
  { id: "rear-delt-fly", name: "Rear Delt Fly", category: "bodybuilding", muscleGroups: ["rear delts"] },
  { id: "db-shoulder-press", name: "Dumbbell Shoulder Press", category: "bodybuilding", muscleGroups: ["shoulders", "triceps"] },
  { id: "arnold-press", name: "Arnold Press", category: "bodybuilding", muscleGroups: ["shoulders"] },
  { id: "barbell-curl", name: "Barbell Curl", category: "bodybuilding", muscleGroups: ["biceps"] },
  { id: "db-curl", name: "Dumbbell Curl", category: "bodybuilding", muscleGroups: ["biceps"] },
  { id: "hammer-curl", name: "Hammer Curl", category: "bodybuilding", muscleGroups: ["biceps", "forearms"] },
  { id: "preacher-curl", name: "Preacher Curl", category: "bodybuilding", muscleGroups: ["biceps"] },
  { id: "cable-curl", name: "Cable Curl", category: "bodybuilding", muscleGroups: ["biceps"] },
  { id: "tricep-pushdown", name: "Tricep Pushdown", category: "bodybuilding", muscleGroups: ["triceps"] },
  { id: "overhead-tricep", name: "Overhead Tricep Extension", category: "bodybuilding", muscleGroups: ["triceps"] },
  { id: "skull-crusher", name: "Skull Crusher", category: "bodybuilding", muscleGroups: ["triceps"] },
  { id: "dip", name: "Dip", category: "bodybuilding", muscleGroups: ["chest", "triceps"] },
  { id: "leg-press", name: "Leg Press", category: "bodybuilding", muscleGroups: ["quads", "glutes"] },
  { id: "hack-squat", name: "Hack Squat", category: "bodybuilding", muscleGroups: ["quads"] },
  { id: "leg-extension", name: "Leg Extension", category: "bodybuilding", muscleGroups: ["quads"] },
  { id: "leg-curl", name: "Leg Curl", category: "bodybuilding", muscleGroups: ["hamstrings"] },
  { id: "hip-thrust", name: "Hip Thrust", category: "bodybuilding", muscleGroups: ["glutes"] },
  { id: "bulgarian-split", name: "Bulgarian Split Squat", category: "bodybuilding", muscleGroups: ["quads", "glutes"] },
  { id: "lunge", name: "Lunge", category: "bodybuilding", muscleGroups: ["quads", "glutes"] },
  { id: "calf-raise", name: "Calf Raise", category: "bodybuilding", muscleGroups: ["calves"] },
  { id: "shrug", name: "Shrug", category: "bodybuilding", muscleGroups: ["traps"] },
  { id: "ab-crunch", name: "Ab Crunch", category: "bodybuilding", muscleGroups: ["core"] },
  { id: "hanging-leg-raise", name: "Hanging Leg Raise", category: "bodybuilding", muscleGroups: ["core"] },
  { id: "plank", name: "Plank", category: "bodybuilding", muscleGroups: ["core"] },
  { id: "cable-crunch", name: "Cable Crunch", category: "bodybuilding", muscleGroups: ["core"] },

  // Olympic lifts
  { id: "clean", name: "Clean", category: "olympic", muscleGroups: ["full body"] },
  { id: "power-clean", name: "Power Clean", category: "olympic", muscleGroups: ["full body"] },
  { id: "hang-clean", name: "Hang Clean", category: "olympic", muscleGroups: ["full body"] },
  { id: "clean-pull", name: "Clean Pull", category: "olympic", muscleGroups: ["back", "traps"] },
  { id: "snatch", name: "Snatch", category: "olympic", muscleGroups: ["full body"] },
  { id: "power-snatch", name: "Power Snatch", category: "olympic", muscleGroups: ["full body"] },
  { id: "hang-snatch", name: "Hang Snatch", category: "olympic", muscleGroups: ["full body"] },
  { id: "snatch-pull", name: "Snatch Pull", category: "olympic", muscleGroups: ["back", "traps"] },
  { id: "jerk", name: "Jerk", category: "olympic", muscleGroups: ["shoulders", "legs"] },
  { id: "push-jerk", name: "Push Jerk", category: "olympic", muscleGroups: ["shoulders", "legs"] },
  { id: "split-jerk", name: "Split Jerk", category: "olympic", muscleGroups: ["shoulders", "legs"] },
  { id: "clean-and-jerk", name: "Clean & Jerk", category: "olympic", muscleGroups: ["full body"] },
  { id: "snatch-grip-dl", name: "Snatch Grip Deadlift", category: "olympic", muscleGroups: ["back", "hamstrings"] },
  { id: "overhead-squat", name: "Overhead Squat", category: "olympic", muscleGroups: ["quads", "shoulders", "core"] },
];
