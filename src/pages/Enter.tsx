import { useState } from 'react';
import type { Role } from '../types';
import { useAuth } from '../context/AuthContext';
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
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn(email, password);
      
      if (result.success) {
        // Backend will return user with role, navigate accordingly
        // We'll fetch the user after login to determine role
        window.location.href = '/browse'; // Will be redirected by role after auth check
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
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
            {(['buyer', 'seller', 'upcycler'] as const).map((role, i) => {
              const copy = ROLE_COPY[role];
              const initials = { buyer: 'AR', seller: 'KM', upcycler: 'NS' }[role];
              const name = { buyer: 'Aditi Rao', seller: 'Kabir Mehta', upcycler: 'Noor Sheikh' }[role];
              const org = {
                buyer: 'Rao Family Office',
                seller: 'Mehta Luxury Consignment',
                upcycler: 'Atelier Noor',
              }[role];

              return (
                <Reveal key={role} delay={i * 120}>
                  <Tilt className="plate group h-full p-7" strength={6}>
                    <div className="flex h-full w-full flex-col">
                      <div className="flex items-center gap-3">
                        <span className="bg-gilded text-ink-950 flex size-11 items-center justify-center rounded-full text-sm font-bold">
                          {initials}
                        </span>
                        <div>
                          <p className="text-gold-300 text-[0.58rem] tracking-[0.26em] uppercase">
                            {role}
                          </p>
                          <p className="text-mist-100 mt-0.5 text-lg leading-tight">{name}</p>
                        </div>
                      </div>

                      <p className="text-mist-300 mt-5 text-[0.84rem] leading-relaxed">
                        {copy.blurb}
                      </p>

                      <dl className="mt-6 space-y-2.5 text-[0.74rem]">
                        <div className="flex justify-between gap-3">
                          <dt className="text-mist-500">Trading as</dt>
                          <dd className="text-mist-200 text-right">{org}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-mist-500">Role</dt>
                          <dd className="text-gold-300 text-right capitalize">{role}</dd>
                        </div>
                      </dl>

                      <p className="text-mist-500 border-gold-500/12 mt-6 border-t pt-4 text-[0.68rem] leading-relaxed">
                        {copy.does}
                      </p>

                      <div className="bg-ink-800/50 border-mist-500/20 mt-6 rounded-lg border px-4 py-3 text-center">
                        <p className="text-mist-400 text-[0.7rem]">
                          Use credentials below to sign in as {role}
                        </p>
                      </div>
                    </div>
                  </Tilt>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={420}>
            <div className="plate mx-auto mt-12 max-w-xl p-7">
              <p className="text-gold-400/85 text-[0.58rem] tracking-[0.26em] uppercase">
                Or sign in with your credentials
              </p>
              <form onSubmit={submit} className="mt-4 space-y-3">
                <Field label="Email" error={error}>
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
                      disabled={isLoading}
                    />
                  )}
                </Field>
                <Field label="Password">
                  {(id) => (
                    <Input
                      id={id}
                      type="password"
                      required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={isLoading}
                    />
                  )}
                </Field>
                <Button 
                  type="submit" 
                  variant="gold" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="text-mist-500 mt-5 space-y-2 text-[0.7rem] leading-relaxed">
                <p>
                  <span className="text-gold-300">Demo accounts:</span> All accounts use password{' '}
                  <code className="bg-ink-800/50 text-gold-200 rounded px-1.5 py-0.5">anvaya2024</code>
                </p>
                <p className="text-verify-light text-[0.65rem]">
                  <span className="font-bold">✅ SECURE:</span> Authentication now uses server-side
                  Argon2id password hashing, HttpOnly cookies, session-based auth, and rate limiting.
                  All validation happens on the backend.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </BareShell>
  );
}
