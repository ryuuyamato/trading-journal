import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations and `db push` go through the direct connection (port 5432).
    // Supavisor's transaction-mode pooler cannot run DDL or hold the session
    // state migrations need, so pointing this at DATABASE_URL fails.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
});
