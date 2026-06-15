"use server";

import { signIn, signOut } from "@/lib/auth";

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/studio" });
}

export async function signInAsCreator(formData: FormData) {
  const handle = String(formData.get("handle") ?? "").trim();
  if (!handle) return;
  await signIn("dev-creator", { handle, redirectTo: "/studio" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
