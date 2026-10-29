import React from 'react';
import { t } from '@/libs/utils/i18n';
import EndCta from '@/features/common/EndCta'; 

export default function V3EndCta({
  images = [],
  count = 0,
  freeCount = 0,
  headline = t('home-v3.endCta.headline'),
  subtext = t('home-v3.endCta.subtext', { count }),
  href = '/checkout?plan=solo&cycle=quarterly',
  primaryCta = null,
  secondaryCta = null,
  children = null,
  bleedTop = 40,
}) {
  return (
    <div className="v3-end-cta">
      <EndCta
        headline={headline}
        subtext={subtext}
        primaryCta={
          primaryCta || {
            label: t('home-v3.hero.cta'),
            href,
          }
        }
        secondaryCta={
          secondaryCta || {
            label: t('home-v3.hero.ctaFree', { count: freeCount }),
            href: '/starter-pack',
          }
        }
        images={images}
        bleed={true}
        bleedTop={bleedTop}
        ringOvershoot={1}
        ringPush={0.3}
      >
        {children}
      </EndCta>
    </div>
  );
}
