'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap'; // NOTE: module id: 989970
import { useGSAP } from '@gsap/react'; // NOTE: module id: 365747
import { ScrollTrigger } from 'gsap/ScrollTrigger'; // NOTE: module id: 883495
import { SplitText } from 'gsap/SplitText'; // NOTE: module id: 875324
import { useAnimation, usePageEnterAnimation } from '@/providers/AnimationProvider'; // NOTE: module id: 488463

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

// NOTE: module id: 218091
export default function AnimatedText({
  children,
  type,
  duration = 0.8,
  delay = 0,
  ease = "power4.out",
  mask,
  stagger = 0.05,
  from,
  animationProps,
  triggerMode = "scroll",
  start,
  toggleActions,
  scrollTrigger,
  autoSplit = true,
  deepSlice = true,
  linesClass,
  wordsClass,
  charsClass,
  aria = "none",
  propIndex = false,
  onComplete,
  onSplitCallback,
  onReady,
  className = "",
  tag: Tag = "div",
  revertOnComplete = false,
  ...restProps
}) {
  const containerRef = useRef(null);
  const splitTextRef = useRef(null);
  const tweenRef = useRef(null);
  const hasPendingRestart = useRef(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    document.fonts.ready.then(() => setFontsLoaded(true));
  }, []);

  let actualType = type;
  let actualMask = mask;

  if (actualType === undefined && actualMask === undefined) {
    actualType = "lines";
    actualMask = "lines";
  }

  const splitType = actualType || (actualMask ? `${actualMask},words` : "lines,words,chars");
  const animProps = animationProps || from || { opacity: 0, y: 30 };

  const { getHasTriggered } = useAnimation();

  const markAnimationStarted = () => {
    if (containerRef.current) {
      containerRef.current.setAttribute("data-animation-started", "true");
    }
  };

  usePageEnterAnimation(
    () => {
      hasPendingRestart.current = true;
      markAnimationStarted();
      if (tweenRef.current) {
        tweenRef.current.restart(true);
      }
    },
    [],
    "AnimatedText",
    triggerMode === "pageEnter"
  );

  useEffect(() => {
    if (triggerMode === "pageEnter" && fontsLoaded && tweenRef.current && getHasTriggered() && hasPendingRestart.current) {
      const timer = setTimeout(() => {
        if (tweenRef.current) {
          markAnimationStarted();
          tweenRef.current.restart(true);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [triggerMode, fontsLoaded, getHasTriggered]);

  useGSAP(() => {
    if (!containerRef.current || !fontsLoaded) return;

    const splitConfig = {
      type: splitType,
      aria,
      deepSlice,
      propIndex,
      autoSplit,
      ...(actualMask && { mask: actualMask }),
      ...(linesClass && { linesClass }),
      ...(wordsClass && { wordsClass }),
      ...(charsClass && { charsClass }),
      onSplit(splitInstance) {
        splitTextRef.current = splitInstance;
        if (onSplitCallback) onSplitCallback(splitInstance);

        const splitTypes = splitType.split(",").map((s) => s.trim());
        const targets =
          splitTypes.includes("chars") && splitInstance.chars?.length > 0
            ? splitInstance.chars
            : splitTypes.includes("words") && splitInstance.words?.length > 0
              ? splitInstance.words
              : splitTypes.includes("lines") && splitInstance.lines?.length > 0
                ? splitInstance.lines
                : [];

        if (targets.length === 0) return;

        const tweenConfig = {
          ...animProps,
          duration,
          delay,
          ease,
          stagger,
          ...(onComplete && {
            onComplete: () => {
              onComplete();
              if (revertOnComplete && splitInstance) {
                splitInstance.revert();
              }
            }
          })
        };

        if (triggerMode === "scroll") {
          const stConfig = {
            trigger: containerRef.current,
            start: start || "top 80%",
            ...(typeof scrollTrigger === "object" && scrollTrigger)
          };
          if (toggleActions) stConfig.toggleActions = toggleActions;
          
          tweenConfig.scrollTrigger = stConfig;
          tweenRef.current = gsap.from(targets, tweenConfig);
        } else if (triggerMode === "immediate") {
          tweenRef.current = gsap.from(targets, tweenConfig);
        } else {
          tweenRef.current = gsap.from(targets, { ...tweenConfig, paused: true });
          
          if (triggerMode === "pageEnter" && hasPendingRestart.current) {
            markAnimationStarted();
            tweenRef.current.restart(true);
          }
          
          if (triggerMode === "manual" && onReady) {
            onReady(() => {
              if (tweenRef.current) tweenRef.current.restart(true);
            });
          }
        }

        return tweenRef.current;
      }
    };

    splitTextRef.current = SplitText.create(containerRef.current, splitConfig);

    return () => {
      if (tweenRef.current) {
        tweenRef.current.kill();
        tweenRef.current = null;
      }
      if (splitTextRef.current) {
        splitTextRef.current.revert();
        splitTextRef.current = null;
      }
    };
  }, {
    scope: containerRef,
    dependencies: [triggerMode, fontsLoaded]
  });

  return (
    <Tag
      ref={containerRef}
      className={className}
      {...(triggerMode === "pageEnter" ? { "data-page-enter-animation": "true" } : {})}
      {...restProps}
    >
      {children}
    </Tag>
  );
}
