import { prisma } from "@/lib/db";
import { computeSplit, distributeByShares } from "@/lib/revenue";

export interface CollaboratorShare {
  creatorId: string;
  sharePct: number;
}

export interface CollabAllocation {
  creatorId: string;
  grossCents: number;
  platformFeeCents: number;
  netCents: number;
}

/**
 * Split a gross amount across co-creators by share %. REUSES the Phase 3
 * functions (no duplicated math): distributeByShares splits the gross with no
 * rounding leakage, then computeSplit derives each row's platform fee + net so
 * every ledger row is internally consistent (net + fee === gross).
 */
export function splitCollaborationGross(
  grossCents: number,
  collaborators: CollaboratorShare[],
): CollabAllocation[] {
  const shares = collaborators.map((c) => ({ id: c.creatorId, pct: c.sharePct }));
  return distributeByShares(grossCents, shares).map((a) => ({
    creatorId: a.id,
    ...computeSplit(a.amountCents),
  }));
}

export async function createCollaboration(
  ownerId: string,
  title: string,
  videoId?: string | null,
) {
  return prisma.collaboration.create({
    data: {
      title,
      ownerId,
      videoId: videoId ?? null,
      collaborators: {
        create: {
          creatorId: ownerId,
          role: "OWNER",
          status: "ACCEPTED",
          sharePct: 100,
        },
      },
    },
  });
}

export async function inviteCollaborator(
  collaborationId: string,
  ownerId: string,
  handle: string,
) {
  const collab = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
  });
  if (!collab || collab.ownerId !== ownerId) throw new Error("not found");
  const invitee = await prisma.creatorProfile.findUnique({ where: { handle } });
  if (!invitee) throw new Error("creator not found");
  return prisma.collaborator.upsert({
    where: {
      collaborationId_creatorId: { collaborationId, creatorId: invitee.id },
    },
    create: {
      collaborationId,
      creatorId: invitee.id,
      role: "COCREATOR",
      status: "INVITED",
      sharePct: 0,
    },
    update: {},
  });
}

export async function respondToInvite(
  collaborationId: string,
  creatorId: string,
  accept: boolean,
) {
  const member = await prisma.collaborator.findUnique({
    where: { collaborationId_creatorId: { collaborationId, creatorId } },
  });
  if (!member) throw new Error("no invite");
  return prisma.collaborator.update({
    where: { id: member.id },
    data: { status: accept ? "ACCEPTED" : "DECLINED" },
  });
}

export async function setShares(
  collaborationId: string,
  ownerId: string,
  shares: CollaboratorShare[],
) {
  const collab = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
  });
  if (!collab || collab.ownerId !== ownerId) throw new Error("not found");
  const total = shares.reduce((s, x) => s + x.sharePct, 0);
  if (total !== 100) throw new Error("shares must sum to 100");
  await prisma.$transaction(
    shares.map((s) =>
      prisma.collaborator.updateMany({
        where: { collaborationId, creatorId: s.creatorId },
        data: { sharePct: s.sharePct },
      }),
    ),
  );
}

export async function addNote(
  collaborationId: string,
  authorId: string,
  body: string,
) {
  const member = await prisma.collaborator.findUnique({
    where: { collaborationId_creatorId: { collaborationId, creatorId: authorId } },
  });
  if (!member) throw new Error("not a member");
  return prisma.projectNote.create({
    data: { collaborationId, authorId, body },
  });
}

/** Distribute a gross amount to the accepted co-creators as ledger rows. */
export async function distributeEarnings(
  collaborationId: string,
  ownerId: string,
  grossCents: number,
) {
  const collab = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    include: { collaborators: true },
  });
  if (!collab || collab.ownerId !== ownerId) throw new Error("not found");
  const accepted = collab.collaborators.filter((c) => c.status === "ACCEPTED");
  const allocations = splitCollaborationGross(
    grossCents,
    accepted.map((c) => ({ creatorId: c.creatorId, sharePct: c.sharePct })),
  );
  const splitGroupId = `${collaborationId}:${Date.now()}`;
  await prisma.$transaction(
    allocations.map((a) =>
      prisma.ledgerEntry.create({
        data: {
          type: "COCREATOR_SHARE",
          creatorId: a.creatorId,
          grossCents: a.grossCents,
          platformFeeCents: a.platformFeeCents,
          netCents: a.netCents,
          splitGroupId,
          note: "Co-creator share",
        },
      }),
    ),
  );
  return { splitGroupId, allocations };
}
