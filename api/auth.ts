/**
 * Anvaya authentication API — one function serving every /api/auth/* action.
 *
 * `vercel.json` rewrites /api/auth/<action> to /api/auth?action=<action>, and the
 * Vite dev server routes the same paths here, so both environments run this file.
 *
 * Deliberately self-contained: no relative imports, only Node built-ins. Vercel
 * transpiles each function file on its own and runs the result as Node ESM
 * without rewriting relative import specifiers, so an extensionless
 * `import './_lib/foo'` resolves locally (Vite resolves it) but throws
 * ERR_MODULE_NOT_FOUND in production and surfaces as an opaque 500 — see
 * https://github.com/vercel/vercel/issues/14910. Keeping everything in one file
 * removes that failure mode rather than working around it.
 *
 * Design notes:
 * - scrypt (node:crypto) rather than argon2: no native addon to bundle.
 * - HMAC-signed cookie rather than a session store: nothing to share between
 *   invocations, which a serverless memory store cannot do.
 */

import { createHmac, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { promisify } from 'node:util';

type ApiRequest = IncomingMessage & { body?: unknown };
type ApiResponse = ServerResponse<IncomingMessage>;

// ── Users ────────────────────────────────────────────────────────────────────
// Stands in for database rows. Hashes were generated with scripts/gen-demo-hashes.ts
// over the public demo password, so nothing secret lives here.

type Role = 'buyer' | 'seller' | 'upcycler';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  org: string;
  initials: string;
  memberSince: string;
  standing: 'Invited' | 'Verified' | 'Atelier' | 'Founding';
  interests?: { categories: string[]; brands: string[]; budget: number };
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const USERS: StoredUser[] = [
  {
    id: 'b-aditi',
    name: 'Aditi Rao',
    email: 'aditi@anvaya.exchange',
    passwordHash:
      'scrypt$16384$8$1$1a946fc932cdb26613b7ea0969fec727$e4b9548eb8c46d84f9d484416e0b2ffab81ee53881b0a7e728321dbaca5309e1',
    role: 'buyer',
    org: 'Rao Family Office',
    initials: 'AR',
    memberSince: daysAgo(410),
    standing: 'Verified',
    interests: {
      categories: ['Watches', 'Jewellery', 'Handbags'],
      brands: ['Cartier', 'Van Cleef & Arpels', 'Hermès', 'Rolex'],
      budget: 1_800_000,
    },
  },
  {
    id: 's-kabir',
    name: 'Kabir Mehta',
    email: 'kabir@anvaya.exchange',
    passwordHash:
      'scrypt$16384$8$1$76bf116b5a69b1eb462c9b583521861e$0cd710cdef8b3dba390308450373602b7383ebd303e5621154c68d5293390417',
    role: 'seller',
    org: 'Mehta Luxury Consignment',
    initials: 'KM',
    memberSince: daysAgo(620),
    standing: 'Founding',
  },
  {
    id: 'u-noor',
    name: 'Noor Sheikh',
    email: 'noor@anvaya.exchange',
    passwordHash:
      'scrypt$16384$8$1$4bcc9690fc567a21cb08aa675810fa97$26e159b00ee8188179bf03e81f9589e1e04e134a91c6481fb71cadf2a9747c9e',
    role: 'upcycler',
    org: 'Atelier Noor',
    initials: 'NS',
    memberSince: daysAgo(300),
    standing: 'Atelier',
  },
  {
    id: 's-colaba',
    name: 'Rhea Fernandes',
    email: 'rhea@colabavault.in',
    passwordHash:
      'scrypt$16384$8$1$b6edfd7dc3bab11f5466ea954a71ddd0$4cdd2ff4fe8003ff90c5c2d1279c45c226de24094710bb89a865163b8cdfca6c',
    role: 'seller',
    org: 'The Colaba Vault',
    initials: 'RF',
    memberSince: daysAgo(500),
    standing: 'Verified',
  },
  {
    id: 's-verve',
    name: 'Dev Khanna',
    email: 'dev@ververetail.in',
    passwordHash:
      'scrypt$16384$8$1$121292454a21c5f284cf926dd4826756$597eb1d76cfe444619d78f2083abe052e508034fd27dd846921b9a3396bfffdb',
    role: 'seller',
    org: 'Verve Retail Group',
    initials: 'DK',
    memberSince: daysAgo(275),
    standing: 'Verified',
  },
  {
    id: 's-sudarshan',
    name: 'Ira Sudarshan',
    email: 'ira@sudarshanheritage.in',
    passwordHash:
      'scrypt$16384$8$1$979becf45027fb5df397cfd7bf45e41c$6db6cf748023b3b55672c7012ad7f25780bc2b0a7820a8d2edea8a243ba73b26',
    role: 'seller',
    org: 'Sudarshan Heritage',
    initials: 'IS',
    memberSince: daysAgo(190),
    standing: 'Invited',
  },
];

function toSafeUser(user: StoredUser) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

// ── Passwords ────────────────────────────────────────────────────────────────

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const MAXMEM = 64 * 1024 * 1024;

/** Constant-time verify. Malformed records return false instead of throwing. */
async function verifyPassword(stored: string, password: string): Promise<boolean> {
  try {
    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

    const [, n, r, p, saltHex, keyHex] = parts;
    const expected = Buffer.from(keyHex, 'hex');
    if (expected.length === 0) return false;

    const derived = await scrypt(
      password.normalize('NFKC'),
      Buffer.from(saltHex, 'hex'),
      expected.length,
      { N: Number(n), r: Number(r), p: Number(p), maxmem: MAXMEM },
    );

    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

// ── Session cookie ───────────────────────────────────────────────────────────

const COOKIE_NAME = 'anvaya.sid';
const SESSION_MAX_AGE = 60 * 60 * 24; // seconds
const INSECURE_FALLBACK_SECRET = 'anvaya-dev-session-secret-change-me';

interface SessionPayload {
  uid: string;
  role: string;
  iat: number;
  exp: number;
}

let secretWarningLogged = false;

function sessionSecret(): string {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;

  if (!secretWarningLogged) {
    secretWarningLogged = true;
    console.warn(
      '[anvaya] SESSION_SECRET is missing or under 32 characters. Using a public fallback so ' +
        'sign-in keeps working, but session cookies are forgeable until you set SESSION_SECRET.',
    );
  }

  return fromEnv && fromEnv.length > 0 ? fromEnv : INSECURE_FALLBACK_SECRET;
}

const sign = (body: string) => createHmac('sha256', sessionSecret()).update(body).digest('base64url');

const secureCookies = () => process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

function serializeCookie(value: string, maxAge: number): string {
  const parts = [`${COOKIE_NAME}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`];
  if (secureCookies()) parts.push('Secure');
  return parts.join('; ');
}

function createSessionCookie(uid: string, role: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { uid, role, iat: now, exp: now + SESSION_MAX_AGE };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return serializeCookie(`${body}.${sign(body)}`, SESSION_MAX_AGE);
}

const clearSessionCookie = () => serializeCookie('', 0);

function readSession(cookieHeader: string | undefined): SessionPayload | null {
  if (!cookieHeader) return null;

  let raw = '';
  for (const pair of cookieHeader.split(';')) {
    const index = pair.indexOf('=');
    if (index < 0) continue;
    if (pair.slice(0, index).trim() === COOKIE_NAME) {
      raw = decodeURIComponent(pair.slice(index + 1).trim());
      break;
    }
  }
  if (!raw) return null;

  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return null;

  const body = raw.slice(0, dot);
  const expected = Buffer.from(sign(body));
  const provided = Buffer.from(raw.slice(dot + 1));
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.uid || typeof payload.exp !== 'number') return null;
    if (payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Rate limiting ────────────────────────────────────────────────────────────
// Per warm instance only. Blunts a single attacker; move to Vercel KV / Upstash
// for a global limit. See DEPLOYMENT.md.

const buckets = new Map<string, { count: number; resetAt: number }>();

function hit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfter: number } {
  const now = Date.now();

  for (const [existing, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(existing);
  }

  const bucket = buckets.get(key);
  if (!bucket) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────

function sendJson(res: ApiResponse, status: number, body: unknown, cookies: string[] = []): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (cookies.length > 0) res.setHeader('Set-Cookie', cookies);
  res.end(JSON.stringify(body));
}

function parseJson(raw: string): Record<string, unknown> {
  if (!raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

async function readBody(req: ApiRequest): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object') return req.body as Record<string, unknown>;
  if (typeof req.body === 'string') return parseJson(req.body);

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return parseJson(Buffer.concat(chunks).toString('utf8'));
}

const str = (value: unknown) => (typeof value === 'string' ? value : '');

function clientIp(req: ApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (first) return first.split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}

/**
 * Which action was requested. On Vercel the rewrite supplies `?action=login`; in
 * dev the real path arrives, so the last path segment is the fallback. "auth"
 * itself is not an action — that is the bare /api/auth path.
 */
function resolveAction(req: ApiRequest): string {
  const url = new URL(req.url ?? '/', 'http://localhost');

  const fromQuery = url.searchParams.get('action');
  if (fromQuery) return fromQuery.trim().toLowerCase();

  const last = url.pathname.split('/').filter(Boolean).pop() ?? '';
  return last === 'auth' ? '' : last.toLowerCase();
}

// ── Actions ──────────────────────────────────────────────────────────────────

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_IP = 20;
const MAX_PER_EMAIL = 5;

async function login(req: ApiRequest, res: ApiResponse): Promise<void> {
  const ip = clientIp(req);
  const ipLimit = hit(`ip:${ip}`, MAX_PER_IP, LOGIN_WINDOW_MS);
  if (!ipLimit.allowed) {
    res.setHeader('Retry-After', String(ipLimit.retryAfter));
    sendJson(res, 429, {
      error: `Too many login attempts. Try again in ${Math.ceil(ipLimit.retryAfter / 60)} minute(s).`,
    });
    return;
  }

  const body = await readBody(req);
  const email = str(body.email).trim().toLowerCase();
  const password = str(body.password);

  if (!email || !password) {
    sendJson(res, 400, { error: 'Email and password are required' });
    return;
  }

  const emailKey = `email:${email}`;
  const emailLimit = hit(emailKey, MAX_PER_EMAIL, LOGIN_WINDOW_MS);
  if (!emailLimit.allowed) {
    res.setHeader('Retry-After', String(emailLimit.retryAfter));
    sendJson(res, 429, {
      error: `Too many attempts for this account. Try again in ${Math.ceil(emailLimit.retryAfter / 60)} minute(s).`,
    });
    return;
  }

  const user = USERS.find((candidate) => candidate.email === email) ?? null;
  const passwordOk = user ? await verifyPassword(user.passwordHash, password) : false;

  // Same answer whether the email is unknown or the password is wrong.
  if (!user || !passwordOk) {
    sendJson(res, 401, { error: 'Invalid email or password' });
    return;
  }

  buckets.delete(emailKey);
  buckets.delete(`ip:${ip}`);

  sendJson(res, 200, { user: toSafeUser(user) }, [createSessionCookie(user.id, user.role)]);
}

function me(req: ApiRequest, res: ApiResponse): void {
  const session = readSession(req.headers.cookie);
  if (!session) {
    sendJson(res, 401, { error: 'Authentication required' });
    return;
  }

  const user = USERS.find((candidate) => candidate.id === session.uid);
  if (!user) {
    // Signed session for an account that no longer exists — drop the cookie.
    sendJson(res, 401, { error: 'Authentication required' }, [clearSessionCookie()]);
    return;
  }

  sendJson(res, 200, { user: toSafeUser(user) });
}

async function forgotPassword(req: ApiRequest, res: ApiResponse): Promise<void> {
  const limit = hit(`reset:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfter));
    sendJson(res, 429, { error: 'Too many reset requests. Please try again later.' });
    return;
  }

  const body = await readBody(req);
  if (!str(body.email).trim()) {
    sendJson(res, 400, { error: 'Email is required' });
    return;
  }

  // Identical response either way, so this cannot enumerate accounts. No mail
  // provider and no persistent store on this deployment, so no token is issued.
  sendJson(res, 200, {
    message: 'If an account exists with that email, a password reset link has been sent.',
  });
}

// ── Entry point ──────────────────────────────────────────────────────────────

const METHODS: Record<string, string> = {
  login: 'POST',
  logout: 'POST',
  me: 'GET',
  'forgot-password': 'POST',
  'reset-password': 'POST',
};

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  const action = resolveAction(req);

  try {
    const expectedMethod = METHODS[action];
    if (!expectedMethod) {
      sendJson(res, 404, { error: 'Unknown auth endpoint' });
      return;
    }

    if (req.method !== expectedMethod) {
      res.setHeader('Allow', expectedMethod);
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    switch (action) {
      case 'login':
        await login(req, res);
        return;

      case 'logout':
        // Stateless sessions: expiring the cookie is the whole operation.
        sendJson(res, 200, { message: 'Logged out successfully' }, [clearSessionCookie()]);
        return;

      case 'me':
        me(req, res);
        return;

      case 'forgot-password':
        await forgotPassword(req, res);
        return;

      case 'reset-password':
        // Changing a password needs a persistent store; this deployment reads a
        // fixed directory, so succeeding here would be a lie.
        sendJson(res, 503, {
          error:
            'Password reset is not enabled on this deployment. It requires a database and an email provider.',
        });
        return;
    }
  } catch (error) {
    console.error(`[anvaya] /api/auth/${action || 'unknown'} failed:`, error);
    if (!res.writableEnded) {
      sendJson(res, 500, { error: 'Sign-in is temporarily unavailable. Please try again.' });
    }
  }
}
