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
| `npm run server` + `ANVAYA_API=proxy npm run dev` | Express (`server/`) | argon2id | `express-session` memory store |

Dev and production now share the same code, so a login that works locally works
deployed.

Why the serverless functions do not reuse `server/`:

- `express-session` with the default memory store cannot work across serverless
  instances — a session written by one invocation is invisible to the next.
- `argon2` is a native addon. Signed cookies plus `node:crypto` scrypt keep the
  functions dependency-free and cold-start friendly.

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

- **Fixed user directory.** `api/_lib/users.ts` holds six accounts. There is no
  registration, and password changes cannot persist, so `POST /api/auth/reset-password`
  returns `503` on purpose rather than pretending to succeed.
- **Rate limiting is per instance.** `api/_lib/rateLimit.ts` counts attempts in
  instance memory. It slows a single attacker but is not a global limit. Move the
  counters to Vercel KV / Upstash Redis for real protection.
- **Public demo password.** The password is printed in the UI by design. Remove the
  demo accounts before putting real inventory or users on the exchange.

## Moving to real users

1. Add a database (Postgres/Neon/Supabase) and replace `findUserByEmail` /
   `findUserById` in `api/_lib/users.ts` with queries.
2. Add registration and email verification endpoints under `api/auth/`.
3. Back `api/_lib/rateLimit.ts` with a shared store.
4. Implement password reset with a real mail provider and a tokens table, then drop
   the `503` in `api/auth/reset-password.ts`.
5. Enforce role checks server-side on every data endpoint as they are added — the
   `RequireAuth` component is UI protection only.
