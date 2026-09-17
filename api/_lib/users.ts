/**
 * Demo user directory for the serverless auth functions.
 *
 * These records stand in for database rows. The hashes below were produced with
 * api/_lib/password.ts (see scripts/gen-demo-hashes.ts) over the public demo
 * password, so nothing secret is committed here.
 *
 * To move to a real database, replace findUserByEmail/findUserById with queries
 * and drop this array. Nothing else in the api/ folder needs to change.
 */

export type Role = 'buyer' | 'seller' | 'upcycler';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  org: string;
  initials: string;
  memberSince: string;
  standing: 'Invited' | 'Verified' | 'Atelier' | 'Founding';
  interests?: { categories: string[]; brands: string[]; budget: number };
}

export type SafeUser = Omit<StoredUser, 'passwordHash'>;

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const USERS: StoredUser[] = [
  {
    id: 'b-aditi',
    name: 'Aditi Rao',
    email: 'aditi@anvaya.exchange',
    passwordHash:
      'scrypt$16384$8$1$1a946fc932cdb26613b7ea0969fec727$e4b9548eb8c46d84f9d484416e0b2ffab81ee53881b0a7e728321dbaca5309e1',
    role: 'buyer',
    org: 'Rao Family Office',
    initials: 'AR',
    memberSince: daysAgo(410),
    standing: 'Verified',
    interests: {
      categories: ['Watches', 'Jewellery', 'Handbags'],
      brands: ['Cartier', 'Van Cleef & Arpels', 'Hermès', 'Rolex'],
      budget: 1_800_000,
    },
  },
  {
    id: 's-kabir',
    name: 'Kabir Mehta',
    email: 'kabir@anvaya.exchange',
    passwordHash:
      'scrypt$16384$8$1$76bf116b5a69b1eb462c9b583521861e$0cd710cdef8b3dba390308450373602b7383ebd303e5621154c68d5293390417',
    role: 'seller',
    org: 'Mehta Luxury Consignment',
    initials: 'KM',
    memberSince: daysAgo(620),
    standing: 'Founding',
  },
  {
    id: 'u-noor',
    name: 'Noor Sheikh',
    email: 'noor@anvaya.exchange',
    passwordHash:
      'scrypt$16384$8$1$4bcc9690fc567a21cb08aa675810fa97$26e159b00ee8188179bf03e81f9589e1e04e134a91c6481fb71cadf2a9747c9e',
    role: 'upcycler',
    org: 'Atelier Noor',
    initials: 'NS',
    memberSince: daysAgo(300),
    standing: 'Atelier',
  },
  {
    id: 's-colaba',
    name: 'Rhea Fernandes',
    email: 'rhea@colabavault.in',
    passwordHash:
      'scrypt$16384$8$1$b6edfd7dc3bab11f5466ea954a71ddd0$4cdd2ff4fe8003ff90c5c2d1279c45c226de24094710bb89a865163b8cdfca6c',
    role: 'seller',
    org: 'The Colaba Vault',
    initials: 'RF',
    memberSince: daysAgo(500),
    standing: 'Verified',
  },
  {
    id: 's-verve',
    name: 'Dev Khanna',
    email: 'dev@ververetail.in',
    passwordHash:
      'scrypt$16384$8$1$121292454a21c5f284cf926dd4826756$597eb1d76cfe444619d78f2083abe052e508034fd27dd846921b9a3396bfffdb',
    role: 'seller',
    org: 'Verve Retail Group',
    initials: 'DK',
    memberSince: daysAgo(275),
    standing: 'Verified',
  },
  {
    id: 's-sudarshan',
    name: 'Ira Sudarshan',
    email: 'ira@sudarshanheritage.in',
    passwordHash:
      'scrypt$16384$8$1$979becf45027fb5df397cfd7bf45e41c$6db6cf748023b3b55672c7012ad7f25780bc2b0a7820a8d2edea8a243ba73b26',
    role: 'seller',
    org: 'Sudarshan Heritage',
    initials: 'IS',
    memberSince: daysAgo(190),
    standing: 'Invited',
  },
];

export function toSafeUser(user: StoredUser): SafeUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export function findUserByEmail(email: string): StoredUser | null {
  const normalized = email.toLowerCase().trim();
  return USERS.find((user) => user.email === normalized) ?? null;
}

export function findUserById(id: string): StoredUser | null {
  return USERS.find((user) => user.id === id) ?? null;
}
