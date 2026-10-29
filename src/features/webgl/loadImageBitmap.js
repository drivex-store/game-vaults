const cache = new Map();

// NOTE: module id: 457714
export function loadImageBitmap(url, options = {}) {
  const { maxWidth } = options;
  const cacheKey = maxWidth ? `${url}@w${maxWidth}` : url;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) throw Error(`fetch failed ${response.status} for ${url}`);
      const blob = await response.blob();
      const bitmapOptions = { imageOrientation: 'flipY' };
      if (maxWidth) {
        bitmapOptions.resizeWidth = maxWidth;
        bitmapOptions.resizeQuality = 'high';
      }
      return await createImageBitmap(blob, bitmapOptions);
    } catch (error) {
      cache.delete(cacheKey);
      throw error;
    }
  })();

  cache.set(cacheKey, promise);
  return promise;
}
