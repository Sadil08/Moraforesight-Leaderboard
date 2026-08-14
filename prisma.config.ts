import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma's CLI doesn't follow Next.js's .env.local convention on its own —
// `vercel env pull` writes Neon's connection strings there.
config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // DDL/migrations use Neon's direct (unpooled) connection — see plan.md §3.
    // The Vercel<->Neon Marketplace integration names this DATABASE_URL_UNPOOLED,
    // not DIRECT_URL as plan.md's env var table assumed.
    url: process.env["DATABASE_URL_UNPOOLED"],
  },
});
