// Prisma 7 configuration
// Local: SQLite (dev.db), Production: Supabase Postgres
import * as dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first, then .env as fallback
dotenv.config({ path: ".env.local" });
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  schema: isProduction ? "prisma/schema.prisma" : "prisma/schema.sqlite.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Production: Supabase Postgres
    // - POSTGRES_PRISMA_URL: pooled connection (port 6543) for app runtime
    // - POSTGRES_URL_NON_POOLING: session mode (port 5432) for migrations/schema push
    // Local: SQLite file
    url: isProduction
      ? process.env["POSTGRES_PRISMA_URL"]!
      : "file:./dev.db",
    directUrl: isProduction
      ? process.env["POSTGRES_URL_NON_POOLING"]
      : undefined,
  },
});
