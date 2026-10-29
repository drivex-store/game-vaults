'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import gsap from 'gsap'; // NOTE: module id: 989970
import { useGSAP } from '@gsap/react'; // NOTE: module id: 365747
import { cn } from '@/libs/utils/className'; // NOTE: module id: 103746

const DIGITS = ["9", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

function RollingDigit({ digit }) {
  const containerRef = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const targetY = -(20 * (digit + 1));
    if (!isInitialized.current) {
      isInitialized.current = true;
      gsap.set(el, { y: targetY });
      return;
    }
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(el, {
      y: targetY,
      duration: 0.4 * !isReduced,
      ease: "back.out(1.6)",
      overwrite: "auto"
    });
  }, [digit]);

  return (
    <span aria-hidden="true" className="inline-block overflow-hidden" style={{ height: 20 }}>
      <span ref={containerRef} className="flex flex-col">
        {DIGITS.map((d, index) => (
          <span
            key={`${d}-${index}`}
            className="flex items-center justify-center"
            style={{ height: 20 }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

function RollingNumber({ value, className = "" }) {
  const strValue = String(value ?? "");
  return (
    <span className={cn("inline-flex items-center tabular-nums", className)} aria-label={strValue}>
      {strValue.split("").map((char, index) =>
        /[0-9]/.test(char) ? (
          <RollingDigit key={`${strValue.length}-${index}`} digit={Number(char)} />
        ) : (
          <span key={`${strValue.length}-${index}-${char}`} aria-hidden="true">
            {char}
          </span>
        )
      )}
    </span>
  );
}

const TICK_MARKS = [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];

// NOTE: module id: 125303
export default function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  disabled = false,
  onChange,
  onCommit,
  labelPosition = "inside",
  className = ""
}) {
  const isAbove = labelPosition === "above";
  const containerRef = useRef(null);
  const fillRef = useRef(null);
  const thumbRef = useRef(null);
  const quickToRef = useRef(null);
  const isReducedRef = useRef(false);
  const minNum = Number(min);
  const maxNum = Number(max);
  
  const [currentVal, setCurrentVal] = useState(value);
  const externalValRef = useRef(value);
  const rafRef = useRef(0);
  const latestValRef = useRef(null);

  useEffect(() => {
    if (String(value) !== String(externalValRef.current)) {
      setCurrentVal(value);
    }
  }, [value]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const numVal = Number(currentVal);
  const ratio = useMemo(() => {
    if (!Number.isFinite(numVal) || maxNum <= minNum) return 0;
    return Math.min(1, Math.max(0, (numVal - minNum) / (maxNum - minNum)));
  }, [numVal, minNum, maxNum]);

  const currentRatioRef = useRef(ratio);
  currentRatioRef.current = ratio;

  const decimals = Math.max(
    (String(step).split(".")[1] || "").length,
    (String(currentVal).split(".")[1] || "").length
  );

  const { contextSafe } = useGSAP(() => {
    const containerEl = containerRef.current;
    const fillEl = fillRef.current;
    const thumbEl = thumbRef.current;
    if (!containerEl || !fillEl || !thumbEl) return;

    isReducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = 0.3 * !isReducedRef.current;

    gsap.set(fillEl, { scaleX: currentRatioRef.current, transformOrigin: "0% 50%", force3D: true });
    gsap.set(containerEl, { "--p": currentRatioRef.current });
    gsap.set(thumbEl, { scaleY: 0.95, transformOrigin: "50% 50%", force3D: true });

    quickToRef.current = {
      fill: gsap.quickTo(fillEl, "scaleX", { duration: dur, ease: "back.out(1.4)" }),
      pos: gsap.quickTo(containerEl, "--p", { duration: dur, ease: "back.out(1.4)" }),
      stretch: gsap.quickTo(thumbEl, "scaleX", { duration: 0.25, ease: "power2.out" })
    };
  }, { scope: containerRef });

  useGSAP(() => {
    if (containerRef.current && quickToRef.current && !isDraggingRef.current) {
      quickToRef.current.fill(ratio);
      quickToRef.current.pos(ratio);
    }
  }, { dependencies: [ratio], scope: containerRef });

  const isDraggingRef = useRef(false);
  const lastEmittedRef = useRef(null);
  const focusWrapperRef = useRef(null);
  const dragStateRef = useRef({ x: 0, t: 0 });

  const emitChange = (val) => {
    latestValRef.current = val;
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        externalValRef.current = latestValRef.current;
        onChange?.(latestValRef.current);
      });
    }
  };

  const updateFromPointer = (clientX) => {
    const containerEl = containerRef.current;
    if (!containerEl || !quickToRef.current) return;

    const rect = containerEl.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    quickToRef.current.fill(p);
    quickToRef.current.pos(p);
    currentRatioRef.current = p;

    const now = performance.now();
    const dragState = dragStateRef.current;
    if (!isReducedRef.current && dragState.t) {
      const speed = Math.abs(clientX - dragState.x) / Math.max(1, now - dragState.t);
      quickToRef.current.stretch(1 + Math.min(0.7, 0.45 * speed));
    }
    dragStateRef.current = { x: clientX, t: now };

    const stepNum = Number(step) || 1;
    const rawVal = Math.round((minNum + p * (maxNum - minNum) - minNum) / stepNum) * stepNum + minNum;
    const clampedStr = String(parseFloat(Math.min(maxNum, Math.max(minNum, rawVal)).toFixed(6)));

    if (clampedStr !== lastEmittedRef.current) {
      lastEmittedRef.current = clampedStr;
      setCurrentVal(clampedStr);
      emitChange(clampedStr);
      if (!isReducedRef.current && focusWrapperRef.current) {
        gsap.fromTo(
          focusWrapperRef.current,
          { scale: 1.18, transformOrigin: "100% 50%" },
          { scale: 1, duration: 0.25, ease: "back.out(2)", overwrite: "auto" }
        );
      }
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const skipBlurRef = useRef(false);

  const handleBlurOrEnter = contextSafe((valStr) => {
    if (skipBlurRef.current) return;
    skipBlurRef.current = true;
    setIsEditing(false);

    const parsed = Number(String(valStr).replace(",", "."));
    if (!Number.isFinite(parsed)) return;

    const clamped = Math.min(maxNum, Math.max(minNum, parsed));
    const clampedStr = String(parseFloat(clamped.toFixed(6)));
    if (clampedStr === String(currentVal)) return;

    setCurrentVal(clampedStr);
    lastEmittedRef.current = clampedStr;
    externalValRef.current = clampedStr;

    const p = maxNum > minNum ? (clamped - minNum) / (maxNum - minNum) : 0;
    currentRatioRef.current = p;
    if (quickToRef.current) {
      quickToRef.current.fill(p);
      quickToRef.current.pos(p);
    }
    onChange?.(clampedStr);
    onCommit?.(clampedStr);
  });

  const handlePointerDown = contextSafe((e) => {
    if (disabled) return;
    isDraggingRef.current = true;
    containerRef.current?.setAttribute("data-dragging", "true");

    if (!isReducedRef.current) {
      gsap.timeline({ overwrite: "auto" })
        .to(fillRef.current, { scaleY: 1.08, duration: 0.12, ease: "power2.out", force3D: true })
        .to(fillRef.current, { scaleY: 0.82, duration: 0.38, ease: "back.out(3)" });
      gsap.to(thumbRef.current, { scaleY: 1, duration: 0.3, ease: "back.out(3)", overwrite: "auto" });
    }

    if (e?.clientX != null) {
      updateFromPointer(e.clientX);
    }

    const onMove = (ev) => updateFromPointer(ev.clientX);
    window.addEventListener("pointermove", onMove);

    const onEnd = contextSafe(() => {
      window.removeEventListener("pointermove", onMove);
      isDraggingRef.current = false;
      containerRef.current?.removeAttribute("data-dragging");

      const finalVal = Number(lastEmittedRef.current ?? currentVal);
      const finalP = maxNum > minNum && Number.isFinite(finalVal) ? Math.min(1, Math.max(0, (finalVal - minNum) / (maxNum - minNum))) : 0;
      
      if (quickToRef.current) {
        quickToRef.current.fill(finalP);
        quickToRef.current.pos(finalP);
        quickToRef.current.stretch(1);
      }
      
      dragStateRef.current = { x: 0, t: 0 };
      
      if (!isReducedRef.current) {
        gsap.to(fillRef.current, { scaleY: 1, duration: 0.45, ease: "back.out(3)", overwrite: "auto" });
        gsap.to(thumbRef.current, { scaleY: 0.95, duration: 0.45, ease: "back.out(3)", overwrite: "auto" });
      }
      
      if (lastEmittedRef.current != null) {
        onCommit?.(lastEmittedRef.current);
      }
    });

    window.addEventListener("pointerup", onEnd, { once: true });
    window.addEventListener("pointercancel", onEnd, { once: true });
  });

  const sliderBody = (
    <div
      ref={containerRef}
      className={cn(
        "group relative h-40 select-none overflow-hidden border border-foreground/[0.08] bg-foreground/[0.04] transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:bg-foreground/[0.055] data-[dragging]:border-foreground/[0.14] data-[dragging]:bg-foreground/[0.06]",
        disabled && "opacity-45",
        !isAbove && className
      )}
    >
      {TICK_MARKS.map((pos) => (
        <span
          key={pos}
          aria-hidden="true"
          className={cn(
            "absolute top-1/2 h-10 w-px -translate-y-1/2 bg-foreground/[0.12]",
            !isAbove && pos < 0.5 && "max-sm:hidden"
          )}
          style={{ left: `${100 * pos}%` }}
        />
      ))}
      <div
        ref={fillRef}
        aria-hidden="true"
        className="absolute inset-y-2 left-0 w-full bg-foreground/[0.07] transition-[background-color] duration-(--duration-quick) group-data-[dragging]:bg-foreground/[0.09]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[13px] h-14 w-4"
        style={{ left: "calc(var(--p, 0) * 100%)", marginLeft: -2 }}
      >
        <span
          ref={thumbRef}
          className="block h-full w-full bg-foreground/50 transition-[background-color] duration-(--duration-quick) group-hover:bg-foreground/70 group-data-[dragging]:bg-foreground"
        />
      </span>
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-12">
        <span className="truncate text-body-sm text-foreground/80">
          {isAbove ? null : label}
        </span>
        <span ref={focusWrapperRef} className="inline-flex items-center text-body-sm text-foreground">
          {isEditing ? (
            <input
              type="text"
              inputMode="decimal"
              value={editValue}
              autoFocus={true}
              aria-label={`${label} value`}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleBlurOrEnter(editValue)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleBlurOrEnter(editValue);
                else if (e.key === "Escape") {
                  skipBlurRef.current = true;
                  setIsEditing(false);
                }
              }}
              style={{ width: `${Math.max(editValue.length, 2) + 1}ch` }}
              className="pointer-events-auto bg-transparent text-right text-body-sm text-foreground outline-none"
            />
          ) : (
            <button
              type="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={`Edit ${label} value`}
              onClick={() => {
                if (!disabled) {
                  skipBlurRef.current = false;
                  setEditValue(Number.isFinite(numVal) ? String(parseFloat(numVal.toFixed(6))) : "");
                  setIsEditing(true);
                }
              }}
              className="pointer-events-auto inline-flex cursor-text items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/30"
            >
              <RollingNumber value={Number.isFinite(numVal) ? numVal.toFixed(decimals) : ""} />
              {unit ? <span>{unit}</span> : null}
            </button>
          )}
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={minNum}
        max={maxNum}
        step={step}
        value={Number.isFinite(numVal) ? numVal : minNum}
        disabled={disabled}
        onChange={(e) => {
          if (isDraggingRef.current) return;
          const val = e.target.value;
          setCurrentVal(val);
          lastEmittedRef.current = val;
          const num = Number(val);
          const p = maxNum > minNum && Number.isFinite(num) ? Math.min(1, Math.max(0, (num - minNum) / (maxNum - minNum))) : 0;
          if (quickToRef.current) {
            quickToRef.current.fill(p);
            quickToRef.current.pos(p);
          }
          emitChange(val);
          onCommit?.(val);
        }}
        onPointerDown={handlePointerDown}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0 disabled:cursor-default"
      />
    </div>
  );

  if (isAbove) {
    return (
      <div className={cn("flex flex-col gap-8", className)}>
        <span aria-hidden="true" className="text-body-sm text-foreground-muted">
          {label}
        </span>
        {sliderBody}
      </div>
    );
  }

  return sliderBody;
}
