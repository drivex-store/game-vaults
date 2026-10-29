'use client';

// NOTE: module id: 314670
import React, { useRef } from 'react';
import gsap from 'gsap'; // NOTE: module id: 989970
import { useGSAP } from '@gsap/react'; // NOTE: module id: 365747

export const euro = (value) => `€${Math.round(value).toLocaleString("en-US")}`;

export default function CurrencyDisplay({ value, className = "" }) {
  const spanRef = useRef(null);
  const currentValueRef = useRef(value);

  useGSAP(() => {
    const el = spanRef.current;
    if (!el) return;

    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state = { v: currentValueRef.current };

    gsap.to(state, {
      v: value,
      duration: 0.5 * !isReduced,
      ease: "expo.out",
      overwrite: true,
      onUpdate: () => {
        currentValueRef.current = state.v;
        el.textContent = euro(state.v);
      }
    });
  }, { dependencies: [value] });

  return (
    <span ref={spanRef} className={className}>
      {euro(value)}
    </span>
  );
}
