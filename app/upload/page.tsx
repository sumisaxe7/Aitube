import { redirect } from "next/navigation";

import { getCurrentCreator } from "@/lib/session";
import { UploadClient } from "@/components/upload-client";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const creator = await getCurrentCreator();
  if (!creator) redirect("/signin");
  return <UploadClient creatorName={creator.displayName} />;
}
