/**
 * GET /api/health
 *
 * Cheap way to confirm the serverless backend is actually deployed and running.
 * JSON here plus a failing sign-in means the problem is credentials or rate
 * limiting; HTML here means the functions were never built.
 *
 * Self-contained on purpose — see the note at the top of api/auth.ts.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';

export default function handler(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
): void {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(
    JSON.stringify({
      status: 'ok',
      runtime: 'serverless',
      // Reports only whether the secret is configured, never its value.
      sessionSecretConfigured: Boolean(
        process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32,
      ),
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    }),
  );
}
