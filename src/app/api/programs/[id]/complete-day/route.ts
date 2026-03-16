import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/programs/:id/complete-day
// Body: { dayId: string }
// Marks all exercises in a day as completed (copies prescribed to actuals if not set)
// and creates progression suggestions in the same day of the next week
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { dayId } = await req.json();

  const day = await prisma.programDay.findUnique({
    where: { id: dayId },
    include: {
      exercises: { orderBy: { order: "asc" } },
      week: true,
    },
  });

  if (!day) return NextResponse.json({ error: "Day not found" }, { status: 404 });

  const program = await prisma.clientProgram.findUnique({
    where: { id: params.id },
    include: {
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: { days: { orderBy: { dayNumber: "asc" }, include: { exercises: true } } },
      },
    },
  });

  if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });

  // Fill in actuals if not set
  for (const ex of day.exercises) {
    if (ex.actualSets === null || ex.actualReps === null || ex.actualLoadKg === null) {
      await prisma.programExercise.update({
        where: { id: ex.id },
        data: {
          actualSets: ex.actualSets ?? ex.sets,
          actualReps: ex.actualReps ?? ex.reps,
          actualLoadKg: ex.actualLoadKg ?? ex.loadKg,
        },
      });
    }
  }

  // Find next week, same day
  const currentWeekIdx = program.weeks.findIndex((w) => w.id === day.week.id);
  const nextWeek = program.weeks[currentWeekIdx + 1];
  if (nextWeek) {
    const nextDay = nextWeek.days.find((d) => d.dayNumber === day.dayNumber);
    if (nextDay && nextDay.exercises.length === 0) {
      const increment = program.progressionIncrement || 2.5;
      const oneRMs = (program.oneRMs as Record<string, number>) || {};

      for (const ex of day.exercises) {
        const prevLoad = ex.actualLoadKg ?? ex.loadKg ?? 0;
        const newLoad = Math.round((prevLoad + increment) / 2.5) * 2.5;
        const oneRM = oneRMs[ex.exerciseId] || 0;
        const newIntensity = oneRM > 0 ? Math.round((newLoad / oneRM) * 1000) / 10 : ex.intensityPercent;

        await prisma.programExercise.create({
          data: {
            dayId: nextDay.id,
            exerciseName: ex.exerciseName,
            exerciseId: ex.exerciseId,
            order: ex.order,
            sets: ex.actualSets ?? ex.sets,
            reps: ex.actualReps ?? ex.reps,
            intensityPercent: newIntensity,
            loadKg: newLoad,
            rpe: ex.rpe,
            notes: null,
          },
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
