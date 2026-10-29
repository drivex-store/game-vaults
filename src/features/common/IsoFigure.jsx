'use client';

// NOTE: module id: 576720
import React, { useRef, useMemo } from 'react';
import gsap from 'gsap'; // NOTE: module id: 989970
import { CustomEase } from 'gsap/CustomEase'; // NOTE: module id: 563208
import { useGSAP } from '@gsap/react'; // NOTE: module id: 365747

gsap.registerPlugin(CustomEase);

CustomEase.create("annnimateInOut", "M0,0 C0.7,0 0.16,1 1,1");
CustomEase.create("annnimate", "M0,0 C0.3,0.9 0.1,1 1,1");

export const PUNCH = "annnimateInOut";

export const reduced = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return false;
};

const COS_30 = Math.cos(Math.PI / 6);

const project = (x, y, z) => [
  (x - y) * COS_30,
  (x + y) * 0.5 - z
];

export const str = (point) => `${point[0].toFixed(2)},${point[1].toFixed(2)}`;

export function faces({ x, y, z, w, d, h }) {
  return [
    // Top face
    [
      project(x, y + d, z),
      project(x + w, y + d, z),
      project(x + w, y + d, z + h),
      project(x, y + d, z + h)
    ],
    // Right face
    [
      project(x + w, y, z),
      project(x + w, y + d, z),
      project(x + w, y + d, z + h),
      project(x + w, y, z + h)
    ],
    // Left face
    [
      project(x, y, z + h),
      project(x + w, y, z + h),
      project(x + w, y + d, z + h),
      project(x, y + d, z + h)
    ]
  ];
}

const normalOpacities = [0.46, 0.4, 0.52];
const accentOpacities = [0.75, 0.88, 1];

export function viewBox(boxes, padding = 24) {
  const allPoints = boxes.filter(b => b.o !== 0).flatMap(b => faces(b).flat());
  if (allPoints.length === 0) return "0 0 0 0";
  
  const xs = allPoints.map(p => p[0]);
  const ys = allPoints.map(p => p[1]);
  
  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  const width = Math.max(...xs) + padding - minX;
  const height = Math.max(...ys) + padding - minY;
  
  return `${minX} ${minY} ${width} ${height}`;
}

const classNormal = "fill-background text-foreground";
const classAccent = "fill-background text-brand";

export const tone = (element, isAccent) => {
  element.setAttribute("class", isAccent ? classAccent : classNormal);
  [...element.children].forEach((polygon, index) => {
    polygon.setAttribute("stroke-opacity", (isAccent ? accentOpacities : normalOpacities)[index]);
  });
};

export function useIsoLoop(containerRef, figConfig, deps = []) {
  const timelineRef = useRef(null);
  const isHoveredRef = useRef(false);
  const initialBoxes = useMemo(() => figConfig.model(), [figConfig, ...deps]);

  useGSAP(() => {
    const boxElements = gsap.utils.selector(containerRef.current)("[data-box]");
    const currentBoxes = figConfig.model();
    
    const tl = gsap.timeline({
      paused: true,
      onUpdate: () => {
        currentBoxes.forEach((boxModel, boxIndex) => {
          faces(boxModel).forEach((facePoints, faceIndex) => {
            const polygon = boxElements[boxIndex]?.children[faceIndex];
            if (polygon) {
              polygon.setAttribute("points", facePoints.map(str).join(" "));
            }
          });
        });
      },
      onComplete: () => {
        if (!figConfig.hold && isHoveredRef.current) {
          tl.restart();
        }
      }
    });

    figConfig.cycle(tl, currentBoxes, boxElements);
    timelineRef.current = tl;

    return () => tl.kill();
  }, {
    scope: containerRef,
    dependencies: [figConfig, ...deps]
  });

  return {
    rest: initialBoxes,
    onEnter: () => {
      isHoveredRef.current = true;
      const tl = timelineRef.current;
      if (!reduced() && tl) {
        if (figConfig.hold) {
          tl.play();
        } else if (!tl.isActive()) {
          tl.restart();
        }
      }
    },
    onLeave: () => {
      isHoveredRef.current = false;
      if (figConfig.hold && timelineRef.current) {
        timelineRef.current.reverse();
      }
    },
    play: () => {
      isHoveredRef.current = false;
      const tl = timelineRef.current;
      if (!reduced() && tl) {
        tl.restart();
      }
    }
  };
}

export function IsoFigure({ boxes }) {
  return (
    <svg
      viewBox={viewBox(boxes)}
      className="h-full w-full overflow-visible"
      strokeLinejoin="miter"
    >
      {boxes.map((box, index) => (
        <g
          key={index}
          data-box={true}
          className={box.accent ? classAccent : classNormal}
          strokeDasharray={box.dashed ? "3 3" : undefined}
          style={box.o != null ? { opacity: box.o } : undefined}
        >
          {faces(box).map((facePoints, faceIndex) => (
            <polygon
              key={faceIndex}
              points={facePoints.map(str).join(" ")}
              stroke="currentColor"
              strokeOpacity={(box.accent ? accentOpacities : normalOpacities)[faceIndex]}
              strokeDasharray={faceIndex !== 0 || box.dashed ? undefined : "2 1.5"}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
