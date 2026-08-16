import { OrderBook } from "./order-book.js";
import { createOrder, parsePrice, parseQty, formatQty } from "../../shared-types";

const book = new OrderBook("BTC/USDT");

// two resting asks
// book.submit(createOrder({ id: "a1", symbol: "BTC/USDT", side: "sell", price: parsePrice("64900"), quantity: parseQty("0.6") }));
// book.submit(createOrder({ id: "a2", symbol: "BTC/USDT", side: "sell", price: parsePrice("65000"), quantity: parseQty("0.5") }));

// two opposite
book.submit(createOrder({ id: "a4", symbol: "BTC/USDT", side: "buy", price: parsePrice("65000"), quantity: parseQty("0.5") }));
book.submit(createOrder({ id: "a5", symbol: "BTC/USDT", side: "buy", price: parsePrice("70000"), quantity: parseQty("0.5") }));
book.submit(createOrder({ id: "a6", symbol: "BTC/USDT", side: "buy", price: parsePrice("80000"), quantity: parseQty("0.5") }));

// one big incoming buy
// const trades = book.submit(createOrder({ id: "b1", symbol: "BTC/USDT", side: "buy", price: parsePrice("65000"), quantity: parseQty("1.0") }));

// one big incoming sell
// const trades = book.submit(createOrder({ id: "b1", symbol: "BTC/USDT", side: "sell", price: parsePrice("60000"), quantity: parseQty("2.0") }));

// partial fill
const trades = book.submit(createOrder({ id: "b1", symbol: "BTC/USDT", side: "sell", price: parsePrice("60000"), quantity: parseQty("1.0") }));


console.log("Trades:", trades.map(t => ({ price: t.price.toString(), qty: formatQty(t.quantity) })));
console.log("Book after:", book.snapshot());




// deterministic replay

const book2 = new OrderBook("BTC/USDT");

// two resting asks
// book.submit(createOrder({ id: "a1", symbol: "BTC/USDT", side: "sell", price: parsePrice("64900"), quantity: parseQty("0.6") }));
// book.submit(createOrder({ id: "a2", symbol: "BTC/USDT", side: "sell", price: parsePrice("65000"), quantity: parseQty("0.5") }));

// two opposite
book2.submit(createOrder({ id: "a4", symbol: "BTC/USDT", side: "buy", price: parsePrice("65000"), quantity: parseQty("0.5") }));
book2.submit(createOrder({ id: "a5", symbol: "BTC/USDT", side: "buy", price: parsePrice("70000"), quantity: parseQty("0.5") }));
book2.submit(createOrder({ id: "a6", symbol: "BTC/USDT", side: "buy", price: parsePrice("80000"), quantity: parseQty("0.5") }));

// one big incoming buy
// const trades = book.submit(createOrder({ id: "b1", symbol: "BTC/USDT", side: "buy", price: parsePrice("65000"), quantity: parseQty("1.0") }));

// one big incoming sell
// const trades = book.submit(createOrder({ id: "b1", symbol: "BTC/USDT", side: "sell", price: parsePrice("60000"), quantity: parseQty("2.0") }));

// partial fill
const trader = book2.submit(createOrder({ id: "b1", symbol: "BTC/USDT", side: "sell", price: parsePrice("60000"), quantity: parseQty("1.0") }));


console.log("Trades:", trader.map(t => ({ price: t.price.toString(), qty: formatQty(t.quantity) })));
console.log("Book after:", book2.snapshot());