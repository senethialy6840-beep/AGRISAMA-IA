'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

/**
 * Anime progressivement une valeur numérique jusqu'à sa cible lors de l'affichage.
 */
export function AnimatedNumber({
  value,
  duration = 750,
  decimals = 0,
  prefix = '',
  suffix = '',
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [displayValue, setDisplayValue] = useState(value);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setDisplayValue(value);
      return;
    }

    const startCount = () => {
      if (hasAnimatedRef.current) {
        setDisplayValue(value);
        return;
      }
      hasAnimatedRef.current = true;
      const startTime = performance.now();

      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = value * eased;
        setDisplayValue(progress >= 1 ? value : current);
        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === 'undefined') {
      startCount();
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.96) {
      startCount();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            startCount();
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  const formatted =
    decimals > 0
      ? displayValue.toLocaleString('fr-FR', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.round(displayValue).toLocaleString('fr-FR');

  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

