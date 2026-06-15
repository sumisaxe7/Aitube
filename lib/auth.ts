import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";

// Auth.js v5. Phase 1 adds a DEV-ONLY Credentials provider: "sign in as" a seeded
// creator by handle (no password). Swap for real OAuth later without touching
// callers (they import { auth } from "@/lib/auth"). JWT sessions carry the
// creator's id/handle/role (see types/next-auth.d.ts).
const providers: Provider[] = [
  Credentials({
    id: "dev-creator",
    name: "Dev Creator",
    credentials: { handle: { label: "Handle", type: "text" } },
    async authorize(credentials) {
      const handle = String(credentials?.handle ?? "").trim();
      if (!handle) return null;
      const profile = await prisma.creatorProfile.findUnique({
        where: { handle },
        include: { user: true },
      });
      if (!profile) return null;
      return {
        id: profile.user.id,
        name: profile.displayName,
        email: profile.user.email ?? undefined,
        creatorId: profile.id,
        handle: profile.handle,
        role: profile.user.role,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/signin" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (!user) return token;

      token.userId = user.id;
      token.role = user.role ?? "CREATOR";

      let creatorProfile = await prisma.creatorProfile.findUnique({
        where: { userId: user.id },
        select: { id: true, handle: true },
      });

      if (!creatorProfile && user.email) {
        creatorProfile = await prisma.creatorProfile.findFirst({
          where: { user: { email: user.email } },
          select: { id: true, handle: true },
        });
      }

      if (!creatorProfile) {
        const baseHandle = (user.name ?? user.email?.split("@")[0] ?? "creator")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        const suggestedHandle = baseHandle || `creator-${Math.random().toString(36).slice(2, 8)}`;
        let handle = suggestedHandle;
        let suffix = 1;

        while (await prisma.creatorProfile.findUnique({ where: { handle } })) {
          handle = `${suggestedHandle}-${suffix++}`;
        }

        creatorProfile = await prisma.creatorProfile.create({
          data: {
            userId: user.id,
            handle,
            displayName: user.name ?? handle,
            bio: "Google sign-in creator profile",
          },
          select: { id: true, handle: true },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { role: "CREATOR" },
        });
      }

      token.creatorId = creatorProfile.id;
      token.handle = creatorProfile.handle;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string | undefined) ?? "";
        session.user.creatorId =
          (token.creatorId as string | null | undefined) ?? null;
        session.user.handle =
          (token.handle as string | null | undefined) ?? null;
        session.user.role = (token.role as Role | undefined) ?? "VIEWER";
      }
      return session;
    },
  },
});
