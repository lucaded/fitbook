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

// DELETE /api/programs/:id/days?dayNumber=N — remove a specific day from every week
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const dayNumberParam = searchParams.get("dayNumber");

  const program = await prisma.clientProgram.findUnique({
    where: { id: params.id },
    include: { weeks: { include: { days: { orderBy: { dayNumber: "asc" } } } } },
  });
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (program.daysPerWeek <= 1) return NextResponse.json({ error: "Need at least 1 day" }, { status: 400 });

  const dayNumber = dayNumberParam ? parseInt(dayNumberParam) : program.daysPerWeek;

  // Delete the specified day from each week
  for (const week of program.weeks) {
    const targetDay = week.days.find((d) => d.dayNumber === dayNumber);
    if (targetDay) {
      await prisma.programDay.delete({ where: { id: targetDay.id } });
    }
  }

  // Renumber remaining days to fill the gap
  for (const week of program.weeks) {
    const remaining = week.days.filter((d) => d.dayNumber !== dayNumber).sort((a, b) => a.dayNumber - b.dayNumber);
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].dayNumber !== i + 1) {
        await prisma.programDay.update({ where: { id: remaining[i].id }, data: { dayNumber: i + 1 } });
      }
    }
  }

  await prisma.clientProgram.update({
    where: { id: params.id },
    data: { daysPerWeek: program.daysPerWeek - 1 },
  });

  return NextResponse.json({ ok: true, daysPerWeek: program.daysPerWeek - 1 });
}
