export const PRICE_SCALE = 100;
export const QTY_SCALE =  100_000_000;

export type FixedPrice = bigint;
export type FixedQty = bigint;

export function parsePrice(input: string): FixedPrice {
    return decimalToFixed(input, PRICE_SCALE);
}

export function parseQty(input: string): FixedQty {
    return decimalToFixed(input, QTY_SCALE);
}

export function formatPrice(value: FixedPrice): string{
    return fixedToDecimal(value, PRICE_SCALE);
}

export function formatQty(value: FixedQty): string {
    return fixedToDecimal(value, QTY_SCALE);
}

export function decimalToFixed(input: string, scale: number): bigint {
    const [whole, frac = ""] = input.trim().split(".");
    const decimalDigits = String(scale).length - 1;
    const paddedFrac = frac.padEnd(decimalDigits, "0").slice(0, decimalDigits);
    return BigInt(whole) * BigInt(scale) + BigInt(paddedFrac || "0");
}

export function fixedToDecimal(value: bigint, scale: number): string {
    const decimalDigits = String(scale).length - 1;
    const whole = value / BigInt(scale);
    const frac = (value % BigInt( scale)).toString().padStart(decimalDigits,"0");
    return `${whole}.${frac}`;
}