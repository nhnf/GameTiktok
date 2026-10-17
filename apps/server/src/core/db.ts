import { PrismaClient } from "@prisma/client";

// Single shared Prisma client for the process (PRD 47: server-authoritative,
// no per-request client churn).
export const prisma = new PrismaClient();
