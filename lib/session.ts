import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** The signed-in creator's profile, or null. Used to gate /upload and /studio. */
export async function getCurrentCreator() {
  const session = await auth();
  const creatorId = session?.user?.creatorId;
  if (!creatorId) return null;
  return prisma.creatorProfile.findUnique({ where: { id: creatorId } });
}

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}
