import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - add exercise to a day
export async function POST(req: NextRequest) {
  const body = await req.json();
  const exercise = await prisma.programExercise.create({
    data: {
      dayId: body.dayId,
      exerciseName: body.exerciseName,
      exerciseId: body.exerciseId,
      variant: body.variant || null,
      order: body.order || 0,
      sets: body.sets || 3,
      reps: body.reps || 5,
      intensityPercent: body.intensityPercent || null,
      loadKg: body.loadKg || null,
      rpe: body.rpe || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(exercise, { status: 201 });
}

// PATCH - update an exercise
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id: exerciseId, ...data } = body;
  const exercise = await prisma.programExercise.update({
    where: { id: exerciseId },
    data: {
      sets: data.sets,
      reps: data.reps,
      intensityPercent: data.intensityPercent,
      loadKg: data.loadKg,
      rpe: data.rpe,
      notes: data.notes,
      variant: data.variant,
      actualSets: data.actualSets,
      actualReps: data.actualReps,
      actualLoadKg: data.actualLoadKg,
      actualRpe: data.actualRpe,
      clientNotes: data.clientNotes,
      repDurationSec: data.repDurationSec,
      exerciseName: data.exerciseName,
      exerciseId: data.exerciseId,
      order: data.order,
    },
  });
  return NextResponse.json(exercise);
}

// DELETE - remove an exercise
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const exerciseId = searchParams.get("exerciseId");
  if (!exerciseId) return NextResponse.json({ error: "exerciseId required" }, { status: 400 });
  await prisma.programExercise.delete({ where: { id: exerciseId } });
  return NextResponse.json({ ok: true });
}
