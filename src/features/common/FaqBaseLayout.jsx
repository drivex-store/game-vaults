'use client';

// NOTE: module id: 752362
import React, { useRef, useState, useCallback, useEffect } from 'react';
import gsap from 'gsap'; // NOTE: module id: 989970
import { SplitText } from 'gsap/SplitText'; // NOTE: module id: 875324
import RevealHeadline from '@/animations/shared/RevealHeadline'; // NOTE: module id: 963160
import AnimatedText from '@/animations/components/AnimatedText'; // NOTE: module id: 218091
import AnimatedButton from '@/animations/components/AnimatedButton'; // NOTE: module id: 687989
import AnimatedReveal from '@/animations/components/AnimatedReveal'; // NOTE: module id: 460391
import { useDualLayerScramble } from '@/hooks/useDualLayerScramble'; // NOTE: module id: 798851 (Placeholder name for text scrambling hook)
import { useBreakpoint } from '@/hooks/useBreakpoint'; // NOTE: module id: 400701
import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682

gsap.registerPlugin(SplitText);

function FaqItem({ q, a, isOpen, onToggle, isDesktop, duration = 0.8, ease = "expo.inOut" }) {
  const contentRef = useRef(null);
  const iconRef = useRef(null);
  const verticalLineRef = useRef(null);
  const timelineRef = useRef(null);
  const splitInstanceRef = useRef(null);
  const splitAnimRef = useRef(null);
  const wasOpenRef = useRef(false);

  const { ref: scrambleRef, scramble } = useScrambleText({
    duration: 0.5,
    speed: 1,
    firstColorClass: "scramble-brand",
    secondColorClass: "scramble-inherit"
  });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const contentEl = contentRef.current;
    if (!contentEl) return;

    gsap.set(contentEl, { height: 0, overflow: "hidden", force3D: true });

    const tl = gsap.timeline({ paused: true, defaults: { duration, ease } });
    tl.to(contentEl, { height: "auto", duration, ease }, 0);
    
    if (iconRef.current) {
      tl.to(iconRef.current, { rotation: -180, duration, ease }, 0);
    }
    
    if (verticalLineRef.current) {
      tl.to(verticalLineRef.current, { opacity: 0, duration: 0.5 * duration, ease: "power2.inOut" }, 0.25 * duration);
    }
    
    timelineRef.current = tl;

    return () => {
      tl.kill();
      splitAnimRef.current?.kill();
      splitInstanceRef.current?.revert();
    };
  }, [duration, ease]);

  useEffect(() => {
    if (timelineRef.current && isOpen !== wasOpenRef.current) {
      wasOpenRef.current = isOpen;
      
      if (isOpen) {
        timelineRef.current.play();
        if (isDesktop) scramble();
        
        if (isDesktop && contentRef.current) {
          const timeoutId = window.setTimeout(() => {
            document.fonts?.ready.then(() => {
              const contentEl = contentRef.current;
              if (contentEl) {
                contentEl.querySelectorAll("p").forEach(pEl => {
                  if (pEl.querySelector(".faq-split-line")) return;
                  
                  splitInstanceRef.current = new SplitText(pEl, {
                    type: "lines",
                    mask: "lines",
                    linesClass: "faq-split-line"
                  });
                  
                  const lines = splitInstanceRef.current.lines;
                  gsap.set(lines, { yPercent: 110, force3D: true });
                  splitAnimRef.current = gsap.to(lines, {
                    yPercent: 0,
                    duration: 0.6,
                    stagger: 0.06,
                    ease: "expo.out",
                    force3D: true
                  });
                });
              }
            });
          }, 180);
          return () => window.clearTimeout(timeoutId);
        }
      } else {
        timelineRef.current.reverse();
        splitAnimRef.current?.kill();
        splitAnimRef.current = null;
        splitInstanceRef.current?.revert();
        splitInstanceRef.current = null;
      }
    }
  }, [isOpen, isDesktop]);

  return (
    <div className="faq-item border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`group flex w-full cursor-pointer items-start justify-between gap-16 border-0 bg-transparent py-24 text-left transition-colors duration-300 lg:items-center ${
          isOpen ? "text-foreground" : "text-foreground-muted hover:text-foreground"
        }`}
      >
        <span ref={scrambleRef} className="text-body-lg">{q}</span>
        <svg
          ref={iconRef}
          className="h-12 w-12 shrink-0"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            ref={verticalLineRef}
            d="M8 1V15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
          <path
            d="M1 8H15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
      </button>
      <div ref={contentRef}>
        <div className="text-body max-w-[96ch] pb-24 text-foreground-muted">
          <p>{a}</p>
        </div>
      </div>
    </div>
  );
}

// NOTE: module id: 752362
export default function FaqSection({
  faqs = t("common.faq.items"),
  eyebrow,
  headline = t("common.faq.headline"),
  subtext = t("common.faq.subtext"),
  ctaLink = { label: t("common.faq.ctaLabel"), href: "/faq" },
  sectionId,
  inset = false,
  list = null,
  theme = "light"
}) {
  const [openIndex, setOpenIndex] = useState(null);
  const isDesktop = useBreakpoint("lg");
  
  const handleToggle = useCallback(index => {
    setOpenIndex(prev => (prev === index ? null : index));
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a }
    }))
  };

  return (
    <section id={sectionId} data-theme={theme} className="faq relative bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="v2-container py-64 lg:py-128">
        <div className={inset ? "grid grid-cols-12 gap-x-24" : "contents"}>
          <div className={inset ? "col-span-12 lg:col-span-10 lg:col-start-2" : "contents"}>
            <div className="grid grid-cols-12 gap-x-24 gap-y-64">
              
              <div
                data-sticky={true}
                className="col-span-12 lg:col-span-4 lg:col-start-1 lg:sticky lg:top-[var(--v2-sticky-top)] lg:self-start"
              >
                {eyebrow ? (
                  <AnimatedText
                    tag="p"
                    className="text-mono-sm mb-24 text-foreground-muted"
                    type="lines"
                    mask="lines"
                    duration={0.6}
                    stagger={0.03}
                    ease="power2.out"
                    animationProps={{ yPercent: 100 }}
                    triggerMode="scroll"
                  >
                    {eyebrow}
                  </AnimatedText>
                ) : null}
                
                <RevealHeadline as="h2" trigger="scroll" className="max-w-[14ch]">
                  {headline}
                </RevealHeadline>
                
                <div className="mt-24">
                  <AnimatedText
                    tag="p"
                    className="text-body max-w-[34ch] text-foreground-muted"
                    type="lines"
                    mask="lines"
                    duration={0.6}
                    stagger={0.03}
                    ease="power2.out"
                    animationProps={{ yPercent: 100 }}
                    triggerMode="scroll"
                  >
                    {subtext}
                  </AnimatedText>
                </div>
                
                {ctaLink ? (
                  <div className="mt-32 hidden lg:flex">
                    <AnimatedButton href={ctaLink.href} theme="brand" size="sm">
                      {ctaLink.label}
                    </AnimatedButton>
                  </div>
                ) : null}
              </div>
              
              <div className="col-span-12 lg:col-span-7 lg:col-start-7">
                {list ?? (
                  <AnimatedReveal trigger="scroll" stagger={0.06} y={20} className="w-full">
                    {faqs.map((faq, index) => (
                      <FaqItem
                        key={faq.q}
                        q={faq.q}
                        a={faq.a}
                        isOpen={openIndex === index}
                        onToggle={() => handleToggle(index)}
                        isDesktop={isDesktop}
                      />
                    ))}
                  </AnimatedReveal>
                )}
                
                {ctaLink ? (
                  <div className="mt-32 flex lg:hidden">
                    <AnimatedButton href={ctaLink.href} theme="brand" size="sm">
                      {ctaLink.label}
                    </AnimatedButton>
                  </div>
                ) : null}
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
