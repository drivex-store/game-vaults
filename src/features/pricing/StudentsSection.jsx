'use client';

// NOTE: module id: 952244
import React, { useRef } from 'react';
import RevealHeadline from '@/animations/shared/RevealHeadline'; // NOTE: module id: 963160
import AnimatedText from '@/animations/components/AnimatedText'; // NOTE: module id: 218091
import AnimatedReveal from '@/animations/components/AnimatedReveal'; // NOTE: module id: 460391
import AnimatedButton from '@/animations/components/AnimatedButton'; // NOTE: module id: 687989
import { IsoFigure, useIsoLoop, PUNCH } from '@/features/common/IsoFigure'; // NOTE: module id: 576720
import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682

const textAnimationProps = {
  type: "lines",
  mask: "lines",
  duration: 0.6,
  stagger: 0.03,
  ease: "power2.out",
  animationProps: { yPercent: 100 }
};

const studentFig = {
  hold: true,
  model: () => [
    { x: -40, y: -40, z: 0, w: 80, d: 80, h: 64 }, // Base of the cap
    { x: -72, y: -72, z: 64, w: 144, d: 144, h: 4, accent: true }, // Top square board
    { x: -5, y: -5, z: 68, w: 10, d: 10, h: 3 }, // Center button
    { x: 5, y: -1, z: 68, w: 67, d: 2, h: 1 }, // Tassel string on top
    { x: 72, y: -1.5, z: 38, w: 3, d: 3, h: 30 } // Tassel hanging down
  ],
  cycle: (tl, boxes) => {
    // Elevate the top parts (board, button, tassel) when hovered
    tl.to(boxes.slice(1), { 
      z: (index, target) => target.z + 40, 
      duration: 0.6, 
      ease: PUNCH 
    });
  }
};

export default function StudentsSection() {
  const containerRef = useRef(null);
  const { rest, onEnter, onLeave } = useIsoLoop(containerRef, studentFig);

  return (
    <section data-theme="light" className="bg-background py-64 text-foreground lg:py-160">
      <div ref={containerRef} className="v2-container flex flex-col items-center gap-32 text-center lg:gap-48">
        
        <AnimatedReveal trigger="scroll" className="h-[140px] w-full max-w-[360px] lg:h-[260px]">
          <div
            aria-hidden="true"
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            className="h-full w-full"
          >
            <IsoFigure boxes={rest} />
          </div>
        </AnimatedReveal>
        
        <div className="flex flex-col items-center gap-32">
          <div className="flex flex-col items-center gap-16">
            <RevealHeadline
              as="h2"
              sizeClass="text-h2"
              className="max-w-[22ch] font-medium text-balance"
              trigger="scroll"
            >
              {t("pricing-v3.students.headline")}
            </RevealHeadline>
            
            <AnimatedText
              tag="p"
              className="text-body-lg max-w-[46ch] text-foreground-muted"
              {...textAnimationProps}
              triggerMode="scroll"
              delay={0.25}
            >
              {t("pricing-v3.students.line")}
            </AnimatedText>
          </div>
          
          <AnimatedReveal
            trigger="scroll"
            delay={0.35}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            <AnimatedButton href="/students" theme="surface">
              {t("pricing-v3.students.cta")}
            </AnimatedButton>
          </AnimatedReveal>
        </div>
        
      </div>
    </section>
  );
}