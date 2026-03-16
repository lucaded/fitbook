import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/programs/:id/exercises - add exercise to a day
export async function POST(req: NextRequest) {
  const body = await req.json();
  const exercise = await prisma.programExercise.create({
    data: {
      dayId: body.dayId,
      exerciseName: body.exerciseName,
      exerciseId: body.exerciseId,
      order: body.order || 0,
      sets: body.sets || 3,
      reps: body.reps || 5,
      intensityPercent: body.intensityPercent,
      loadKg: body.loadKg,
      rpe: body.rpe,
      notes: body.notes,
    },
  });
  return NextResponse.json(exercise, { status: 201 });
}

// PATCH /api/programs/:id/exercises - update an exercise
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const exercise = await prisma.programExercise.update({
    where: { id: body.exerciseId },
    data: {
      sets: body.sets,
      reps: body.reps,
      intensityPercent: body.intensityPercent,
      loadKg: body.loadKg,
      rpe: body.rpe,
      notes: body.notes,
      actualSets: body.actualSets,
      actualReps: body.actualReps,
      actualLoadKg: body.actualLoadKg,
    },
  });
  return NextResponse.json(exercise);
}

// DELETE /api/programs/:id/exercises - remove an exercise
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const exerciseId = searchParams.get("exerciseId");
  if (!exerciseId) return NextResponse.json({ error: "exerciseId required" }, { status: 400 });
  await prisma.programExercise.delete({ where: { id: exerciseId } });
  return NextResponse.json({ ok: true });
}
