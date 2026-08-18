import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';

export const JWT_SECRET =  'dev-secret-change-me';

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = await verify(token, JWT_SECRET, 'HS256');
    if (typeof payload.userId !== 'number') {
      return c.json({ error: 'Invalid token payload' }, 401);
    }
    c.set('userId', payload.userId);
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  await next();
});