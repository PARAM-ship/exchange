import { EventEmitter } from 'events';
import { OrderBook, type SubmitResult } from '../../../engine/src/order-book';
import type { Order } from '../../../shared-types/src';
import type { WalWriter } from '../../../engine/src/wal';

export class EngineGateway extends EventEmitter {
  constructor(private book: OrderBook, private wal: WalWriter) {
    super();
  }

  async submit(incoming: Order): Promise<SubmitResult> {
    const result = this.book.submit(incoming);
    await this.wal.append({ type: 'SUBMIT_ORDER', payload: incoming });

    for (const t of result.trades) this.emit('TradeExecuted', t);
    if (result.restingOrder) this.emit('OrderResting', result.restingOrder);
    if (result.incomingOrderStatus === 'filled') this.emit('OrderFilled', incoming.id);

    return result;
  }

  getOrder(orderId: string): Order | null {
    return this.book.get(orderId);
  }

  async cancel(orderId: string): Promise<Order | null> {
    const cancelled = this.book.cancel(orderId);
    if (cancelled) {
      await this.wal.append({ type: 'CANCEL_ORDER', payload: { orderId } });
      this.emit('OrderCancelled', cancelled);
    }
    return cancelled;
  }
}