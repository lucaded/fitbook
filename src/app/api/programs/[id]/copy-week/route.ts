import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/programs/:id/copy-week
// Body: { sourceWeekId: string, targetWeekId: string }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { sourceWeekId, targetWeekId } = await req.json();

  const sourceWeek = await prisma.programWeek.findUnique({
    where: { id: sourceWeekId },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: { exercises: { orderBy: { order: "asc" } } },
      },
    },
  });

  const targetWeek = await prisma.programWeek.findUnique({
    where: { id: targetWeekId },
    include: { days: { orderBy: { dayNumber: "asc" }, include: { exercises: true } } },
  });

  if (!sourceWeek || !targetWeek) {
    return NextResponse.json({ error: "Week not found" }, { status: 404 });
  }

  // Clear existing exercises in target week
  for (const day of targetWeek.days) {
    if (day.exercises.length > 0) {
      await prisma.programExercise.deleteMany({ where: { dayId: day.id } });
    }
  }

  // Copy exercises from source to target
  for (const sourceDay of sourceWeek.days) {
    const targetDay = targetWeek.days.find((d) => d.dayNumber === sourceDay.dayNumber);
    if (!targetDay) continue;

    // Copy day label
    if (sourceDay.label) {
      await prisma.programDay.update({
        where: { id: targetDay.id },
        data: { label: sourceDay.label },
      });
    }

    for (const ex of sourceDay.exercises) {
      await prisma.programExercise.create({
        data: {
          dayId: targetDay.id,
          exerciseName: ex.exerciseName,
          exerciseId: ex.exerciseId,
          order: ex.order,
          sets: ex.sets,
          reps: ex.reps,
          intensityPercent: ex.intensityPercent,
          loadKg: ex.loadKg,
          rpe: ex.rpe,
          notes: ex.notes,
          // Don't copy actuals
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
