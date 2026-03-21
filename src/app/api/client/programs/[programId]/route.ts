import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const GRACE_DAYS = 5;

export async function GET(
  _req: NextRequest,
  { params }: { params: { programId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find the client linked to this user
  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    select: { id: true, paidUntil: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Check subscription: if paidUntil is set and expired + grace period
  if (client.paidUntil) {
    const grace = new Date(client.paidUntil);
    grace.setDate(grace.getDate() + GRACE_DAYS);
    if (new Date() > grace) {
      return NextResponse.json(
        { error: "subscriptionRequired" },
        { status: 403 }
      );
    }
  }

  // Fetch program and verify it belongs to this client
  const program = await prisma.clientProgram.findUnique({
    where: { id: params.programId },
    include: {
      client: { select: { id: true, name: true } },
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

  if (!program) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (program.clientId !== client.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(program);
}
