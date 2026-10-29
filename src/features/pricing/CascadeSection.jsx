'use client';

// NOTE: module id: 619499
import React, { useRef, useMemo } from 'react';
import gsap from 'gsap'; // NOTE: module id: 989970
import { CustomEase } from 'gsap/CustomEase'; // NOTE: module id: 563208
import { useGSAP } from '@gsap/react'; // NOTE: module id: 365747
import { CaretLeft, CaretRight } from '@phosphor-icons/react'; // NOTE: module id: 590961, 268817 (Merged representation)
import { useTransitionRouter } from '@/providers/TransitionRouterProvider'; // NOTE: module id: 676040
import RevealHeadline from '@/animations/shared/RevealHeadline'; // NOTE: module id: 963160
import AnimatedText from '@/animations/components/AnimatedText'; // NOTE: module id: 218091
import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682

// Optional unused import from original bundle
// import Link from 'next/link'; // NOTE: module id: 517249

gsap.registerPlugin(CustomEase);
CustomEase.create("annnimateInOut", "M0,0 C0.7,0 0.16,1 1,1");

const EASE_NAME = "annnimateInOut";
const ASPECT_RATIO = 1280 / 804;
const ROTATION_TAN = Math.tan((15 * Math.PI) / 180);
const calcScale = (e) => (0.89 * (1 - Math.pow(0.89, e))) / 0.11;

const absoluteOverlayClass = "absolute inset-0 origin-top-left will-change-transform";

const textAnimProps = {
  type: "lines",
  mask: "lines",
  duration: 0.6,
  stagger: 0.03,
  ease: "power2.out",
  animationProps: { yPercent: 100 }
};

export function ShippedCascadeCore({ items = [], fill = false, className = "" }) {
  const containerRef = useRef(null);
  const gapSize = fill ? 24 : 80;
  
  const itemRefs = useRef([]);
  const scaleRefs = useRef([]);
  const textRefs = useRef([]);
  const overlayRefs = useRef([]);
  const stateRefs = useRef([]);
  
  const updateLayoutRef = useRef(() => {});
  const handleActiveRef = useRef(() => {});
  const state = useRef({ offset: 0, w: 480, active: -1 });
  
  const router = useTransitionRouter();
  
  const duplicatedItems = useMemo(() => {
    let arr = [];
    while (items.length && arr.length < 20) {
      arr.push(...items);
    }
    return arr;
  }, [items]);

  useGSAP(() => {
    const currentState = state.current;
    const totalItems = duplicatedItems.length;
    currentState.active = -1;
    
    gsap.set(textRefs.current.filter(Boolean), { yPercent: 100 });
    stateRefs.current = Array.from({ length: totalItems }, () => ({ v: 0 }));
    
    const calculateDimensions = () => {
      const el = containerRef.current;
      if (!el) return;
      const maxHeight = fill ? (el.clientHeight - 2 * (48 + gapSize + 40 + 48)) * ASPECT_RATIO : Infinity;
      currentState.w = Math.max(280, Math.min(0.4 * el.clientWidth, 640, maxHeight));
      
      const ww = window.innerWidth;
      currentState.peek = Math.min(0.5, Math.max(0.18, ((0.6 * ww) / currentState.w - 0.5) / calcScale(Math.min(8, Math.max(3, Math.round(ww / 360))))));
      
      el.style.setProperty("--ss-w", `${currentState.w}px`);
      el.style.setProperty("--ss-h", `${currentState.w / ASPECT_RATIO}px`);
    };
    
    const animateActive = (index, isActive) => {
      const itemState = stateRefs.current[index];
      const textEl = textRefs.current[index];
      if (!itemState || !textEl) return;
      
      const dur = 0.6 * !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap.to(itemState, {
        v: 32 * !!isActive,
        duration: dur,
        ease: EASE_NAME,
        overwrite: true,
        onUpdate: () => updateLayoutRef.current()
      });
      gsap.to(textEl, {
        yPercent: 100 * !isActive,
        duration: isActive ? dur : 0.6 * dur,
        delay: isActive ? 0.25 * dur : 0,
        ease: EASE_NAME,
        overwrite: true
      });
    };
    
    const renderTransforms = () => {
      const { w, offset, peek } = currentState;
      itemRefs.current.forEach((el, index) => {
        if (!el) return;
        const wrappedIndex = gsap.utils.wrap(-totalItems / 2, totalItems / 2, index - offset);
        const absIndex = Math.abs(wrappedIndex);
        
        const translateX = Math.sign(wrappedIndex) * (0.5 + peek * calcScale(absIndex) - Math.pow(0.89, absIndex) / 2) * w;
        const scaleVal = Math.pow(0.89, absIndex);
        
        el.style.transform = `translate(-50%, -50%) translate(${translateX}px, ${translateX * ROTATION_TAN}px) rotate(${0.5 * Math.sign(wrappedIndex) * (15 * (1 - Math.pow(0.7, absIndex)))}deg) scale(${scaleVal})`;
        el.style.zIndex = String(100 - Math.round(10 * Math.abs(wrappedIndex)));
        
        const pad = 16 * Math.pow(0.55, absIndex);
        const h = w / ASPECT_RATIO;
        const innerTransform = `translate(${-pad}px, ${-pad}px) scale(${(w + 2 * pad) / w}, ${(h + 2 * pad + (stateRefs.current[index]?.v || 0)) / h})`;
        
        const scaleEl = scaleRefs.current[index];
        if (scaleEl) scaleEl.style.transform = innerTransform;
        
        const overlayEl = overlayRefs.current[index];
        if (overlayEl) {
          overlayEl.style.transform = innerTransform;
          overlayEl.style.opacity = Math.min(1, absIndex < 1 ? 0.3 * absIndex : 0.2 + 0.1 * absIndex);
        }
      });
    };
    
    handleActiveRef.current = (shouldActivate, currentOffset = currentState.offset) => {
      if (!shouldActivate) {
        animateActive(currentState.active, false);
        currentState.active = -1;
        return;
      }
      const activeIdx = gsap.utils.wrap(0, totalItems, Math.round(currentOffset));
      if (activeIdx !== currentState.active) {
        animateActive(currentState.active, false);
        animateActive(activeIdx, true);
        currentState.active = activeIdx;
      }
    };
    
    updateLayoutRef.current = renderTransforms;
    calculateDimensions();
    renderTransforms();
    handleActiveRef.current(true);
    
    const resizeObserver = new ResizeObserver(() => {
      calculateDimensions();
      renderTransforms();
    });
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, { scope: containerRef, dependencies: [duplicatedItems.length] });

  const tweenToOffset = (targetOffset, dur = 0.7, easeName = EASE_NAME) => {
    let triggered = false;
    state.current.target = targetOffset;
    
    const tween = gsap.to(state.current, {
      offset: targetOffset,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : dur,
      ease: easeName,
      overwrite: true,
      onUpdate: () => {
        updateLayoutRef.current();
        if (!triggered && tween.progress() >= 0.3) {
          triggered = true;
          handleActiveRef.current(true, targetOffset);
        }
      },
      onComplete: () => handleActiveRef.current(true)
    });
    return tween;
  };

  const dragState = useRef({ on: false, moved: false, x: 0, start: 0, v: 0, lastX: 0, lastT: 0 });
  const getFriction = () => 1 / (0.3 * state.current.w * 1.6);
  
  const handleDragEnd = () => {
    const dState = dragState.current;
    if (!dState.on) return;
    dState.on = false;
    if (!dState.moved) return;
    
    const velocity = performance.now() - dState.lastT < 80 ? dState.v : 0;
    const target = Math.round(state.current.offset + 450 * velocity);
    const dist = Math.abs(target - state.current.offset);
    
    tweenToOffset(target, gsap.utils.clamp(0.5, 1.4, 0.45 + 0.25 * dist), "expo.out");
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={(e) => {
        const now = performance.now();
        dragState.current = { on: true, moved: false, x: e.clientX, start: state.current.offset, v: 0, lastX: e.clientX, lastT: now };
        gsap.killTweensOf(state.current);
      }}
      onPointerMove={(e) => {
        const dState = dragState.current;
        if (!dState.on) return;
        if (!dState.moved && Math.abs(e.clientX - dState.x) > 4) {
          dState.moved = true;
          handleActiveRef.current(false);
        }
        state.current.offset = dState.start - (e.clientX - dState.x) * getFriction();
        
        const now = performance.now();
        const instVelocity = -((e.clientX - dState.lastX) * getFriction()) / Math.max(1, now - dState.lastT);
        dState.v = 0.6 * dState.v + 0.4 * instVelocity;
        dState.lastX = e.clientX;
        dState.lastT = now;
        updateLayoutRef.current();
      }}
      onPointerUp={handleDragEnd}
      onPointerLeave={handleDragEnd}
      style={fill ? { "--ss-gap": `${gapSize}px` } : undefined}
      className={`relative w-full cursor-grab touch-pan-y select-none active:cursor-grabbing ${fill ? "h-full" : "h-[calc(var(--ss-h)_+_240px)] [--ss-gap:32px] lg:h-[calc(var(--ss-h)_+_336px)] lg:[--ss-gap:80px]"} ${className}`}
    >
      {duplicatedItems.map((item, index) => (
        <a
          key={`${item.slug}-${index}`}
          ref={(el) => (itemRefs.current[index] = el)}
          href={`/animations/${item.slug}`}
          aria-label={item.title}
          draggable={false}
          onClick={(e) => {
            e.preventDefault();
            if (dragState.current.moved) return;
            const currentState = state.current;
            const total = duplicatedItems.length;
            const dist = gsap.utils.wrap(-total / 2, total / 2, index - currentState.offset);
            const path = `/animations/${duplicatedItems[index].slug}`;
            
            if (Math.abs(dist) < 0.5) {
              if (router) {
                router.push(path);
              } else {
                window.location.href = path;
              }
            } else {
              handleActiveRef.current(false);
              tweenToOffset(Math.round(currentState.offset + dist));
            }
          }}
          className="absolute top-1/2 left-1/2 block h-(--ss-h) w-(--ss-w) will-change-transform"
        >
          <span ref={(el) => (scaleRefs.current[index] = el)} className={`${absoluteOverlayClass} bg-surface`} />
          <span className="absolute inset-0 overflow-hidden bg-surface">
            <img src={item.image} alt="" loading="lazy" draggable={false} className="absolute inset-0 object-cover" style={{ width: "100%", height: "100%" }} />
          </span>
          <span ref={(el) => (overlayRefs.current[index] = el)} className={`${absoluteOverlayClass} pointer-events-none bg-black opacity-0`} />
          <span className="absolute top-full right-0 left-0 flex h-48 items-center">
            <span className="block min-w-0 overflow-hidden">
              <span ref={(el) => (textRefs.current[index] = el)} className="text-body-sm block truncate font-medium">
                {item.title}
              </span>
            </span>
          </span>
        </a>
      ))}
      <div className="absolute top-[calc(50%_+_var(--ss-h)/2_+_48px_+_var(--ss-gap))] right-0 left-0 z-[200] flex items-center justify-center gap-8">
        {[
          { dir: -1, label: "Previous", Icon: CaretLeft },
          { dir: 1, label: "Next", Icon: CaretRight }
        ].map(({ dir, label, Icon }, i) => (
          <button
            key={i}
            type="button"
            aria-label={label}
            onClick={() => {
              handleActiveRef.current(false);
              const currentState = state.current;
              const currentOffset = gsap.isTweening(currentState) ? (currentState.target ?? Math.round(currentState.offset)) : Math.round(currentState.offset);
              tweenToOffset(currentOffset + dir);
            }}
            className="inline-flex size-40 cursor-pointer items-center justify-center bg-surface text-foreground transition-[background-color,scale] duration-200 ease-(--ease-expo-out) hover:bg-surface/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/60 active:scale-90"
          >
            <Icon className="size-16" />
          </button>
        ))}
      </div>
    </div>
  );
}

// NOTE: module id: 619499
export default function CascadeSection({ items = [], count = 0, headline, line, theme = "dark" }) {
  return (
    <section data-theme={theme} className="overflow-hidden bg-background py-64 text-foreground lg:py-160">
      <div className="v2-container flex flex-col gap-16">
        <RevealHeadline as="h2" sizeClass="text-h2" className="font-medium text-balance" trigger="scroll">
          {headline ?? t("home-v3.shipped.headline")}
        </RevealHeadline>
        <AnimatedText
          tag="p"
          className="text-body-lg max-w-[40rem] text-foreground-muted"
          {...textAnimProps}
          triggerMode="scroll"
          delay={0.25}
        >
          {line ?? t("home-v3.shipped.line", { count })}
        </AnimatedText>
      </div>
      <div className="v2-container">
        <ShippedCascadeCore items={items} className="mt-32 lg:mt-176" />
      </div>
    </section>
  );
}
