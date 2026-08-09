import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // The PWA plumbing has to be reachable without a session: the browser fetches
  // the manifest and the service worker before — and regardless of — login, and
  // redirecting them to /login silently breaks installability. None of these
  // carry user data.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|sw.js|icons/).*)",
  ],
};
