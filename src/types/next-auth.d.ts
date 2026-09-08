import "next-auth";
import "next-auth/jwt";

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      mobile?: string | null;
      role?: string;
      createdAt?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    mobile?: string | null;
    role?: string;
    createdAt?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    mobile?: string | null;
    role?: string;
    createdAt?: string;
  }
}