import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("[prisma] DATABASE_URL is not set");

  const adapter = new PrismaNeonHttp(url, {});
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    return createClient();
  }
  // In dev, reuse across hot-reload
  if (!global.__prisma) global.__prisma = createClient();
  return global.__prisma;
}

// Convenience re-export for existing code that imports { prisma }
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_t, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getPrisma() as any)[prop];
  },
});
