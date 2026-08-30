import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import type { Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { usePointerBeacon, useScrollY } from '../lib/motion';
import { Monogram, Wordmark } from './Monogram';
import { Aurora } from './effects/Aurora';
import { Grain, ScrollProgress, Spotlight } from './effects/Atmosphere';

const NAV: Record<Role, { to: string; label: string }[]> = {
  buyer: [
    { to: '/browse', label: 'Exchange' },
    { to: '/watchlist', label: 'Watchlist' },
    { to: '/orders', label: 'Acquisitions' },
  ],
  seller: [
    { to: '/seller', label: 'Inventory' },
    { to: '/seller/new', label: 'List a piece' },
    { to: '/browse', label: 'Exchange' },
  ],
  upcycler: [
    { to: '/upcycler', label: 'Renewal pool' },
    { to: '/upcycler/projects', label: 'Atelier' },
    { to: '/browse', label: 'Exchange' },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  buyer: 'Buyer',
  seller: 'Seller',
  upcycler: 'Upcycler',
};

/** Returns the viewer to the top of the page whenever the route changes. */
function useScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
}

function AccountMenu() {
  const { user, signOut } = useAuth();
  const { resetDemo } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="border-gold-500/22 bg-ink-900/60 hover:border-gold-400/60 flex items-center gap-2.5 rounded-full border py-1.5 pr-3.5 pl-1.5 transition-all duration-300"
      >
        <span className="bg-gilded text-ink-950 flex size-7 items-center justify-center rounded-full text-[0.66rem] font-bold">
          {user.initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="text-mist-200 block text-[0.72rem] leading-tight">{user.name}</span>
          <span className="text-gold-400/80 block text-[0.55rem] tracking-[0.18em] uppercase">
            {ROLE_LABEL[user.role]}
          </span>
        </span>
        <span className="text-mist-500 text-[0.6rem]">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="plate rise absolute right-0 z-50 mt-2 w-64 overflow-hidden p-1.5"
        >
          <div className="border-gold-500/12 border-b px-3 py-3">
            <p className="text-mist-100 text-sm">{user.org}</p>
            <p className="text-mist-500 mt-0.5 text-[0.68rem]">{user.email}</p>
            <p className="text-gold-300 mt-2 text-[0.58rem] tracking-[0.2em] uppercase">
              {user.standing} standing
            </p>
          </div>
          <button
            role="menuitem"
            onClick={() => {
              resetDemo();
              setOpen(false);
            }}
            className="text-mist-300 hover:bg-ink-700/60 hover:text-gold-200 w-full rounded-md px-3 py-2.5 text-left text-[0.78rem] transition-colors"
          >
            Reset demo data
          </button>
          <button
            role="menuitem"
            onClick={() => {
              signOut();
              navigate('/');
            }}
            className="text-mist-300 hover:bg-ink-700/60 hover:text-urgent-light w-full rounded-md px-3 py-2.5 text-left text-[0.78rem] transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Header() {
  const { user } = useAuth();
  const scrollY = useScrollY();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setMenuOpen(false), [pathname]);

  const condensed = scrollY > 24;
  const links = user ? NAV[user.role] : [];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        condensed
          ? 'border-gold-500/14 bg-ink-950/85 border-b py-2.5 shadow-[0_18px_40px_-30px_rgba(0,0,0,1)] backdrop-blur-xl'
          : 'border-b border-transparent py-5'
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-5 sm:px-8">
        <Link to={user ? links[0]!.to : '/'} className="shrink-0">
          <span className="hidden sm:block">
            <Wordmark size={condensed ? 'sm' : 'md'} animate={false} tagline={!condensed} />
          </span>
          <span className="sm:hidden">
            <Monogram size={34} animate={false} />
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/seller' || link.to === '/upcycler'}
              className={({ isActive }) =>
                `relative rounded-full px-4 py-2 text-[0.7rem] tracking-[0.18em] uppercase transition-all duration-300 ${
                  isActive
                    ? 'text-gold-100 bg-gold-500/10'
                    : 'text-mist-300 hover:text-gold-200 hover:bg-ink-700/40'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && (
                    <span className="bg-gilded absolute inset-x-4 -bottom-0.5 h-px rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={`flex items-center gap-3 ${user ? '' : 'ml-auto'}`}>
          {user ? (
            <AccountMenu />
          ) : (
            <Link
              to="/enter"
              className="btn-gold rounded-full px-5 py-2.5 text-[0.7rem] font-semibold tracking-[0.18em] uppercase"
            >
              Enter the exchange
            </Link>
          )}

          {user && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              className="border-gold-500/22 text-mist-300 rounded-full border p-2.5 md:hidden"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d={menuOpen ? 'M5 5l14 14M19 5L5 19' : 'M3 7h18M3 12h18M3 17h18'}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {menuOpen && user && (
        <nav className="plate rise mx-5 mt-3 flex flex-col gap-1 p-2 md:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/seller' || link.to === '/upcycler'}
              className={({ isActive }) =>
                `rounded-lg px-4 py-3 text-[0.74rem] tracking-[0.16em] uppercase ${
                  isActive ? 'bg-gold-500/12 text-gold-100' : 'text-mist-300'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}

const FOOTER_VISION: { group: string; items: { label: string; live: boolean }[] }[] = [
  {
    group: 'Marketplace channels',
    items: [
      { label: 'Premium / Luxury Exchange', live: true },
      { label: 'Upcycling & Renewal', live: true },
      { label: 'B2B Marketplace', live: false },
      { label: 'B2C Marketplace', live: false },
      { label: 'Auction & Liquidation', live: false },
    ],
  },
  {
    group: 'AI intelligence',
    items: [
      { label: 'Inventory health / risk score', live: true },
      { label: 'Demand & price intelligence', live: true },
      { label: 'Recovery recommendation', live: true },
      { label: 'Buyer matching', live: true },
    ],
  },
  {
    group: 'Platform',
    items: [
      { label: 'Search & smart filters', live: true },
      { label: 'Verification & authentication', live: true },
      { label: 'Secure transactions', live: true },
      { label: 'Logistics & tracking', live: false },
      { label: 'Analytics & insights', live: false },
      { label: 'Subscriptions & admin', live: false },
    ],
  },
];

function Footer() {
  return (
    <footer className="border-gold-500/12 relative mt-28 border-t">
      <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <Wordmark size="md" animate={false} />
            <p className="text-mist-400 mt-6 max-w-sm text-sm leading-relaxed">
              An AI-powered inventory recovery and resale platform. Sellers list high-value
              inventory, buyers acquire it, and upcyclers give it a second life.
            </p>
            <p className="text-mist-500 mt-6 text-[0.68rem] leading-relaxed">
              Phase 1 ships the Premium / Luxury Exchange with three roles. Everything marked
              otherwise is on the roadmap.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {FOOTER_VISION.map((column) => (
              <div key={column.group}>
                <h3 className="text-gold-300 text-[0.62rem] tracking-[0.24em] uppercase">
                  {column.group}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {column.items.map((item) => (
                    <li key={item.label} className="flex items-start gap-2 text-[0.76rem]">
                      <span
                        className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                          item.live ? 'bg-verify-light shadow-[0_0_6px_#4CC79B]' : 'bg-mist-500/50'
                        }`}
                      />
                      <span className={item.live ? 'text-mist-200' : 'text-mist-500'}>
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-gold-500/10 text-mist-500 mt-14 flex flex-col gap-3 border-t pt-8 text-[0.68rem] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Anvaya Exchange. Phase 1 prototype.</p>
          <p className="flex items-center gap-2">
            <span className="bg-verify-light pulse-dot size-1.5 rounded-full" />
            Demo data only — no live inventory or payments
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Chrome shared by every signed-in screen. */
export function AppShell({ children, dense = false }: { children: ReactNode; dense?: boolean }) {
  usePointerBeacon();
  useScrollReset();

  return (
    <div className="relative min-h-dvh">
      <Aurora dense={dense} />
      <Spotlight />
      <Grain />
      <ScrollProgress />
      <Header />
      <main className="relative z-10 mx-auto max-w-[1400px] px-5 pt-32 sm:px-8 sm:pt-36">
        {children}
      </main>
      <Footer />
    </div>
  );
}

/** Bare shell for the landing page, which supplies its own full-bleed layout. */
export function BareShell({ children }: { children: ReactNode }) {
  usePointerBeacon();
  useScrollReset();

  return (
    <div className="relative min-h-dvh">
      <Aurora dense />
      <Spotlight />
      <Grain />
      <ScrollProgress />
      <Header />
      <main className="relative z-10">{children}</main>
      <Footer />
    </div>
  );
}
