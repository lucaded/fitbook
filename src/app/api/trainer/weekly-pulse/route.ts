import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trainerId = session.user.id;

  // Calculate Monday–Sunday of the current week
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Bookings this week for trainer's clients
  const bookings = await prisma.booking.findMany({
    where: {
      client: {
        trainerId,
      },
      date: {
        gte: monday,
        lte: sunday,
      },
    },
    select: { date: true, status: true },
  });

  const sessionsBooked = bookings.length;
  const sessionsCompleted = bookings.filter(
    (b) => b.date <= now || b.status === "COMPLETED"
  ).length;

  // Active programs count
  const programsActive = await prisma.clientProgram.count({
    where: {
      status: "ACTIVE",
      client: { trainerId },
    },
  });

  // Exercises with actuals logged across active programs
  const exercisesLogged = await prisma.programExercise.count({
    where: {
      actualSets: { not: null },
      day: {
        week: {
          program: {
            status: "ACTIVE",
            client: { trainerId },
          },
        },
      },
    },
  });

  return NextResponse.json({
    sessionsBooked,
    sessionsCompleted,
    programsActive,
    exercisesLogged,
  });
}
