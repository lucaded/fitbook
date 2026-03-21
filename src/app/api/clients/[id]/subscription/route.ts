import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/clients/:id/subscription - update paidUntil on a Client record
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Require TRAINER role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "TRAINER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify the trainer owns this client
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: { trainerId: true },
  });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  if (client.trainerId !== null && client.trainerId !== session.user.id) {
    return NextResponse.json({ error: "Not your client" }, { status: 403 });
  }

  const body = await req.json();
  const paidUntil = body.paidUntil ? new Date(body.paidUntil) : null;

  const updated = await prisma.client.update({
    where: { id: params.id },
    data: { paidUntil },
    select: { id: true, paidUntil: true },
  });

  return NextResponse.json(updated);
}
