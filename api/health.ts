/**
 * GET /api/health
 *
 * Cheap way to confirm the serverless backend is actually deployed. If this
 * returns JSON but sign-in reports a network error, the problem is in the auth
 * call, not in routing. Reports only whether SESSION_SECRET is configured,
 * never its value.
 */

import { methodNotAllowed, sendJson, type ApiRequest, type ApiResponse } from './_lib/http';

export default function handler(req: ApiRequest, res: ApiResponse): void {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  sendJson(res, 200, {
    status: 'ok',
    runtime: 'serverless',
    sessionSecretConfigured: Boolean(
      process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32,
    ),
    timestamp: new Date().toISOString(),
  });
}
