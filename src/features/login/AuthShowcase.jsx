'use client';

import React, { useRef } from 'react';
import ImageGrid from '@/features/common/ImageGrid'; // NOTE: module id: 73062
import { usePageEnterAnimation } from '@/providers/AnimationProvider'; 

const layoutConfig = { rowCount: 9 };
export default function AuthShowcase({
  images = [],
  className = "",
  driftVx,
  driftVy
}) {
  const gridRef = useRef(null);
  usePageEnterAnimation(
    () => gridRef.current?.reveal(),
    [],
    "AuthShowcase"
  );

  return (
    <div className={`relative hidden overflow-hidden bg-background lg:block ${className}`.trim()}>
      {images.length > 0 ? (
        <ImageGrid
          ref={gridRef}
          images={images}
          entrance="center-out"
          layout={layoutConfig}
          className="h-full"
          driftVx={driftVx}
          driftVy={driftVy}
        />
      ) : null}
    </div>
  );
}
