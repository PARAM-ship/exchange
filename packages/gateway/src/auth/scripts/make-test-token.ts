// scripts/make-test-token.ts
import { sign } from 'hono/jwt';
// const token = await sign({ userId: 'test-user-1', exp: Math.floor(Date.now()/1000) + 3600 }, 'dev-secret-change-me');
// scripts/make-test-token.ts — temporarily change userId, or add a second script
const token2 = await sign({ userId: 'test-user-2', exp: Math.floor(Date.now()/1000) + 3600 }, 'dev-secret-change-me');
console.log(token2);