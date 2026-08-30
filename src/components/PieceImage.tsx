import { useState } from 'react';
import type { Category, Listing } from '../types';
import { CATEGORY_IMAGES, LISTING_IMAGES } from '../data/images';
import { ProductPlate } from './ProductPlate';

/**
 * Resolves the artwork for a piece, most specific first:
 *   1. a photo the seller attached to the listing
 *   2. a curated catalogue photo keyed to the seed listing id
 *   3. a category stand-in
 * Returning undefined means "no photo" and the caller draws the ProductPlate.
 */
export function imageFor(listing: {
  id: string;
  category: Category;
  imageUrl?: string;
}): string | undefined {
  return listing.imageUrl || LISTING_IMAGES[listing.id] || CATEGORY_IMAGES[listing.category];
}

/**
 * Photography for a piece, with the generated ProductPlate as the fallback.
 *
 * The plate covers three cases: no photo exists, the file 404s, or the seller
 * pasted a URL that fails to load. It is deliberately not a grey placeholder —
 * a gilded plate reads as a design decision rather than a missing asset.
 */
export function PieceImage({
  listing,
  className = '',
  sizes,
  eager = false,
  glow = true,
}: {
  listing: Pick<Listing, 'id' | 'brand' | 'title' | 'category'> & { imageUrl?: string };
  className?: string;
  sizes?: string;
  eager?: boolean;
  glow?: boolean;
}) {
  const source = imageFor(listing);
  const [failed, setFailed] = useState(false);

  if (!source || failed) {
    return (
      <ProductPlate
        id={listing.id}
        brand={listing.brand}
        category={listing.category}
        className={className}
        glow={glow}
      />
    );
  }

  return (
    <img
      src={source}
      alt={`${listing.brand} ${listing.title}`}
      onError={() => setFailed(true)}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      sizes={sizes}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
