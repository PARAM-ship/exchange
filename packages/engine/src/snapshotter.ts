import type { Order } from "../../shared-types/src";
import { deserializeOrder, serializeOrder } from "../../shared-types/src/serialize";
import type { OrderBook } from "./order-book";
import fs from "node:fs";

export class Snapshotter {
    constructor(private book: OrderBook,private path = "snapshot.json"){}

    take(){
        const data = {
            seq: this.book.lastAppliedSeq,
            bids: this.book.bids.map(serializeOrder),
            asks: this.book.asks.map(serializeOrder),
            nextOrderId: this.book.nextOrderId,
        };
        fs.writeFileSync(this.path, JSON.stringify(data));
    }

    load(): {seq: number; bids: Order[]; asks: Order[]; nextOrderId: number} | null {
        if(!fs.existsSync(this.path))return null;
        const raw =  JSON.parse(fs.readFileSync(this.path,'utf-8'));

        return {
        seq: raw.seq,
        bids: raw.bids.map(deserializeOrder),
        asks: raw.asks.map(deserializeOrder),
        nextOrderId: raw.nextOrderId,
    };

    }
}