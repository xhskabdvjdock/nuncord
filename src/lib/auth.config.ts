import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const isAuthPage =
        nextUrl.pathname.startsWith("/sign-in") ||
        nextUrl.pathname.startsWith("/sign-up");

      const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
      const isApiRoute = nextUrl.pathname.startsWith("/api");

      if (isApiAuthRoute || isApiRoute) {
        return true;
      }

      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
