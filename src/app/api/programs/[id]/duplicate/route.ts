import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/programs/:id/duplicate
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const program = await prisma.clientProgram.findUnique({
    where: { id: params.id },
    include: {
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: {
          days: {
            orderBy: { dayNumber: "asc" },
            include: { exercises: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });

  if (!program) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  const newProgram = await prisma.$transaction(async (tx) => {
    const created = await tx.clientProgram.create({
      data: {
        clientId: program.clientId,
        name: `${program.name} (copy)`,
        daysPerWeek: program.daysPerWeek,
        progressionIncrement: program.progressionIncrement,
        oneRMs: program.oneRMs as object,
        status: "ACTIVE",
      },
    });

    for (const week of program.weeks) {
      const newWeek = await tx.programWeek.create({
        data: {
          programId: created.id,
          weekNumber: week.weekNumber,
        },
      });

      for (const day of week.days) {
        const newDay = await tx.programDay.create({
          data: {
            weekId: newWeek.id,
            dayNumber: day.dayNumber,
            label: day.label,
          },
        });

        for (const ex of day.exercises) {
          await tx.programExercise.create({
            data: {
              dayId: newDay.id,
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
    }

    return created;
  });

  return NextResponse.json({ id: newProgram.id });
}
