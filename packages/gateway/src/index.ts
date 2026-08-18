import { Hono } from 'hono';
import { OrderBook } from '../../engine/src/order-book';
import { WalWriter } from '../../engine/src/wal';
import { replay } from '../../engine/src/replay';
import { Snapshotter } from '../../engine/src/snapshotter';
import { EngineGateway } from './engine/engineGateway';
import { ordersRoute } from './routes/orders';
import { serializeTrade, toClientTrade } from '../../shared-types/src/serialize';
import { authMiddleware } from './auth/authMiddleware';
import authRoutes from "./routes/auth";
import { settleTrade } from '../../settlement/src/settlement';
import { QTY_SCALE } from '../../shared-types/src';

// --- crash recovery: snapshot + WAL replay ---
const book = new OrderBook("BTC/USDT");
const snapshotter = new Snapshotter(book);

const baseAsset = "BTC";
const quoteAsset = "USDT";


const snap = snapshotter.load();
if (snap) {
  book.bids = snap.bids;
  book.asks = snap.asks;
  book.nextOrderId = snap.nextOrderId;
}

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
for (const entry of startFrom) {
  if (entry.type === "SUBMIT_ORDER") book.submit(entry.payload);
  if (entry.type === "CANCEL_ORDER") book.cancel(entry.payload.orderId);
  book.lastAppliedSeq = entry.seq;
}

// --- live components, now operating on the recovered book ---
const wal = new WalWriter();
const engineGateway = new EngineGateway(book, wal);

setInterval(() => snapshotter.take(), 60_000);

const app = new Hono();

// auth middleware — verifies JWT, extracts user id, attaches to context

// route handler — reads c.get('userId'), never touches JWT/tokens directly

app.use('/orders/*', authMiddleware);
app.route('/orders', ordersRoute(engineGateway));
app.route("/auth", authRoutes);


const server = Bun.serve({
  port: 3000,
  fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === '/ws') {
      const symbol = url.searchParams.get('symbol');
      if (!symbol) {
        return new Response('symbol query param required', { status: 400 });
      }
      const upgraded = server.upgrade(req, { data: { symbol } });
      if (upgraded) return undefined; // Bun takes over the connection
      return new Response('WebSocket upgrade failed', { status: 400 });
    }

    return app.fetch(req, server);
  },
  websocket: {
    open(ws) {
      const { symbol } = ws.data as { symbol: string };
      ws.subscribe(`trades:${symbol}`);
    },
    message() {
      // no client->server messages expected yet; ignore
    },
    close(ws) {
      const { symbol } = ws.data as { symbol: string };
      ws.unsubscribe(`trades:${symbol}`);
    },
  },
});

// wire engine events -> broadcast
engineGateway.on('TradeExecuted', async (trade) => {
  
    // const buyOrder = engineGateway.getOrder(trade.buyOrderId);
    // const sellOrder = engineGateway.getOrder(trade.sellOrderId);
    // if (!buyOrder || !sellOrder) {
    // // shouldn't happen — an executed trade implies both orders existed
    // console.error("Trade executed but order lookup failed", trade.id);
    // return;
    // }
    
    try {
        const quoteAmount = BigInt(trade.quantity * trade.price) / BigInt(QTY_SCALE);
        await settleTrade(
            trade.buyUserId, trade.sellUserId,
            baseAsset, quoteAsset,
            trade.quantity, quoteAmount/* quoteAmount computed same way as reserve/release */
        );
    } catch (err) {
        // trade already matched in-memory but settlement failed — what should happen here?
        console.error("Settlement failed for trade", trade.id, err);
    }
  
    server.publish(
    `trades:${trade.symbol}`,
    JSON.stringify({ type: 'TradeExecuted', trade: toClientTrade(trade) })
  );
});

console.log(`Server running on port ${server.port}`);

// export default {
//   port: 3000,
//   fetch: app.fetch,
// };