'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

import AnimationHero from '@/features/animations/AnimationHero';
import NewsletterForm from '@/features/common/NewsletterEyebrow';
import StarterPackModal from '@/features/common/StarterPackModal';
import FilterBar, { VIEW_MODES } from '@/features/animations/FilterBar';
import AnimationsGrid from '@/features/animations/AnimationsGrid';
import EmptyState from '@/features/animations/EmptyState';
import EndCta from '@/features/common/EndCta';
import FaqSection from '@/features/animations/FaqSection';

import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { analytics } from '@/libs/utils/analytics';
import { SORT_OPTIONS } from '@/libs/utils/search';
import { useCategorySlugs, useCategoryOptions } from '@/providers/CategoryProvider';

const INTERACTION_OPTIONS = [
  { value: 'hover', label: 'Hover' },
  { value: 'click', label: 'Click' },
  { value: 'drag', label: 'Drag' },
  { value: 'scroll', label: 'Scroll' },
  { value: 'ambient', label: 'Ambient' }
];

const VALID_INTERACTIONS = INTERACTION_OPTIONS.map((item) => item.value);
const SEVEN_DAYS_MS = 604800000;
const FOURTEEN_DAYS_MS = 1209600000;

export default function AnimationsCatalog({
  initialAnimations = [],
  savedAnimationIds = [],
  isAuthenticated = false,
  faq = []
}) {
  const searchParams = useSearchParams();
  const searchTimeoutRef = useRef(null);
  const categorySlugs = useCategorySlugs();
  const categoryOptions = useCategoryOptions();
  const [animations] = useState(initialAnimations);
  const [activeCategories, setActiveCategories] = useState(() => {
  const rawCategory = searchParams.get('category');
    if (!rawCategory) return [];
  const cleanCategory = rawCategory.split(/[?&]/)[0];
  
    return categorySlugs.includes(cleanCategory) ? [cleanCategory] : [];
  });
  const [activeInteraction, setActiveInteraction] = useState(() => {
  const rawInteraction = searchParams.get('interaction');
    return rawInteraction && VALID_INTERACTIONS.includes(rawInteraction) ? rawInteraction : null;
  });

  const [freeOnly, setFreeOnly] = useState(() => searchParams.get('free') === '1');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'recent');
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [prevResultCount, setPrevResultCount] = useState(0);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const syncUrlParams = useCallback((categories, search, sort, interaction, isFree) => {
    const params = new URLSearchParams();
    if (categories.length > 0) params.set('category', categories[0]);
    if (interaction) params.set('interaction', interaction);
    if (isFree) params.set('free', '1');
    if (search) params.set('search', search);
    if (sort && sort !== 'recent') params.set('sort', sort);

    const queryString = params.toString();
    const nextUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState({}, '', nextUrl);
  }, []);

  const filterOptions = useMemo(() => [
    {
      id: 'category',
      label: 'Category',
      options: categoryOptions.map((opt) => ({
        ...opt,
        count: animations.filter((anim) => anim.category === opt.value).length
      }))
    }
  ], [categoryOptions, animations]);

  const interactionOptionsWithCounts = useMemo(() => {
    return INTERACTION_OPTIONS.map((opt) => ({
      ...opt,
      count: animations.filter((anim) => (anim.metadata?.interaction || []).includes(opt.value)).length
    }));
  }, [animations]);

  const freeCount = useMemo(() => {
    return animations.filter((anim) => anim.is_free_preview).length;
  }, [animations]);

  const filteredAnimations = useMemo(() => {
    let list = [...animations];

    if (activeCategories.length > 0) {
      list = list.filter((anim) => activeCategories.includes(anim.category));
    }

    if (activeInteraction) {
      list = list.filter((anim) => (anim.metadata?.interaction || []).includes(activeInteraction));
    }

    if (freeOnly) {
      list = list.filter((anim) => anim.is_free_preview);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((anim) =>
        anim.title?.toLowerCase().includes(q) ||
        anim.description?.toLowerCase().includes(q) ||
        anim.category?.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'hot':
        list.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case 'new':
        list.sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
        break;
      case 'saved':
        list.sort((a, b) => (b.save_count || 0) - (a.save_count || 0));
        break;
      default: {
        const now = Date.now();
        const sevenDaysAgo = now - SEVEN_DAYS_MS;
        const fourteenDaysAgo = now - FOURTEEN_DAYS_MS;

        const isRecentlyTouched = (item) => {
          const isNew = item.published_at && new Date(item.published_at).getTime() > fourteenDaysAgo;
          const isUpdated = item.content_updated_at && new Date(item.content_updated_at).getTime() > sevenDaysAgo;
          return isNew || isUpdated ? 1 : 0;
        };

        list.sort((a, b) => {
          const priorityDiff = isRecentlyTouched(b) - isRecentlyTouched(a);
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at);
        });
      }
    }

    return list;
  }, [animations, activeCategories, activeInteraction, freeOnly, searchQuery, sortBy]);

  const { displayedCount, sentinelRef, hasMore } = useInfiniteScroll(
    filteredAnimations.length,
    [activeCategories, activeInteraction, freeOnly, searchQuery, sortBy]
  );

  const visibleAnimations = useMemo(() => {
    return filteredAnimations.slice(0, displayedCount);
  }, [filteredAnimations, displayedCount]);

  const animationKey = useMemo(() => {
    const topIds = filteredAnimations.slice(0, 9).map((anim) => anim.id).join('-');
    return `${topIds}-${viewMode}`;
  }, [filteredAnimations, viewMode]);

  useEffect(() => {
    const currentCount = filteredAnimations.length;
    if (prevResultCount !== 0 && prevResultCount !== currentCount) {
      if (window.lenis) {
        window.lenis.scrollTo(0, {
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });
      } else {
        const transitionContainer = document.querySelector('[data-transition-content]');
        if (transitionContainer && transitionContainer.scrollHeight > transitionContainer.clientHeight) {
          transitionContainer.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
    setPrevResultCount(currentCount);
  }, [filteredAnimations.length, prevResultCount]);

  const handleFiltersChange = useCallback((nextCategories) => {
    setActiveCategories(nextCategories);
    syncUrlParams(nextCategories, searchQuery, sortBy, activeInteraction, freeOnly);

    let list = [...animations];
    if (nextCategories.length > 0) {
      list = list.filter((anim) => nextCategories.includes(anim.category));
    }
    if (activeInteraction) {
      list = list.filter((anim) => (anim.metadata?.interaction || []).includes(activeInteraction));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((anim) =>
        anim.title?.toLowerCase().includes(q) ||
        anim.description?.toLowerCase().includes(q) ||
        anim.category?.toLowerCase().includes(q)
      );
    }

    analytics.search.filtered(
      { category: nextCategories[0] || null, interaction: activeInteraction, sort: sortBy },
      list.length
    );
  }, [animations, searchQuery, sortBy, activeInteraction, freeOnly, syncUrlParams]);

  const handleInteractionChange = useCallback((nextInteraction) => {
    setActiveInteraction(nextInteraction);
    syncUrlParams(activeCategories, searchQuery, sortBy, nextInteraction, freeOnly);
    analytics.search.filtered(
      { category: activeCategories[0] || null, interaction: nextInteraction, sort: sortBy },
      filteredAnimations.length
    );
  }, [activeCategories, searchQuery, sortBy, freeOnly, syncUrlParams, filteredAnimations.length]);

  const handleFreeChange = useCallback((nextFree) => {
    setFreeOnly(nextFree);
    syncUrlParams(activeCategories, searchQuery, sortBy, activeInteraction, nextFree);
    analytics.search.filtered(
      { category: activeCategories[0] || null, interaction: activeInteraction, free: nextFree, sort: sortBy },
      filteredAnimations.length
    );
  }, [activeCategories, searchQuery, sortBy, activeInteraction, syncUrlParams, filteredAnimations.length]);

  const handleSearchChange = useCallback((nextSearch) => {
    setSearchQuery(nextSearch);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      syncUrlParams(activeCategories, nextSearch, sortBy, activeInteraction, freeOnly);
      if (nextSearch.trim()) {
        const q = nextSearch.toLowerCase().trim();
        const matchCount = animations.filter((anim) =>
          anim.title?.toLowerCase().includes(q) ||
          anim.description?.toLowerCase().includes(q) ||
          anim.category?.toLowerCase().includes(q)
        ).length;

        analytics.search.performed(nextSearch.trim(), matchCount, {
          category: activeCategories[0] || null,
          sort: sortBy
        });
      }
    }, 300);
  }, [activeCategories, animations, sortBy, activeInteraction, freeOnly, syncUrlParams]);

  const handleSortChange = useCallback((nextSort) => {
    setSortBy(nextSort);
    syncUrlParams(activeCategories, 
    searchQuery, nextSort, 
    activeInteraction, 
    freeOnly
  );
    analytics.search.filtered(
      { category: activeCategories[0] || null, interaction: activeInteraction, sort: nextSort },
      filteredAnimations.length
    );
  }, [activeCategories, searchQuery, activeInteraction, freeOnly, syncUrlParams, filteredAnimations.length]);

  const handleViewModeChange = useCallback((nextViewMode) => {
    setViewMode(nextViewMode);
  }, []);
  const handleResetFilters = useCallback(() => {
    setActiveCategories([]);
    setActiveInteraction(null);
    setFreeOnly(false);
    setSearchQuery('');
    setSortBy('recent');
    syncUrlParams([], '', 'recent', null, false);
  }, [syncUrlParams]);
  
  const bannerImages = useMemo(() => {
    return animations.map((anim) => anim.preview_image_url).filter(Boolean).slice(0, 24);
  }, [animations]);

  return (
    <div data-theme="dark" className="bg-background text-foreground">
      <AnimationHero
        headline="GSAP animations, every framework."
        subtext="React and Vue animation components, built on GSAP. The animated UI components studios ship on real brand work - scroll reveals, magnetic buttons, text effects, page transitions. Copy what you need."
      />

      <div className="relative pb-32">
        {visibleAnimations.length === 0 ? (
          <EmptyState query={searchQuery} onReset={handleResetFilters} />
        ) : (
          <AnimationsGrid
            animations={visibleAnimations}
            viewMode={viewMode}
            isAuthenticated={isAuthenticated}
            savedAnimationIds={savedAnimationIds}
            sentinelRef={sentinelRef}
            hasMore={hasMore}
            animationKey={animationKey}
            interstitial={
              isAuthenticated ? null : (
                <section data-starter-pack-band={true} className="py-32 lg:py-48">
                  <div className="mx-auto flex max-w-[640px] flex-col gap-16 text-left">
                    <h3 className="text-h3 font-medium text-foreground">
                      A new free component every week.
                      <span className="block">Get the pack.</span>
                    </h3>
                    <NewsletterForm
                      source="animations-library"
                      idPrefix="animations"
                      buttonLabel="Send it to me"
                      inputSize="lg"
                    />
                  </div>
                </section>
              )
            }
          />
        )}

        <FilterBar
          activeFilters={activeCategories}
          onFiltersChange={handleFiltersChange}
          interaction={activeInteraction}
          onInteractionChange={handleInteractionChange}
          interactionOptions={interactionOptionsWithCounts}
          freeOnly={freeOnly}
          onFreeChange={handleFreeChange}
          freeCount={freeCount}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          searchValue={searchQuery}
          onSearchChange={handleSearchChange}
          filterOptions={filterOptions}
          sortOptions={SORT_OPTIONS}
          count={filteredAnimations.length}
          isAuthenticated={isAuthenticated}
        />
      </div>

      <section className="v2-container py-96 lg:py-128">
        <div className="grid grid-cols-12 gap-x-24">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3">
            <FaqSection items={faq} />
          </div>
        </div>
      </section>

      {isAuthenticated ? (
        <EndCta
          images={bannerImages}
          minimal={true}
          headline="Find your next component."
          subtext="Filter, preview live, copy in React or Vue. The library updates every week."
          primaryCta={{ label: 'View your saved', href: '/animations/saved' }}
          secondaryCta={{ label: 'Suggest a component', href: '/roadmap' }}
        />
      ) : (
        <EndCta images={bannerImages} bleed={true} />
      )}

      <StarterPackModal
        isAuthenticated={isAuthenticated}
        source="animations-list-modal"
        idPrefix="animations-list-modal"
      />
    </div>
  );
}
