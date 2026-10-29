'use client';

// NOTE: module id: 876355
import React, { useRef, useCallback, useEffect } from 'react';
import gsap from 'gsap'; // NOTE: module id: 989970
import { Flip } from 'gsap/Flip'; // NOTE: module id: 433965
import { cn } from '@/libs/utils/className'; // NOTE: module id: 103746

gsap.registerPlugin(Flip);

export default function AnimatedPillGroup({
  activeId,
  pillClassName,
  containerClassName,
  duration = 0.4,
  ease = "expo.inOut",
  children,
  ...rest
}) {
  const containerRef = useRef(null);
  const pillRef = useRef(null);
  const isInitialized = useRef(false);

  const updatePillPosition = useCallback((target, opacity = 1) => {
    if (!pillRef.current || !target || !containerRef.current) return;
    
    const targetRect = target.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    gsap.set(pillRef.current, {
      width: targetRect.width,
      height: targetRect.height,
      x: targetRect.left - containerRect.left,
      y: targetRect.top - containerRect.top,
      opacity: opacity
    });
  }, []);

  const animatePill = useCallback((target) => {
    if (!pillRef.current || !target || !containerRef.current) return;
    
    // Check for reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      updatePillPosition(target, 1);
      return;
    }
    
    const state = Flip.getState(pillRef.current);
    updatePillPosition(target, 1);
    Flip.from(state, { duration, ease, absolute: true });
  }, [updatePillPosition, duration, ease]);

  useEffect(() => {
    let timeoutId;
    
    const handleResize = () => {
      const target = containerRef.current?.querySelector(`[data-flip-id="${activeId}"]`);
      if (target) updatePillPosition(target, 1);
    };
    
    // Set initial position
    handleResize();
    isInitialized.current = true;
    
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 200);
    };
    
    window.addEventListener("resize", debouncedResize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", debouncedResize);
    };
  }, []); // Original array is empty; relies on closure for activeId initially

  useEffect(() => {
    if (!isInitialized.current) return;
    const target = containerRef.current?.querySelector(`[data-flip-id="${activeId}"]`);
    if (target) animatePill(target);
  }, [activeId, animatePill]);

  return (
    <div 
      ref={containerRef} 
      className={cn("relative inline-flex", containerClassName)} 
      {...rest}
    >
      <span
        ref={pillRef}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-0 top-0 bg-foreground/10 opacity-0",
          pillClassName
        )}
        style={{ zIndex: 1 }}
      />
      {children}
    </div>
  );
}
