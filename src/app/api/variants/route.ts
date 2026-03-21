import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/variants?exerciseId=xxx or ?exerciseName=xxx
// Returns distinct variants used by this trainer for a given exercise, ordered by frequency
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const exerciseId = searchParams.get("exerciseId");
  const exerciseName = searchParams.get("exerciseName");

  if (!exerciseId && !exerciseName) {
    return NextResponse.json({ error: "exerciseId or exerciseName required" }, { status: 400 });
  }

  const trainerId = session.user.id;

  // Find all variants for exercises belonging to this trainer's clients' programs
  const where: any = {
    variant: { not: null },
    day: {
      week: {
        program: {
          client: {
            trainerId,
          },
        },
      },
    },
  };

  if (exerciseId) {
    where.exerciseId = exerciseId;
  } else if (exerciseName) {
    where.exerciseName = exerciseName;
  }

  const results = await prisma.programExercise.groupBy({
    by: ["variant"],
    where,
    _count: { variant: true },
    orderBy: { _count: { variant: "desc" } },
  });

  const variants = results
    .filter((r) => r.variant)
    .map((r) => r.variant as string);

  return NextResponse.json(variants);
}
