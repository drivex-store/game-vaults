'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useAnimation, usePageEnterAnimation } from '@/providers/AnimationProvider';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export const defaultAnimationConfig = {
  type: "lines",
  mask: "lines",
  duration: 0.6,
  stagger: 0.03,
  ease: "power2.out",
  animationProps: {
    yPercent: 100
  },
  triggerMode: "pageEnter"
};

export const AnimatedHeadline = forwardRef(function AnimatedHeadline({
  children,
  className = "",
  tag: Tag = "h2",
  size = "h2",
  delay = 0,
  rectangleDuration = 0.8,
  textDuration = 0.8,
  rectangleColor = "var(--secondary)",
  start = "top 95%",
  stagger = 0.05,
  triggerMode = "scroll",
  onReady,
  ...restProps
}, ref) {
  const containerRef = useRef(null);
  const splitTextRef = useRef(null);
  const timelineRef = useRef(null);
  const hasPendingRestart = useRef(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    document.fonts.ready.then(() => setFontsLoaded(true));
  }, []);

  const { getHasTriggered } = useAnimation();

  usePageEnterAnimation(() => {
    if (timelineRef.current) {
      timelineRef.current.restart();
    } else {
      hasPendingRestart.current = true;
    }
  }, [], "AnimatedHeadline", triggerMode === "pageEnter");

  useEffect(() => {
    if (triggerMode === "pageEnter" && fontsLoaded && timelineRef.current && getHasTriggered() && hasPendingRestart.current) {
      const timer = setTimeout(() => {
        if (timelineRef.current) {
          timelineRef.current.restart();
          hasPendingRestart.current = false;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [triggerMode, fontsLoaded, getHasTriggered]);

  useGSAP(() => {
    if (!containerRef.current || !fontsLoaded) return;

    const mm = gsap.matchMedia();
    let wrappers = [];
    let rectangles = [];

    mm.add("(max-width: 767px)", () => {
      const split = SplitText.create(containerRef.current, {
        type: "lines",
        linesClass: "split-line",
        mask: "lines",
        aria: "none"
      });
      splitTextRef.current = split;

      if (!split.lines || split.lines.length === 0) return;

      gsap.set(split.lines, {
        yPercent: 100,
        force3D: true
      });

      const timelineConfig = {};
      if (triggerMode === "scroll") {
        timelineConfig.scrollTrigger = {
          trigger: containerRef.current,
          start: start,
          toggleActions: "play none none none",
          invalidateOnRefresh: true
        };
      } else if (triggerMode === "immediate") {
        timelineConfig.paused = false;
      } else {
        timelineConfig.paused = true;
      }
      const tl = gsap.timeline(timelineConfig);
      timelineRef.current = tl;
      tl.to(split.lines, {
        yPercent: 0,
        duration: textDuration,
        delay: delay,
        ease: "expo.out",
        stagger: stagger,
        force3D: true
      });

      if ((triggerMode === "manual" || triggerMode === "pageEnter") && onReady) {
        onReady(() => timelineRef.current?.restart());
      }

      if (hasPendingRestart.current && triggerMode === "pageEnter") {
        hasPendingRestart.current = false;
        tl.restart();
      }

      return () => {
        tl.kill();
        split.revert();
      };
    });

    mm.add("(min-width: 768px)", () => {
      const split = SplitText.create(containerRef.current, {
        type: "lines",
        linesClass: "split-line",
        aria: "none"
      });
      splitTextRef.current = split;

      if (!split.lines || split.lines.length === 0) return;

      wrappers = [];
      rectangles = [];

      split.lines.forEach(() => {
        const wrapper = document.createElement("div");
        wrapper.className = "line-wrapper";
        Object.assign(wrapper.style, {
          position: "relative",
          overflow: "visible",
          display: "inline-block",
          width: "fit-content",
          lineHeight: "0.9"
        });

        const rect = document.createElement("div");
        rect.className = "line-rectangle";
        Object.assign(rect.style, {
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          background: rectangleColor,
          transformOrigin: "left center",
          zIndex: "2",
          pointerEvents: "none"
        });

        wrappers.push(wrapper);
        rectangles.push(rect);
      });

      split.lines.forEach((line, index) => {
        line.style.lineHeight = "0.9";
        line.parentNode.insertBefore(wrappers[index], line);
        wrappers[index].appendChild(line);
        wrappers[index].appendChild(rectangles[index]);
      });

      gsap.set(split.lines, {
        opacity: 0,
        x: "5rem",
        force3D: true
      });
      
      gsap.set(rectangles, {
        scaleX: 1,
        force3D: true,
        willChange: "transform"
      });

      const timelineConfig = {};
      if (triggerMode === "scroll") {
        timelineConfig.scrollTrigger = {
          trigger: containerRef.current,
          start: start,
          toggleActions: "play none none none",
          invalidateOnRefresh: true
        };
      } else if (triggerMode === "immediate") {
        timelineConfig.paused = false;
      } else {
        timelineConfig.paused = true;
      }

      const tl = gsap.timeline(timelineConfig);
      timelineRef.current = tl;

      tl.to(rectangles, {
        scaleX: 0,
        duration: rectangleDuration,
        delay: delay,
        ease: "expo.inOut",
        stagger: stagger,
        force3D: true
      });

      tl.to(split.lines, {
        opacity: 1,
        x: 0,
        duration: textDuration,
        ease: "expo.out",
        stagger: stagger,
        force3D: true,
        onComplete: () => {
          gsap.set(rectangles, {
            clearProps: "willChange"
          });
        }
      }, "<+60%");

      if ((triggerMode === "manual" || triggerMode === "pageEnter") && onReady) {
        onReady(() => timelineRef.current?.restart());
      }

      if (hasPendingRestart.current && triggerMode === "pageEnter") {
        hasPendingRestart.current = false;
        tl.restart();
      }

      return () => {
        tl.kill();
        split.revert();
        wrappers.forEach((wrapper) => {
          if (wrapper?.parentNode) {
            while (wrapper.firstChild) {
              wrapper.parentNode.insertBefore(wrapper.firstChild, wrapper);
            }
            wrapper.remove();
          }
        });
      };
    });

    return () => {
      mm.revert();
      timelineRef.current = null;
      hasPendingRestart.current = false;
      splitTextRef.current = null;
    };
  }, {
    scope: containerRef,
    dependencies: [triggerMode, fontsLoaded]
  });

  useImperativeHandle(ref, () => ({
    play: () => {
      if (timelineRef.current) timelineRef.current.restart();
    },
    reset: () => {
      if (timelineRef.current) timelineRef.current.progress(0).pause();
    }
  }));

  return (
    <Tag
      ref={containerRef}
      className={`${size} ${className} tracking-tight`}
      {...(triggerMode === "pageEnter" ? { "data-page-enter-animation": "true" } : {})}
      {...restProps}
    >
      {children}
    </Tag>
  );
});

export default AnimatedHeadline;
