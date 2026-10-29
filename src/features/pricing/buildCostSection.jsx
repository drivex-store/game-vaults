'use client';

// NOTE: module id: 23692
import React, { useRef, useState } from 'react';
import gsap from 'gsap'; // NOTE: module id: 989970
import { useGSAP } from '@gsap/react'; // NOTE: module id: 365747
import Slider from '@/features/common/Slider'; // NOTE: module id: 125303
import RevealHeadline from '@/animations/shared/RevealHeadline'; // NOTE: module id: 963160
import AnimatedReveal from '@/animations/components/AnimatedReveal'; // NOTE: module id: 460391
import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682
import CurrencyDisplay, { euro } from '@/features/pricing/components/CurrencyDisplay'; // NOTE: module id: 314670

function AnimatedBar({ share, className = "" }) {
  const barRef = useRef(null);
  const targetScale = Math.max(0.02, share);

  useGSAP(() => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(barRef.current, {
      scaleY: targetScale,
      duration: 0.5 * !isReduced,
      ease: "expo.out",
      overwrite: true
    });
  }, { dependencies: [targetScale] });

  return (
    <div
      ref={barRef}
      className={`h-full w-full origin-bottom ${className}`}
      style={{ transform: `scaleY(${targetScale})` }}
    />
  );
}

export default function buildCostSection({ yearly = 240, count = 0 }) {
  const [hourlyRate, setHourlyRate] = useState(80);
  const [hours, setHours] = useState(8);

  const buildCost = hourlyRate * hours;
  const maxCost = Math.max(buildCost, yearly);

  const calculatePaybackTime = (hoursToPayback) => {
    if (hoursToPayback < 1) {
      const minutes = Math.max(5, 5 * Math.round((60 * hoursToPayback) / 5));
      return t("pricing-v3.buildCost.minutes", { n: minutes });
    }
    const roundedHours = Math.round(2 * hoursToPayback) / 2;
    return t(
      roundedHours === 1 ? "pricing-v3.buildCost.hour" : "pricing-v3.buildCost.hours",
      { n: roundedHours }
    );
  };

  return (
    <section data-theme="light" className="bg-background pb-96 text-foreground lg:pb-160">
      <div className="v2-container grid grid-cols-12 items-end gap-y-48 lg:gap-x-24">
        <div className="col-span-12 flex flex-col gap-48 lg:col-span-5">
          <div className="flex flex-col gap-16">
            <RevealHeadline
              as="h2"
              sizeClass="text-h2"
              className="max-w-[22ch] font-medium text-balance"
              trigger="scroll"
            >
              {t("pricing-v3.buildCost.headline", { count, yearly: euro(yearly) })}
            </RevealHeadline>

            <AnimatedReveal as="p" trigger="scroll" delay={0.25} className="text-body-lg text-foreground-muted">
              {t("pricing-v3.buildCost.payback", {
                time: calculatePaybackTime(yearly / hourlyRate)
              })}
            </AnimatedReveal>
          </div>

          <AnimatedReveal trigger="scroll" className="flex flex-col gap-12">
            <Slider
              label={t("pricing-v3.buildCost.rate")}
              value={hourlyRate}
              min={30}
              max={200}
              step={5}
              unit="€/h"
              labelPosition="above"
              onChange={(val) => setHourlyRate(Number(val))}
            />
            <Slider
              label={t("pricing-v3.buildCost.hoursLabel")}
              value={hours}
              min={2}
              max={24}
              step={1}
              unit="h"
              labelPosition="above"
              onChange={(val) => setHours(Number(val))}
            />
          </AnimatedReveal>
        </div>

        <AnimatedReveal
          trigger="scroll"
          delay={0.15}
          className="col-span-12 grid grid-cols-2 gap-24 border border-border p-24 lg:col-span-6 lg:col-start-7 lg:gap-32 lg:p-32"
        >
          <div className="flex flex-col gap-16">
            <div className="h-[200px]">
              <AnimatedBar share={buildCost / maxCost} className="bg-foreground" />
            </div>
            <div className="flex flex-col gap-4">
              <CurrencyDisplay value={buildCost} className="text-h3 font-medium tabular-nums" />
              <p className="text-body-sm text-foreground-muted">
                {t("pricing-v3.buildCost.yours")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-16">
            <div className="h-[200px]">
              <AnimatedBar share={yearly / maxCost} className="bg-brand" />
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-h3 font-medium tabular-nums text-brand">
                {euro(yearly)}
              </span>
              <p className="text-body-sm text-foreground-muted">
                {t("pricing-v3.buildCost.ours", { count })}
              </p>
            </div>
          </div>
        </AnimatedReveal>
      </div>
    </section>
  );
}
