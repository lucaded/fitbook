import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/invites — generate an invite link for a client
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "TRAINER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { clientId } = body;

  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  // Verify the trainer owns this client
  const client = await prisma.client.findFirst({
    where: { id: clientId, trainerId: session.user.id },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Check if client is already linked to a user
  if (client.userId) {
    return NextResponse.json({ error: "Client already has a linked account" }, { status: 400 });
  }

  // Create invite with 7-day expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.invite.create({
    data: {
      trainerId: session.user.id,
      clientId,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;
  const url = `${baseUrl}/invite/${invite.token}`;

  return NextResponse.json({ token: invite.token, url }, { status: 201 });
}
