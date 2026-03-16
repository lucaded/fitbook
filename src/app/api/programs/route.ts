import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/programs - create a program for a client
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clientId, name, daysPerWeek, weeks, progressionIncrement, oneRMs } = body;

  const program = await prisma.clientProgram.create({
    data: {
      clientId,
      name,
      daysPerWeek,
      progressionIncrement: progressionIncrement || 2.5,
      oneRMs: oneRMs || {},
      weeks: {
        create: Array.from({ length: weeks || 8 }, (_, w) => ({
          weekNumber: w + 1,
          days: {
            create: Array.from({ length: daysPerWeek }, (_, d) => ({
              dayNumber: d + 1,
            })),
          },
        })),
      },
    },
    include: {
      weeks: {
        include: {
          days: { include: { exercises: true } },
        },
      },
    },
  });

  return NextResponse.json(program, { status: 201 });
}
