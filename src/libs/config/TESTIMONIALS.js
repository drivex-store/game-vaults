'use client';

import dynamic from 'next/dynamic';
import { gsap, useGSAP, ScrollTrigger } from '@/libs/utils/vendor';
import { t } from '@/libs/utils/i18n';
import '@/animations/components/AnimatedText';
import '@/hooks/useBreakpoint';

dynamic(() => import('@/features/webgl/ImageSphere'), { ssr: false });
const avatars = [
  "/imgs/lukas_avatar.avif",
  "/imgs/edoardo_avatar.avif",
  "/imgs/matthew_avatar.avif"
];
export const TESTIMONIALS = t("common.testimonials.items").map((item, index) => ({
  ...item,
  avatarSrc: avatars[index]
}));
