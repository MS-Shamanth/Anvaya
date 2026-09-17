/**
 * POST /api/auth/login
 *
 * Verifies credentials server-side and issues a signed HttpOnly session cookie.
 * Errors are deliberately generic so the response never reveals whether an
 * email exists on the exchange.
 */

import {
  asString,
  clientIp,
  methodNotAllowed,
  readJsonBody,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from '../_lib/http';
import { verifyPassword } from '../_lib/password';
import { hit, reset, sweep } from '../_lib/rateLimit';
import { createSessionCookie } from '../_lib/session';
import { findUserByEmail, toSafeUser } from '../_lib/users';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_IP = 20;
const MAX_PER_EMAIL = 5;

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  try {
    sweep();

    const ip = clientIp(req);
    const ipLimit = hit(`ip:${ip}`, MAX_PER_IP, WINDOW_MS);
    if (!ipLimit.allowed) {
      res.setHeader('Retry-After', String(ipLimit.retryAfterSeconds));
      sendJson(res, 429, {
        error: `Too many login attempts. Try again in ${Math.ceil(ipLimit.retryAfterSeconds / 60)} minute(s).`,
      });
      return;
    }

    const body = await readJsonBody(req);
    const email = asString(body.email).trim().toLowerCase();
    const password = asString(body.password);

    if (!email || !password) {
      sendJson(res, 400, { error: 'Email and password are required' });
      return;
    }

    const emailKey = `email:${email}`;
    const emailLimit = hit(emailKey, MAX_PER_EMAIL, WINDOW_MS);
    if (!emailLimit.allowed) {
      res.setHeader('Retry-After', String(emailLimit.retryAfterSeconds));
      sendJson(res, 429, {
        error: `Too many attempts for this account. Try again in ${Math.ceil(emailLimit.retryAfterSeconds / 60)} minute(s).`,
      });
      return;
    }

    const user = findUserByEmail(email);
    const passwordOk = user ? await verifyPassword(user.passwordHash, password) : false;

    if (!user || !passwordOk) {
      sendJson(res, 401, { error: 'Invalid email or password' });
      return;
    }

    reset(emailKey);
    reset(`ip:${ip}`);

    sendJson(res, 200, { user: toSafeUser(user) }, [createSessionCookie(user.id, user.role)]);
  } catch (error) {
    console.error('[anvaya] login failed:', error);
    sendJson(res, 500, { error: 'Sign-in is temporarily unavailable. Please try again.' });
  }
}
