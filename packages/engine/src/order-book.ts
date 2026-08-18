import type { Side, Order, Trade } from "../../shared-types/src";

export interface SubmitResult {
    trades: Trade[];
    restingOrder?: Order;
    incomingOrderStatus: 'filled' | 'partiallyFilled' | 'resting' | 'cancelled';
}

export class OrderBook {
    public bids: Order[] = []; // wants to buy
    public asks: Order[] = []; // willing to pay/sell
    public nextOrderId = 0;
    public lastAppliedSeq = 0;

    constructor(public readonly symbol: string){}

    submit(incoming: Order): SubmitResult {
        
        this.nextOrderId += 1;

        const trades: Trade[] = [];
        const originalQuantity = incoming.remainingQuantity;

        while(true){
            const resting = this.oppositeSide(incoming.side)[0];
            const canMatch = resting && (incoming.side === "buy" ? incoming.price >= resting.price : incoming.price <= resting?.price);
            if(!canMatch){
                // this.insertSorted(this.oppositeSide(incoming.side) === this.bids ? this.asks : this.bids, incoming, incoming.side);
                break;
            }
            const tradeQty = incoming.remainingQuantity < resting.remainingQuantity ? incoming.remainingQuantity : resting?.remainingQuantity;
            
            incoming.remainingQuantity -= tradeQty;
            resting.remainingQuantity -= tradeQty;

            const trade: Trade = {
                id:crypto.randomUUID(),
                symbol:incoming?.symbol,
                price: resting?.price,
                quantity:tradeQty,
                buyOrderId: incoming.side === "buy" ? incoming.id : resting?.id,
                sellOrderId:incoming.side === "sell" ? incoming.id : resting?.id,
                buyUserId: incoming.side === "buy" ? incoming.userId : resting.userId,
                sellUserId: incoming.side === "sell" ? incoming.userId : resting.userId,
                executedAt: Date.now()
            }
            trades.push(trade);

            if(resting.remainingQuantity === 0n)this.oppositeSide(incoming.side).splice(0,1);
            if(!incoming.remainingQuantity)break;
        }
        const result:SubmitResult = { trades };
        if(incoming.remainingQuantity){
            this.insertSorted(incoming.side === "buy" ? this.bids : this.asks ,incoming,incoming.side);
            result.restingOrder = incoming;
        }
        
        if (incoming.remainingQuantity === 0n) {
            result.incomingOrderStatus = 'filled';
        } else if (incoming.remainingQuantity < originalQuantity) {
            result.incomingOrderStatus = 'partiallyFilled';
        } else {
            result.incomingOrderStatus = 'resting';
        }
        
        return result;
    }

    cancel(orderId: string): Order | null {
    for (const side of [this.bids, this.asks]) {
        const idx = side.findIndex(o => o.id === orderId);
        if (idx !== -1) {
            const [removed] = side.splice(idx, 1);
            removed.status = 'cancelled';
            return removed;
        }
    }
    return null; // order not found (already filled/cancelled/never existed)
}

    bestBid(): Order | undefined {
        return this.bids[0];
    }

    bestAsk(): Order | undefined {
        return this.asks[0];
    }

    serialize() {
        return {
            bids: this.bids,
            asks: this.asks,
            nextOrderId: this.nextOrderId
        }
    }

    snapshot(){
        return {
            bids: this.bids.map(o => ({price: o.price, qty: o.remainingQuantity})),
            asks: this.asks.map(o => ({price: o.price, qty: o.remainingQuantity}))
        }
    }

    private oppositeSide(side: Side): Order[] {
        return side === "buy" ? this.asks : this.bids;
    }

    get(orderId: string): Order | null {
    for (const side of [this.bids, this.asks]) {
        const order = side.find(o => o.id === orderId);
        if (order) return order;
    }
    return null;
}


    private insertSorted(list: Order[],order: Order, side: Side) {
        for(let i = 0;i < list.length;i++){
            if(side === 'buy' && order.price > list[i]?.price){
                list.splice(i,0,order);
                return;
            }
            if(side === 'sell' && order.price < list[i]?.price){
                list.splice(i,0,order);
                return;
            }
        }
        list.push(order);
    }
}