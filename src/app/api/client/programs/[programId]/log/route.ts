import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { programId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { exerciseId, actualSets, actualReps, actualLoadKg, actualRpe, clientNotes, repDurationSec } = body;

  if (!exerciseId) {
    return NextResponse.json({ error: "exerciseId required" }, { status: 400 });
  }

  // Find the client linked to this user
  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Verify the exercise belongs to a program of this client
  const exercise = await prisma.programExercise.findUnique({
    where: { id: exerciseId },
    include: {
      day: {
        include: {
          week: {
            include: {
              program: { select: { id: true, clientId: true } },
            },
          },
        },
      },
    },
  });

  if (!exercise) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  if (exercise.day.week.program.clientId !== client.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (exercise.day.week.program.id !== params.programId) {
    return NextResponse.json({ error: "Exercise does not belong to this program" }, { status: 400 });
  }

  // Build update data — only include fields that were provided
  const data: Record<string, unknown> = {};
  if (actualSets !== undefined) data.actualSets = actualSets === "" || actualSets === null ? null : Number(actualSets);
  if (actualReps !== undefined) data.actualReps = actualReps === "" || actualReps === null ? null : Number(actualReps);
  if (actualLoadKg !== undefined) data.actualLoadKg = actualLoadKg === "" || actualLoadKg === null ? null : Number(actualLoadKg);
  if (actualRpe !== undefined) data.actualRpe = actualRpe === "" || actualRpe === null ? null : Number(actualRpe);
  if (clientNotes !== undefined) data.clientNotes = clientNotes || null;
  if (repDurationSec !== undefined) data.repDurationSec = repDurationSec === "" || repDurationSec === null ? null : Number(repDurationSec);

  const updated = await prisma.programExercise.update({
    where: { id: exerciseId },
    data,
  });

  return NextResponse.json(updated);
}
