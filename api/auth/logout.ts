/**
 * POST /api/auth/logout
 *
 * Clears the session cookie. Stateless sessions mean there is nothing to delete
 * server-side; the cookie is expired immediately and the signature stops being
 * accepted once its exp passes.
 */

import { methodNotAllowed, sendJson, type ApiRequest, type ApiResponse } from '../_lib/http';
import { clearSessionCookie } from '../_lib/session';

export default function handler(req: ApiRequest, res: ApiResponse): void {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  sendJson(res, 200, { message: 'Logged out successfully' }, [clearSessionCookie()]);
}
