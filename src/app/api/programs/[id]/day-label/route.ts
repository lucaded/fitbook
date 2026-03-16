import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/programs/:id/day-label
// Body: { dayId: string, label: string }
export async function PATCH(req: NextRequest) {
  const { dayId, label } = await req.json();
  await prisma.programDay.update({
    where: { id: dayId },
    data: { label: label || null },
  });
  return NextResponse.json({ ok: true });
}
