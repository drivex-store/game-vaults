'use client';

// NOTE: module id: 162387
import React, { useRef, useState, useEffect, useMemo } from 'react';
import gsap from 'gsap'; // NOTE: module id: 989970
import { ScrollTrigger } from 'gsap/ScrollTrigger'; // NOTE: module id: 883495
import { useGSAP } from '@gsap/react'; // NOTE: module id: 365747
import { usePageEnterAnimation } from '@/providers/AnimationProvider'; // NOTE: module id: 488463

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function RollerNumber({
  value,
  className = "",
  suffix = "",
  minDigits = 2,
  triggerMode = "immediate",
  delay = 0,
  duration = 2,
  valueChangeDuration = 1.5,
  ease = "expo.inOut",
  onReady
}) {
  const containerRef = useRef(null);
  const previousValueRef = useRef(0);
  const previousDigitsLengthRef = useRef(0);
  const isInitializedRef = useRef(false);
  const [shouldAnimate, setShouldAnimate] = useState(triggerMode === "immediate");
  const pageEnterTriggeredRef = useRef(false);
  const currentValueRef = useRef(value);
  const timelineRef = useRef(null);

  useEffect(() => {
    currentValueRef.current = value;
  }, [value]);

  const currentDigits = useMemo(() => {
    const digits = Math.round(value).toString().split("").map(Number);
    while (digits.length < minDigits) {
      digits.unshift(0);
    }
    return digits;
  }, [value, minDigits]);

  const previousDigits = useMemo(() => {
    const digits = Math.round(previousValueRef.current).toString().split("").map(Number);
    while (digits.length < currentDigits.length) {
      digits.unshift(0);
    }
    return digits;
  }, [currentDigits.length]);

  usePageEnterAnimation(
    () => {
      const val = currentValueRef.current;
      pageEnterTriggeredRef.current = true;
      if (val > 0) {
        requestAnimationFrame(() => {
          setShouldAnimate(true);
        });
      }
    },
    [],
    "RollerNumber",
    triggerMode === "pageEnter"
  );

  useEffect(() => {
    if (triggerMode === "pageEnter" && pageEnterTriggeredRef.current && value > 0 && !shouldAnimate) {
      setShouldAnimate(true);
    }
  }, [value, triggerMode, shouldAnimate]);

  useGSAP(() => {
    if (triggerMode === "scroll" && containerRef.current) {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top bottom",
        once: true,
        onEnter: () => {
          setShouldAnimate(true);
        }
      });
    }
  }, { scope: containerRef, dependencies: [triggerMode] });

  useEffect(() => {
    if (triggerMode === "manual" && onReady) {
      onReady(() => setShouldAnimate(true));
    }
  }, [triggerMode, onReady]);

  useGSAP(() => {
    if (!shouldAnimate) return;

    const rollers = containerRef.current?.querySelectorAll("[data-roller]");
    if (!rollers || rollers.length === 0) return;

    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    const isFirstAnimation = previousValueRef.current === 0 && value > 0;

    if (!isInitializedRef.current && isFirstAnimation) {
      isInitializedRef.current = true;
      previousDigitsLengthRef.current = currentDigits.length;
      
      const tl = gsap.timeline({
        onComplete: () => {
          previousDigitsLengthRef.current = currentDigits.length;
          previousValueRef.current = value;
          timelineRef.current = null;
        }
      });
      timelineRef.current = tl;

      rollers.forEach((roller, index) => {
        const targetDigit = currentDigits[index];
        const inner = roller.querySelector(".roller-inner");
        
        if (inner) {
          gsap.set(inner, { y: "-10em" });
          tl.to(
            inner,
            { y: `${-20 - targetDigit}em`, duration: duration, delay: delay, ease: ease },
            (currentDigits.length - 1 - index) * 0.08
          );
        }
      });
    } else if (isInitializedRef.current && previousValueRef.current !== value) {
      previousValueRef.current = value;
      previousDigitsLengthRef.current = currentDigits.length;
      
      rollers.forEach((roller, index) => {
        const targetDigit = currentDigits[index];
        const inner = roller.querySelector(".roller-inner");
        
        if (inner) {
          gsap.to(inner, {
            y: `${-20 - targetDigit}em`,
            duration: valueChangeDuration,
            ease: ease,
            overwrite: "auto",
            delay: (currentDigits.length - 1 - index) * 0.05
          });
        }
      });
    }
  }, { scope: containerRef, dependencies: [value, currentDigits.length, shouldAnimate] });

  return (
    <div
      ref={containerRef}
      className={`flex justify-start items-start overflow-hidden leading-none ${className}`}
      style={{ height: "0.9em" }}
    >
      {currentDigits.map((digit, index) => (
        <div
          key={`${index}-${currentDigits.length}`}
          data-roller={true}
          className="flex flex-col justify-start items-center overflow-hidden relative"
          style={{ width: "1ch" }}
        >
          <div className="roller-inner flex flex-col will-change-transform">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <div
                key={`a-${num}`}
                className="flex justify-center items-center leading-none"
                style={{ height: "1em", fontVariantNumeric: "tabular-nums" }}
              >
                {num}
              </div>
            ))}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <div
                key={`b-${num}`}
                className="flex justify-center items-center leading-none"
                style={{ height: "1em", fontVariantNumeric: "tabular-nums" }}
              >
                {num}
              </div>
            ))}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <div
                key={`c-${num}`}
                className="flex justify-center items-center leading-none"
                style={{ height: "1em", fontVariantNumeric: "tabular-nums" }}
              >
                {num}
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {suffix && (
        <div className="flex items-center ml-[0.1em]">
          <div
            className="flex justify-center items-center leading-none"
            style={{ height: "1em", fontVariantNumeric: "tabular-nums" }}
          >
            {suffix}
          </div>
        </div>
      )}
    </div>
  );
}
