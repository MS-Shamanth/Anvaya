/**
 * GET /api/auth/me
 *
 * Returns the authenticated user for a valid session cookie, 401 otherwise.
 * This is the endpoint the frontend calls on load to restore session state.
 */

import { methodNotAllowed, sendJson, type ApiRequest, type ApiResponse } from '../_lib/http';
import { clearSessionCookie, readSession } from '../_lib/session';
import { findUserById, toSafeUser } from '../_lib/users';

export default function handler(req: ApiRequest, res: ApiResponse): void {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  const session = readSession(req.headers.cookie);
  if (!session) {
    sendJson(res, 401, { error: 'Authentication required' });
    return;
  }

  const user = findUserById(session.uid);
  if (!user) {
    // Signed session for an account that no longer exists — drop the cookie.
    sendJson(res, 401, { error: 'Authentication required' }, [clearSessionCookie()]);
    return;
  }

  sendJson(res, 200, { user: toSafeUser(user) });
}
