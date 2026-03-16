import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/programs/:id
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const program = await prisma.clientProgram.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: {
          days: {
            orderBy: { dayNumber: "asc" },
            include: {
              exercises: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(program);
}

// PATCH /api/programs/:id - update program metadata or oneRMs
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const program = await prisma.clientProgram.update({
    where: { id: params.id },
    data: {
      name: body.name,
      oneRMs: body.oneRMs,
      status: body.status,
      progressionIncrement: body.progressionIncrement,
    },
  });
  return NextResponse.json(program);
}
