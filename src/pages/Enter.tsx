import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { monthYear } from '../lib/format';
import { BareShell } from '../components/AppShell';
import { Monogram } from '../components/Monogram';
import { Button, Field, Input } from '../components/ui';
import { GoldDust } from '../components/effects/GoldDust';
import { Reveal, RevealWords } from '../components/effects/Reveal';
import { Tilt } from '../components/effects/Tilt';
import { Divider } from '../components/effects/Atmosphere';

export const HOME_FOR: Record<Role, string> = {
  buyer: '/browse',
  seller: '/seller',
  upcycler: '/upcycler',
};

const ROLE_COPY: Record<Role, { blurb: string; does: string }> = {
  buyer: {
    blurb: 'Browses and purchases premium inventory.',
    does: 'Smart filters, AI matching, escrow checkout',
  },
  seller: {
    blurb: 'Uploads and manages inventory for sale.',
    does: 'Health scores, price guidance, renewal routing',
  },
  upcycler: {
    blurb: 'Claims pieces for renewal, repair, and resale.',
    does: 'Renewal pool, bench projects, provenance relisting',
  },
};

export default function Enter() {
  const { users, signInAs, signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const demoAccounts = (['buyer', 'seller', 'upcycler'] as Role[])
    .map((role) => users.find((u) => u.role === role))
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  const enterAs = (role: Role) => {
    signInAs(role);
    navigate(HOME_FOR[role]);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const match = signInWithEmail(email);
    if (!match) {
      setError('No account on the exchange with that address.');
      return;
    }
    navigate(HOME_FOR[match.role]);
  };

  return (
    <BareShell>
      <section className="relative flex min-h-dvh items-center overflow-hidden py-28">
        <GoldDust density={0.9} />

        <div className="relative mx-auto w-full max-w-[1200px] px-5 sm:px-8">
          <Reveal direction="scale">
            <div className="flex flex-col items-center text-center">
              <Monogram size={68} />
              <h1 className="text-mist-100 mt-7 text-4xl sm:text-5xl">
                <RevealWords text="Choose your vantage point" />
              </h1>
              <p className="text-mist-300 mt-4 max-w-xl text-sm leading-relaxed sm:text-base">
                Phase 1 ships three roles. Pick one to enter the Premium Exchange — the demo signs
                you straight in.
              </p>
              <Divider className="mt-8 w-full max-w-sm" />
            </div>
          </Reveal>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {demoAccounts.map((account, i) => (
              <Reveal key={account.id} delay={i * 120}>
                <Tilt className="plate group h-full p-7" strength={6}>
                  <button
                    onClick={() => enterAs(account.role)}
                    className="flex h-full w-full flex-col text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="bg-gilded text-ink-950 flex size-11 items-center justify-center rounded-full text-sm font-bold">
                        {account.initials}
                      </span>
                      <div>
                        <p className="text-gold-300 text-[0.58rem] tracking-[0.26em] uppercase">
                          {account.role}
                        </p>
                        <p className="text-mist-100 mt-0.5 text-lg leading-tight">{account.name}</p>
                      </div>
                    </div>

                    <p className="text-mist-300 mt-5 text-[0.84rem] leading-relaxed">
                      {ROLE_COPY[account.role].blurb}
                    </p>

                    <dl className="mt-6 space-y-2.5 text-[0.74rem]">
                      <div className="flex justify-between gap-3">
                        <dt className="text-mist-500">Trading as</dt>
                        <dd className="text-mist-200 text-right">{account.org}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-mist-500">Standing</dt>
                        <dd className="text-gold-300 text-right">{account.standing}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-mist-500">Member since</dt>
                        <dd className="text-mist-200 text-right">{monthYear(account.memberSince)}</dd>
                      </div>
                    </dl>

                    <p className="text-mist-500 border-gold-500/12 mt-6 border-t pt-4 text-[0.68rem] leading-relaxed">
                      {ROLE_COPY[account.role].does}
                    </p>

                    <span className="btn-ghost mt-6 block w-full rounded-full py-3 text-center text-[0.7rem] tracking-[0.18em] uppercase">
                      Enter as {account.role}
                    </span>
                  </button>
                </Tilt>
              </Reveal>
            ))}
          </div>

          <Reveal delay={420}>
            <div className="plate mx-auto mt-12 max-w-xl p-7">
              <p className="text-gold-400/85 text-[0.58rem] tracking-[0.26em] uppercase">
                Or sign in with an address
              </p>
              <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <Field label="Email" className="flex-1" error={error}>
                  {(id) => (
                    <Input
                      id={id}
                      type="email"
                      required
                      placeholder="kabir@anvaya.exchange"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError('');
                      }}
                    />
                  )}
                </Field>
                <Button type="submit" variant="gold" className="sm:mb-0.5">
                  Continue
                </Button>
              </form>

              <p className="text-mist-500 mt-5 text-[0.7rem] leading-relaxed">
                <span className="text-gold-300">Demo authentication.</span> No password is checked
                and no session is verified by a server. Real accounts will need a server-side
                identity provider, authorisation enforced on every request, and KYB checks before
                sellers or upcyclers can transact.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </BareShell>
  );
}
