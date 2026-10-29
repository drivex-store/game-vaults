'use client';

// NOTE: module id: 392197
import React, { useRef } from 'react';
import RevealHeadline from '@/animations/shared/RevealHeadline'; // NOTE: module id: 963160
import AnimatedButton from '@/animations/components/AnimatedButton'; // NOTE: module id: 687989
import AnimatedReveal from '@/animations/components/AnimatedReveal'; // NOTE: module id: 460391
import { IsoFigure, useIsoLoop, PUNCH, tone } from '@/features/common/IsoFigure'; // NOTE: module id: 576720
import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682

// --- Figure Configurations for different tiles ---

const valuesHeights = [50, 80, 32];
const valuesFig = {
  model: () => [
    ...[-1, 0, 1].map((i, idx) => ({ x: -24 + 50 * i, y: -24 - 50 * i, z: 0, w: 48, d: 48, h: valuesHeights[idx] })),
    { x: -12, y: -12, z: valuesHeights[1], w: 24, d: 24, h: 24, accent: true }
  ],
  cycle: (tl, boxes) => {
    tl.to(boxes.slice(0, 3), { h: 6, duration: 0.6, ease: PUNCH, stagger: 0.05 }, 0)
      .to(boxes[3], { z: 6, duration: 0.6, ease: PUNCH }, 0.05)
      .to(boxes[0], { h: valuesHeights[0], duration: 0.8, ease: PUNCH }, 0.9)
      .to(boxes[2], { h: valuesHeights[2], duration: 0.8, ease: PUNCH }, 1)
      .to(boxes[1], { h: valuesHeights[1], duration: 0.9, ease: PUNCH }, 1.15)
      .to(boxes[3], { z: valuesHeights[1], duration: 0.9, ease: PUNCH }, 1.15)
      .to({}, { duration: 0.5 });
  }
};

const formatsFig = {
  model: () => [-1, 0, 1].map((i) => ({ x: -28 + 52 * i, y: -28 - 52 * i, z: 0, w: 56, d: 56, h: 56, accent: i === 0 })),
  cycle: (tl, boxes) => {
    tl.to(boxes, { x: -28, y: -28, duration: 0.7, ease: PUNCH }, 0);
    boxes.forEach(box => tl.to(box, { x: box.x, y: box.y, duration: 0.8, ease: PUNCH }, 1));
    tl.to({}, { duration: 0.5 });
  }
};

const agentFig = {
  model: () => {
    let boxes = [];
    for (let t = 0; t < 3; t++) {
      for (let a = 0; a < 3; a++) {
        if (t !== 1 || a !== 1) {
          boxes.push({ x: -68 + 48 * t, y: -68 + 48 * a, z: 0, w: 40, d: 40, h: 4, depth: t + a });
        }
      }
    }
    boxes.sort((a, b) => a.depth - b.depth);
    let idx = boxes.findIndex((b) => b.depth > 2);
    boxes.splice(
      idx, 0,
      { x: -20, y: -20, z: 0, w: 40, d: 40, h: 0, dashed: true },
      { x: -20, y: -20, z: 0, w: 40, d: 40, h: 40, accent: true, piece: true }
    );
    return boxes;
  },
  cycle: (tl, boxes) => {
    let piece = boxes.find((b) => b.piece);
    tl.to(piece, { z: 80, duration: 0.7, ease: PUNCH }, 0)
      .to(piece, { z: 0, duration: 0.7, ease: PUNCH }, 1)
      .to({}, { duration: 0.6 });
  }
};

const calcCodeHeight = (e) => 14 + 96 * (1 - Math.pow(2, (-10 * e) / 8));
const codeFig = {
  model: () => Array.from({ length: 9 }, (_, t) => ({ x: -66 + 16 * t, y: -32, z: 0, w: 5, d: 64, h: calcCodeHeight(t), accent: t === 8 })),
  cycle: (tl, boxes) => {
    let state = { v: 0 };
    let updateFn = () => boxes.forEach((box, t) => { box.h = calcCodeHeight(t) + (14 + (t / 8) * 96 - calcCodeHeight(t)) * state.v; });
    tl.to(state, { v: 1, duration: 0.9, ease: PUNCH, onUpdate: updateFn }, 0)
      .to(state, { v: 0, duration: 0.9, ease: PUNCH, onUpdate: updateFn }, 1.3)
      .to({}, { duration: 0.5 });
  }
};

const awardOffsets = [[-18, 10], [14, -16], [-10, -14], [16, 12]];
const awardFig = {
  model: () => awardOffsets.map((pos, t) => ({ x: -45, y: -45, z: 16 * t, w: 90, d: 90, h: 10, accent: t === awardOffsets.length - 1 })),
  cycle: (tl, boxes) => {
    boxes.forEach((box, a) => tl.to(box, { x: box.x + awardOffsets[a][0], y: box.y + awardOffsets[a][1], duration: 0.6, ease: PUNCH }, 0.05 * a));
    boxes.forEach((box, a) => tl.to(box, { x: box.x, y: box.y, duration: 0.8, ease: PUNCH }, 0.9 + (boxes.length - 1 - a) * 0.05));
    tl.to({}, { duration: 0.5 });
  }
};

export const weeklyFig = {
  model: () => [
    ...Array.from({ length: 9 }, (_, t) => ({ x: -117 + 26 * t, y: -40, z: 0, w: 4, d: 80, h: 110, accent: t === 8 })),
    { x: 117, y: -40, z: 0, w: 4, d: 80, h: 110, accent: true, o: 0 }
  ],
  cycle: (tl, boxes, elements) => {
    boxes.slice(0, 9).forEach((box, a) => tl.to(box, { x: -117 + 26 * (a - 1), duration: 0.8, ease: PUNCH }, 0));
    tl.to(elements[0], { opacity: 0, duration: 0.8, ease: PUNCH }, 0)
      .add(() => tone(elements[8], false), 0.15)
      .to(boxes[9], { x: 91, duration: 0.8, ease: PUNCH }, 0.1)
      .to(elements[9], { opacity: 1, duration: 0.8, ease: PUNCH }, 0.1)
      .to({}, { duration: 0.5 })
      .add(() => {
        boxes.slice(0, 9).forEach((e, t) => { e.x = -117 + 26 * t; });
        boxes[9].x = 117;
      })
      .set(elements[0], { opacity: 1 })
      .add(() => tone(elements[8], true))
      .set(elements[9], { opacity: 0 });
  }
};

// --- Tile Component ---

function Tile({ className = "", fig, title, line, children = null }) {
  const containerRef = useRef(null);
  const { rest, onEnter, onLeave } = useIsoLoop(containerRef, fig);

  return (
    <div
      ref={containerRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`col-span-12 flex flex-col gap-32 bg-background p-24 lg:p-40 ${className}`}
    >
      <div aria-hidden="true" className="flex h-[160px] items-center justify-center md:h-[200px] lg:h-[260px]">
        <IsoFigure boxes={rest} />
      </div>
      <div className="flex flex-col gap-8">
        <h3 className="text-body font-medium">{title}</h3>
        <p className="text-body-sm max-w-[44ch] text-foreground-muted">{line}</p>
      </div>
      {children}
    </div>
  );
}

// NOTE: module id: 392197
export default function BentoTilesSection({ count = 0 }) {
  const renderTile = (key, figConfig, classNames, extraArgs) => (
    <Tile
      key={key}
      className={classNames}
      fig={figConfig}
      title={t(`home-v3.bento.${key}.title`)}
      line={t(`home-v3.bento.${key}.line`, extraArgs)}
    />
  );

  return (
    <section data-theme="dark" className="bg-background py-64 text-foreground lg:py-160">
      <div className="v2-container flex flex-col gap-48 lg:gap-64">
        <RevealHeadline
          as="h2"
          sizeClass="text-h2"
          className="max-w-[18ch] font-medium text-balance"
          trigger="scroll"
        >
          {t("home-v3.bento.headline")}
        </RevealHeadline>

        <div className="v3-rail grid grid-cols-12 gap-px border border-border bg-border [--rail-gap:0px] max-md:border-0 max-md:bg-transparent max-md:*:border-y max-md:*:border-r max-md:*:border-border max-md:[&>:first-child]:border-l">
          {renderTile("award", awardFig, "md:col-span-6 lg:col-span-5")}
          {renderTile("agent", agentFig, "md:col-span-6 lg:col-span-4")}
          {renderTile("formats", formatsFig, "md:col-span-6 lg:col-span-3")}
          {renderTile("values", valuesFig, "md:col-span-6 lg:col-span-3")}
          {renderTile("code", codeFig, "md:col-span-6 lg:col-span-4")}
          {renderTile("weekly", weeklyFig, "md:col-span-6 lg:col-span-5", { count })}
        </div>

        <AnimatedReveal trigger="scroll" className="flex justify-center">
          <AnimatedButton href="/animations" theme="brand">
            {t("home-v3.bento.browse")}
          </AnimatedButton>
        </AnimatedReveal>
      </div>
    </section>
  );
}
