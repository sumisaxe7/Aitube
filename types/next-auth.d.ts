import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      creatorId: string | null;
      handle: string | null;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    creatorId?: string | null;
    handle?: string | null;
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    creatorId?: string | null;
    handle?: string | null;
    role?: Role;
  }
}
