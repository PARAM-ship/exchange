import { formatPrice, formatQty, type Order, type Trade } from './index'; // adjust import path to match your setup

export function serializeOrder(o: Order) {
    return {
        ...o,
        price: o.price.toString(),
        quantity: o.quantity.toString(),
        remainingQuantity: o.remainingQuantity.toString(),
    };
}

export function deserializeOrder(raw: any): Order {
    return {
        ...raw,
        price: BigInt(raw.price),
        quantity: BigInt(raw.quantity),
        remainingQuantity: BigInt(raw.remainingQuantity),
    };
}

export function serializeTrade(t: Trade) {
    return {
        ...t,
        price: t.price.toString(),
        quantity: t.quantity.toString(),
    };
}

export function deserializeTrade(raw: any): Trade {
    return {
        ...raw,
        price: BigInt(raw.price),
        quantity: BigInt(raw.quantity),
    };
}

// shared-types/src/serialize.ts — add alongside existing serializeOrder/serializeTrade

export function toClientTrade(t: Trade) {
    return {
        ...t,
        price: formatPrice(t.price),
        quantity: formatQty(t.quantity),
    };
}

export function toClientOrder(o: Order) {
    return {
        ...o,
        price: formatPrice(o.price),
        quantity: formatQty(o.quantity),
        remainingQuantity: formatQty(o.remainingQuantity),
    };
}