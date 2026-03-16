import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/clients - list all clients
export async function GET() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { programs: true, bookings: true } },
    },
  });
  return NextResponse.json(clients);
}

// POST /api/clients - create a client
export async function POST(req: NextRequest) {
  const body = await req.json();
  const client = await prisma.client.create({
    data: {
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
