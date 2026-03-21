import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/programs/:id/copy-exercise
// Body: { exerciseId: string, exerciseName: string, dayNumber: number, sets, reps, intensityPercent, loadKg, rpe }
// Copies an exercise to the same dayNumber in ALL weeks
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  const program = await prisma.clientProgram.findUnique({
    where: { id: params.id },
    include: {
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: {
          days: {
            orderBy: { dayNumber: "asc" },
            include: { exercises: true },
          },
        },
      },
    },
  });

  if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });

  let added = 0;
  for (const week of program.weeks) {
    const day = week.days.find((d) => d.dayNumber === body.dayNumber);
    if (!day) continue;
    // Skip if exercise already exists in this day
    const exists = day.exercises.some((e) => e.exerciseId === body.exerciseId);
    if (exists) continue;

    await prisma.programExercise.create({
      data: {
        dayId: day.id,
        exerciseName: body.exerciseName,
        exerciseId: body.exerciseId,
        variant: body.variant || null,
        order: day.exercises.length,
        sets: body.sets || 3,
        reps: body.reps || 5,
        intensityPercent: body.intensityPercent || null,
        loadKg: body.loadKg || null,
        rpe: body.rpe || null,
      },
    });
    added++;
  }

  return NextResponse.json({ ok: true, added });
}
