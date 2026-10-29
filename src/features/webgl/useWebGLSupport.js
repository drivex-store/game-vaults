import { useState } from 'react';

let cachedSupport;

function detectWebGLSupport() {
  if (typeof document === 'undefined') return true;
  if (cachedSupport !== void 0) return cachedSupport;
  try {
    const canvas = document.createElement('canvas');
    const context =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    cachedSupport = !!context;
    try {
      context?.getExtension?.('WEBGL_lose_context')?.loseContext?.();
    } catch (e) {}
  } catch (e) {
    cachedSupport = false;
  }
  return cachedSupport;
}

// NOTE: module id: 143848
export function useWebGLSupport() {
  return useState(detectWebGLSupport)[0];
}
