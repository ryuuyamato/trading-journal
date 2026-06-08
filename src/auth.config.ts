import type { NextAuthConfig } from "next-auth";

// Edge-compatible config — no DB imports
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      const isAuthPage = pathname === "/login" || pathname === "/register";
      const isApiAuth  = pathname.startsWith("/api/auth");
      const isPendingPage = pathname === "/pending";

      if (isApiAuth) return true;

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      if (!isLoggedIn) return false;

      const { role, status } = auth.user;
      const isApproved = role === "ADMIN" || status === "APPROVED";

      if (!isApproved) {
        if (isPendingPage) return true;
        return Response.redirect(new URL("/pending", nextUrl));
      }

      if (isPendingPage) return Response.redirect(new URL("/dashboard", nextUrl));

      if (pathname.startsWith("/admin") && role !== "ADMIN") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.status = token.status;
      return session;
    },
  },
};
