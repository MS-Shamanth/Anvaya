import type { ElementType, ReactNode } from 'react';
import { useReveal } from '../../lib/motion';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale' | 'blur';

const OFFSETS: Record<RevealDirection, string> = {
  up: 'translate3d(0, 28px, 0)',
  down: 'translate3d(0, -28px, 0)',
  left: 'translate3d(34px, 0, 0)',
  right: 'translate3d(-34px, 0, 0)',
  scale: 'scale(0.94)',
  blur: 'translate3d(0, 16px, 0)',
};

/** Fades and slides its children in the first time they enter the viewport. */
export function Reveal({
  children,
  as: Tag = 'div',
  direction = 'up',
  delay = 0,
  duration = 760,
  className = '',
}: {
  children: ReactNode;
  as?: ElementType;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : OFFSETS[direction],
        filter: shown ? 'none' : direction === 'blur' ? 'blur(14px)' : 'blur(2px)',
        transition: `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, filter ${duration}ms ease ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </Tag>
  );
}

/** Splits a heading into words and lifts them in one after another. */
export function RevealWords({
  text,
  className = '',
  wordClassName = '',
  delay = 0,
  step = 70,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  step?: number;
}) {
  const { ref, shown } = useReveal<HTMLSpanElement>({ threshold: 0.3 });
  const words = text.split(' ');

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
          <span
            className={`inline-block ${wordClassName}`}
            style={{
              transform: shown ? 'none' : 'translateY(105%) rotate(4deg)',
              opacity: shown ? 1 : 0,
              transition: `transform 900ms cubic-bezier(0.16, 1, 0.3, 1) ${delay + i * step}ms, opacity 700ms ease ${delay + i * step}ms`,
            }}
          >
            {word}
          </span>
          {i < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}
