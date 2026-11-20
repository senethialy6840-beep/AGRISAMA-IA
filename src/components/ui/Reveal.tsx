'use client';

import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: 'up' | 'scale' | 'left' | 'right';
}

const HIDDEN_CLASSES: Record<NonNullable<RevealProps['variant']>, string> = {
  up: 'opacity-0 translate-y-6',
  scale: 'opacity-0 translate-y-4 scale-[0.96]',
  left: 'opacity-0 -translate-x-6',
  right: 'opacity-0 translate-x-6',
};

/**
 * Révèle progressivement un bloc au défilement avec animation fluide.
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
  variant = 'up',
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.96) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:scale-100 ${
        visible ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : HIDDEN_CLASSES[variant]
      } ${className}`}
    >
      {children}
    </div>
  );
}
