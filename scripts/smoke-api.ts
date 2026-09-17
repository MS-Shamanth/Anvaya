/**
 * Verification harness for the deployed auth contract.
 *
 * Mounts api/auth.ts and api/health.ts on a local http server, routing requests
 * the way vercel.json does (/api/auth/<action> → /api/auth?action=<action>), then
 * exercises sign-in, sessions, cookie tampering, methods and rate limits.
 *
 * Run: npm run smoke:api
 */

import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import auth from '../api/auth';
import health from '../api/health';

type Handler = (req: IncomingMessage, res: ServerResponse) => unknown;

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1');
  const path = url.pathname;

  let handler: Handler | undefined;

  if (path === '/api/health') {
    handler = health as Handler;
  } else if (path.startsWith('/api/auth/')) {
    // Same shape the Vercel rewrite produces.
    const action = path.slice('/api/auth/'.length);
    req.url = `/api/auth?action=${encodeURIComponent(action)}`;
    handler = auth as Handler;
  } else if (path === '/api/auth') {
    handler = auth as Handler;
  }

  if (!handler) {
    res.statusCode = 404;
    res.end('{"error":"Not found"}');
    return;
  }

  void handler(req, res);
});

await new Promise<void>((resolve) => server.listen(4599, resolve));
const base = 'http://127.0.0.1:4599';
let failures = 0;

function check(label: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

const post = (path: string, body: unknown, cookie?: string) =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });

const errorOf = async (response: Response) =>
  ((await response.json()) as { error?: string }).error ?? '';

// health
const healthRes = await fetch(`${base}/api/health`);
check('GET /api/health → 200 JSON', healthRes.status === 200, JSON.stringify(await healthRes.json()));

// unknown action must not be mistaken for an endpoint
const unknownAction = await post('/api/auth/nonsense', {});
check('unknown auth action → 404', unknownAction.status === 404, await errorOf(unknownAction));

// missing fields
const missing = await post('/api/auth/login', {});
check('login without credentials → 400', missing.status === 400, await errorOf(missing));

// wrong password
const wrong = await post('/api/auth/login', { email: 'kabir@anvaya.exchange', password: 'nope' });
check('wrong password → 401 generic', wrong.status === 401, await errorOf(wrong));

// unknown email is indistinguishable from a wrong password
const unknown = await post('/api/auth/login', { email: 'nobody@anvaya.exchange', password: 'nope' });
check('unknown email → 401 same message', unknown.status === 401, await errorOf(unknown));

// correct password
const good = await post('/api/auth/login', { email: 'kabir@anvaya.exchange', password: 'anvaya2024' });
const goodBody = (await good.json()) as {
  user?: { id: string; role: string; passwordHash?: string };
};
const setCookie = good.headers.get('set-cookie') ?? '';
check('valid credentials → 200', good.status === 200, JSON.stringify(goodBody.user));
check('response carries role for redirect', goodBody.user?.role === 'seller');
check('response omits passwordHash', goodBody.user?.passwordHash === undefined);
check(
  'cookie is HttpOnly + SameSite',
  /HttpOnly/i.test(setCookie) && /SameSite=Lax/i.test(setCookie),
  setCookie,
);

const cookie = setCookie.split(';')[0];

// session round trip
const meOk = await fetch(`${base}/api/auth/me`, { headers: { cookie } });
check('GET /api/auth/me with cookie → 200', meOk.status === 200, JSON.stringify(await meOk.json()));

const meAnon = await fetch(`${base}/api/auth/me`);
check('GET /api/auth/me without cookie → 401', meAnon.status === 401);

// tampered signature
const meBad = await fetch(`${base}/api/auth/me`, {
  headers: { cookie: `${cookie.slice(0, -3)}aaa` },
});
check('tampered session cookie → 401', meBad.status === 401);

// forged payload with a bogus signature
const forgedPayload = Buffer.from(
  JSON.stringify({ uid: 'b-aditi', role: 'buyer', iat: 0, exp: 9_999_999_999 }),
).toString('base64url');
const forged = await fetch(`${base}/api/auth/me`, {
  headers: { cookie: `anvaya.sid=${forgedPayload}.forgedsignature` },
});
check('forged session payload → 401', forged.status === 401);

// logout expires the cookie
const out = await post('/api/auth/logout', {}, cookie);
check(
  'logout → 200 with expiring cookie',
  out.status === 200 && /Max-Age=0/.test(out.headers.get('set-cookie') ?? ''),
);

// method enforcement
const wrongMethod = await fetch(`${base}/api/auth/login`, { method: 'GET' });
check('GET /api/auth/login → 405', wrongMethod.status === 405);

// password reset is explicitly unavailable rather than silently useless
const reset = await post('/api/auth/reset-password', { token: 'x', newPassword: 'Abcdefghij1' });
check('reset-password → 503 with reason', reset.status === 503, await errorOf(reset));

const forgot = await post('/api/auth/forgot-password', { email: 'kabir@anvaya.exchange' });
check('forgot-password → 200 generic message', forgot.status === 200);

// rate limiting per email
let limited = 0;
for (let i = 0; i < 8; i += 1) {
  const attempt = await post('/api/auth/login', { email: 'rhea@colabavault.in', password: 'bad' });
  if (attempt.status === 429) limited += 1;
}
check('repeated failures eventually rate limited', limited > 0, `${limited} of 8 blocked`);

server.close();
console.log(failures === 0 ? '\nAll checks passed' : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
