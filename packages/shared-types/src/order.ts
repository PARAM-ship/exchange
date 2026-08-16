import type { FixedPrice,FixedQty } from "./money";

export type Side = "buy" | "sell";

export type OrderStatus = "open" | "filled" | "partially_filled" | "cancelled";

export interface Order {
    id: string;
    symbol: string;
    side: Side;
    price: FixedPrice;
    quantity: FixedQty;
    remainingQuantity: FixedQty;
    status: OrderStatus;
    createdAt: number;
}

export interface Trade {
    id: string;
    symbol: string;
    price: FixedPrice;
    quantity: FixedQty;
    buyOrderId: string;
    sellOrderId: string;
    executedAt: number;
}

export function createOrder(input: {
    id: string;
    symbol: string;
    side: Side;
    price: FixedPrice;
    quantity: FixedQty;
}): Order {
    return {
        ...input,
        remainingQuantity: input.quantity,
        status: "open",
        createdAt: Date.now(),
    };
}