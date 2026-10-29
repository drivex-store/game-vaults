'use client';

// NOTE: module id: 547118
import React, { useRef } from 'react';
import RevealHeadline from '@/animations/shared/RevealHeadline'; // NOTE: module id: 963160
import AnimatedText from '@/animations/components/AnimatedText'; // NOTE: module id: 218091
import AnimatedReveal from '@/animations/components/AnimatedReveal'; // NOTE: module id: 460391
import AnimatedButton from '@/animations/components/AnimatedButton'; // NOTE: module id: 687989
import FactList from '@/features/pricing/components/FactList'; // NOTE: module id: 567874
import { IsoFigure, useIsoLoop } from '@/features/common/IsoFigure'; // NOTE: module id: 576720
import { weeklyFig } from '@/features/pricing/BentoTilesSection'; // NOTE: module id: 392197 (Assuming this is a figure config)
import { revealFig } from '@/features/pricing/PricingV4Section'; // NOTE: module id: 586818
import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682

const textAnimationProps = {
  type: "lines",
  mask: "lines",
  duration: 0.6,
  stagger: 0.03,
  ease: "power2.out",
  animationProps: { yPercent: 100 }
};

export function Column({ fig, title, line, facts, cta, href, action = null }) {
  const columnRef = useRef(null);
  const { rest, onEnter, onLeave } = useIsoLoop(columnRef, fig);

  return (
    <article
      ref={columnRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="col-span-12 flex flex-col gap-32 bg-background p-24 md:col-span-6 lg:p-40"
    >
      <div aria-hidden="true" className="flex h-[140px] items-center justify-center md:h-[200px]">
        <IsoFigure boxes={rest} />
      </div>
      <div className="flex flex-col gap-12">
        <h3 className="text-h4 font-medium">{title}</h3>
        <p className="text-body text-foreground-muted">{line}</p>
      </div>
      <FactList className="w-full max-w-[420px]" items={facts} />
      
      {(action || href) && (
        <div className="mt-auto">
          {action || (
            <AnimatedButton href={href} theme="surface">
              {cta}
            </AnimatedButton>
          )}
        </div>
      )}
    </article>
  );
}

// NOTE: module id: 547118
export default function LibraryOrKitSection({
  count = 0,
  perMonth = 20,
  kits = [],
  theme = "dark",
  kitHref = "/kits"
}) {
  const kitNames = kits.map(k => k.title).join(" and ");
  
  let priceDisplay = kits[0]?.priceDisplay;
  const formattedPrice = (typeof priceDisplay === "string" 
    ? priceDisplay.replace(/^EUR\s*/, "€") 
    : priceDisplay) || "€149";

  const interpolateFacts = (factsArray, valuesObj) => {
    return factsArray.map(fact => {
      const replacedValue = fact.value.replace(/\{(\w+)\}/g, (match, key) => {
        return valuesObj[key] != null ? String(valuesObj[key]) : match;
      });
      return {
        label: fact.label,
        value: replacedValue
      };
    });
  };

  return (
    <section data-theme={theme} className="bg-background py-64 text-foreground lg:py-160">
      <div className="v2-container flex flex-col gap-48 lg:gap-64">
        <div className="grid grid-cols-12 items-end gap-y-24 lg:gap-x-24">
          <div className="col-span-12 flex flex-col gap-16 md:col-span-6">
            <RevealHeadline
              as="h2"
              sizeClass="text-h2"
              className="max-w-[22ch] font-medium text-balance"
              trigger="scroll"
            >
              {t("pricing-v3.libraryOrKit.headline")}
            </RevealHeadline>
            <AnimatedText
              tag="p"
              className="text-body-lg max-w-[46ch] text-foreground-muted"
              {...textAnimationProps}
              triggerMode="scroll"
              delay={0.25}
            >
              {t("pricing-v3.libraryOrKit.sub")}
            </AnimatedText>
          </div>
          <AnimatedText
            tag="p"
            className="text-body-lg col-span-12 max-w-[46ch] md:col-span-6 md:col-start-7"
            {...textAnimationProps}
            triggerMode="scroll"
            delay={0.35}
          >
            {t("pricing-v3.libraryOrKit.stack")}
          </AnimatedText>
        </div>

        <AnimatedReveal trigger="scroll" className="grid grid-cols-12 gap-px border border-border bg-border">
          <Column
            fig={weeklyFig}
            title={t("pricing-v3.libraryOrKit.library.title")}
            line={t("pricing-v3.libraryOrKit.library.line")}
            facts={interpolateFacts(t("pricing-v3.libraryOrKit.library.facts"), {
              count: count,
              perMonth: `€${perMonth}`
            })}
            cta={t("pricing-v3.libraryOrKit.library.cta")}
            href="/animations"
          />
          <Column
            fig={revealFig}
            title={t("pricing-v3.libraryOrKit.kit.title")}
            line={t("pricing-v3.libraryOrKit.kit.line")}
            facts={interpolateFacts(t("pricing-v3.libraryOrKit.kit.facts"), {
              names: kitNames,
              price: formattedPrice
            })}
            cta={t("pricing-v3.libraryOrKit.kit.cta")}
            href={kitHref}
          />
        </AnimatedReveal>
      </div>
    </section>
  );
}
