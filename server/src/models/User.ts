/**
 * User model and database operations.
 * 
 * Currently uses in-memory storage for development.
 * In production, replace with PostgreSQL/MySQL/MongoDB.
 */

import type { User, SafeUser } from '../types.js';
import { hashPassword } from '../utils/password.js';

/**
 * In-memory user database.
 * In production: Replace with actual database queries.
 */
const users: User[] = [];

/**
 * Converts User to SafeUser (removes sensitive fields).
 */
export function toSafeUser(user: User): SafeUser {
  const { passwordHash, emailVerified, createdAt, updatedAt, ...safe } = user;
  return safe;
}

/**
 * Find user by ID.
 */
export async function findUserById(id: string): Promise<User | null> {
  return users.find(u => u.id === id) || null;
}

/**
 * Find user by email (case-insensitive).
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.toLowerCase().trim();
  return users.find(u => u.email.toLowerCase() === normalizedEmail) || null;
}

/**
 * Create a new user.
 */
export async function createUser(userData: {
  email: string;
  password: string;
  name: string;
  role: Role;
  org: string;
  standing: 'Invited' | 'Verified' | 'Atelier' | 'Founding';
  interests?: { categories: string[]; brands: string[]; budget: number };
}): Promise<User> {
  const passwordHash = await hashPassword(userData.password);
  const now = new Date().toISOString();
  
  // Generate initials from name
  const initials = userData.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const user: User = {
    id: `u-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: userData.name,
    email: userData.email.toLowerCase().trim(),
    passwordHash,
    role: userData.role,
    org: userData.org,
    initials,
    memberSince: now,
    standing: userData.standing,
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
    interests: userData.interests,
  };

  users.push(user);
  return user;
}

/**
 * Update user password.
 */
export async function updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
  const user = await findUserById(userId);
  if (!user) return false;

  user.passwordHash = await hashPassword(newPassword);
  user.updatedAt = new Date().toISOString();
  return true;
}

/**
 * Update user email verification status.
 */
export async function verifyUserEmail(userId: string): Promise<boolean> {
  const user = await findUserById(userId);
  if (!user) return false;

  user.emailVerified = true;
  user.updatedAt = new Date().toISOString();
  return true;
}

/**
 * Get all users (for admin purposes, returns safe data).
 */
export async function getAllUsers(): Promise<SafeUser[]> {
  return users.map(toSafeUser);
}

/**
 * Seed initial users for development.
 */
export async function seedUsers(): Promise<void> {
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

  // Only seed if database is empty
  if (users.length > 0) return;

  const seedData = [
    {
      id: 'b-aditi',
      name: 'Aditi Rao',
      email: 'aditi@anvaya.exchange',
      password: 'anvaya2024',
      role: 'buyer' as Role,
      org: 'Rao Family Office',
      initials: 'AR',
      memberSince: daysAgo(410),
      standing: 'Verified' as const,
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
      password: 'anvaya2024',
      role: 'seller' as Role,
      org: 'Mehta Luxury Consignment',
      initials: 'KM',
      memberSince: daysAgo(620),
      standing: 'Founding' as const,
    },
    {
      id: 'u-noor',
      name: 'Noor Sheikh',
      email: 'noor@anvaya.exchange',
      password: 'anvaya2024',
      role: 'upcycler' as Role,
      org: 'Atelier Noor',
      initials: 'NS',
      memberSince: daysAgo(300),
      standing: 'Atelier' as const,
    },
    {
      id: 's-colaba',
      name: 'Rhea Fernandes',
      email: 'rhea@colabavault.in',
      password: 'anvaya2024',
      role: 'seller' as Role,
      org: 'The Colaba Vault',
      initials: 'RF',
      memberSince: daysAgo(500),
      standing: 'Verified' as const,
    },
    {
      id: 's-verve',
      name: 'Dev Khanna',
      email: 'dev@ververetail.in',
      password: 'anvaya2024',
      role: 'seller' as Role,
      org: 'Verve Retail Group',
      initials: 'DK',
      memberSince: daysAgo(275),
      standing: 'Verified' as const,
    },
    {
      id: 's-sudarshan',
      name: 'Ira Sudarshan',
      email: 'ira@sudarshanheritage.in',
      password: 'anvaya2024',
      role: 'seller' as Role,
      org: 'Sudarshan Heritage',
      initials: 'IS',
      memberSince: daysAgo(190),
      standing: 'Invited' as const,
    },
  ];

  for (const data of seedData) {
    const passwordHash = await hashPassword(data.password);
    const now = new Date().toISOString();

    const user: User = {
      id: data.id,
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role,
      org: data.org,
      initials: data.initials,
      memberSince: data.memberSince,
      standing: data.standing,
      emailVerified: true, // Pre-verified for demo users
      createdAt: now,
      updatedAt: now,
      interests: (data as any).interests,
    };

    users.push(user);
  }

  console.log(`✅ Seeded ${users.length} demo users`);
}
