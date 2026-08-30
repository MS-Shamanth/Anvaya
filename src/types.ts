/**
 * Anvaya — Phase 1 domain model (Premium / Luxury Exchange).
 *
 * The three Phase 1 roles meet around a single object: a Listing. A seller
 * creates it, a buyer acquires it, and an upcycler can take it out of the
 * market, renew it, and put it back — which is why the lifecycle lives here
 * rather than being split per role.
 */

export type Role = 'buyer' | 'seller' | 'upcycler';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Company, maison, or atelier the account trades under. */
  org: string;
  initials: string;
  memberSince: string;
  /** Trust standing shown next to the account name. */
  standing: 'Invited' | 'Verified' | 'Atelier' | 'Founding';
  /** Buyer-only: powers the "Matched for you" rail. */
  interests?: { categories: Category[]; brands: string[]; budget: number };
}

export type Category =
  | 'Watches'
  | 'Handbags'
  | 'Jewellery'
  | 'Couture'
  | 'Footwear'
  | 'Eyewear'
  | 'Objet';

export const CATEGORIES: Category[] = [
  'Watches',
  'Handbags',
  'Jewellery',
  'Couture',
  'Footwear',
  'Eyewear',
  'Objet',
];

export type Condition = 'Unworn' | 'Pristine' | 'Excellent' | 'Good' | 'Restorable';

export const CONDITIONS: Condition[] = ['Unworn', 'Pristine', 'Excellent', 'Good', 'Restorable'];

/**
 * Listing lifecycle:
 *
 *   draft ──▶ live ──▶ sold
 *               │
 *               └──▶ renewal_pool ──▶ in_renewal ──▶ archived
 *                    (seller offers)   (upcycler      (superseded by the
 *                                       claims)        renewed relisting)
 */
export type ListingStatus = 'draft' | 'live' | 'sold' | 'renewal_pool' | 'in_renewal' | 'archived';

export interface Listing {
  id: string;
  sku: string;
  title: string;
  brand: string;
  category: Category;
  condition: Condition;
  description: string;
  /** What the seller is asking, in INR. */
  askingPrice: number;
  /** Original retail, used for recovery-rate maths. */
  retailPrice: number;
  year: number;
  materials: string;
  location: string;
  includes: string[];
  sellerId: string;
  status: ListingStatus;
  verified: boolean;
  authenticator?: string;
  /**
   * Photography for the piece. Optional: when absent, the UI resolves a curated
   * catalogue image or falls back to the generated ProductPlate.
   */
  imageUrl?: string;
  listedAt: string;
  views: number;
  watchers: number;
  /** Present once a seller routes the piece to the upcycling channel. */
  renewal?: { brief: string; reserve: number };
  /** Provenance for pieces that came back through an atelier. */
  renewedFrom?: string;
  renewedBy?: string;
  renewalSummary?: string;
}

export type OrderStage = 'escrow' | 'authenticating' | 'in_transit' | 'delivered';

export interface Order {
  id: string;
  reference: string;
  listingId: string;
  listingTitle: string;
  listingBrand: string;
  buyerId: string;
  sellerId: string;
  /** Agreed price for the piece. */
  amount: number;
  /** Anvaya escrow + authentication fee. */
  fee: number;
  shipping: number;
  total: number;
  placedAt: string;
  stage: OrderStage;
  trackingCode: string;
}

export type RenewalStage = 'intake' | 'restoration' | 'quality_check' | 'relisted';

export interface RenewalProject {
  id: string;
  reference: string;
  listingId: string;
  listingTitle: string;
  listingBrand: string;
  upcyclerId: string;
  claimedAt: string;
  /** What the upcycler paid the seller to take the piece on. */
  acquisitionCost: number;
  /** Budgeted spend on parts, labour, and authentication. */
  restorationBudget: number;
  targetPrice: number;
  stage: RenewalStage;
  log: { at: string; note: string }[];
  relistedListingId?: string;
}

/** Rule-based stand-in for the Phase 2 pricing model. */
export interface PriceGuidance {
  floor: number;
  fair: number;
  ceiling: number;
  confidence: 'Low' | 'Moderate' | 'High';
  rationale: string[];
}

export type HealthBand = 'strong' | 'steady' | 'at_risk' | 'critical';

export interface InventoryHealth {
  score: number;
  band: HealthBand;
  label: string;
  drivers: string[];
}

export type RecoveryAction = 'promote' | 'hold' | 'reprice' | 'route_to_renewal';

export interface RecoveryRecommendation {
  action: RecoveryAction;
  headline: string;
  detail: string;
  /** Suggested new asking price when the action is a reprice. */
  suggestedPrice?: number;
}
