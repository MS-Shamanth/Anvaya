/**
 * Small request/response helpers shared by the serverless auth functions.
 *
 * Everything is written against Node's plain http types rather than the Vercel
 * request/response helpers, so the same handlers run under any Node host and the
 * project needs no extra dependency.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';

export type ApiRequest = IncomingMessage & { body?: unknown };
export type ApiResponse = ServerResponse<IncomingMessage>;

export function sendJson(
  res: ApiResponse,
  status: number,
  body: unknown,
  cookies: string[] = [],
): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (cookies.length > 0) res.setHeader('Set-Cookie', cookies);
  res.end(JSON.stringify(body));
}

/**
 * Reads a JSON body. Vercel usually pre-parses it onto req.body; when it does
 * not (or when the handler runs behind a different host) fall back to the stream.
 */
export async function readJsonBody(req: ApiRequest): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object') return req.body as Record<string, unknown>;

  if (typeof req.body === 'string' && req.body.length > 0) {
    return safeParse(req.body);
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return safeParse(Buffer.concat(chunks).toString('utf8'));
}

function safeParse(raw: string): Record<string, unknown> {
  if (!raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function methodNotAllowed(res: ApiResponse, allowed: string[]): void {
  res.setHeader('Allow', allowed.join(', '));
  sendJson(res, 405, { error: 'Method not allowed' });
}

export function clientIp(req: ApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (first) return first.split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}

export function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
