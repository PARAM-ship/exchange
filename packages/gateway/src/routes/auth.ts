import { sign } from "hono/jwt";
import { createUser, findUserByUsername } from "../../../settlement/src/user";
import { JWT_SECRET } from "../auth/authMiddleware";
import bcrypt from "bcryptjs";
import { Hono } from "hono";
const route = new Hono();

route.post('/signup', async (c) => {
  const { username, email, password } = await c.req.json();
  // 1. hash the password with bcrypt
  // 2. call createUser(username, email, hashedPassword) from settlement
  // 3. return something minimal — NOT the password/hash
    const pass = await bcrypt.hash(password,10);
    await createUser(username,email,pass);
    return c.json({
        msg: "User created Successfully!"
    })
});

route.post('/login', async (c) => {
  const { username, password } = await c.req.json();

  const user = await findUserByUsername(username);
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401); // deliberately vague — see below
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401); // same message as above, on purpose
  }

  const token = await sign({ userId: user.id }, JWT_SECRET);
  return c.json({ token });
});

export default route;