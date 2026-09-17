/**
 * Temporary verification harness: mounts the serverless auth handlers on a local
 * http server and exercises the full sign-in contract.
 */

import { createServer } from 'node:http';
import login from '../api/auth/login';
import logout from '../api/auth/logout';
import me from '../api/auth/me';
import health from '../api/health';
import type { ApiRequest, ApiResponse } from '../api/_lib/http';

const routes: Record<string, (req: ApiRequest, res: ApiResponse) => unknown> = {
  '/api/auth/login': login,
  '/api/auth/logout': logout,
  '/api/auth/me': me,
  '/api/health': health,
};

const server = createServer((req, res) => {
  const handler = routes[(req.url ?? '').split('?')[0]];
  if (!handler) {
    res.statusCode = 404;
    res.end('{"error":"Not found"}');
    return;
  }
  void handler(req as ApiRequest, res as ApiResponse);
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
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });

const errorOf = async (response: Response) =>
  ((await response.json()) as { error?: string }).error ?? '';

// health
const healthRes = await fetch(`${base}/api/health`);
check('GET /api/health returns 200 JSON', healthRes.status === 200, JSON.stringify(await healthRes.json()));

// missing fields
const missing = await post('/api/auth/login', {});
check('login without credentials → 400', missing.status === 400, await errorOf(missing));

// wrong password
const wrong = await post('/api/auth/login', { email: 'kabir@anvaya.exchange', password: 'nope' });
check('wrong password → 401 generic', wrong.status === 401, await errorOf(wrong));

// unknown email is indistinguishable
const unknown = await post('/api/auth/login', { email: 'nobody@anvaya.exchange', password: 'nope' });
check('unknown email → 401 same message', unknown.status === 401, await errorOf(unknown));

// correct password
const good = await post('/api/auth/login', { email: 'kabir@anvaya.exchange', password: 'anvaya2024' });
const goodBody = (await good.json()) as { user?: { id: string; role: string; passwordHash?: string } };
const setCookie = good.headers.get('set-cookie') ?? '';
check('valid credentials → 200', good.status === 200, JSON.stringify(goodBody.user));
check('response carries role for redirect', goodBody.user?.role === 'seller');
check('response omits passwordHash', goodBody.user?.passwordHash === undefined);
check('cookie is HttpOnly + SameSite', /HttpOnly/i.test(setCookie) && /SameSite=Lax/i.test(setCookie), setCookie);

const cookie = setCookie.split(';')[0];

// session round trip
const meOk = await fetch(`${base}/api/auth/me`, { headers: { cookie } });
check('GET /api/auth/me with cookie → 200', meOk.status === 200, JSON.stringify(await meOk.json()));

const meAnon = await fetch(`${base}/api/auth/me`);
check('GET /api/auth/me without cookie → 401', meAnon.status === 401);

// tampered cookie must be rejected
const tampered = `${cookie.slice(0, -3)}aaa`;
const meBad = await fetch(`${base}/api/auth/me`, { headers: { cookie: tampered } });
check('tampered session cookie → 401', meBad.status === 401);

// forged payload (valid base64 body, bogus signature)
const forgedPayload = Buffer.from(
  JSON.stringify({ uid: 'b-aditi', role: 'buyer', iat: 0, exp: 9_999_999_999 }),
).toString('base64url');
const forged = await fetch(`${base}/api/auth/me`, {
  headers: { cookie: `anvaya.sid=${forgedPayload}.forgedsignature` },
});
check('forged session payload → 401', forged.status === 401);

// logout clears the cookie
const out = await post('/api/auth/logout', {}, cookie);
check('logout → 200 with expiring cookie', out.status === 200 && /Max-Age=0/.test(out.headers.get('set-cookie') ?? ''));

// wrong method
const wrongMethod = await fetch(`${base}/api/auth/login`, { method: 'GET' });
check('GET /api/auth/login → 405', wrongMethod.status === 405);

// rate limiting per email (5 allowed in window, 6th blocked)
let limited = 0;
for (let i = 0; i < 8; i += 1) {
  const attempt = await post('/api/auth/login', { email: 'rhea@colabavault.in', password: 'bad' });
  if (attempt.status === 429) limited += 1;
}
check('repeated failures eventually rate limited', limited > 0, `${limited} of 8 blocked`);

server.close();
console.log(failures === 0 ? '\nAll checks passed' : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
