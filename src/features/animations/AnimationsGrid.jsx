'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link'; // NOTE: module id: 101836
import { ArrowUpRight, BookmarkSimple } from '@phosphor-icons/react'; // NOTE: module id: 683845, 933325
import { bunnyImageUrl } from '@/libs/utils/bunnyImageUrl'; // NOTE: module id: 632021
import { useAnimation } from '@/animations/hooks/useAnimation'; // NOTE: module id: 488843
import AnimationCard from '@/animations/components/AnimationCard'; // NOTE: module id: 591611
import HoverFollowPreview from '@/animations/shared/HoverFollowPreview'; // NOTE: module id: 934783

const GRID_COLUMNS = {
  grid: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  duo: 'grid-cols-1 sm:grid-cols-2',
  condensed: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
};

const GRID_GAPS = {
  grid: 'gap-x-24 gap-y-24',
  duo: 'gap-x-32 gap-y-32',
  condensed: 'gap-x-16 gap-y-16'
};

function isRecentlyPublished(animation) {
  return (
    !!animation?.published_at &&
    Date.now() - new Date(animation.published_at).getTime() < 1209600000
  );
}

function AnimationListRow({
  animation,
  index,
  isAuthenticated,
  initialIsSaved,
  hrefBase = '/animations',
  hideSave = false
}) {
  const { id, title, slug, category } = animation;
  const isNew = isRecentlyPublished(animation);
  const isUpdated =
    !(!animation?.content_updated_at || isRecentlyPublished(animation)) &&
    Date.now() - new Date(animation.content_updated_at).getTime() < 604800000;

  const { isSaved, isLoading, toggleSave } = useAnimation(
    isAuthenticated ? id : null,
    initialIsSaved,
    isAuthenticated ? animation : null
  );

  const handleSaveClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSave?.(e);
    },
    [toggleSave]
  );

  return (
    <li
      data-row-index={index}
      data-hfp-index={index}
      data-tile={true}
      className="animate-stagger-in group relative"
      style={{ animationDelay: `${(index % 12) * 0.04}s` }}
    >
      <Link
        href={`${hrefBase}/${slug}`}
        className="grid items-center gap-16 px-16 py-20 transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/5"
        style={{ gridTemplateColumns: '32px minmax(0,1fr) 240px 8rem 32px' }}
      >
        <span aria-hidden="true" className="text-accent-xs text-foreground-muted">
          {String(index + 1).padStart(2, '0')}
        </span>

        <h3 className="text-h5 truncate font-medium text-foreground">{title}</h3>

        <span className="flex justify-start gap-8">
          {animation.is_free_preview && (
            <span className="text-accent-xs bg-brand px-8 py-4 font-medium text-[#141314]">
              Free
            </span>
          )}
          {isNew && (
            <span className="text-accent-xs bg-brand px-8 py-4 font-medium text-[#141314]">
              New
            </span>
          )}
          {isUpdated && (
            <span className="text-accent-xs bg-foreground px-8 py-4 font-medium text-background">
              Updated
            </span>
          )}
        </span>

        <span className="text-accent-xs truncate text-foreground-muted">{category}</span>

        <div className="flex justify-end">
          {hideSave ? null : isAuthenticated ? (
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={isLoading}
              aria-label={isSaved ? 'Remove from saved' : 'Save animation'}
              aria-pressed={isSaved}
              className="flex size-32 items-center justify-center text-foreground-muted transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:text-foreground"
            >
              <BookmarkSimple
                className={isSaved ? 'size-16 fill-brand text-brand' : 'size-16 text-current'}
              />
            </button>
          ) : (
            <span
              aria-hidden="true"
              className="flex size-32 items-center justify-center text-foreground-muted opacity-0 transition-opacity duration-(--duration-fast) ease-(--ease-expo-out) group-hover:opacity-100"
            >
              <ArrowUpRight className="size-16" />
            </span>
          )}
        </div>
      </Link>

      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-foreground/10" />
    </li>
  );
}

function AnimationListView({
  animations,
  isAuthenticated = false,
  savedAnimationIds = [],
  hrefBase = '/animations',
  hideSave = false
}) {
  const listContainerRef = useRef(null);
  const savedSet = new Set(savedAnimationIds);
  const previewItems = animations.map((item) => ({
    type: 'image',
    src: item.preview_image_url ? bunnyImageUrl(item.preview_image_url, { width: 480 }) : null
  }));

  return (
    <div className="v2-container pb-128">
      <div ref={listContainerRef} className="relative">
        <div aria-hidden="true" className="h-px bg-foreground/10" />
        <ul role="list" className="flex flex-col">
          {animations.map((animation, index) => (
            <AnimationListRow
              key={animation.id}
              animation={animation}
              index={index}
              isAuthenticated={isAuthenticated}
              initialIsSaved={savedSet.has(animation.id)}
              hrefBase={hrefBase}
              hideSave={hideSave}
            />
          ))}
        </ul>
      </div>
      <HoverFollowPreview containerRef={listContainerRef} items={previewItems} width={240} />
    </div>
  );
}

// NOTE: module id: 425565
export default function AnimationsGrid({
  animations,
  viewMode = 'grid',
  isAuthenticated = false,
  savedAnimationIds = [],
  sentinelRef,
  hasMore = false,
  animationKey = 'default',
  interstitial = null,
  tileProps = null,
  listProps = null
}) {
  const savedSet = useMemo(() => new Set(savedAnimationIds), [savedAnimationIds]);
  const gridRef = useRef(null);
  const prevKeyRef = useRef(null);

  useEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl) return;
    if (prevKeyRef.current === null) {
      prevKeyRef.current = animationKey;
      return;
    }
    if (prevKeyRef.current === animationKey) return;
    prevKeyRef.current = animationKey;

    const tiles = gridEl.querySelectorAll('[data-tile]');
    if (tiles.length !== 0) {
      tiles.forEach((tile) => tile.classList.remove('animate-stagger-in'));
      void gridEl.offsetWidth;
      tiles.forEach((tile) => tile.classList.add('animate-stagger-in'));
    }
  }, [animationKey]);

  if (viewMode === 'list') {
    return (
      <>
        <AnimationListView
          animations={animations}
          isAuthenticated={isAuthenticated}
          savedAnimationIds={savedAnimationIds}
          {...(listProps || {})}
        />
        {hasMore && (
          <div ref={sentinelRef} className="v2-container h-32 pb-128" aria-hidden="true" />
        )}
      </>
    );
  }

  return (
    <div className="v2-container pb-128">
      <div
        ref={gridRef}
        className={`mt-24 grid ${GRID_COLUMNS[viewMode] ?? GRID_COLUMNS.grid} ${GRID_GAPS[viewMode] ?? GRID_GAPS.grid}`}
      >
        {animations.map((animation, index) => (
          <React.Fragment key={animation.id}>
            <div
              data-tile={true}
              className="animate-stagger-in"
              style={{ animationDelay: `${(index % 12) * 0.04}s` }}
            >
              <AnimationCard
                {...(typeof tileProps === 'function' ? tileProps(animation) : tileProps || {})}
                animation={animation}
                viewMode={viewMode}
                isAuthenticated={isAuthenticated}
                initialIsSaved={savedSet.has(animation.id)}
                priority={index < 3}
              />
            </div>

            {interstitial && index === Math.min(8, animations.length) - 1 ? (
              <div className="col-span-full">{interstitial}</div>
            ) : null}
          </React.Fragment>
        ))}
      </div>

      {hasMore && <div ref={sentinelRef} className="mt-48 h-32 w-full" aria-hidden="true" />}
    </div>
  );
}
