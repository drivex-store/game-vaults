'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DoubleSide,
  Euler,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Texture,
  Vector3,
} from 'three';

import { loadImageBitmap } from '@/features/webgl/loadImageBitmap'; // NOTE: module id: 457714
import { useWebGLSupport } from '@/hooks/useWebGLSupport'; // NOTE: module id: 143848

const TILT = Math.PI / 7;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const TILE_GEOMETRY = new PlaneGeometry(0.6, 0.44);

function log(message) {}

function ShaderWarmup() {
  const { gl, scene, camera } = useThree();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const warmup = () => {
      const start = performance.now();
      try {
        gl.compile(scene, camera);
      } catch (e) {}
      log(`warmup ${(performance.now() - start).toFixed(1)}ms`);
    };

    if (typeof requestIdleCallback === 'function') {
      const idleId = requestIdleCallback(warmup, { timeout: 500 });
      return () => cancelIdleCallback(idleId);
    }

    const timeoutId = setTimeout(warmup, 0);
    return () => clearTimeout(timeoutId);
  }, [gl, scene, camera]);

  return null;
}

function Tile({ position, rotation, texture, wantsPlay, revealDelay, reducedMotion }) {
  const meshRef = useRef(null);
  const tweenRef = useRef(null);

  useEffect(() => {
    if (meshRef.current) meshRef.current.scale.setScalar(+!!reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    if (wantsPlay && meshRef.current) {
      if (reducedMotion) {
        meshRef.current.scale.setScalar(1);
        return;
      }
      tweenRef.current?.kill();
      tweenRef.current = gsap.to(meshRef.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.1,
        ease: 'power3.out',
        delay: revealDelay,
      });
      return () => tweenRef.current?.kill();
    }
  }, [wantsPlay, revealDelay, reducedMotion]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      geometry={TILE_GEOMETRY}
      frustumCulled={false}
    >
      <meshBasicMaterial map={texture} side={DoubleSide} />
    </mesh>
  );
}

function Sphere({ images, wantsPlay, reducedMotion }) {
  const groupRef = useRef(null);
  const state = useRef({
    spin: 0,
    inertia: 0,
    dragAccum: 0,
    dragging: false,
    lastX: 0,
    firstRenderLogged: false,
    frames: 0,
    droppedFrames: 0,
    maxDt: 0,
    lastLog: performance.now(),
  });

  const { textures, uploaded } = (function (images) {
    const { gl } = useThree();
    const [, forceUpdate] = useState(0);
    const store = useRef({
      textures: [],
      uploaded: new Set(),
      target: 0,
      loadedCount: 0,
      initialized: false,
    });

    useEffect(() => {
      const current = store.current;
      if (current.initialized) return;
      current.initialized = true;

      const total = Math.min(70, images.length);
      current.target = total;
      if (total === 0) return;

      const startTime = performance.now();
      let cancelled = false;
      let nextIndex = 0;
      let inFlight = 0;
      const pendingHandles = new Set();

      function pump() {
        if (!cancelled) {
          while (inFlight < 4 && nextIndex < total) {
            const index = nextIndex++;
            inFlight++;
            const handle =
              typeof requestIdleCallback === 'function'
                ? requestIdleCallback(() => load(index, handle), { timeout: 2000 })
                : setTimeout(() => load(index, null), 0);
            if (handle) pendingHandles.add(handle);
          }
        }
      }

      async function load(index, handle) {
        if (handle) pendingHandles.delete(handle);
        if (!cancelled) {
          try {
            const bitmap = await loadImageBitmap(images[index], { maxWidth: 384 });
            if (cancelled) return void bitmap.close?.();

            const texture = new Texture(bitmap);
            texture.colorSpace = SRGBColorSpace;
            texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
            texture.flipY = false;
            texture.needsUpdate = true;

            const uploadStart = performance.now();
            gl.initTexture(texture);
            const uploadTime = performance.now() - uploadStart;
            if (uploadTime > 10) log(`upload-slow #${index} ${uploadTime.toFixed(1)}ms`);

            current.textures[index] = texture;
            current.uploaded.add(index);
            current.loadedCount++;
            forceUpdate((count) => count + 1);
            if (current.loadedCount === total) {
              log(`textures-ready (${(performance.now() - startTime).toFixed(0)}ms total)`);
            }
          } catch (e) {
            current.loadedCount++;
          } finally {
            inFlight--;
            pump();
          }
        }
      }

      pump();

      return () => {
        cancelled = true;
        for (const handle of pendingHandles) {
          if (typeof cancelIdleCallback === 'function') {
            try {
              cancelIdleCallback(handle);
            } catch (err) {
              clearTimeout(handle);
            }
          } else {
            clearTimeout(handle);
          }
        }
        pendingHandles.clear();
        for (const texture of current.textures) texture?.dispose();
        current.textures = [];
        current.uploaded.clear();
        current.target = 0;
        current.loadedCount = 0;
        current.initialized = false;
      };
    }, [images, gl]);

    return { textures: store.current.textures, uploaded: store.current.uploaded };
  })(images);

  const placements = useMemo(() => {
    const items = [];
    for (let i = 0; i < 70; i++) {
      const y = 1 - (i / 69) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = i * GOLDEN_ANGLE;
      const px = Math.cos(theta) * radius * 3;
      const py = 3 * y;
      const pz = Math.sin(theta) * radius * 3;
      const matrix = new Matrix4().lookAt(
        new Vector3(px, py, pz),
        new Vector3(2 * px, 2 * py, 2 * pz),
        new Vector3(0, 1, 0)
      );
      const quaternion = new Quaternion().setFromRotationMatrix(matrix);
      const euler = new Euler().setFromQuaternion(quaternion);
      items.push({
        position: [px, py, pz],
        rotation: [euler.x, euler.y, euler.z],
        revealDelay: 0.7 * Math.random(),
      });
    }
    return items;
  }, []);

  useFrame((_, delta) => {
    const s = state.current;
    s.frames++;
    if (delta > s.maxDt) s.maxDt = delta;
    if (delta > 0.033) s.droppedFrames++;
    if (!s.firstRenderLogged) {
      s.firstRenderLogged = true;
      log('first-render');
    }

    const dragDelta = -0.0015 * s.dragAccum;
    s.dragAccum = 0;

    if (s.dragging) {
      s.inertia = delta > 0 ? Math.max(-1.4, Math.min(1.4, dragDelta / delta)) : 0;
    } else {
      s.inertia *= Math.exp(-2.4 * delta);
    }

    if (!reducedMotion) s.spin += -0.05 * delta;
    s.spin += dragDelta;
    if (!s.dragging) s.spin += s.inertia * delta;

    if (groupRef.current) groupRef.current.rotation.y = s.spin;

    const now = performance.now();
    if (now - s.lastLog > 1000) {
      const fps = s.frames / ((now - s.lastLog) / 1000);
      log(
        `fps=${fps.toFixed(0)} maxDt=${(1000 * s.maxDt).toFixed(1)}ms dropped=${s.droppedFrames}`
      );
      s.frames = 0;
      s.droppedFrames = 0;
      s.maxDt = 0;
      s.lastLog = now;
    }
  });

  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const s = state.current;

    function onPointerDown(event) {
      s.dragging = true;
      s.lastX = event.clientX;
      canvas.setPointerCapture?.(event.pointerId);
      canvas.style.cursor = 'grabbing';
    }

    function onPointerMove(event) {
      if (s.dragging) {
        s.dragAccum += event.clientX - s.lastX;
        s.lastX = event.clientX;
      }
    }

    function onPointerUp(event) {
      if (s.dragging) {
        s.dragging = false;
        canvas.releasePointerCapture?.(event.pointerId);
        canvas.style.cursor = 'grab';
      }
    }

    canvas.style.cursor = 'grab';
    canvas.style.touchAction = 'pan-y';
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    };
  }, [gl]);

  return (
    <group rotation={[-TILT, 0, -(0.4 * TILT)]}>
      <group ref={groupRef}>
        {placements.map((placement, index) => {
          const texture = textures[index];
          return texture && uploaded.has(index) ? (
            <Tile
              key={index}
              position={placement.position}
              rotation={placement.rotation}
              texture={texture}
              wantsPlay={wantsPlay}
              revealDelay={placement.revealDelay}
              reducedMotion={reducedMotion}
            />
          ) : null;
        })}
      </group>
    </group>
  );
}

typeof performance !== 'undefined' && performance.now();

// NOTE: module id: 607601
export default function ImageSphere({ images = [], wantsPlay = false, active = true }) {
  log('mount');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const onChange = (event) => setReducedMotion(event.matches);
    query.addEventListener?.('change', onChange);
    return () => query.removeEventListener?.('change', onChange);
  }, []);

  return useWebGLSupport() ? (
    <Canvas
      className="size-full block"
      dpr={[1, 1.5]}
      frameloop={active ? 'always' : 'never'}
      gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
      camera={{ position: [0, 0, 11], fov: 35 }}
      style={{ background: 'transparent' }}
      onCreated={({ gl }) => {
        log('r3f-created');
        gl.domElement.addEventListener('webglcontextlost', (event) => event.preventDefault());
      }}
    >
      <ShaderWarmup />
      <Sphere images={images} wantsPlay={wantsPlay} reducedMotion={reducedMotion} />
    </Canvas>
  ) : null;
}
