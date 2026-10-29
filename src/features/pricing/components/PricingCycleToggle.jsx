'use client';

// NOTE: module id: 821980
import React from 'react';
import Switch from '@/animations/shared/Switch'; // NOTE: module id: 870777
import { Sparkle } from '@phosphor-icons/react'; // NOTE: module id: 400545
import AnimatedPillGroup from '@/animations/components/AnimatedPillGroup'; // NOTE: module id: 876355
import config, { effectiveCyclePrice } from '@/libs/config/siteConfig'; // NOTE: module id: 516799
import { analytics } from '@/libs/utils/analytics'; // NOTE: module id: 943348
import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682
import { cn } from '@/libs/utils/className'; // NOTE: module id: 103746

export default function PricingCycleToggle({
  cycle,
  onChange,
  variant = "default",
  hint = true
}) {
  const isQuarterly = cycle === "quarterly";

  const savingsPercentage = (() => {
    const plans = config.stripe?.landingPlans || [];
    let maxSavings = 0;
    
    for (const plan of plans) {
      const qPrice = effectiveCyclePrice(plan.quarterly);
      const yPrice = effectiveCyclePrice(plan.yearly);
      
      if (!qPrice || !yPrice) continue;
      
      const yearlyEquivalent = 12 * qPrice;
      if (yearlyEquivalent <= 0) continue;
      
      const savings = Math.round(((yearlyEquivalent - yPrice) / yearlyEquivalent) * 100);
      if (savings > maxSavings) {
        maxSavings = savings;
      }
    }
    
    return maxSavings > 0 ? maxSavings : null;
  })();

  const showHint = hint && isQuarterly && !!savingsPercentage;

  const handleToggle = (newCycle) => {
    analytics.track("pricing_cycle_toggled", { cycle: newCycle });
    onChange(newCycle);
  };

  if (variant === "compact") {
    const getButtonClass = (isActive) =>
      cn(
        "text-mono-sm transition-colors duration-(--duration-quick) ease-(--ease-expo-out)",
        isActive ? "text-foreground" : "text-foreground-muted hover:text-foreground"
      );

    return (
      <div className="inline-flex items-center gap-12">
        <button
          type="button"
          onClick={() => handleToggle("quarterly")}
          className={getButtonClass(isQuarterly)}
        >
          Quarterly
        </button>
        <Switch
          checked={!isQuarterly}
          onChange={(checked) => handleToggle(checked ? "yearly" : "quarterly")}
          label={t("pricing.cycle.toggleAria")}
        />
        <button
          type="button"
          onClick={() => handleToggle("yearly")}
          className={getButtonClass(!isQuarterly)}
        >
          Yearly
        </button>
        {isQuarterly && savingsPercentage ? (
          <span className="text-mono-sm text-brand">
            −{savingsPercentage}%
          </span>
        ) : null}
      </div>
    );
  }

  const getPillButtonClass = (isActive) =>
    cn(
      "relative z-10 px-24 py-12 text-mono-sm transition-colors duration-(--duration-quick) ease-(--ease-expo-out)",
      isActive ? "text-background" : "text-foreground-muted hover:text-foreground"
    );

  return (
    <div className="inline-flex flex-col items-center">
      <AnimatedPillGroup
        activeId={cycle}
        pillClassName="bg-foreground"
        containerClassName="border border-foreground/15 p-4"
        role="radiogroup"
        aria-label={t("pricing.cycle.toggleAria")}
      >
        <button
          type="button"
          role="radio"
          aria-checked={isQuarterly}
          data-flip-id="quarterly"
          onClick={() => handleToggle("quarterly")}
          className={getPillButtonClass(isQuarterly)}
        >
          Quarterly
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={!isQuarterly}
          data-flip-id="yearly"
          onClick={() => handleToggle("yearly")}
          className={getPillButtonClass(!isQuarterly)}
        >
          Yearly
        </button>
      </AnimatedPillGroup>
      
      <div
        className="grid w-full overflow-hidden transition-[grid-template-rows,opacity] duration-(--duration-snap) ease-(--ease-power3-out)"
        style={{
          gridTemplateRows: showHint ? "1fr" : "0fr",
          opacity: showHint ? 1 : 0
        }}
        aria-hidden={!showHint}
      >
        <div className="min-h-0">
          <button
            type="button"
            onClick={() => handleToggle("yearly")}
            tabIndex={showHint ? 0 : -1}
            className="text-mono-sm mt-12 inline-flex items-center gap-8 text-brand transition-opacity duration-(--duration-fast) ease-(--ease-power3-out) hover:opacity-80"
          >
            <Sparkle />
            {t("pricing.cycle.savingsHint", { percent: savingsPercentage })}
          </button>
        </div>
      </div>
    </div>
  );
}
