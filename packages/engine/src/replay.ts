import fs from "node:fs";
import type { LogEntry } from "./wal";
import { deserializeOrder } from "../../shared-types/src/serialize";

export function replay(): LogEntry[] {

    if (!fs.existsSync('logfile.txt')) return [];

    let content = fs.readFileSync('logfile.txt', 'utf-8');
    let logs = content.trim().split('\n').filter((el) => el.length > 0);

    return logs.map(el => {
        const raw = JSON.parse(el);
        if (raw.type === "SUBMIT_ORDER") {
            return { ...raw, payload: deserializeOrder(raw.payload) };
        }
        return raw; // CANCEL_ORDER — no bigints to restore
    });
}