import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.booking.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const booking = await prisma.booking.update({
    where: { id: params.id },
    data: {
      status: body.status,
      notes: body.notes,
      date: body.date ? new Date(body.date) : undefined,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
    },
    include: { client: { select: { id: true, name: true } } },
  });
  return NextResponse.json(booking);
}
