/**
 * Motion primitives — hand-rolled so the app ships no animation dependency.
 *
 * Every hook here checks `prefersReducedMotion()` and degrades to the final
 * state immediately, so the heavy visual treatment never becomes an
 * accessibility problem.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Reveals an element the first time it scrolls into view. */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}) {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(() => prefersReducedMotion());

  const { threshold = 0.16, rootMargin = '0px 0px -8% 0px', once = true } = options ?? {};

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setShown(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, shown };
}

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -9 * t));

/** Counts up to `target` once the returned ref scrolls into view. */
export function useCountUp(target: number, duration = 1500) {
  const { ref, shown } = useReveal<HTMLSpanElement>({ threshold: 0.4 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!shown) return;
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(target * easeOutExpo(progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [shown, target, duration]);

  return { ref, value, done: value >= target };
}

/**
 * Pointer-reactive 3D tilt. Writes CSS custom properties instead of React
 * state so pointer moves never trigger a re-render.
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>(strength = 8) {
  const ref = useRef<T | null>(null);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<T>) => {
      const node = ref.current;
      if (!node || prefersReducedMotion()) return;
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      node.style.setProperty('--tilt-x', `${(0.5 - py) * strength * 2}deg`);
      node.style.setProperty('--tilt-y', `${(px - 0.5) * strength * 2}deg`);
      node.style.setProperty('--glow-x', `${px * 100}%`);
      node.style.setProperty('--glow-y', `${py * 100}%`);
      node.style.setProperty('--glow-o', '1');
    },
    [strength],
  );

  const onPointerLeave = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty('--tilt-x', '0deg');
    node.style.setProperty('--tilt-y', '0deg');
    node.style.setProperty('--glow-o', '0');
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}

/** Normalised scroll progress (0–1) of the whole document. */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return progress;
}

/** Raw window scrollY, throttled to animation frames. */
export function useScrollY() {
  const [y, setY] = useState(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setY(window.scrollY));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return y;
}

/**
 * Tracks the pointer across the viewport and publishes it as CSS variables on
 * <html>, so any stylesheet can react to the cursor with no JS of its own.
 */
export function usePointerBeacon() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const root = document.documentElement;
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        root.style.setProperty('--cursor-x', `${event.clientX}px`);
        root.style.setProperty('--cursor-y', `${event.clientY}px`);
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);
}

/** Staggered animation delays for list children. */
export function useStagger(count: number, step = 60) {
  return useMemo(
    () => Array.from({ length: count }, (_, i) => `${i * step}ms`),
    [count, step],
  );
}

/** Types a string out character by character, cycling through a list. */
export function useTypewriter(phrases: string[], opts?: { speed?: number; hold?: number }) {
  const { speed = 55, hold = 1900 } = opts ?? {};
  const [index, setIndex] = useState(0);
  const [text, setText] = useState(phrases[0] ?? '');
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion() || phrases.length === 0) return;

    const current = phrases[index % phrases.length]!;
    let timer: number;

    if (!erasing) {
      if (text.length < current.length) {
        timer = window.setTimeout(() => setText(current.slice(0, text.length + 1)), speed);
      } else {
        timer = window.setTimeout(() => setErasing(true), hold);
      }
    } else if (text.length > 0) {
      timer = window.setTimeout(() => setText(current.slice(0, text.length - 1)), speed / 2.2);
    } else {
      setErasing(false);
      setIndex((i) => (i + 1) % phrases.length);
      timer = window.setTimeout(() => undefined, speed);
    }

    return () => window.clearTimeout(timer);
  }, [text, erasing, index, phrases, speed, hold]);

  return text;
}
