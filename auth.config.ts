import NextAuth from "next-auth";
import type { NextAuthConfig, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

// Edge/proxy-safe subset: no providers, no Prisma, no bcryptjs. Imported by both
// auth.ts (full config) and proxy.ts (route gating only) — see plan.md §2/§4.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role;

      if (pathname.startsWith("/admin")) return role === "ADMIN";
      if (pathname.startsWith("/coordinator")) return role === "ADMIN" || role === "COORDINATOR";
      return true;
    },
    // Pure token/session shaping — no Prisma or bcryptjs involved, so this is
    // still safe to share with proxy.ts's provider-less instance below. Without
    // this here, proxyAuth's authorized() callback above would see auth.user.role
    // as undefined (the default session() callback doesn't expose custom JWT
    // claims), and reject every logged-in user from /admin and /coordinator.
    jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }: { session: Session; token: JWT }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;

// A second, provider-less NextAuth instance used only for route gating — this is
// what proxy.ts imports, so Prisma/bcryptjs (pulled in by auth.ts's Credentials
// provider) never end up in the proxy bundle.
export const { auth: proxyAuth } = NextAuth(authConfig);
