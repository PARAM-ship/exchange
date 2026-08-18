import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(moduleDir, "../.env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    `DATABASE_URL is not set. Configure it in the environment or packages/settlement/.env before starting the gateway.`,
  );
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({
    adapter
});

export async function reserveFunds(userId: number, asset: string, amount: bigint) {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: number; available: bigint; locked: bigint }[]>`
      SELECT id, available, locked FROM "Account"
      WHERE "userId" = ${userId} AND "asset" = ${asset}
      FOR UPDATE
    `;

    const account = rows[0];
    if (!account) {
      throw new Error("Account not found");
    }

    if (account.available < amount) {
      throw new Error("Insufficient funds");
    }

    await tx.account.update({
      where: { id: account.id },
      data: {
        available: account.available - amount,
        locked: account.locked + amount,
      },
    });

    return account.id;
  });
}

export async function releaseFunds(userId: number, asset: string, amount: bigint) {
  return prisma.$transaction(async (tx) => {
    // same SELECT ... FOR UPDATE pattern as reserveFunds
    // then: locked -= amount, available += amount
    const rows = await tx.$queryRaw<{ id: number; available: bigint; locked: bigint }[]>`
      SELECT id, available, locked FROM "Account"
      WHERE "userId" = ${userId} AND "asset" = ${asset}
      FOR UPDATE
    `;

    const account = rows[0];
    if (!account) {
      throw new Error("Account not found");
    }

    if (account.locked < amount) {
      throw new Error("Insufficient locked funds to release.");
    }

    await tx.account.update({
      where: { id: account.id },
      data: {
        available: account.available + amount,
        locked: account.locked - amount,
      },
    });

    return account.id;
  });
}