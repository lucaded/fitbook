import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/invites/accept?token=TOKEN — accept an invite after OAuth sign-in
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    // Not signed in — redirect to login with invite param
    return NextResponse.redirect(new URL(`/login?invite=${token}`, req.url));
  }

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { client: true },
  });

  if (!invite) {
    return NextResponse.redirect(new URL("/login?error=invite_not_found", req.url));
  }

  if (invite.usedAt) {
    return NextResponse.redirect(new URL("/login?error=invite_already_used", req.url));
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/login?error=invite_expired", req.url));
  }

  // Check if the client is already linked to a different user
  if (invite.client.userId && invite.client.userId !== session.user.id) {
    return NextResponse.redirect(new URL("/login?error=client_already_linked", req.url));
  }

  // Link the user to the client record and set role to CLIENT
  await prisma.$transaction([
    prisma.client.update({
      where: { id: invite.clientId },
      data: { userId: session.user.id },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { role: "CLIENT" },
    }),
    prisma.invite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.redirect(new URL("/client", req.url));
}
