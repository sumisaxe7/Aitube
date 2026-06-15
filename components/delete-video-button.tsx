"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function DeleteVideoButton({
  videoId,
  label,
}: {
  videoId: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this video? This action cannot be undone.")) return;

    setPending(true);
    const res = await fetch(`/api/uploads/${videoId}`, { method: "DELETE" });
    setPending(false);

    if (res.ok) {
      router.replace("/studio");
      return;
    }

    alert("Could not delete this video right now.");
  }

  return (
    <Button variant="destructive" size="sm" onClick={onDelete} disabled={pending}>
      {pending ? "Deleting…" : label}
    </Button>
  );
}
