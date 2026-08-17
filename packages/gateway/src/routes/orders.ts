import { Hono } from 'hono';
import type { EngineGateway } from '../engine/engineGateway';
import { parseOrderPayload } from '../validation/order';
import { formatPrice, formatQty } from '../../../shared-types/src';
import { toClientOrder } from '../../../shared-types/src/serialize';

export function ordersRoute(engineGateway: EngineGateway) {
  const route = new Hono();

  route.post('/', async (c) => {
    const userId = c.get('userId') as string;
    const body = await c.req.json();

    // your turn:
    // 1. validate + parse `body` into an Order using parseOrderPayload
    //    - if invalid, return c.json({ error: ... }, 400)
    // 2. call engineGateway.submit(order)
    // 3. return the result as JSON — think about status code:
    //    what's the right HTTP status for "order placed, no error"?
    //    200? 201? does it matter whether it traded vs just rested?
    const order = parseOrderPayload(body,userId);
    if(!order)return c.json({error:"Parsing failed"},400);
    
    // your turn: does Order need a userId/ownerId field added to attribute the order to this user?
    // if so, attach it here before calling engineGateway.submit(order)
    order.userId = userId;
    
    const result = await engineGateway.submit(order);


    return c.json({
        success:true,
        incomingOrderStatus: result.incomingOrderStatus,
        trades: result.trades.map(t => ({
            id: t.id,
            symbol: t.symbol,
            price: formatPrice(t.price),
            quantity: formatQty(t.quantity),
            buyOrderId: t.buyOrderId,
            sellOrderId: t.sellOrderId,
            executedAt: t.executedAt,
        })),
        restingOrder: result.restingOrder ? {
            id: result.restingOrder.id,
            symbol: result.restingOrder.symbol,
            side: result.restingOrder.side,
            price: formatPrice(result.restingOrder.price),
            quantity: formatQty(result.restingOrder.quantity),
            remainingQuantity: formatQty(result.restingOrder.remainingQuantity),
            status: result.restingOrder.status,
            createdAt: result.restingOrder.createdAt,
        } : undefined,
    },201);
  });

  route.delete('/:id', async (c) => {
    const userId = c.get('userId') as string;
    const orderId = c.req.param('id');

    const order = engineGateway.getOrder(orderId); // you'll need a lookup method — does OrderBook have one, or only cancel()?
    if (!order || order.userId !== userId) {
        return c.json({ error: 'Order not found' }, 404); // ambiguous on purpose — see below
    }

    const cancelled = await engineGateway.cancel(orderId);

    if (!cancelled) {
        return c.json({ error: 'Order not found' }, 404);
    }

    return c.json({
        success: true,
        order: toClientOrder(cancelled!),
        // {
            // id: cancelled.id,
            // symbol: cancelled.symbol,
            // side: cancelled.side,
            // price: formatPrice(cancelled.price),
            // quantity: formatQty(cancelled.quantity),
            // remainingQuantity: formatQty(cancelled.remainingQuantity),
            // status: cancelled.status,
            // createdAt: cancelled.createdAt,},
    }, 200);
});

  return route;
}