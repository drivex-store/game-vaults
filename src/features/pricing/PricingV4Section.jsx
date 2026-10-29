'use client';

// NOTE: module id: 586818
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap'; // NOTE: module id: 989970
import RollerNumber from '@/animations/components/RollerNumber'; // NOTE: module id: 162387
import config, { effectiveCyclePrice, effectiveCycleTotal } from '@/libs/config/siteConfig'; // NOTE: module id: 516799
import { getPppDisplayPrice } from '@/features/pricing/utils/ppp'; // NOTE: module id: 397242
import { usePppTier } from '@/hooks/usePppGeo'; // NOTE: module id: 12895
import { studioPppTotalCents, STUDIO_CYCLE_MONTHS } from '@/features/pricing/utils/studioPricing'; // NOTE: module id: 59011
import PricingCycleToggle from '@/features/pricing/components/PricingCycleToggle'; // NOTE: module id: 821980
import SeatCounter from '@/features/common/SeatCounter'; // NOTE: module id: 69291
import KitPrice from '@/features/pricing/components/KitPrice'; // NOTE: module id: 597274
import AnimatedButton from '@/animations/components/AnimatedButton'; // NOTE: module id: 687989
import RevealHeadline from '@/animations/shared/RevealHeadline'; // NOTE: module id: 963160
import AnimatedReveal from '@/animations/components/AnimatedReveal'; // NOTE: module id: 460391
import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682
import { IsoFigure, viewBox, faces, str, reduced, PUNCH, useIsoLoop } from '@/features/common/IsoFigure'; // NOTE: module id: 576720

// Optional unused imports from original bundle kept for reference if needed later
import NavLink from 'next/link'; // NOTE: module id: 520237
import Image from 'next/image'; // NOTE: module id: 702954
import { useRouter } from 'next/navigation'; // NOTE: module id: 101836
import { usePathname } from 'next/navigation'; // NOTE: module id: 825740
import { useSearchParams } from 'next/navigation'; // NOTE: module id: 245647
import { analytics } from '@/libs/utils/analytics'; // NOTE: module id: 943348

const ANIMATION_TOTAL_COUNT = config?.animationStats?.totalCount ?? 50;

const landingPlans = config.stripe.landingPlans;
const soloPlan = landingPlans.find((plan) => plan.key === "solo");
const studioPlan = landingPlans.find((plan) => plan.perSeat);

// IsoFigure configurations for pricing cards
const soloFig = {
  model: () => [
    { x: -60, y: -60, z: 0, w: 120, d: 120, h: 4 },
    { x: -26, y: -26, z: 4, w: 52, d: 52, h: 52, accent: true }
  ],
  cycle: (tl, boxes) => {
    tl.to(boxes[1], { z: 40, duration: 0.6, ease: PUNCH }, 0)
      .to(boxes[1], { z: 4, duration: 0.6, ease: PUNCH }, 0.8)
      .to({}, { duration: 0.5 });
  }
};

const calcStudioPos = (index, total) => ({
  x: -16 + (index - (total - 1) / 2) * 30,
  y: -16 - (index - (total - 1) / 2) * 30
});

const generateStudioBoxes = (count) =>
  Array.from({ length: 8 }, (_, i) => ({
    ...calcStudioPos(Math.min(i, count - 1), count),
    z: 0,
    w: 32,
    d: 32,
    h: 32,
    o: +(i < count),
    accent: i === 0
  }));

const parseViewBox = (vbStr) => {
  const [x, y, w, h] = vbStr.split(" ").map(Number);
  return { x, y, w, h };
};

function StudioFigure({ seats }) {
  const containerRef = useRef(null);
  const displayCount = Math.min(seats, 8);
  const [initialBoxes] = useState(() => generateStudioBoxes(displayCount));
  const stateRef = useRef(null);

  if (!stateRef.current) {
    stateRef.current = {
      m: initialBoxes.map((b) => ({ ...b })),
      n: displayCount,
      vb: parseViewBox(viewBox(initialBoxes))
    };
  }

  const renderFrame = () => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    
    const { m: models, vb } = stateRef.current;
    const boxElements = svg.querySelectorAll("[data-box]");
    
    models.forEach((model, i) => {
      const el = boxElements[i];
      if (el) {
        faces(model).forEach((points, j) => {
          el.children[j]?.setAttribute("points", points.map(str).join(" "));
        });
        el.style.opacity = model.o;
      }
    });
    
    svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  };

  useEffect(() => {
    const state = stateRef.current;
    if (displayCount === state.n) return;
    
    const prevCount = state.n;
    state.n = displayCount;
    const dur = 0.7 * (!reduced());
    const tl = gsap.timeline({ onUpdate: renderFrame });
    
    state.tl?.kill();
    state.hop?.kill();
    
    state.m.forEach((model, i) => {
      const pos = calcStudioPos(i, displayCount);
      if (i < displayCount) {
        if (model.o < 0.05) {
          gsap.set(model, { ...pos, z: 40, o: 0 });
        }
        tl.to(model, { ...pos, z: 0, o: 1, duration: dur, ease: PUNCH }, i >= prevCount ? (i - prevCount) * 0.06 : 0);
      } else {
        if (model.o > 0 || model.z !== 40) {
          tl.to(model, { z: 40, o: 0, duration: 0.8 * dur, ease: PUNCH }, i < prevCount ? (prevCount - 1 - i) * 0.06 : 0);
        }
      }
    });
    
    tl.to(state.vb, { ...parseViewBox(viewBox(generateStudioBoxes(displayCount))), duration: dur, ease: PUNCH }, 0);
    state.tl = tl;
  }, [displayCount]);

  useEffect(() => {
    const article = containerRef.current?.closest("article");
    if (!article) return;
    
    const handleMouseEnter = () => {
      if (reduced() || stateRef.current.hop?.isActive() || stateRef.current.tl?.isActive()) return;
      
      const activeModels = stateRef.current.m.slice(0, stateRef.current.n);
      const hopTl = gsap.timeline({ onUpdate: renderFrame });
      stateRef.current.hop = hopTl;
      
      activeModels.forEach((model, i) => {
        hopTl
          .to(model, { z: 22, duration: 0.45, ease: PUNCH }, 0.07 * i)
          .to(model, { z: 0, duration: 0.45, ease: PUNCH }, 0.5 + 0.07 * i);
      });
    };
    
    article.addEventListener("mouseenter", handleMouseEnter);
    return () => {
      article.removeEventListener("mouseenter", handleMouseEnter);
      stateRef.current.hop?.kill();
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full">
      <IsoFigure boxes={initialBoxes} />
    </div>
  );
}

const emptyFig = { model: () => [], cycle: () => {} };

export const revealFig = {
  model: () => [
    { x: -70, y: -45, z: 0, w: 140, d: 90, h: 4 },
    { x: -58, y: -32, z: 4, w: 64, d: 14, h: 0, o: 0 },
    { x: -58, y: -8, z: 4, w: 40, d: 10, h: 0, o: 0 },
    { x: 22, y: -30, z: 4, w: 36, d: 50, h: 0, o: 0 },
    { x: -70, y: -45, z: 6, w: 140, d: 90, h: 4, accent: true }
  ],
  cycle: (tl, boxes, rawBoxes) => {
    tl.to(boxes[4], { z: 96, duration: 0.8, ease: PUNCH }, 0)
      .to(rawBoxes[4], { opacity: 0, duration: 0.5, ease: PUNCH }, 0.35);
      
    [1, 2, 3].forEach((i, idx) => {
      tl.to(rawBoxes[i], { opacity: 1, duration: 0.2, ease: "none" }, 0.45 + 0.1 * idx)
        .to(boxes[i], { h: i === 3 ? 30 : 6, duration: 0.6, ease: PUNCH }, 0.45 + 0.1 * idx);
    });
    
    tl.to(boxes.slice(1, 4), { h: 0, duration: 0.5, ease: PUNCH, stagger: 0.05 }, 2)
      .to(rawBoxes.slice(1, 4), { opacity: 0, duration: 0.2, ease: "none" }, 2.4)
      .to(rawBoxes[4], { opacity: 1, duration: 0.4, ease: PUNCH }, 2.1)
      .to(boxes[4], { z: 6, duration: 0.7, ease: PUNCH }, 2.1)
      .to({}, { duration: 0.4 });
  }
};

const menuFig = {
  model: () => [
    { x: -70, y: -45, z: 0, w: 140, d: 90, h: 4 },
    { x: -70, y: -45, z: 4, w: 4, d: 90, h: 4, accent: true },
    ...[0, 1, 2].map((i) => ({ x: -64, y: -36 + 26 * i, z: 8, w: 40, d: 14, h: 0, o: 0 }))
  ],
  cycle: (tl, boxes, rawBoxes) => {
    tl.to(boxes[1], { w: 56, duration: 0.7, ease: PUNCH }, 0);
    
    [2, 3, 4].forEach((i, idx) => {
      tl.to(rawBoxes[i], { opacity: 1, duration: 0.2, ease: "none" }, 0.45 + 0.1 * idx)
        .to(boxes[i], { h: 5, duration: 0.5, ease: PUNCH }, 0.45 + 0.1 * idx);
    });
    
    tl.to(boxes.slice(2), { h: 0, duration: 0.4, ease: PUNCH, stagger: { each: 0.05, from: "end" } }, 1.8)
      .to(rawBoxes.slice(2), { opacity: 0, duration: 0.2, ease: "none" }, 2.1)
      .to(boxes[1], { w: 4, duration: 0.6, ease: PUNCH }, 2.1)
      .to({}, { duration: 0.4 });
  }
};

function AnimatedCycleText({ cycle, texts, align = "start", className = "" }) {
  const refs = useRef({});
  const prevCycle = useRef(cycle);

  useLayoutEffect(() => {
    Object.entries(refs.current).forEach(([key, el]) => {
      gsap.set(el, { y: 0, yPercent: 110 * (key !== cycle) });
    });
  }, []); // Original had empty dependency array relying on closure

  useEffect(() => {
    const oldCycle = prevCycle.current;
    prevCycle.current = cycle;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (oldCycle === cycle) {
      Object.entries(refs.current).forEach(([key, el]) => {
        gsap.set(el, { yPercent: 110 * (key !== cycle) });
      });
      return;
    }
    
    const dir = cycle === "yearly" ? -1 : 1;
    const dur = 0.6 * (!isReduced);
    
    gsap.to(refs.current[oldCycle], { yPercent: 110 * dir, duration: dur, ease: PUNCH, overwrite: true });
    gsap.fromTo(
      refs.current[cycle],
      { yPercent: -110 * dir },
      { yPercent: 0, duration: dur, ease: PUNCH, overwrite: true }
    );
  }, [cycle]);

  return (
    <span className={`grid overflow-hidden ${className}`}>
      {Object.entries(texts).map(([key, text]) => (
        <span
          key={key}
          ref={(el) => (refs.current[key] = el)}
          className={`[grid-area:1/1] whitespace-nowrap ${align === "end" ? "justify-self-start sm:justify-self-end" : "justify-self-start"}`}
        >
          {text}
        </span>
      ))}
    </span>
  );
}

const formatAmount = (amt) => Math.round(100 * amt) / 100;

function SavingsHint({ plan, cycle }) {
  const freeMonths = Math.floor((4 * plan.quarter - plan.year) / (plan.quarter / 3));
  
  if (freeMonths > 0) {
    return (
      <AnimatedCycleText
        cycle={cycle}
        texts={{
          quarterly: " ",
          yearly: t("home-v3.pricing.monthsFree", { months: freeMonths })
        }}
        className="text-body-sm text-brand"
      />
    );
  }
  return null;
}

const formatCurrency = (amt) => `€${Number.isInteger(amt) ? amt : amt.toFixed(2)}`;

function PriceDisplay({ amount, plan, cycle, muted, was }) {
  const integerPart = Math.floor(amount + 1e-6);
  const decimalPart = Math.round((amount - integerPart) * 100);

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-16 gap-y-4">
      <div className="text-h2 inline-flex items-baseline font-medium">
        <span>€</span>
        <RollerNumber
          value={integerPart}
          minDigits={1}
          triggerMode="immediate"
          duration={1.2}
          valueChangeDuration={0.8}
          className="text-h2 font-medium leading-none"
        />
        {decimalPart > 0 && (
          <React.Fragment>
            <span>.</span>
            <RollerNumber
              value={decimalPart}
              minDigits={2}
              triggerMode="immediate"
              duration={1.2}
              valueChangeDuration={0.8}
              className="text-h2 font-medium leading-none"
            />
          </React.Fragment>
        )}
        {was && (
          <span className={`text-body ml-8 font-normal tracking-normal line-through ${muted}`}>
            {formatCurrency(was)}
          </span>
        )}
        <span className={`text-body ml-4 font-normal tracking-normal ${muted}`}>
          {t("home-v3.pricing.perMonth")}
        </span>
      </div>
      
      <AnimatedCycleText
        cycle={cycle}
        align="end"
        texts={{
          quarterly: t("home-v3.pricing.billedQuarterly", { total: formatCurrency(plan.quarter) }),
          yearly: t("home-v3.pricing.billedYearly", { total: formatCurrency(plan.year) })
        }}
        className={`text-body-sm basis-full sm:basis-auto ${muted}`}
      />
    </div>
  );
}

function PricingCard({ fig = emptyFig, figure, featured = false, compact = false, label, children }) {
  const articleRef = useRef(null);
  const { rest, onEnter, onLeave } = useIsoLoop(articleRef, fig);
  const visual = figure ?? <IsoFigure boxes={rest} />;
  const iconColors = featured ? "[&_g]:fill-transparent [&_g]:text-white" : "";

  return (
    <article
      ref={articleRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`relative flex flex-col gap-24 overflow-hidden p-24 lg:p-32 ${featured ? "bg-black text-white" : "bg-background"}`}
    >
      <div className={`relative grid grid-cols-[1fr_auto] items-start gap-x-16 ${compact ? "" : "lg:gap-y-24"}`}>
        <div className="flex flex-col items-start gap-8">
          <p className={`text-body-sm ${featured ? "text-white/75" : "text-foreground-muted"}`}>
            {label}
          </p>
          {featured && (
            <span className={`text-body-sm bg-white/15 px-8 py-4 ${compact ? "" : "lg:hidden"}`}>
              {t("home-v3.pricing.popular")}
            </span>
          )}
        </div>
        
        {featured && !compact && (
          <span className="text-body-sm hidden bg-white/15 px-8 py-4 lg:col-start-2 lg:row-start-1 lg:block">
            {t("home-v3.pricing.popular")}
          </span>
        )}
        
        <div
          aria-hidden="true"
          className={`col-start-2 row-start-1 flex h-[72px] w-[104px] items-center justify-center sm:w-[136px] ${compact ? "" : "lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:h-[120px] lg:w-auto"} ${iconColors}`}
        >
          {visual}
        </div>
      </div>
      
      <div className="relative flex flex-1 flex-col gap-24">
        {children}
      </div>
    </article>
  );
}

function FeatureList({ items, featured, strong = 0 }) {
  return (
    <ul className="flex flex-col gap-8">
      {items.map((item, idx) => {
        const isStrong = typeof item !== "string" || idx < strong;
        return (
          <li
            key={typeof item === "string" ? item : item.label}
            className={`text-body-sm ${featured ? "text-white" : "text-foreground"} ${isStrong ? "" : "opacity-50"}`}
          >
            {typeof item === "string" ? item : item.label}
          </li>
        );
      })}
    </ul>
  );
}

function KitCard({ kit, fig, compact = false }) {
  const articleRef = useRef(null);
  const { rest, onEnter, onLeave } = useIsoLoop(articleRef, fig);
  let priceDisplayStr = kit.priceDisplay;
  
  if (typeof priceDisplayStr === "string") {
    priceDisplayStr = priceDisplayStr.replace(/^EUR\s*/, "€");
  }

  return (
    <article
      ref={articleRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="flex flex-1 flex-col gap-16 bg-background p-24 lg:p-32"
    >
      <div className="flex items-start justify-between gap-16">
        <div className="flex flex-col gap-8">
          <p className="text-body-sm text-foreground-muted">
            {t("home-v3.pricing.kitLabel", { title: kit.title })}
          </p>
          <p className="text-h3 font-medium">
            <KitPrice
              kitSlug={kit.slug}
              fallback={priceDisplayStr}
              struckClassName="text-body tracking-normal text-foreground-muted"
            />
            <span className="text-body-sm block font-normal tracking-normal text-foreground-muted sm:inline">
              {" "}{t("home-v3.pricing.oneTime")}
            </span>
          </p>
        </div>
        <div aria-hidden="true" className="flex h-[88px] w-[88px] shrink-0 items-center justify-center sm:w-[120px]">
          <IsoFigure boxes={rest} />
        </div>
      </div>
      
      <div className="flex flex-col gap-12">
        <p className="text-body-sm">{kit.tagline}</p>
        {!compact && (
          <FeatureList
            strong={1}
            items={[
              t("home-v3.pricing.kitComponents", { count: kit.componentCount }),
              t("home-v3.pricing.kitFormats"),
              t("home-v3.pricing.kitOwned")
            ]}
          />
        )}
      </div>
      
      <div className="mt-auto">
        <AnimatedButton href={`/checkout?kit=${kit.slug}`} theme="surface" className="w-full justify-center">
          {t("home-v3.pricing.kitCta", { title: kit.title })}
        </AnimatedButton>
      </div>
    </article>
  );
}

export default function PricingSection({
  kits = [],
  shippedRecently = 0,
  headingAs = "h2",
  headline,
  sub,
  defaultCycle = "quarterly",
  count,
  compact = false,
  className = "py-64 lg:py-160",
  id = "pricing"
}) {
  const [cycle, setCycle] = useState(defaultCycle);
  const triggerMode = headingAs === "h1" ? "pageEnter" : "scroll";
  
  const [seats, setSeats] = useState(studioPlan?.minSeats ?? 2);
  const pppTier = usePppTier();
  
  const soloPppQuarterly = pppTier ? getPppDisplayPrice("solo", "quarterly", pppTier) : null;
  const soloPppYearly = pppTier ? getPppDisplayPrice("solo", "yearly", pppTier) : null;
  
  const soloConfig = {
    quarterMonth: soloPppQuarterly ? soloPppQuarterly.price : effectiveCyclePrice(soloPlan.quarterly),
    quarter: soloPppQuarterly ? soloPppQuarterly.cycleTotal : effectiveCycleTotal(soloPlan.quarterly),
    year: soloPppYearly ? soloPppYearly.price : effectiveCyclePrice(soloPlan.yearly)
  };
  
  const getStudioTotal = (cycleKey) => {
    return studioPlan ? studioPppTotalCents(seats, studioPlan.soloCents[cycleKey], pppTier, STUDIO_CYCLE_MONTHS[cycleKey]) / 100 : 0;
  };
  
  const studioConfig = {
    quarter: getStudioTotal("quarterly"),
    year: getStudioTotal("yearly")
  };
  studioConfig.quarterMonth = formatAmount(studioConfig.quarter / 3);
  
  const getMonthlyEquivalent = (planConf) => {
    return cycle === "quarterly" ? planConf.quarterMonth : formatAmount(planConf.year / 12);
  };

  const parseFeatures = (features, context) => {
    return features.map(item => {
      if (typeof item === "string") return item;
      if (item?.componentCount) return { label: t("pricing.tiers.allComponents", { count: context.count || ANIMATION_TOTAL_COUNT }), highlight: true };
      if (item?.shippedRecently) return context.shippedRecently >= 2 ? { label: t("pricing.tiers.shippedRecently", { count: context.shippedRecently }), solid: true } : null;
      return item?.label || "";
    }).filter(Boolean);
  };

  return (
    <section id={id} data-theme="light" className={`scroll-mt-96 bg-background text-foreground ${className}`}>
      <div className={`v2-container flex flex-col ${compact ? "gap-40" : "gap-48 lg:gap-64"}`}>
        <div className="flex flex-wrap items-end justify-between gap-24">
          <div className="flex flex-col gap-16">
            <RevealHeadline
              as={headingAs}
              sizeClass="text-h2"
              className="max-w-[20ch] font-medium text-balance"
              trigger={triggerMode}
            >
              {headline ?? t("home-v3.pricing.headline")}
            </RevealHeadline>
            
            {sub && (
              <AnimatedReveal
                as="p"
                trigger={triggerMode}
                delay={0.3}
                className="text-body-lg max-w-[46ch] text-foreground-muted"
              >
                {sub}
              </AnimatedReveal>
            )}
          </div>
          
          <PricingCycleToggle cycle={cycle} onChange={setCycle} hint={false} />
        </div>
        
        <div className="v3-rail grid grid-cols-1 gap-px border border-foreground/15 bg-foreground/15 [--rail-gap:0px] [--rail-item:85%] max-md:border-0 max-md:bg-transparent max-md:*:border-y max-md:*:border-r max-md:*:border-foreground/15 max-md:[&>:first-child]:border-l md:grid-cols-2 xl:grid-cols-3">
          <PricingCard fig={soloFig} featured={true} compact={compact} label={t("home-v3.pricing.soloLabel")}>
            <div className="flex flex-col gap-8">
              <PriceDisplay
                amount={getMonthlyEquivalent(soloConfig)}
                plan={soloConfig}
                cycle={cycle}
                muted="text-white/75"
                was={cycle === "yearly" ? soloConfig.quarterMonth : null}
              />
              <SavingsHint plan={soloConfig} cycle={cycle} />
            </div>
            <p className="text-body-sm text-white/85">{soloPlan.pitch}</p>
            <FeatureList
              items={parseFeatures(soloPlan.features, { shippedRecently, ...(count ? { count } : {}) })}
              featured={true}
            />
            <div className="mt-auto flex flex-col gap-12">
              <AnimatedButton
                href={`/checkout?plan=solo&cycle=${cycle}`}
                theme="brand"
                className="w-full justify-center"
              >
                {soloPlan.cta}
              </AnimatedButton>
            </div>
          </PricingCard>

          {studioPlan && (
            <PricingCard figure={<StudioFigure seats={seats} />} compact={compact} label={t("home-v3.pricing.studioLabel")}>
              <div className="flex flex-col gap-12">
                <PriceDisplay
                  amount={getMonthlyEquivalent(studioConfig)}
                  plan={studioConfig}
                  cycle={cycle}
                  muted="text-foreground-muted"
                  was={cycle === "yearly" ? studioConfig.quarterMonth : null}
                />
                <SavingsHint plan={studioConfig} cycle={cycle} />
                <SeatCounter
                  seats={seats}
                  onChange={setSeats}
                  min={studioPlan.minSeats}
                  max={studioPlan.maxSeats}
                />
              </div>
              <p className="text-body-sm text-foreground-muted">{studioPlan.pitch}</p>
              <FeatureList items={studioPlan.features} strong={2} />
              <div className="mt-auto flex flex-col gap-12">
                <p className="text-body-sm text-foreground-muted">
                  <a href={`mailto:${config.resend.supportEmail}`} className="underline underline-offset-2">
                    {t("home-v3.pricing.moreSeats", { max: studioPlan.maxSeats })}
                  </a>
                </p>
                <AnimatedButton
                  href={`/checkout?plan=${studioPlan.key}&cycle=${cycle}&seats=${seats}`}
                  theme="surface"
                  className="w-full justify-center"
                >
                  {studioPlan.cta}
                </AnimatedButton>
              </div>
            </PricingCard>
          )}
          <div className="flex flex-col gap-px max-md:bg-foreground/15 max-md:bg-clip-padding md:col-span-2 xl:col-span-1">
            {kits.map((kit) => (
              <KitCard
                key={kit.slug}
                kit={kit}
                compact={compact}
                fig={kit.slug === "menu" ? menuFig : revealFig}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
