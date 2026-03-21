import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/client/me - returns the Client record for the logged-in client user
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
    include: {
      programs: {
        include: {
          weeks: {
            include: {
              days: {
                include: {
                  exercises: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      bookings: {
        where: {
          date: { gte: new Date() },
          status: { not: "CANCELLED" },
        },
        orderBy: { date: "asc" },
        take: 10,
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client profile not found" }, { status: 404 });
  }

  return NextResponse.json(client);
}
