import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var __prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("[prisma] DATABASE_URL is not set");

  const adapter = new PrismaPg({
    connectionString: url,
    // One connection per function instance. Supavisor does the real pooling;
    // node-postgres defaults to a pool of 10, which would let a handful of
    // concurrent instances consume the project's entire pooler allowance.
    max: 1,
  });

  return new PrismaClient({ adapter });
}

// A single client — and therefore a single connection pool — per process.
//
// This must not be per-request. The previous Neon HTTP adapter was stateless,
// so building a client per call cost nothing; a TCP pool is not, and creating
// one per request would open connections faster than they are released.
function getClient(): PrismaClient {
  if (!global.__prisma) global.__prisma = createClient();
  return global.__prisma;
}

export function getPrisma(): PrismaClient {
  return getClient();
}

// Convenience re-export for existing code that imports { prisma }
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_t, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getClient() as any)[prop];
  },
});
