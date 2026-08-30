import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../../lib/motion';

interface Mote {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
  speed: number;
  depth: number;
}

/**
 * Drifting gold dust on a canvas. Particle count scales with viewport area and
 * is hard-capped, the whole field parallaxes gently toward the pointer, and
 * reduced-motion visitors get a single static frame.
 */
export function GoldDust({ density = 1, className = '' }: { density?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const still = prefersReducedMotion();
    let motes: Mote[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(150, Math.round(((width * height) / 16000) * density));
      motes = Array.from({ length: count }, () => {
        const depth = 0.35 + Math.random() * 0.65;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: (0.5 + Math.random() * 1.7) * depth,
          vx: (Math.random() - 0.5) * 0.16,
          vy: -0.06 - Math.random() * 0.22,
          phase: Math.random() * Math.PI * 2,
          speed: 0.006 + Math.random() * 0.02,
          depth,
        };
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      pointer.x += (pointer.tx - pointer.x) * 0.045;
      pointer.y += (pointer.ty - pointer.y) * 0.045;
      const shiftX = (pointer.x - 0.5) * 26;
      const shiftY = (pointer.y - 0.5) * 18;

      for (const mote of motes) {
        if (!still) {
          mote.x += mote.vx;
          mote.y += mote.vy;
          mote.phase += mote.speed;

          if (mote.y < -8) {
            mote.y = height + 8;
            mote.x = Math.random() * width;
          }
          if (mote.x < -8) mote.x = width + 8;
          if (mote.x > width + 8) mote.x = -8;
        }

        const twinkle = still ? 0.5 : 0.34 + 0.66 * (0.5 + 0.5 * Math.sin(mote.phase));
        const px = mote.x - shiftX * mote.depth;
        const py = mote.y - shiftY * mote.depth;
        const alpha = twinkle * mote.depth * 0.72;

        const halo = ctx.createRadialGradient(px, py, 0, px, py, mote.r * 5);
        halo.addColorStop(0, `rgba(255, 242, 189, ${alpha})`);
        halo.addColorStop(0.35, `rgba(217, 180, 95, ${alpha * 0.5})`);
        halo.addColorStop(1, 'rgba(201, 162, 75, 0)');

        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(px, py, mote.r * 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 246, 214, ${Math.min(1, alpha * 1.5)})`;
        ctx.beginPath();
        ctx.arc(px, py, mote.r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!still) frame = requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.tx = event.clientX / window.innerWidth;
      pointer.ty = event.clientY / window.innerHeight;
    };

    const onResize = () => {
      build();
      if (still) draw();
    };

    build();
    draw();

    window.addEventListener('resize', onResize);
    if (!still) window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
