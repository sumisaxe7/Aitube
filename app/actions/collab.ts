"use server";

import { revalidatePath } from "next/cache";

import { getCurrentCreator } from "@/lib/session";
import * as collab from "@/lib/collaboration";

export async function createCollaborationAction(formData: FormData) {
  const creator = await getCurrentCreator();
  if (!creator) return;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  await collab.createCollaboration(creator.id, title);
  revalidatePath("/studio/collaborations");
}

export async function inviteAction(formData: FormData) {
  const creator = await getCurrentCreator();
  if (!creator) return;
  const id = String(formData.get("collaborationId"));
  const handle = String(formData.get("handle") ?? "").trim();
  try {
    await collab.inviteCollaborator(id, creator.id, handle);
  } catch {
    /* ignore — invalid handle / not owner */
  }
  revalidatePath(`/studio/collaborations/${id}`);
}

export async function respondAction(formData: FormData) {
  const creator = await getCurrentCreator();
  if (!creator) return;
  const id = String(formData.get("collaborationId"));
  const accept = String(formData.get("accept")) === "true";
  try {
    await collab.respondToInvite(id, creator.id, accept);
  } catch {
    /* ignore */
  }
  revalidatePath(`/studio/collaborations/${id}`);
}

export async function setSharesAction(formData: FormData) {
  const creator = await getCurrentCreator();
  if (!creator) return;
  const id = String(formData.get("collaborationId"));
  const shares: { creatorId: string; sharePct: number }[] = [];
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("share_")) {
      shares.push({ creatorId: k.slice("share_".length), sharePct: Number(v) });
    }
  }
  try {
    await collab.setShares(id, creator.id, shares);
  } catch {
    /* ignore — must sum to 100 / not owner */
  }
  revalidatePath(`/studio/collaborations/${id}`);
}

export async function addNoteAction(formData: FormData) {
  const creator = await getCurrentCreator();
  if (!creator) return;
  const id = String(formData.get("collaborationId"));
  const body = String(formData.get("body") ?? "").trim();
  if (body) {
    try {
      await collab.addNote(id, creator.id, body);
    } catch {
      /* ignore — not a member */
    }
  }
  revalidatePath(`/studio/collaborations/${id}`);
}

export async function distributeAction(formData: FormData) {
  const creator = await getCurrentCreator();
  if (!creator) return;
  const id = String(formData.get("collaborationId"));
  const grossCents = Math.round(parseFloat(String(formData.get("amount") ?? "0")) * 100);
  if (grossCents > 0) {
    try {
      await collab.distributeEarnings(id, creator.id, grossCents);
    } catch {
      /* ignore — shares invalid / not owner */
    }
  }
  revalidatePath(`/studio/collaborations/${id}`);
}
