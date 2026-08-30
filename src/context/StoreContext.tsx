import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Condition, Listing, Order, RenewalProject, RenewalStage } from '../types';
import { SEED_LISTINGS, SEED_ORDERS, SEED_PROJECTS } from '../data/seed';
import { load, resetAll, save, uid } from '../lib/storage';

/** Anvaya's cut, charged to the buyer and held in escrow with the price. */
const PLATFORM_FEE_RATE = 0.05;

/** Insured, white-glove delivery. Fragile and bulky categories cost more. */
const SHIPPING = { standard: 2_500, fragile: 6_500 } as const;

export interface Quote {
  amount: number;
  fee: number;
  shipping: number;
  total: number;
}

export function quoteFor(listing: Listing): Quote {
  const amount = listing.askingPrice;
  const fee = Math.round(amount * PLATFORM_FEE_RATE);
  const shipping =
    listing.category === 'Objet' || listing.category === 'Couture'
      ? SHIPPING.fragile
      : SHIPPING.standard;
  return { amount, fee, shipping, total: amount + fee + shipping };
}

export type NewListingInput = Pick<
  Listing,
  | 'title'
  | 'brand'
  | 'category'
  | 'condition'
  | 'description'
  | 'askingPrice'
  | 'retailPrice'
  | 'year'
  | 'materials'
  | 'location'
  | 'includes'
  | 'imageUrl'
>;

const RENEWAL_FLOW: RenewalStage[] = ['intake', 'restoration', 'quality_check', 'relisted'];

interface StoreValue {
  listings: Listing[];
  orders: Order[];
  projects: RenewalProject[];
  watchlist: string[];

  listingById: (id: string) => Listing | undefined;
  liveListings: Listing[];
  renewalPool: Listing[];
  listingsBySeller: (sellerId: string) => Listing[];
  ordersByBuyer: (buyerId: string) => Order[];
  ordersBySeller: (sellerId: string) => Order[];
  projectsByUpcycler: (upcyclerId: string) => RenewalProject[];

  createListing: (input: NewListingInput, sellerId: string, publish: boolean) => Listing;
  updateListing: (id: string, patch: Partial<Listing>) => void;
  publishListing: (id: string) => void;
  routeToRenewal: (id: string, brief: string, reserve: number) => void;
  withdrawFromRenewal: (id: string) => void;
  purchase: (listingId: string, buyerId: string) => Order | null;
  advanceOrder: (orderId: string) => void;
  toggleWatch: (listingId: string) => void;
  isWatched: (listingId: string) => boolean;
  recordView: (listingId: string) => void;

  claimForRenewal: (
    listingId: string,
    upcyclerId: string,
    restorationBudget: number,
    targetPrice: number,
  ) => RenewalProject | null;
  advanceProject: (projectId: string, note: string) => void;
  logProjectNote: (projectId: string, note: string) => void;
  relistRenewed: (
    projectId: string,
    input: { askingPrice: number; condition: Condition; summary: string },
  ) => Listing | null;

  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<Listing[]>(() => load('listings', SEED_LISTINGS));
  const [orders, setOrders] = useState<Order[]>(() => load('orders', SEED_ORDERS));
  const [projects, setProjects] = useState<RenewalProject[]>(() => load('projects', SEED_PROJECTS));
  const [watchlist, setWatchlist] = useState<string[]>(() => load('watchlist', ['l-002', 'l-010']));

  useEffect(() => save('listings', listings), [listings]);
  useEffect(() => save('orders', orders), [orders]);
  useEffect(() => save('projects', projects), [projects]);
  useEffect(() => save('watchlist', watchlist), [watchlist]);

  const patchListing = useCallback((id: string, patch: Partial<Listing>) => {
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const value = useMemo<StoreValue>(() => {
    const listingById = (id: string) => listings.find((l) => l.id === id);

    return {
      listings,
      orders,
      projects,
      watchlist,

      listingById,
      liveListings: listings.filter((l) => l.status === 'live'),
      renewalPool: listings.filter((l) => l.status === 'renewal_pool'),
      listingsBySeller: (sellerId) => listings.filter((l) => l.sellerId === sellerId),
      ordersByBuyer: (buyerId) =>
        orders
          .filter((o) => o.buyerId === buyerId)
          .sort((a, b) => +new Date(b.placedAt) - +new Date(a.placedAt)),
      ordersBySeller: (sellerId) => orders.filter((o) => o.sellerId === sellerId),
      projectsByUpcycler: (upcyclerId) =>
        projects
          .filter((p) => p.upcyclerId === upcyclerId)
          .sort((a, b) => +new Date(b.claimedAt) - +new Date(a.claimedAt)),

      // ------------------------------------------------------------------ seller
      createListing: (input, sellerId, publish) => {
        const listing: Listing = {
          ...input,
          id: uid('l'),
          sku: `ANV-${input.category.charAt(0).toUpperCase()}-${1000 + listings.length + 1}`,
          sellerId,
          status: publish ? 'live' : 'draft',
          verified: false,
          listedAt: new Date().toISOString(),
          views: 0,
          watchers: 0,
        };
        setListings((prev) => [listing, ...prev]);
        return listing;
      },

      updateListing: patchListing,

      publishListing: (id) =>
        patchListing(id, { status: 'live', listedAt: new Date().toISOString() }),

      routeToRenewal: (id, brief, reserve) =>
        patchListing(id, { status: 'renewal_pool', renewal: { brief, reserve } }),

      withdrawFromRenewal: (id) => patchListing(id, { status: 'live' }),

      // ------------------------------------------------------------------- buyer
      purchase: (listingId, buyerId) => {
        const listing = listingById(listingId);
        if (!listing || listing.status !== 'live') return null;

        const quote = quoteFor(listing);
        const order: Order = {
          id: uid('o'),
          reference: `ANV-${new Date().getFullYear()}-${String(419 + orders.length).padStart(4, '0')}`,
          listingId: listing.id,
          listingTitle: listing.title,
          listingBrand: listing.brand,
          buyerId,
          sellerId: listing.sellerId,
          ...quote,
          placedAt: new Date().toISOString(),
          stage: 'escrow',
          trackingCode: `ANV-LOG-${Math.floor(10_000 + Math.random() * 89_999)}`,
        };

        setOrders((prev) => [order, ...prev]);
        patchListing(listing.id, { status: 'sold' });
        return order;
      },

      /** Nudges an order along its escrow → delivered timeline. */
      advanceOrder: (orderId) =>
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id !== orderId) return o;
            const flow: Order['stage'][] = ['escrow', 'authenticating', 'in_transit', 'delivered'];
            const next = flow[Math.min(flow.length - 1, flow.indexOf(o.stage) + 1)]!;
            return { ...o, stage: next };
          }),
        ),

      toggleWatch: (listingId) => {
        setWatchlist((prev) =>
          prev.includes(listingId) ? prev.filter((id) => id !== listingId) : [...prev, listingId],
        );
        const listing = listingById(listingId);
        if (listing) {
          patchListing(listingId, {
            watchers: Math.max(0, listing.watchers + (watchlist.includes(listingId) ? -1 : 1)),
          });
        }
      },

      isWatched: (listingId) => watchlist.includes(listingId),

      recordView: (listingId) => {
        const listing = listingById(listingId);
        if (listing) patchListing(listingId, { views: listing.views + 1 });
      },

      // ---------------------------------------------------------------- upcycler
      claimForRenewal: (listingId, upcyclerId, restorationBudget, targetPrice) => {
        const listing = listingById(listingId);
        if (!listing || listing.status !== 'renewal_pool') return null;

        const project: RenewalProject = {
          id: uid('p'),
          reference: `RNW-${String(92 + projects.length).padStart(4, '0')}`,
          listingId: listing.id,
          listingTitle: listing.title,
          listingBrand: listing.brand,
          upcyclerId,
          claimedAt: new Date().toISOString(),
          acquisitionCost: listing.renewal?.reserve ?? listing.askingPrice,
          restorationBudget,
          targetPrice,
          stage: 'intake',
          log: [
            {
              at: new Date().toISOString(),
              note: 'Claimed from the renewal pool. Awaiting intake inspection.',
            },
          ],
        };

        setProjects((prev) => [project, ...prev]);
        patchListing(listing.id, { status: 'in_renewal' });
        return project;
      },

      advanceProject: (projectId, note) =>
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id !== projectId) return p;
            const index = RENEWAL_FLOW.indexOf(p.stage);
            // 'relisted' is only reachable through relistRenewed.
            const next = RENEWAL_FLOW[Math.min(RENEWAL_FLOW.length - 2, index + 1)]!;
            return {
              ...p,
              stage: next,
              log: [...p.log, { at: new Date().toISOString(), note }],
            };
          }),
        ),

      logProjectNote: (projectId, note) =>
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, log: [...p.log, { at: new Date().toISOString(), note }] }
              : p,
          ),
        ),

      /**
       * Closes the loop: the renewed piece goes back on the exchange under the
       * upcycler's name, carrying provenance back to the original listing, and
       * the original is archived so it can't be found or bought twice.
       */
      relistRenewed: (projectId, input) => {
        const project = projects.find((p) => p.id === projectId);
        if (!project) return null;
        const origin = listingById(project.listingId);
        if (!origin) return null;

        const renewed: Listing = {
          ...origin,
          id: uid('l'),
          sku: `ANV-R-${9_000 + projects.length + 1}`,
          title: origin.title.includes('Renewed') ? origin.title : `${origin.title} — Renewed`,
          condition: input.condition,
          askingPrice: input.askingPrice,
          sellerId: project.upcyclerId,
          status: 'live',
          verified: true,
          authenticator: 'Anvaya Renewal Desk',
          listedAt: new Date().toISOString(),
          views: 0,
          watchers: 0,
          renewal: undefined,
          renewedFrom: origin.id,
          renewedBy: project.upcyclerId,
          renewalSummary: input.summary,
        };

        setListings((prev) => [renewed, ...prev.map((l) => (l.id === origin.id ? { ...l, status: 'archived' as const } : l))]);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  stage: 'relisted',
                  relistedListingId: renewed.id,
                  targetPrice: input.askingPrice,
                  log: [
                    ...p.log,
                    {
                      at: new Date().toISOString(),
                      note: `Relisted on the Premium Exchange at ₹${input.askingPrice.toLocaleString('en-IN')}.`,
                    },
                  ],
                }
              : p,
          ),
        );

        return renewed;
      },

      resetDemo: () => {
        resetAll();
        setListings(SEED_LISTINGS);
        setOrders(SEED_ORDERS);
        setProjects(SEED_PROJECTS);
        setWatchlist(['l-002', 'l-010']);
      },
    };
  }, [listings, orders, projects, watchlist, patchListing]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used inside <StoreProvider>');
  return context;
}
