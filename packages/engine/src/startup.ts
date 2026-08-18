import { EngineGateway } from "../../gateway/src/engine/engineGateway";
import { OrderBook } from "./order-book";
import { replay } from "./replay";
import { Snapshotter } from "./snapshotter";
import { WalWriter } from "./wal";

const book = new OrderBook("BTC/USDT");

const snapshotter = new Snapshotter(book);

setInterval(() => {
    snapshotter.take()
}, 60_000);

const snap = snapshotter.load();

function deserializeEntry(raw: any): LogEntry {
    if (raw.type === "SUBMIT_ORDER") {
        return {
            type: "SUBMIT_ORDER",
            payload: {
                ...raw.payload,
                price: BigInt(raw.payload.price),
                quantity: BigInt(raw.payload.quantity),
                remainingQuantity: BigInt(raw.payload.remainingQuantity),
            },
        };
    }
    return raw;
}

const logs = deserializeEntry(replay());

const startFrom = snap ? logs.filter(e => e.seq > snap.seq) : logs;
if (snap) { book.bids = snap.bids; book.asks = snap.asks; book.nextOrderId = snap.nextOrderId; }
for (const entry of startFrom) {
    if (entry.type === "SUBMIT_ORDER") book.submit(entry.payload);
    if(entry.type === "CANCEL_ORDER"){
        book.cancel(entry.payload.orderId);
    }
    book.lastAppliedSeq = entry.seq;
}

// for(let entry of logs){
//     if(entry.type === "SUBMIT_ORDER")book.submit(entry.payload);
//     book.lastAppliedSeq = entry.seq;
// }

const wal = new WalWriter();

const engineGateway = new EngineGateway(book,wal);