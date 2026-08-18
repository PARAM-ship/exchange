import type { Order } from "../../shared-types/src";
import fs from "node:fs";

export type LogEntry = | {type: "SUBMIT_ORDER"; payload: Order} | { type: "CANCEL_ORDER"; payload: {orderId: string}};

function serializeEntry(entry: LogEntry): any {
    if (entry.type === "SUBMIT_ORDER") {
        return {
            type: "SUBMIT_ORDER",
            payload: {
                ...entry.payload,
                price: entry.payload.price.toString(),
                quantity: entry.payload.quantity.toString(),
                remainingQuantity: entry.payload.remainingQuantity.toString(),
            },
        };
    }
    return entry; // CANCEL_ORDER has no bigints
}

export class WalWriter {
    private buffer: {entry: LogEntry; resolve: () => void, seq: number}[] = [];
    private fd = fs.openSync('logfile.txt','a');
    private timer:NodeJS.Timeout;
    private nextSeq = 0;

    constructor() {
        this.timer = setInterval(()=>this.flush(), 20);
    }

    append(entry: LogEntry): Promise<void> {
        const seq = ++this.nextSeq;
        return new Promise((resolve) => {
            this.buffer.push({entry,resolve,seq});
        })
    }

    flush(){
        if(!this.buffer.length)return;

        const batch = this.buffer;
        this.buffer = [];
        
        for(let i = 0;i < batch.length;i++){
            fs.writeSync(this.fd,JSON.stringify({seq: batch[i]?.seq,...serializeEntry(batch[i]!.entry)}) + '\n');
        }
        fs.fsyncSync(this.fd);
        for(let b of batch)b?.resolve();
    }

    close() {
        clearInterval(this.timer);
        this.flush();
        fs.closeSync(this.fd);
    }
}