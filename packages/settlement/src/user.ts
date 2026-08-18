// import { PrismaPg } from "@prisma/adapter-pg";
// import { PrismaClient } from "../generated/prisma/client";

import { prisma } from "./reservation";

// const connectionString = `${process.env.DATABASE_URL}`;

// const adapter = new PrismaPg({ connectionString });

// const prisma = new PrismaClient({
//     adapter
// });

export async function createUser(username: string, email: string, passwordHash: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { username, email, password: passwordHash },
    });

    await tx.account.createMany({
      data: [
        { userId: user.id, asset: "BTC", available: 0n, locked: 0n },
        { userId: user.id, asset: "USDT", available: 0n, locked: 0n },
      ],
    });

    return user;
  });
}

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}