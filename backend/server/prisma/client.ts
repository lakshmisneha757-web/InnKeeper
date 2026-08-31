/// <reference types="node" />
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export function hasDatabaseConfig(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
