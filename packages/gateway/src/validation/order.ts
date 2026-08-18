import type { Order, Side } from "../../../shared-types/src";
import {  parsePrice, parseQty } from "../../../shared-types/src"; // whatever your parse fns are actually named

export function parseOrderPayload(body: unknown,userId:number): Order | null {
  if (typeof body !== 'object' || body === null) return null;

  const { symbol, side, price, quantity } = body as Record<string, unknown>;

  if (typeof symbol !== 'string' || symbol.length === 0) return null;
  if (side !== 'buy' && side !== 'sell') return null;
  if(typeof price !== 'string' || typeof quantity !== 'string')return null;
  // your turn: validate + convert price and quantity using your FixedPrice/FixedQty parsers
  // return null if either fails to parse (e.g. negative, zero, non-numeric)
  let parsedPrice: bigint;
  let parsedQuantity: bigint;
  try {
    parsedPrice = parsePrice(price);
    parsedQuantity = parseQty(quantity);
  } catch {
    return null; // malformed decimal string (e.g. "banana", "1.2.3")
  }

  if (parsedPrice <= 0n || parsedQuantity <= 0n) return null;

  const order: Order = {
    id: crypto.randomUUID(),
    userId,
    symbol,
    side: side as Side,
    price: parsedPrice,
    quantity: parsedQuantity,
    remainingQuantity: parsedQuantity,
    status: 'open', // check this matches your actual OrderStatus values
    createdAt: Date.now(),
  };

  return order;
}