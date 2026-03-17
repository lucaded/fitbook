import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/programs/:id/day-label
// Body: { dayId: string, label?: string, notes?: string }
export async function PATCH(req: NextRequest) {
  const { dayId, label, notes } = await req.json();
  const data: Record<string, string | null> = {};
  if (label !== undefined) data.label = label || null;
  if (notes !== undefined) data.notes = notes || null;
  await prisma.programDay.update({
    where: { id: dayId },
    data,
  });
  return NextResponse.json({ ok: true });
}
