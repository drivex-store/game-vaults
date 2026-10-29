import PricingSection from '@/features/pricing/PricingV4Section';
import V3Faq from '@/features/pricing/V3FaqSection'; 
import V3EndCta from '@/features/pricing/V3EndCta'; 
import { t } from '@/libs/utils/i18n';
import config, {
  effectiveCyclePrice,
  effectiveCycleTotal,
} from '@/libs/config/siteConfig';
import {
  getPublishedAnimations,
  getShippedRecently,
} from '@/libs/supabase/latestAnimation';

export const revalidate = 60;

export const metadata = {
  title: 'Pricing',
  description:
    'Every component for one monthly price. Solo, Studio and one-time Landmark Kits, with the prices on the page.',
};

const KITS = [
  {
    slug: 'reveal',
    title: 'Reveal',
    tagline: 'Preloader covers and hero sections, built as one mixable system.',
    componentCount: 13,
    priceDisplay: '€149',
  },
  {
    slug: 'menu',
    title: 'Menu',
    tagline: 'Ten site navigations, each one its own component.',
    componentCount: 10,
    priceDisplay: '€149',
  },
];

export default async function PricingPage() {
  const [animations, shippedRecently] = await Promise.all([
    getPublishedAnimations(),
    getShippedRecently(),
  ]);

  const count = animations.length || config.animationStats.totalCount;

  const solo = config.stripe.landingPlans.find((plan) => plan.key === 'solo');
  const yearly = effectiveCyclePrice(solo.yearly);
  const quarterly = effectiveCycleTotal(solo.quarterly);
  const perMonth = Math.round(yearly / 12);

  return (
     <>
    <PricingSection
      id="pricing-tiers"
      headingAs="h1"
      compact
      className="pt-128 pb-96 lg:pt-120 lg:pb-160"
      headline={t('pricing-v3.plans.headline', { perMonth: `€${perMonth}` })}
      sub={t('pricing-v3.plans.sub', {
        yearly: `€${yearly}`,
        quarterly: `€${quarterly}`,
      })}
      shippedRecently={shippedRecently}
      count={count}
      kits={KITS}
    />
    <V3Faq />
    <V3EndCta />
  </>
  );
}


