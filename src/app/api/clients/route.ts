import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/clients - list clients for the logged-in trainer
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 200 });

  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { trainerId: session.user.id },
        { trainerId: null }, // show legacy/example clients
      ],
    },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { programs: true, bookings: true } },
    },
  });
  return NextResponse.json(clients);
}

// POST /api/clients - create a client owned by the logged-in trainer
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const client = await prisma.client.create({
    data: {
      trainerId: session.user.id,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      height: body.height ? parseFloat(body.height) : null,
      weight: body.weight ? parseFloat(body.weight) : null,
      goals: body.goals || null,
      injuries: body.injuries || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(client, { status: 201 });
}
