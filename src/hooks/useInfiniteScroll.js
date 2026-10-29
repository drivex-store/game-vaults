'use client';

import { startTransition, useCallback, useEffect, useRef, useState } from 'react';

// NOTE: module id: 451945
export const BATCH_SIZE = 12;

function getScrollParent(element) {
  if (!element) return null;
  let parent = element.parentElement;
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const style = window.getComputedStyle(parent);
    if (/(auto|scroll|overlay)/.test(style.overflowY)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return window;
}

// NOTE: module id: 451945
export function useInfiniteScroll(totalCount, deps = []) {
  const [displayedCount, setDisplayedCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef(null);
  const lastLoadTimeRef = useRef(0);
  const displayedCountRef = useRef(displayedCount);

  useEffect(() => {
    displayedCountRef.current = displayedCount;
  }, [displayedCount]);

  useEffect(() => {
    setDisplayedCount(BATCH_SIZE);
    displayedCountRef.current = BATCH_SIZE;
    lastLoadTimeRef.current = 0;
  }, deps);

  const checkAndLoadMore = useCallback(() => {
    if (displayedCountRef.current >= totalCount) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const now = performance.now();
    if (now - lastLoadTimeRef.current < 150 || sentinel.getBoundingClientRect().top - window.innerHeight >= 1500) {
      return;
    }

    lastLoadTimeRef.current = now;
    const nextCount = Math.min(displayedCountRef.current + BATCH_SIZE, totalCount);
    displayedCountRef.current = nextCount;

    startTransition(() => {
      setDisplayedCount(nextCount);
    });
  }, [totalCount]);

  useEffect(() => {
    let scrollTarget = null;
    let isAttached = false;
    const handleScroll = () => checkAndLoadMore();

    const rafId = requestAnimationFrame(() => {
      if (!isAttached && (scrollTarget = getScrollParent(sentinelRef.current))) {
        const target = scrollTarget === window ? window : scrollTarget;
        target.addEventListener('scroll', handleScroll, { passive: true });
        isAttached = true;
        checkAndLoadMore();
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (isAttached && scrollTarget) {
        const target = scrollTarget === window ? window : scrollTarget;
        target.removeEventListener('scroll', handleScroll);
      }
    };
  }, [checkAndLoadMore]);

  return {
    displayedCount,
    sentinelRef,
    hasMore: displayedCount < totalCount
  };
}
