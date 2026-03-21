import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import InviteClient from "./InviteClient";

interface Props {
  params: { token: string };
}

export default async function InvitePage({ params }: Props) {
  const { token } = params;

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: {
      trainer: { select: { name: true, image: true } },
      client: { select: { name: true, userId: true } },
    },
  });

  if (!invite) {
    return notFound();
  }

  const expired = invite.expiresAt < new Date();
  const alreadyUsed = !!invite.usedAt;
  const alreadyLinked = !!invite.client.userId;

  return (
    <InviteClient
      token={token}
      trainerName={invite.trainer.name || "Your Trainer"}
      trainerImage={invite.trainer.image || null}
      clientName={invite.client.name}
      expired={expired}
      alreadyUsed={alreadyUsed}
      alreadyLinked={alreadyLinked}
    />
  );
}
