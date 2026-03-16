import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Templates are stored as JSON in a simple key-value table
// For now, use localStorage on client side. This endpoint saves/loads from a
// ProgramTemplate model we'll add, or we can use the existing Program structure.

// GET /api/templates - list saved templates
export async function GET() {
  // Templates are programs with a special flag. For simplicity, we'll store
  // template data in a separate table. But since we don't have one yet,
  // let's return programs that can serve as templates.
  // We'll use a simple JSON file approach via the DB.

  // For now, return all programs grouped by name pattern
  const programs = await prisma.clientProgram.findMany({
    select: {
      id: true,
      name: true,
      daysPerWeek: true,
      client: { select: { name: true } },
      weeks: {
        take: 1,
        orderBy: { weekNumber: "asc" },
        include: {
          days: {
            orderBy: { dayNumber: "asc" },
            include: { exercises: { orderBy: { order: "asc" } } },
          },
        },
      },
      _count: { select: { weeks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(programs);
}

// POST /api/templates - create program from template
// Body: { clientId, name, weeks, daysPerWeek, sourceProgramId }
export async function POST(req: NextRequest) {
  const body = await req.json();

  const source = await prisma.clientProgram.findUnique({
    where: { id: body.sourceProgramId },
    include: {
      weeks: {
        take: 1,
        orderBy: { weekNumber: "asc" },
        include: {
          days: {
            orderBy: { dayNumber: "asc" },
            include: { exercises: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });

  if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });

  const templateWeek = source.weeks[0];
  if (!templateWeek) return NextResponse.json({ error: "Source has no weeks" }, { status: 400 });

  const program = await prisma.clientProgram.create({
    data: {
      clientId: body.clientId,
      name: body.name || `${source.name} (copy)`,
      daysPerWeek: source.daysPerWeek,
      progressionIncrement: source.progressionIncrement,
      oneRMs: body.oneRMs || source.oneRMs || {},
      weeks: {
        create: Array.from({ length: body.weeks || source.weeks.length }, (_, w) => ({
          weekNumber: w + 1,
          days: {
            create: templateWeek.days.map((srcDay) => ({
              dayNumber: srcDay.dayNumber,
              label: srcDay.label,
              exercises: {
                create: srcDay.exercises.map((srcEx) => ({
                  exerciseName: srcEx.exerciseName,
                  exerciseId: srcEx.exerciseId,
                  order: srcEx.order,
                  sets: srcEx.sets,
                  reps: srcEx.reps,
                  intensityPercent: srcEx.intensityPercent,
                  loadKg: srcEx.loadKg,
                  rpe: srcEx.rpe,
                })),
              },
            })),
          },
        })),
      },
    },
  });

  return NextResponse.json(program, { status: 201 });
}
