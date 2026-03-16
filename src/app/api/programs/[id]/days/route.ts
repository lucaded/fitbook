import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/programs/:id/days — add a day to every week
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const program = await prisma.clientProgram.findUnique({
    where: { id: params.id },
    include: { weeks: { include: { days: true } } },
  });
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newDayNumber = program.daysPerWeek + 1;

  // Add a day to each week
  for (const week of program.weeks) {
    await prisma.programDay.create({
      data: {
        weekId: week.id,
        dayNumber: newDayNumber,
      },
    });
  }

  // Update daysPerWeek
  await prisma.clientProgram.update({
    where: { id: params.id },
    data: { daysPerWeek: newDayNumber },
  });

  return NextResponse.json({ ok: true, daysPerWeek: newDayNumber });
}

// DELETE /api/programs/:id/days — remove last day from every week
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const program = await prisma.clientProgram.findUnique({
    where: { id: params.id },
    include: { weeks: { include: { days: { orderBy: { dayNumber: "desc" } } } } },
  });
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (program.daysPerWeek <= 1) return NextResponse.json({ error: "Need at least 1 day" }, { status: 400 });

  // Delete last day from each week
  for (const week of program.weeks) {
    const lastDay = week.days[0]; // ordered desc, so first is highest dayNumber
    if (lastDay) {
      await prisma.programDay.delete({ where: { id: lastDay.id } });
    }
  }

  await prisma.clientProgram.update({
    where: { id: params.id },
    data: { daysPerWeek: program.daysPerWeek - 1 },
  });

  return NextResponse.json({ ok: true, daysPerWeek: program.daysPerWeek - 1 });
}
