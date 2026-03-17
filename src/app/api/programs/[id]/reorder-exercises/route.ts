import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH - reorder exercises within a day
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { dayId, exerciseIds } = body as { dayId: string; exerciseIds: string[] };

  if (!dayId || !exerciseIds?.length) {
    return NextResponse.json({ error: "dayId and exerciseIds required" }, { status: 400 });
  }

  await prisma.$transaction(
    exerciseIds.map((id, index) =>
      prisma.programExercise.update({ where: { id }, data: { order: index } })
    )
  );

  return NextResponse.json({ ok: true });
}
