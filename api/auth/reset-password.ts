/**
 * POST /api/auth/reset-password
 *
 * Intentionally unavailable on the hosted demo. Password changes need a
 * persistent user store; the serverless functions read from a fixed in-code
 * directory, so a "successful" reset here would silently do nothing. The local
 * Express server (server/src/routes/auth.ts) implements the full flow against
 * its in-memory store for development.
 */

import { methodNotAllowed, sendJson, type ApiRequest, type ApiResponse } from '../_lib/http';

export default function handler(req: ApiRequest, res: ApiResponse): void {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  sendJson(res, 503, {
    error:
      'Password reset is not enabled on this deployment. It requires a database and an email provider.',
  });
}
