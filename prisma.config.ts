// Prisma 7 configuration
// Local: SQLite (dev.db), Production: Supabase Postgres
import * as dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first, then .env as fallback
dotenv.config({ path: ".env.local" });
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// Get the database URL, with fallback for generate-only operations
function getDatabaseUrl(): string {
  if (isProduction) {
    // In production, use Supabase Postgres
    // During prisma generate, the URL might not be needed, so provide a placeholder
    return process.env["POSTGRES_PRISMA_URL"] || "postgresql://placeholder:placeholder@localhost:5432/placeholder";
  }
  return "file:./dev.db";
}

export default defineConfig({
  schema: isProduction ? "prisma/schema.prisma" : "prisma/schema.sqlite.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Production: Supabase Postgres (pooled connection)
    // Local: SQLite file
    url: getDatabaseUrl(),
  },
});
