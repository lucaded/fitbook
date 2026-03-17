import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/bookings - only bookings for clients owned by this trainer
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 200 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {
    client: {
      OR: [
        { trainerId: session.user.id },
        { trainerId: null },
      ],
    },
  };
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const booking = await prisma.booking.create({
    data: {
      clientId: body.clientId,
      date: new Date(`${body.date}T00:00:00Z`),
      startTime: new Date(`${body.date}T${body.startTime}:00Z`),
      endTime: new Date(`${body.date}T${body.endTime}:00Z`),
      type: body.type || "PERSONAL",
      status: body.status || "CONFIRMED",
      notes: body.notes || null,
    },
    include: { client: { select: { id: true, name: true } } },
  });
  return NextResponse.json(booking, { status: 201 });
}
