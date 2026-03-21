import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/client/bookings - returns all bookings for the logged-in client
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if ((session.user as any).role !== "CLIENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    select: { id: true, paidUntil: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client profile not found" }, { status: 404 });
  }

  const bookings = await prisma.booking.findMany({
    where: { clientId: client.id },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ bookings, paidUntil: client.paidUntil });
}

// POST /api/client/bookings - create a booking for the logged-in client
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if ((session.user as any).role !== "CLIENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    select: { id: true, paidUntil: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client profile not found" }, { status: 404 });
  }

  // Verify subscription: paidUntil must be valid (+ 5 day grace period)
  if (client.paidUntil) {
    const grace = new Date(client.paidUntil);
    grace.setDate(grace.getDate() + 5);
    if (new Date() > grace) {
      return NextResponse.json(
        { error: "Subscription expired. Please contact your trainer." },
        { status: 403 }
      );
    }
  }

  const body = await req.json();

  const booking = await prisma.booking.create({
    data: {
      clientId: client.id,
      date: new Date(`${body.date}T00:00:00Z`),
      startTime: new Date(`${body.date}T${body.startTime}:00Z`),
      endTime: new Date(`${body.date}T${body.endTime}:00Z`),
      type: body.type || "PERSONAL",
      status: "PENDING",
      notes: body.notes || null,
    },
  });

  return NextResponse.json(booking, { status: 201 });
}
