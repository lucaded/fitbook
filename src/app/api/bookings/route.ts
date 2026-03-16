import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/bookings
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};
  if (clientId) where.clientId = clientId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { date: "asc" },
    include: { client: { select: { id: true, name: true } } },
  });
  return NextResponse.json(bookings);
}

// POST /api/bookings
export async function POST(req: NextRequest) {
  const body = await req.json();
  const booking = await prisma.booking.create({
    data: {
      clientId: body.clientId,
      date: new Date(body.date),
      startTime: new Date(`${body.date}T${body.startTime}`),
      endTime: new Date(`${body.date}T${body.endTime}`),
      type: body.type || "PERSONAL",
      status: body.status || "CONFIRMED",
      notes: body.notes || null,
    },
    include: { client: { select: { id: true, name: true } } },
  });
  return NextResponse.json(booking, { status: 201 });
}
