'use client';

import React, { useRef } from 'react';
import Link from '@/components/navigation/Link'; // NOTE: module id: 522016
import LogoText from '@/assets/logos/LogoText'; // NOTE: module id: 867584
import AnimatedArches from '@/animations/components/AnimatedArches'; // NOTE: module id: 503433
import { cn } from '@/libs/utils/className'; // NOTE: module id: 103746
import { useTransitionClick } from '@/hooks/useTransitionClick'; // NOTE: module id: 995289
import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682

// NOTE: module id: 635566
export default function HeaderLogo({ className }) {
  const handleTransitionClick = useTransitionClick("/");
  const archesRef = useRef(null);

  return (
    <Link
      href="/"
      onClick={handleTransitionClick}
      onMouseEnter={() => archesRef.current?.play()}
      aria-label="Annnimate - Home"
      className={cn("flex shrink-0 items-end justify-start gap-8", className)}
    >
      <span className="flex items-end gap-6">
        <AnimatedArches 
          ref={archesRef} 
          className="h-[15px] lg:h-[18px]" 
        />
        <LogoText 
          className="h-[15px] w-auto text-foreground lg:h-[18px]" 
        />
      </span>
      <span className="-mb-2 mt-auto text-[9px] text-foreground-muted lg:text-[10px]">
        {t("common.header.logoByline")}
      </span>
    </Link>
  );
}
