'use client';

import React, { useState, useRef, useEffect } from 'react';
import CloseIcon from '@/assets/icons/Icons'; // NOTE: module id: 137410
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from '@/features/common/Dialog'; // NOTE: module id: 753145
import NewsletterForm from '@/features/common/NewsletterEyebrow'; // NOTE: module id: 42242
import { STARTER_PROMPT_KEY, readSubscriberId } from '@/libs/config/starterPromptKey'; // NOTE: module id: 927627

// NOTE: module id: 573564

const globalKey = STARTER_PROMPT_KEY;

function isRecentlyDismissed(key) {
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return false;
    const timestamp = parseInt(item, 10);
    if (Number.isNaN(timestamp)) return false;
    return Date.now() - timestamp < 2592000000; // 30 days
  } catch {
    return false;
  }
}

function shouldSuppress(key) {
  return isRecentlyDismissed(globalKey) || isRecentlyDismissed(key) || !!readSubscriberId();
}

function recordDismissal(key) {
  try {
    const nowStr = String(Date.now());
    window.localStorage.setItem(globalKey, nowStr);
    if (key !== globalKey) {
      window.localStorage.setItem(key, nowStr);
    }
  } catch {
    // Ignore localStorage errors
  }
}

export default function StarterPackModal({
  isAuthenticated = false,
  source = "animations-detail",
  idPrefix = "animations-detail",
  delayMs = 30000,
  storageKey = globalKey,
  eyebrow = "Free starter pack",
  title = "Get the Starter Pack: free components, on the house.",
  description = "Production-grade GSAP for React, Vue, and HTML/CSS/JS. A new free component every week. No attribution, no expiration. Delivered to your inbox the moment you subscribe.",
  buttonLabel = "Send it to me"
}) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated || shouldSuppress(storageKey)) return;

    const showModal = () => {
      if (!shouldSuppress(storageKey)) {
        const isBandVisible = (() => {
          const bandElement = document.querySelector("[data-starter-pack-band]");
          if (!bandElement) return false;
          const rect = bandElement.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < window.innerHeight;
        })();

        if (isBandVisible) {
          timerRef.current = window.setTimeout(showModal, 15000);
          return;
        }
        setOpen(true);
      }
    };

    timerRef.current = window.setTimeout(showModal, delayMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [isAuthenticated, delayMs, storageKey]);

  if (isAuthenticated) return null;

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          recordDismissal(storageKey);
        }
      }}
    >
      <DialogContent 
        showCloseButton={false} 
        className="!rounded-none !border-foreground/15 !bg-background !p-32 sm:!max-w-[560px] lg:!p-40 max-h-[90vh] overflow-y-auto"
      >
        <DialogClose 
          aria-label="Close" 
          className="group/close absolute right-16 top-16 inline-flex size-40 items-center justify-center border border-foreground/15 bg-background text-foreground/70 transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:border-foreground/40 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <CloseIcon className="size-18 transition-transform duration-(--duration-quick) ease-(--ease-back-out) group-hover/close:rotate-90" />
        </DialogClose>
        
        <div className="flex flex-col gap-12 pr-48">
          <p className="text-mono-sm text-foreground/55">{eyebrow}</p>
          <DialogTitle className="h3 font-medium leading-tight text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-body text-foreground-muted">
            {description}
          </DialogDescription>
        </div>
        
        <div className="mt-24 lg:mt-32">
          <NewsletterForm 
            source={source} 
            idPrefix={idPrefix} 
            buttonLabel={buttonLabel} 
            buttonSize="sm" 
            inputSize="lg" 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
