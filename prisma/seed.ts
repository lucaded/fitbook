import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create Aldo Balboa
  const aldo = await prisma.client.upsert({
    where: { id: "aldo-balboa" },
    update: {},
    create: {
      id: "aldo-balboa",
      name: "Aldo Balboa",
      email: "aldo.balboa@example.com",
      phone: "+39 333 1234567",
      height: 178,
      weight: 82,
      goals: "Powerlifting competition prep. Targeting 600kg total (220 SQ / 140 BP / 240 DL). Improve bench lockout and squat depth consistency.",
      injuries: "Minor left shoulder impingement (2025, resolved). Occasional lower back tightness after heavy pulls.",
      notes: "Very consistent, trains 4x/week. Prefers morning sessions. Responds well to RPE-based programming. Competes in -83kg class.",
      active: true,
    },
  });

  // Create 4 programs covering ~1 year
  const programs = [
    { name: "Hypertrophy Block", weeks: 6, daysPerWeek: 4, status: "COMPLETED" as const, startMonthsAgo: 12 },
    { name: "Strength Block 1", weeks: 8, daysPerWeek: 4, status: "COMPLETED" as const, startMonthsAgo: 10 },
    { name: "Peaking Block", weeks: 6, daysPerWeek: 4, status: "COMPLETED" as const, startMonthsAgo: 6 },
    { name: "Strength Block 2", weeks: 8, daysPerWeek: 4, status: "ACTIVE" as const, startMonthsAgo: 2 },
  ];

  // Exercise templates per day for each program type
  const hypertrophyDays = [
    [ // Day 1 - Squat + Accessories
      { name: "Back Squat", id: "squat", baseSets: 4, baseReps: 8, baseIntensity: 65 },
      { name: "Leg Press", id: "leg-press", baseSets: 3, baseReps: 12, baseIntensity: 0 },
      { name: "Leg Curl", id: "leg-curl", baseSets: 3, baseReps: 12, baseIntensity: 0 },
      { name: "Bulgarian Split Squat", id: "bulgarian-split", baseSets: 3, baseReps: 10, baseIntensity: 0 },
    ],
    [ // Day 2 - Bench + Upper
      { name: "Bench Press", id: "bench", baseSets: 4, baseReps: 8, baseIntensity: 65 },
      { name: "Incline Dumbbell Press", id: "incline-db-bench", baseSets: 3, baseReps: 10, baseIntensity: 0 },
      { name: "Barbell Row", id: "barbell-row", baseSets: 4, baseReps: 8, baseIntensity: 0 },
      { name: "Lateral Raise", id: "lateral-raise", baseSets: 3, baseReps: 15, baseIntensity: 0 },
    ],
    [ // Day 3 - Deadlift + Posterior
      { name: "Deadlift", id: "deadlift", baseSets: 4, baseReps: 6, baseIntensity: 70 },
      { name: "Romanian Deadlift", id: "rdl", baseSets: 3, baseReps: 10, baseIntensity: 0 },
      { name: "Hip Thrust", id: "hip-thrust", baseSets: 3, baseReps: 12, baseIntensity: 0 },
      { name: "Hanging Leg Raise", id: "hanging-leg-raise", baseSets: 3, baseReps: 12, baseIntensity: 0 },
    ],
    [ // Day 4 - Upper Accessories
      { name: "Overhead Press", id: "overhead-press", baseSets: 4, baseReps: 8, baseIntensity: 0 },
      { name: "Lat Pulldown", id: "lat-pulldown", baseSets: 4, baseReps: 10, baseIntensity: 0 },
      { name: "Dumbbell Curl", id: "db-curl", baseSets: 3, baseReps: 12, baseIntensity: 0 },
      { name: "Tricep Pushdown", id: "tricep-pushdown", baseSets: 3, baseReps: 12, baseIntensity: 0 },
      { name: "Face Pull", id: "face-pull", baseSets: 3, baseReps: 15, baseIntensity: 0 },
    ],
  ];

  const strengthDays = [
    [ // Day 1 - Heavy Squat
      { name: "Back Squat", id: "squat", baseSets: 5, baseReps: 3, baseIntensity: 80 },
      { name: "Pause Squat", id: "pause-squat", baseSets: 3, baseReps: 3, baseIntensity: 72 },
      { name: "Leg Extension", id: "leg-extension", baseSets: 3, baseReps: 10, baseIntensity: 0 },
    ],
    [ // Day 2 - Heavy Bench
      { name: "Bench Press", id: "bench", baseSets: 5, baseReps: 3, baseIntensity: 82 },
      { name: "Close Grip Bench Press", id: "close-grip-bench", baseSets: 3, baseReps: 5, baseIntensity: 72 },
      { name: "Barbell Row", id: "barbell-row", baseSets: 4, baseReps: 6, baseIntensity: 0 },
      { name: "Dip", id: "dip", baseSets: 3, baseReps: 8, baseIntensity: 0 },
    ],
    [ // Day 3 - Heavy Deadlift
      { name: "Deadlift", id: "deadlift", baseSets: 5, baseReps: 3, baseIntensity: 82 },
      { name: "Deficit Deadlift", id: "deficit-deadlift", baseSets: 3, baseReps: 3, baseIntensity: 72 },
      { name: "Good Morning", id: "good-morning", baseSets: 3, baseReps: 8, baseIntensity: 0 },
    ],
    [ // Day 4 - Volume Upper
      { name: "Bench Press", id: "bench", baseSets: 4, baseReps: 5, baseIntensity: 75 },
      { name: "Overhead Press", id: "overhead-press", baseSets: 3, baseReps: 6, baseIntensity: 0 },
      { name: "Pull-Up", id: "pull-up", baseSets: 4, baseReps: 6, baseIntensity: 0 },
      { name: "Lateral Raise", id: "lateral-raise", baseSets: 3, baseReps: 12, baseIntensity: 0 },
    ],
  ];

  const peakingDays = [
    [
      { name: "Back Squat", id: "squat", baseSets: 3, baseReps: 2, baseIntensity: 88 },
      { name: "Front Squat", id: "front-squat", baseSets: 2, baseReps: 3, baseIntensity: 72 },
    ],
    [
      { name: "Bench Press", id: "bench", baseSets: 3, baseReps: 2, baseIntensity: 90 },
      { name: "Spoto Press", id: "spoto-press", baseSets: 2, baseReps: 3, baseIntensity: 75 },
      { name: "Cable Row", id: "cable-row", baseSets: 3, baseReps: 8, baseIntensity: 0 },
    ],
    [
      { name: "Deadlift", id: "deadlift", baseSets: 3, baseReps: 2, baseIntensity: 90 },
      { name: "Block Pull", id: "block-pull", baseSets: 2, baseReps: 2, baseIntensity: 85 },
    ],
    [
      { name: "Back Squat", id: "squat", baseSets: 3, baseReps: 3, baseIntensity: 80 },
      { name: "Bench Press", id: "bench", baseSets: 3, baseReps: 3, baseIntensity: 82 },
      { name: "Barbell Row", id: "barbell-row", baseSets: 3, baseReps: 6, baseIntensity: 0 },
    ],
  ];

  // 1RM progression over the year (start → end)
  const oneRMProgression = {
    squat: { start: 180, end: 210 },
    bench: { start: 115, end: 132.5 },
    deadlift: { start: 200, end: 235 },
  };

  const programDayTemplates = [hypertrophyDays, strengthDays, peakingDays, strengthDays];

  for (let p = 0; p < programs.length; p++) {
    const prog = programs[p];
    const dayTemplates = programDayTemplates[p];

    // Calculate 1RMs for this program phase
    const phaseProgress = (12 - prog.startMonthsAgo) / 12;
    const oneRMs: Record<string, number> = {
      squat: Math.round(oneRMProgression.squat.start + (oneRMProgression.squat.end - oneRMProgression.squat.start) * phaseProgress),
      bench: Math.round((oneRMProgression.bench.start + (oneRMProgression.bench.end - oneRMProgression.bench.start) * phaseProgress) * 2) / 2,
      deadlift: Math.round(oneRMProgression.deadlift.start + (oneRMProgression.deadlift.end - oneRMProgression.deadlift.start) * phaseProgress),
    };

    const createdAt = new Date();
    createdAt.setMonth(createdAt.getMonth() - prog.startMonthsAgo);

    const program = await prisma.clientProgram.create({
      data: {
        clientId: aldo.id,
        name: prog.name,
        daysPerWeek: prog.daysPerWeek,
        progressionIncrement: 2.5,
        oneRMs,
        status: prog.status,
        createdAt,
        weeks: {
          create: Array.from({ length: prog.weeks }, (_, w) => ({
            weekNumber: w + 1,
            days: {
              create: Array.from({ length: prog.daysPerWeek }, (_, d) => {
                const template = dayTemplates[d] || dayTemplates[0];
                // Progressive overload: increase intensity by ~1-2% per week
                const weekIntensityBump = w * 1.5;
                // Simulate some actual performance with slight variation
                const rand = () => (Math.random() - 0.5) * 2; // ±1

                return {
                  dayNumber: d + 1,
                  exercises: {
                    create: template.map((ex, i) => {
                      const intensity = ex.baseIntensity > 0
                        ? Math.min(100, ex.baseIntensity + weekIntensityBump)
                        : null;
                      const rm = oneRMs[ex.id as keyof typeof oneRMs] || 0;
                      const loadKg = intensity && rm
                        ? Math.round(rm * intensity / 100 / 2.5) * 2.5
                        : (ex.id === "leg-press" ? 140 + w * 5 :
                           ex.id === "leg-curl" ? 40 + w * 2 :
                           ex.id === "rdl" ? 80 + w * 2.5 :
                           ex.id === "hip-thrust" ? 90 + w * 5 :
                           ex.id === "overhead-press" ? 55 + w * 1.25 :
                           ex.id === "lat-pulldown" ? 60 + w * 2 :
                           ex.id === "barbell-row" ? 70 + w * 2.5 :
                           ex.id === "cable-row" ? 55 + w * 2 :
                           ex.id === "incline-db-bench" ? 28 + w * 1 :
                           ex.id === "lateral-raise" ? 12 + w * 0.5 :
                           ex.id === "face-pull" ? 20 + w * 1 :
                           ex.id === "db-curl" ? 14 + w * 0.5 :
                           ex.id === "tricep-pushdown" ? 25 + w * 1 :
                           ex.id === "leg-extension" ? 50 + w * 2.5 :
                           ex.id === "dip" ? 10 + w * 2.5 :
                           ex.id === "pull-up" ? 5 + w * 1.25 :
                           ex.id === "hanging-leg-raise" ? 0 :
                           ex.id === "bulgarian-split" ? 30 + w * 2 :
                           ex.id === "good-morning" ? 60 + w * 2.5 :
                           ex.id === "front-squat" ? (oneRMs.squat * 0.72 + w * 2) :
                           ex.id === "spoto-press" ? (oneRMs.bench * 0.75 + w * 1.25) :
                           ex.id === "block-pull" ? (oneRMs.deadlift * 0.85 + w * 2.5) :
                           ex.id === "pause-squat" ? (oneRMs.squat * 0.72 + w * 2) :
                           ex.id === "close-grip-bench" ? (oneRMs.bench * 0.72 + w * 1.25) :
                           ex.id === "deficit-deadlift" ? (oneRMs.deadlift * 0.72 + w * 2.5) :
                           40);
                      const roundedLoad = Math.round(loadKg / 2.5) * 2.5;

                      // For completed programs, fill in actuals
                      const isCompleted = prog.status === "COMPLETED";
                      return {
                        exerciseName: ex.name,
                        exerciseId: ex.id,
                        order: i,
                        sets: ex.baseSets,
                        reps: ex.baseReps,
                        intensityPercent: intensity,
                        loadKg: roundedLoad,
                        rpe: intensity && intensity > 80 ? 8.5 + rand() * 0.5 : (intensity ? 7.5 + rand() * 0.5 : null),
                        actualSets: isCompleted ? ex.baseSets : null,
                        actualReps: isCompleted ? Math.max(1, ex.baseReps + Math.round(rand())) : null,
                        actualLoadKg: isCompleted ? roundedLoad + Math.round(rand()) * 2.5 : null,
                      };
                    }),
                  },
                };
              }),
            },
          })),
        },
      },
    });

    console.log(`Created program: ${program.name} (${prog.weeks} weeks)`);
  }

  // Add PRs over the year
  const prData = [
    { exerciseId: "squat", exerciseName: "Back Squat", loadKg: 185, reps: 1, monthsAgo: 11 },
    { exerciseId: "bench", exerciseName: "Bench Press", loadKg: 120, reps: 1, monthsAgo: 11 },
    { exerciseId: "deadlift", exerciseName: "Deadlift", loadKg: 210, reps: 1, monthsAgo: 11 },
    { exerciseId: "squat", exerciseName: "Back Squat", loadKg: 190, reps: 1, monthsAgo: 9 },
    { exerciseId: "squat", exerciseName: "Back Squat", loadKg: 180, reps: 3, monthsAgo: 9 },
    { exerciseId: "bench", exerciseName: "Bench Press", loadKg: 122.5, reps: 1, monthsAgo: 8 },
    { exerciseId: "deadlift", exerciseName: "Deadlift", loadKg: 220, reps: 1, monthsAgo: 8 },
    { exerciseId: "squat", exerciseName: "Back Squat", loadKg: 200, reps: 1, monthsAgo: 6 },
    { exerciseId: "bench", exerciseName: "Bench Press", loadKg: 127.5, reps: 1, monthsAgo: 6 },
    { exerciseId: "deadlift", exerciseName: "Deadlift", loadKg: 227.5, reps: 1, monthsAgo: 5 },
    { exerciseId: "squat", exerciseName: "Back Squat", loadKg: 205, reps: 1, monthsAgo: 4 },
    { exerciseId: "bench", exerciseName: "Bench Press", loadKg: 130, reps: 1, monthsAgo: 3 },
    { exerciseId: "deadlift", exerciseName: "Deadlift", loadKg: 232.5, reps: 1, monthsAgo: 2 },
    { exerciseId: "squat", exerciseName: "Back Squat", loadKg: 210, reps: 1, monthsAgo: 1 },
    { exerciseId: "bench", exerciseName: "Bench Press", loadKg: 132.5, reps: 1, monthsAgo: 1 },
    { exerciseId: "deadlift", exerciseName: "Deadlift", loadKg: 235, reps: 1, monthsAgo: 0 },
  ];

  for (const pr of prData) {
    const date = new Date();
    date.setMonth(date.getMonth() - pr.monthsAgo);
    await prisma.personalRecord.create({
      data: {
        clientId: aldo.id,
        exerciseId: pr.exerciseId,
        exerciseName: pr.exerciseName,
        loadKg: pr.loadKg,
        reps: pr.reps,
        date,
      },
    });
  }

  console.log("Seed complete: Aldo Balboa with 1 year of training history");
  console.log(`  Squat: ${oneRMProgression.squat.start} → ${oneRMProgression.squat.end} kg`);
  console.log(`  Bench: ${oneRMProgression.bench.start} → ${oneRMProgression.bench.end} kg`);
  console.log(`  Deadlift: ${oneRMProgression.deadlift.start} → ${oneRMProgression.deadlift.end} kg`);
  console.log(`  4 programs, 16 PRs`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
