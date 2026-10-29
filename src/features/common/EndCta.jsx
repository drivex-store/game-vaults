'use client';

import React, { useRef } from 'react';
import gsap from 'gsap'; // NOTE: module id: 989970
import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682
import { useReveal } from '@/hooks/useReveal'; // NOTE: module id: 228414
import RevealHeadline from '@/animations/shared/RevealHeadline'; // NOTE: module id: 963160
import AnimatedText from '@/animations/components/AnimatedText'; // NOTE: module id: 218091
import AnimatedButton from '@/animations/components/AnimatedButton'; // NOTE: module id: 687989
import RingSection, { RING_SECTION_MIN_VH } from '@/features/landing/RingBackground'; // NOTE: module id: 809214

const defaultHeadline = t('common.endCta.headline');
const defaultSubtext = t('common.endCta.subtext');
const defaultPrimaryCta = {
  label: t('common.endCta.primaryLabel'),
  href: '/pricing'
};
const defaultSecondaryCta = {
  label: t('common.endCta.secondaryLabel'),
  href: '/animations'
};

// NOTE: module id: 482232
export default function EndCta({
  headline = defaultHeadline,
  subtext = defaultSubtext,
  primaryCta = defaultPrimaryCta,
  secondaryCta = defaultSecondaryCta,
  images = [],
  bleed = false,
  bleedTop = 0,
  ringOvershoot,
  ringPush,
  eyebrow,
  minimal = false,
  children = null
}) {
  const sectionRef = useRef(null);
  const headlineRef = useRef(null);
  const playSubtextRef = useRef(null);

  useReveal(sectionRef, {
    mode: 'scroll',
    build: () => {
      const tl = gsap.timeline({ paused: true });
      tl.call(() => headlineRef.current?.reveal?.(), [], 0);
      tl.call(() => playSubtextRef.current?.(), [], 0.2);
      return tl;
    }
  });

  const halfIndex = Math.ceil(images.length / 2);
  const leftImages = images.slice(0, halfIndex);
  const rightImages = images.slice(halfIndex);
  const shouldBleed = bleed && !minimal;
  const minHeightVh = minimal ? 50 : RING_SECTION_MIN_VH;
  const buttonSize = minimal ? 'sm' : 'default';

  return (
    <section
      ref={sectionRef}
      data-theme="dark"
      className={`end-cta relative flex items-center bg-background text-foreground ${shouldBleed ? '' : 'overflow-hidden'}`}
      style={{
        minHeight: `${minHeightVh}vh`,
        ...(shouldBleed ? { clipPath: `inset(-${bleedTop}vh 0 -100vh 0)` } : null)
      }}
    >
      <RingSection
        side="left"
        images={leftImages.length ? leftImages : images}
        overshoot={ringOvershoot}
        push={ringPush}
      />
      <RingSection
        side="right"
        images={rightImages.length ? rightImages : images}
        overshoot={ringOvershoot}
        push={ringPush}
      />
      <RingSection side="center" images={images} />

      <div className={`v2-container relative ${minimal ? 'py-96 lg:py-128' : 'py-128 lg:py-200'}`}>
        <div className="grid grid-cols-12 gap-x-24">
          <div
            className={`col-span-12 flex flex-col gap-32 lg:col-span-6 lg:col-start-4 ${children ? 'mx-auto w-full max-w-[560px] items-stretch text-left' : 'items-center text-center'}`}
          >
            {eyebrow && <p className="text-mono-sm text-foreground-muted">{eyebrow}</p>}

            <RevealHeadline
              ref={headlineRef}
              as="h2"
              trigger="manual"
              className="max-w-[18ch]"
            >
              {headline}
            </RevealHeadline>

            {subtext ? (
              <AnimatedText
                tag="p"
                className="text-body max-w-[44ch] text-foreground-muted"
                type="lines"
                mask="lines"
                duration={0.6}
                stagger={0.03}
                ease="power2.out"
                animationProps={{ yPercent: 100 }}
                triggerMode="manual"
                onReady={(play) => {
                  playSubtextRef.current = play;
                }}
                children={subtext}
              />
            ) : null}

            {children ? (
              <div className="mt-8 w-full text-left">{children}</div>
            ) : (
              <div className="mt-8 flex flex-col items-center gap-16 sm:flex-row sm:gap-12">
                {primaryCta && (
                  <AnimatedButton href={primaryCta.href} theme="brand" size={buttonSize}>
                    {primaryCta.label}
                  </AnimatedButton>
                )}
                {secondaryCta && (
                  <AnimatedButton href={secondaryCta.href} theme="surface" size={buttonSize}>
                    {secondaryCta.label}
                  </AnimatedButton>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
