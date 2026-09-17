/**
 * Password hashing for the serverless (Vercel) auth functions.
 *
 * Uses scrypt from Node's built-in crypto instead of argon2. The Express dev
 * server keeps argon2id, but a native addon is a poor fit for serverless
 * bundling, and scrypt is a memory-hard KDF that ships with the runtime.
 *
 * Stored format: scrypt$N$r$p$saltHex$keyHex
 */

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const COST = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 32;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, COST);
  return `scrypt$${COST.N}$${COST.r}$${COST.p}$${salt.toString('hex')}$${key.toString('hex')}`;
}

/**
 * Constant-time verification. Returns false on any malformed input rather than
 * throwing, so a corrupt record can never turn into a 500 that leaks detail.
 */
export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  try {
    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

    const [, n, r, p, saltHex, keyHex] = parts;
    const expected = Buffer.from(keyHex, 'hex');
    if (expected.length === 0) return false;

    const derived = await scrypt(password.normalize('NFKC'), Buffer.from(saltHex, 'hex'), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: COST.maxmem,
    });

    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function validatePasswordStrength(password: string): { isValid: boolean; error?: string } {
  if (password.length < 10) {
    return { isValid: false, error: 'Password must be at least 10 characters' };
  }
  if (!/[a-z]/.test(password) || !/[A-Z0-9]/.test(password)) {
    return { isValid: false, error: 'Password must mix lower case with upper case or digits' };
  }
  return { isValid: true };
}
