'use client';

// NOTE: module id: 979652
import React from 'react';
import RevealHeadline from '@/animations/shared/RevealHeadline'; // NOTE: module id: 963160
import AnimatedText from '@/animations/components/AnimatedText'; // NOTE: module id: 218091
import AnimatedReveal from '@/animations/components/AnimatedReveal'; // NOTE: module id: 460391
import { TESTIMONIALS } from '@/libs/config/TESTIMONIALS'; // NOTE: module id: 967791

const textAnimationProps = {
  type: "lines",
  mask: "lines",
  duration: 0.6,
  stagger: 0.03,
  ease: "power2.out",
  animationProps: { yPercent: 100 }
};

export default function TestimonialsSection({
  headline,
  names,
  quotes = []
}) {

  const displayQuotes = names
    ? names.map(name => TESTIMONIALS.find(t => t.name === name)).filter(Boolean)
    : quotes;

  return (
    <section data-theme="light" className="bg-background py-64 text-foreground lg:py-160">
      <div className="v2-container flex flex-col gap-48 lg:gap-80">
        <RevealHeadline
          as="h2"
          sizeClass="text-h2"
          className="max-w-[20ch] font-medium text-balance"
          trigger="scroll"
        >
          {headline}
        </RevealHeadline>
        
        <div className="grid grid-cols-12 gap-y-64 lg:gap-x-24">
          {displayQuotes.map((quote, index) => (
            <figure key={quote.name} className="col-span-12 flex flex-col gap-32 lg:col-span-6 lg:pr-48">
              <AnimatedText
                tag="blockquote"
                className="text-h4 !font-normal"
                {...textAnimationProps}
                triggerMode="scroll"
                delay={0.12 * index}
              >
                {quote.body}
              </AnimatedText>
              
              <AnimatedReveal
                as="figcaption"
                trigger="scroll"
                delay={0.3 + 0.12 * index}
                className="flex items-center gap-16"
              >
                {quote.avatarSrc ? (
                  <div className="relative size-56 shrink-0 overflow-hidden">
                    <img
                      src={quote.avatarSrc}
                      alt=""
                      className="absolute inset-0 object-cover"
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                ) : null}
                
                <div className="flex flex-col gap-2">
                  <span className="text-body-sm font-medium">{quote.name}</span>
                  <span className="text-body-sm text-foreground-muted">{quote.role}</span>
                </div>
              </AnimatedReveal>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}