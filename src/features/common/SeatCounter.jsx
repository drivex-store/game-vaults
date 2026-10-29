'use client';

import React from 'react';
import { Minus, Plus } from '@phosphor-icons/react'; // NOTE: module id: 499839
import { cn } from '@/libs/utils/className'; // NOTE: module id: 103746

// NOTE: module id: 69291
export default function SeatCounter({
  seats,
  onChange,
  min = 2,
  max = 20,
  tone = "dark",
  className = ""
}) {
  const buttonClass = cn(
    "relative inline-flex size-32 cursor-pointer items-center justify-center after:absolute after:-inset-6 after:content-[''] transition-[background-color,scale] duration-200 ease-(--ease-expo-out) active:scale-90 disabled:cursor-not-allowed disabled:opacity-40",
    tone === "light"
      ? "bg-background/10 text-background hover:bg-background/20"
      : "bg-foreground/5 text-foreground hover:bg-foreground/10"
  );

  return (
    <div
      className={cn("flex items-center gap-8", className)}
      role="group"
      aria-label="Seats"
    >
      <button
        type="button"
        className={buttonClass}
        aria-label="Remove a seat"
        disabled={seats <= min}
        onClick={() => onChange(Math.max(min, seats - 1))}
      >
        <Minus className="size-14" />
      </button>
      
      <span
        className="text-body min-w-[5.5ch] text-center tabular-nums"
        aria-live="polite"
      >
        {seats} seats
      </span>
      
      <button
        type="button"
        className={buttonClass}
        aria-label="Add a seat"
        disabled={seats >= max}
        onClick={() => onChange(Math.min(max, seats + 1))}
      >
        <Plus className="size-14" />
      </button>
    </div>
  );
}
