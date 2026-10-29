'use client';

import React, { useState, useEffect } from 'react';
import { getConsent } from '@/libs/utils/cookieConsent';
import { PostHogProvider } from '@/features/analytics/PostHogProvider';
import { CrispChat } from '@/features/analytics/CrispChat';
import { GlobalErrorTracker } from '@/features/analytics/GlobalErrorTracker';

export default function ConsentAwareAnalytics() {
  const [consent, setConsent] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setConsent(getConsent());

    const handleConsentChanged = () => setConsent(getConsent());
    window.addEventListener('annnimate:consent-changed', handleConsentChanged);

    return () => {
      window.removeEventListener(
        'annnimate:consent-changed',
        handleConsentChanged,
      );
    };
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <PostHogProvider />
      <GlobalErrorTracker />
      {consent?.functional && <CrispChat />}
    </>
  );
}
