import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";

// Auth.js v5. Phase 1 adds a DEV-ONLY Credentials provider: "sign in as" a seeded
// creator by handle (no password). Swap for real OAuth later without touching
// callers (they import { auth } from "@/lib/auth"). JWT sessions carry the
// creator's id/handle/role (see types/next-auth.d.ts).
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/signin" },
  providers: [
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
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.creatorId = user.creatorId ?? null;
        token.handle = user.handle ?? null;
        token.role = user.role ?? "CREATOR";
      }
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
