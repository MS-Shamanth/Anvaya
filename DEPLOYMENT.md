# Deploying Anvaya to Vercel

## Why sign-in used to fail in production

The frontend calls `POST /api/auth/login`. Vercel was only serving the Vite build, so
that path fell through to the SPA and returned `index.html`. `response.json()` then
threw, the `catch` block ran, and the UI reported:

> Network error. Please check your connection.

Nothing was wrong with the network or the credentials — there was no backend at that
URL. The Express server in `server/` only ever listened on `localhost:3001`.

## What runs where now

| Environment | Backend | Password hashing | Session |
| --- | --- | --- | --- |
| `npm run dev` | `api/` handlers mounted in-process by a Vite plugin | scrypt (`node:crypto`) | HMAC-signed HttpOnly cookie |
| Vercel | `api/` as Node serverless functions | scrypt (`node:crypto`) | HMAC-signed HttpOnly cookie |
| `npm run dev:express` | Express (`server/`) | argon2id | `express-session` memory store |

Dev and production now share the same code, so a login that works locally works
deployed.

Why the serverless functions do not reuse `server/`:

- `express-session` with the default memory store cannot work across serverless
  instances — a session written by one invocation is invisible to the next.
- `argon2` is a native addon. Signed cookies plus `node:crypto` scrypt keep the
  functions dependency-free and cold-start friendly.

## Why the functions are two self-contained files

`api/` holds exactly two files, and neither imports the other or anything else in
the repo:

- `api/auth.ts` — every auth action, selected by `?action=login|logout|me|forgot-password|reset-password`
- `api/health.ts` — deployment probe

That shape is deliberate. Vercel transpiles each function file separately and runs
the output as Node ESM without rewriting relative import specifiers, so a helper
imported as `./_lib/session` resolves during local development (Vite resolves it)
and throws `ERR_MODULE_NOT_FOUND` in production. The function then never starts and
the platform returns an HTML `500`, which the browser reported as a vague sign-in
error. See [vercel/vercel#14910](https://github.com/vercel/vercel/issues/14910).

The frontend calls `/api/auth?action=login` — the function's own path — so routing
does not depend on a rewrite or a dynamic segment. `vercel.json` additionally maps
`/api/auth/<action>` onto the same function, which keeps the tidier REST-style URLs
working for curl and for the Express implementation in `server/`.

## Required configuration

Set one environment variable in **Vercel → Project → Settings → Environment
Variables** (Production, Preview, and Development):

```
SESSION_SECRET = <at least 32 random characters>
```

Generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

If `SESSION_SECRET` is missing the functions still sign in — they fall back to a
public default and log a warning — but session cookies are forgeable by anyone who
reads this repository. Treat setting it as mandatory.

## Verifying a deployment

1. `https://<your-app>.vercel.app/api/health` should return JSON with
   `"status":"ok"` and `"sessionSecretConfigured":true`.
   - HTML instead of JSON means the functions were not built. Check that `api/` is
     committed and that the build log lists the serverless functions.
   - A `500` means the function was built but crashed on invocation. Open
     Vercel → Deployment → Runtime Logs; the stack trace names the cause. An
     `ERR_MODULE_NOT_FOUND` there means something in `api/` grew a relative import
     again — keep those files self-contained.
2. Sign in with a demo account (password `anvaya2024`):
   - `aditi@anvaya.exchange` (buyer)
   - `kabir@anvaya.exchange` (seller)
   - `noor@anvaya.exchange` (upcycler)
3. Reload the page. You should stay signed in, which proves the cookie survives and
   `GET /api/auth/me` validates it.

`vercel.json` keeps `/api/*` out of the SPA rewrite; every other path falls back to
`index.html` for React Router.

## Known limits of this deployment

These are demo constraints, not bugs:

- **Fixed user directory.** `api/auth.ts` holds six accounts. There is no
  registration, and password changes cannot persist, so the `reset-password` action
  returns `503` on purpose rather than pretending to succeed.
- **Rate limiting is per instance.** Attempts are counted in instance memory. It
  slows a single attacker but is not a global limit. Move the counters to Vercel KV /
  Upstash Redis for real protection.
- **Public demo password.** The password is printed in the UI by design. Remove the
  demo accounts before putting real inventory or users on the exchange.

## Moving to real users

1. Add a database (Postgres/Neon/Supabase) and replace the `USERS` lookup in
   `api/auth.ts` with queries.
2. Add registration and email verification actions to `api/auth.ts`.
3. Back the rate-limit counters with a shared store.
4. Implement password reset with a real mail provider and a tokens table, then drop
   the `503` from the `reset-password` action.
5. Enforce role checks server-side on every data endpoint as they are added — the
   `RequireAuth` component is UI protection only.
