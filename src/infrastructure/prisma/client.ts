import "server-only";
import { PrismaClient } from "@prisma/client";

/**
 * Single Prisma client for the process. In dev, Next.js HMR re-evaluates
 * modules, so we stash the instance on `globalThis` to avoid exhausting the
 * connection pool with a new client per reload.
 *
 * Never import this outside `infrastructure/`. Feature/UI code goes through
 * repositories.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
