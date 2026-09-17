/**
 * Stateless session cookies for the serverless auth functions.
 *
 * The Express dev server uses express-session with a memory store. That cannot
 * work on Vercel: every request may hit a different instance, so a session
 * written by one invocation is invisible to the next. Instead the session is a
 * short HMAC-signed payload carried in an HttpOnly cookie — nothing to store,
 * and the signature still makes it unforgeable by the browser.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'anvaya.sid';
const MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours
const INSECURE_FALLBACK_SECRET = 'anvaya-dev-session-secret-change-me';

export interface SessionPayload {
  uid: string;
  role: string;
  iat: number;
  exp: number;
}

let warned = false;

function sessionSecret(): string {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;

  const hosted = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  if (hosted && !warned) {
    warned = true;
    console.warn(
      '[anvaya] SESSION_SECRET is missing or under 32 characters. Falling back to a public ' +
        'default so sign-in keeps working, but session cookies are forgeable until you set ' +
        'SESSION_SECRET in your hosting environment variables.',
    );
  }

  return fromEnv && fromEnv.length > 0 ? fromEnv : INSECURE_FALLBACK_SECRET;
}

const b64url = (input: string | Buffer) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function sign(body: string): string {
  return createHmac('sha256', sessionSecret()).update(body).digest('base64url');
}

function secureCookies(): boolean {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
}

function serialize(value: string, maxAge: number): string {
  const attributes = [
    `${COOKIE_NAME}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (secureCookies()) attributes.push('Secure');
  return attributes.join('; ');
}

export function createSessionCookie(uid: string, role: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { uid, role, iat: now, exp: now + MAX_AGE_SECONDS };
  const body = b64url(JSON.stringify(payload));
  return serialize(`${body}.${sign(body)}`, MAX_AGE_SECONDS);
}

export function clearSessionCookie(): string {
  return serialize('', 0);
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const pair of header.split(';')) {
    const index = pair.indexOf('=');
    if (index < 0) continue;
    out[pair.slice(0, index).trim()] = decodeURIComponent(pair.slice(index + 1).trim());
  }
  return out;
}

export function readSession(cookieHeader: string | undefined): SessionPayload | null {
  const raw = parseCookies(cookieHeader)[COOKIE_NAME];
  if (!raw) return null;

  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return null;

  const body = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);

  const expected = Buffer.from(sign(body));
  const provided = Buffer.from(signature);
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
