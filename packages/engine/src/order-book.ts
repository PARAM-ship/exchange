import type { Side, Order, Trade } from "../../shared-types/src";


export class OrderBook {
    private bids: Order[] = []; // wants to buy
    private asks: Order[] = []; // willing to pay/sell

    constructor(public readonly symbol: string){}

    submit(incoming: Order): Trade[] {
        throw new Error("TODO");
    }

    bestBid(): Order | undefined {
        return this.bids[0];
    }

    bestAsk(): Order | undefined {
        return this.asks[0];
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