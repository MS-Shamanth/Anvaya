/**
 * POST /api/auth/forgot-password
 *
 * Always answers with the same message so the response cannot be used to
 * enumerate accounts. The hosted demo has no mail provider and no persistent
 * user store, so no token is actually issued — see reset-password.ts.
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
import { hit, sweep } from '../_lib/rateLimit';

const GENERIC_MESSAGE =
  'If an account exists with that email, a password reset link has been sent.';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  sweep();

  const limit = hit(`reset:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds));
    sendJson(res, 429, { error: 'Too many reset requests. Please try again later.' });
    return;
  }

  const body = await readJsonBody(req);
  const email = asString(body.email).trim();

  if (!email) {
    sendJson(res, 400, { error: 'Email is required' });
    return;
  }

  sendJson(res, 200, { message: GENERIC_MESSAGE });
}
