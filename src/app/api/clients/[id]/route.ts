import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper: check the client belongs to the logged-in trainer (or is a legacy client)
async function getOwnedClient(clientId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { trainerId: true } });
  if (!client) return null;
  if (client.trainerId !== null && client.trainerId !== session.user.id) return null;
  return session.user.id;
}

// GET /api/clients/:id
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getOwnedClient(params.id);
  if (!userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      programs: {
        orderBy: { createdAt: "desc" },
        include: {
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
      },
      prs: { orderBy: { date: "desc" } },
      bookings: { orderBy: { date: "desc" }, take: 10 },
    },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

// PATCH /api/clients/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getOwnedClient(params.id);
  if (!userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const client = await prisma.client.update({
    where: { id: params.id },
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      height: body.height != null ? parseFloat(body.height) : undefined,
      weight: body.weight != null ? parseFloat(body.weight) : undefined,
      goals: body.goals,
      injuries: body.injuries,
      notes: body.notes,
      active: body.active,
    },
  });
  return NextResponse.json(client);
}

// DELETE /api/clients/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getOwnedClient(params.id);
  if (!userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.client.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
