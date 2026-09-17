/**
 * One-off helper: prints scrypt hashes for the demo accounts so they can be
 * embedded in api/auth.ts the way a real database row would hold them.
 *
 * Kept independent of api/auth.ts (which exports only its request handler) so the
 * function file stays free of anything the runtime does not need.
 *
 * Usage: npx tsx scripts/gen-demo-hashes.ts [password]
 */

import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

// Must match the cost parameters in api/auth.ts.
const COST = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

const ids = ['b-aditi', 's-kabir', 'u-noor', 's-colaba', 's-verve', 's-sudarshan'];
const password = process.argv[2] ?? 'anvaya2024';

for (const id of ids) {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize('NFKC'), salt, 32, COST);
  console.log(
    `${id}\tscrypt$${COST.N}$${COST.r}$${COST.p}$${salt.toString('hex')}$${key.toString('hex')}`,
  );
}
