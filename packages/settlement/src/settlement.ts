import { prisma } from "./reservation";


export async function settleTrade(
  buyUserId: number, sellUserId: number,
  baseAsset: string, quoteAsset: string,
  baseAmount: bigint, quoteAmount: bigint
) {
  return prisma.$transaction(async (tx) => {
    // 1. Determine lock order — always same global order regardless of buy/sell role
    // 2. Lock all four account rows (buyer's base + quote, seller's base + quote) via SELECT FOR UPDATE, in that order
    // 3. Apply the four balance updates described above
    const rows = await tx.$queryRaw<{ id: number; userId: number; asset: string; available: bigint; locked: bigint }[]>`
        SELECT id, "userId", asset, available, locked FROM "Account"
        WHERE ("userId" = ${buyUserId} AND asset IN (${baseAsset}, ${quoteAsset}))
            OR ("userId" = ${sellUserId} AND asset IN (${baseAsset}, ${quoteAsset}))
        ORDER BY id
        FOR UPDATE
    `;

    if (!rows) {
    throw new Error("Account not found");
    }

    const buyerQuote = rows.find(r => r.userId === buyUserId && r.asset === quoteAsset);
    const buyerBase = rows.find(r => r.userId === buyUserId && r.asset === baseAsset);
    const sellerBase = rows.find(r => r.userId === sellUserId && r.asset === baseAsset);
    const sellerQuote = rows.find(r => r.userId === sellUserId && r.asset === quoteAsset);

    if (!buyerQuote || !buyerBase || !sellerBase || !sellerQuote) {
        throw new Error("Account not found");
    }
    
    if(buyerQuote.locked < quoteAmount){
        throw new Error("Insufficient funds");
    }

    await tx.account.update({
        where: { id: buyerQuote.id },
            data: {
                locked: buyerQuote.locked - quoteAmount,
            },
    });


    await tx.account.update({
        where: { id: buyerBase.id },
            data: {
                available: buyerBase.available + baseAmount,
            },
    });

    if(sellerBase.locked < baseAmount){
        throw new Error("Insufficient funds");
    }

    await tx.account.update({
        where: { id: sellerBase.id },
            data: {
                locked: sellerBase.locked - baseAmount,
            },
    });


    await tx.account.update({
        where: { id: sellerQuote.id },
            data: {
                available: sellerQuote.available + quoteAmount,
            },
    });

  });
}