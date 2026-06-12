import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { signInAsCreator } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_LOCALE, getTranslator } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const t = getTranslator(DEFAULT_LOCALE);
  const session = await auth();
  if (session?.user?.creatorId) redirect("/studio");

  const creators = await prisma.creatorProfile.findMany({
    orderBy: { displayName: "asc" },
  });

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>{t("signin.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            {t("signin.subtitle")}
          </p>
          <form action={signInAsCreator} className="space-y-3">
            <select
              name="handle"
              defaultValue={creators[0]?.handle}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {creators.map((c) => (
                <option key={c.handle} value={c.handle}>
                  {c.displayName} (@{c.handle})
                </option>
              ))}
            </select>
            <Button type="submit" className="w-full">
              {t("signin.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
