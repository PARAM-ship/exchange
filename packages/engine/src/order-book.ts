import type { Side, Order, Trade } from "../../shared-types/src";


export class OrderBook {
    private bids: Order[] = []; // wants to buy
    private asks: Order[] = []; // willing to pay/sell

    constructor(public readonly symbol: string){}

    submit(incoming: Order): Trade[] {
        
        const trades: Trade[] = [];

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
                executedAt: Date.now()
            }
            trades.push(trade);

            if(resting.remainingQuantity === 0n)this.oppositeSide(incoming.side).splice(0,1);
            if(!incoming.remainingQuantity)break;
        }
        if(incoming.remainingQuantity)this.insertSorted(incoming.side === "buy" ? this.bids : this.asks ,incoming,incoming.side)
        return trades;
    }

    bestBid(): Order | undefined {
        return this.bids[0];
    }

    bestAsk(): Order | undefined {
        return this.asks[0];
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