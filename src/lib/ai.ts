/**
 * Anvaya AI Intelligence Layer — Phase 1 implementation.
 *
 * These are deterministic, explainable heuristics, not a trained model. They
 * exist so the product surfaces (health score, price guidance, recovery
 * recommendation, buyer matching) are real and consistent today, and so the
 * Phase 2 model has a defined contract to slot into: same inputs, same return
 * shapes. Every score ships with its drivers so nothing is a black box.
 */

import type {
  Category,
  Condition,
  InventoryHealth,
  Listing,
  PriceGuidance,
  RecoveryRecommendation,
  User,
} from '../types';
import { daysSince, recoveryRate } from './format';

/** Residual value retained at resale, by condition. */
const CONDITION_FACTOR: Record<Condition, number> = {
  Unworn: 0.92,
  Pristine: 0.82,
  Excellent: 0.7,
  Good: 0.55,
  Restorable: 0.34,
};

/** How readily a category clears on a premium exchange. */
const CATEGORY_LIQUIDITY: Record<Category, number> = {
  Watches: 1.08,
  Handbags: 1.05,
  Jewellery: 0.98,
  Couture: 0.86,
  Footwear: 0.82,
  Eyewear: 0.78,
  Objet: 0.9,
};

/**
 * Brands with a durable secondary market hold value above the category
 * baseline. Anything unlisted falls back to 1.0 and lowers confidence.
 */
const BRAND_STRENGTH: Record<string, number> = {
  'Rolex': 1.34,
  'Patek Philippe': 1.38,
  'Audemars Piguet': 1.26,
  'Cartier': 1.18,
  'Omega': 1.04,
  'Jaeger-LeCoultre': 1.0,
  'Hermès': 1.42,
  'Chanel': 1.24,
  'Louis Vuitton': 1.06,
  'Bottega Veneta': 0.96,
  'Gucci': 0.9,
  'Dior': 0.98,
  'Van Cleef & Arpels': 1.22,
  'Bvlgari': 1.1,
  'Tiffany & Co.': 1.04,
  'Sabyasachi': 1.12,
  'Manish Malhotra': 1.02,
  'Christian Louboutin': 0.88,
  'Berluti': 0.94,
  'Persol': 0.8,
  'Baccarat': 0.92,
  'Lalique': 0.9,
};

const round = (value: number, to = 500) => Math.max(to, Math.round(value / to) * to);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Stable pseudo-random in [0,1) derived from a string — keeps demos repeatable. */
export const seededUnit = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
};

// ---------------------------------------------------------------------------
// AI Demand & Price Intelligence
// ---------------------------------------------------------------------------

export function priceGuidance(input: {
  brand: string;
  category: Category;
  condition: Condition;
  retailPrice: number;
  year: number;
  verified: boolean;
}): PriceGuidance {
  const { brand, category, condition, retailPrice, year, verified } = input;

  const known = Object.prototype.hasOwnProperty.call(BRAND_STRENGTH, brand);
  const brandFactor = BRAND_STRENGTH[brand] ?? 1;
  const liquidity = CATEGORY_LIQUIDITY[category] ?? 1;
  const conditionFactor = CONDITION_FACTOR[condition];

  const age = clamp(new Date().getFullYear() - year, 0, 60);
  /**
   * Two opposing forces on age: ordinary depreciation for the first stretch,
   * then a collectability lift once a piece crosses into vintage territory.
   */
  const depreciation = 1 - Math.min(0.3, age * 0.012);
  const vintageLift = age >= 22 ? 1 + Math.min(0.34, (age - 22) * 0.016) : 1;

  const fair =
    retailPrice * conditionFactor * brandFactor * liquidity * depreciation * vintageLift;

  const spread = known ? 0.13 : 0.2;
  const rationale = [
    `${condition} condition retains ~${Math.round(conditionFactor * 100)}% of retail as a baseline.`,
    known
      ? `${brand} trades at ${brandFactor >= 1 ? 'a premium of' : 'a discount of'} ${Math.round(Math.abs(brandFactor - 1) * 100)}% against category baseline.`
      : `${brand} has thin comparable data — guidance widened and confidence lowered.`,
    `${category} liquidity index ${liquidity.toFixed(2)} on the Premium Exchange.`,
  ];

  if (vintageLift > 1) {
    rationale.push(
      `${age}-year-old piece: collector demand adds ${Math.round((vintageLift - 1) * 100)}%.`,
    );
  } else if (age > 0) {
    rationale.push(`${age} years since release trims ${Math.round((1 - depreciation) * 100)}%.`);
  }

  if (!verified) {
    rationale.push('Not yet authenticated — buyers discount unverified pieces by 8–12%.');
  }

  const confidence: PriceGuidance['confidence'] =
    known && verified ? 'High' : known || verified ? 'Moderate' : 'Low';

  const unverifiedDrag = verified ? 1 : 0.92;

  return {
    floor: round(fair * (1 - spread) * unverifiedDrag),
    fair: round(fair * unverifiedDrag),
    ceiling: round(fair * (1 + spread) * unverifiedDrag),
    confidence,
    rationale,
  };
}

// ---------------------------------------------------------------------------
// AI Inventory Health / Risk Score
// ---------------------------------------------------------------------------

export function inventoryHealth(listing: Listing): InventoryHealth {
  const drivers: string[] = [];
  let score = 100;

  const age = daysSince(listing.listedAt);
  const guidance = priceGuidance(listing);
  const rate = recoveryRate(listing.askingPrice, listing.retailPrice);

  // Days on market — the single strongest signal of stalling inventory.
  if (age > 14) {
    const penalty = Math.min(36, (age - 14) * 0.55);
    score -= penalty;
    drivers.push(`${age} days on market (${Math.round(penalty)} pt drag)`);
  } else {
    drivers.push(`Fresh listing — ${age} day${age === 1 ? '' : 's'} live`);
  }

  // Asking price against model guidance.
  const overAsk = listing.askingPrice / guidance.fair;
  if (overAsk > 1.12) {
    const penalty = Math.min(26, (overAsk - 1.12) * 100);
    score -= penalty;
    drivers.push(`Asking ${Math.round((overAsk - 1) * 100)}% above fair value`);
  } else if (overAsk < 0.88) {
    score += 6;
    drivers.push(`Priced ${Math.round((1 - overAsk) * 100)}% under fair value — should clear fast`);
  } else {
    score += 3;
    drivers.push('Asking price sits inside the fair-value band');
  }

  if (!listing.verified) {
    score -= 12;
    drivers.push('Awaiting authentication');
  } else {
    score += 4;
    drivers.push(`Authenticated${listing.authenticator ? ` by ${listing.authenticator}` : ''}`);
  }

  // Engagement quality: watchers per view beats raw view count.
  if (listing.views >= 25) {
    const conversion = listing.watchers / listing.views;
    if (conversion >= 0.08) {
      score += 9;
      drivers.push(`Strong intent — ${listing.watchers} watchers on ${listing.views} views`);
    } else if (conversion <= 0.02) {
      score -= 9;
      drivers.push(`Weak intent — ${listing.watchers} watchers on ${listing.views} views`);
    }
  } else {
    score -= 4;
    drivers.push('Low visibility so far');
  }

  if (listing.condition === 'Restorable') {
    score -= 7;
    drivers.push('Condition limits the buyer pool');
  }

  if (rate > 0.95) {
    score -= 8;
    drivers.push('Asking near original retail');
  }

  score = Math.round(clamp(score, 4, 99));

  const band: InventoryHealth['band'] =
    score >= 78 ? 'strong' : score >= 58 ? 'steady' : score >= 38 ? 'at_risk' : 'critical';

  const label = {
    strong: 'Strong',
    steady: 'Steady',
    at_risk: 'At risk',
    critical: 'Critical',
  }[band];

  return { score, band, label, drivers: drivers.slice(0, 5) };
}

// ---------------------------------------------------------------------------
// AI Recovery Recommendation
// ---------------------------------------------------------------------------

export function recoveryRecommendation(listing: Listing): RecoveryRecommendation {
  const health = inventoryHealth(listing);
  const guidance = priceGuidance(listing);
  const age = daysSince(listing.listedAt);

  if (health.band === 'critical' || (age > 75 && listing.condition === 'Restorable')) {
    return {
      action: 'route_to_renewal',
      headline: 'Route to an upcycler',
      detail:
        'Recovery through the open market is unlikely at this price and age. An atelier can renew the piece and return it with a stronger story — you recover capital now and share the upside.',
    };
  }

  if (listing.askingPrice > guidance.ceiling) {
    return {
      action: 'reprice',
      headline: `Reprice to ${Math.round(guidance.fair).toLocaleString('en-IN')}`,
      detail: `Current ask is above the modelled ceiling of ₹${guidance.ceiling.toLocaleString('en-IN')}. Moving to fair value typically clears comparable pieces within three weeks.`,
      suggestedPrice: guidance.fair,
    };
  }

  if (health.band === 'at_risk') {
    return {
      action: 'reprice',
      headline: 'Trim the ask to restart momentum',
      detail: `${age} days live with soft engagement. A ${Math.round(((listing.askingPrice - guidance.floor) / listing.askingPrice) * 100)}% adjustment toward the floor of the band re-enters buyer alerts and saved searches.`,
      suggestedPrice: Math.min(listing.askingPrice, guidance.floor),
    };
  }

  if (!listing.verified) {
    return {
      action: 'promote',
      headline: 'Authenticate to unlock the full price band',
      detail:
        'Verified pieces carry the emerald seal on the exchange and clear 8–12% higher. Submit the piece for authentication before promoting it further.',
    };
  }

  if (health.band === 'strong' && listing.watchers >= 8) {
    return {
      action: 'hold',
      headline: 'Hold the ask',
      detail: `${listing.watchers} buyers are watching and the piece is priced inside the band. No action needed — holding firm is the higher-value play.`,
    };
  }

  return {
    action: 'promote',
    headline: 'Promote to matched buyers',
    detail:
      'Health is sound but reach is limited. Pushing this to buyers whose saved interests match the brand and category is the cheapest lever available.',
  };
}

// ---------------------------------------------------------------------------
// Buyer Matching
// ---------------------------------------------------------------------------

/** 0–100 fit between a listing and a buyer's stated interests. */
export function matchScore(listing: Listing, buyer: User | null): number {
  const interests = buyer?.interests;
  if (!interests) return 0;

  let score = 34;

  if (interests.categories.includes(listing.category)) score += 26;
  if (interests.brands.includes(listing.brand)) score += 24;

  const ratio = listing.askingPrice / interests.budget;
  if (ratio <= 1) score += 14 * (0.55 + 0.45 * ratio);
  else score -= Math.min(30, (ratio - 1) * 46);

  if (listing.verified) score += 8;
  if (listing.condition === 'Unworn' || listing.condition === 'Pristine') score += 5;
  if (listing.renewedFrom) score += 3;

  return Math.round(clamp(score, 0, 99));
}

export { CONDITION_FACTOR, CATEGORY_LIQUIDITY, BRAND_STRENGTH };
