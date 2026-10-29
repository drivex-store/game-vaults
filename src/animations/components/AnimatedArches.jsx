'use client';

import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { cn } from '@/libs/utils/className';

function ArchesIcon({ width, height, strokeWidth = 26, ...rest }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 255 129"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      {...rest}
    >
      <path d="M13 129C13 105.252 32.0279 86 55.5 86C78.9721 86 98 105.252 98 129" />
      <path d="M13 129C13 89.7878 44.3401 58 83 58C121.66 58 153 89.7878 153 129" />
      <path d="M13 129C13 64.935 64.2634 13 127.5 13C190.737 13 242 64.935 242 129" />
    </svg>
  );
}

const AnimatedArches = forwardRef(function AnimatedArches({
  className,
  strokeWidth = 26,
  fit = "height",
  tone = "default",
  playOnView = false,
  ...rest
}, ref) {
  const containerRef = useRef(null);
  const timelineRef = useRef(null);

  const getPaths = () => {
    const container = containerRef.current;
    return {
      brand: Array.from(container?.querySelectorAll('[data-pass="brand"] path') || []),
      fg: Array.from(container?.querySelectorAll('[data-pass="fg"] path') || [])
    };
  };

  const preparePaths = (paths) => {
    paths.forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    });
  };

  const play = () => {
    const { brand, fg } = getPaths();
    if (!brand.length) return;

    timelineRef.current?.kill();
    preparePaths(brand);
    preparePaths(fg);

    const tl = gsap.timeline();
    tl.to(brand, { strokeDashoffset: 0, duration: 0.9, ease: "expo.inOut", stagger: { each: 0.1 } }, 0);
    tl.to(fg, { strokeDashoffset: 0, duration: 0.9, ease: "expo.inOut", stagger: { each: 0.1 } }, 0.12);
    
    timelineRef.current = tl;
  };

  useImperativeHandle(ref, () => ({ play }), []);

  useGSAP(() => {
    const { brand, fg } = getPaths();
    [...brand, ...fg].forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: 0 });
    });
    
    return () => timelineRef.current?.kill();
  }, { scope: containerRef });

  useEffect(() => {
    if (!playOnView || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let isReset = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (isReset) play();
        isReset = false;
      } else if (entry.boundingClientRect.top > 0 && !isReset) {
        timelineRef.current?.kill();
        const { brand, fg } = getPaths();
        preparePaths(brand);
        preparePaths(fg);
        isReset = true;
      }
    }, { rootMargin: "0px 0px -20% 0px" });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [playOnView]);

  const svgClass = cn("col-start-1 row-start-1", fit === "width" ? "h-auto w-full" : "h-full w-auto");
  const isMuted = tone === "muted";

  return (
    <span ref={containerRef} className={cn("grid place-items-center", className)} {...rest}>
      <ArchesIcon 
        data-pass="brand" 
        strokeWidth={strokeWidth} 
        className={cn(svgClass, isMuted ? "text-foreground" : "text-brand")} 
      />
      <ArchesIcon 
        data-pass="fg" 
        strokeWidth={strokeWidth} 
        className={cn(svgClass, isMuted ? "text-[color-mix(in_srgb,var(--foreground)_10%,var(--background))]" : "text-foreground")} 
      />
    </span>
  );
});

export default AnimatedArches;
