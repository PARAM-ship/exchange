import type { Order, Trade } from "./order";

export type EngineEvent = | { type: 'TradeExecuted'; trade: Trade }  | { type: 'OrderResting'; order: Order }  | { type: 'OrderFilled'; orderId: string } | { type: 'OrderCancelled'; order: Order };