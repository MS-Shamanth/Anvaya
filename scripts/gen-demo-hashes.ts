/**
 * One-off helper: prints scrypt hashes for the demo accounts so they can be
 * embedded in api/_lib/users.ts the way a real database row would hold them.
 *
 * Usage: npx tsx scripts/gen-demo-hashes.ts
 */

import { hashPassword } from '../api/_lib/password';

const ids = ['b-aditi', 's-kabir', 'u-noor', 's-colaba', 's-verve', 's-sudarshan'];
const password = process.argv[2] ?? 'anvaya2024';

for (const id of ids) {
  console.log(`${id}\t${await hashPassword(password)}`);
}
