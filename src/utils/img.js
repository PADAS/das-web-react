import { DAS_HOST } from '../constants';

const URL_WITH_SCHEME_REGEX = /^([a-z][a-z\d+\-.]*:|\/\/)/i;

const urlResolvesOnItsOwn = (url) => URL_WITH_SCHEME_REGEX.test(url);

const NORMALIZED_DAS_HOST = DAS_HOST
  ? DAS_HOST.replace(/\/+$/, '').replace(/^http:\/\//i, 'https://')
  : '';

const imgIsAppBundledAsset = url => {
  if (typeof url === 'string') {
    const base = import.meta.env.BASE_URL || '/';
    const appBundledAssetsPrefix = base.endsWith('/') ? `${base}assets/` : `${base}/assets/`;
    if (url.startsWith(appBundledAssetsPrefix)) {
      return true;
    }
    if (import.meta.env.DEV && url.startsWith('/src/')) {
      return true;
    }
  }
  return false;
};

const isObjectURL = url => url && typeof url === 'string' && url.startsWith('blob:');

const imgNeedsHostAppended = url => {
  if (urlResolvesOnItsOwn(url)) return false;
  if (imgIsAppBundledAsset(url)) return false;
  return true;
};

export class ImageCache {
  constructor() {
    this.imageCache = new Map();
    this.failedImageCache = new Map();
    this.maxFailures = 3;
  }

  static getInstance() {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache();
    }
    return ImageCache.instance;
  }

  generateCacheKey(src, width, height) {
    const w = width === null ? 'null' : (width === undefined ? 'undefined' : width);
    const h = height === null ? 'null' : (height === undefined ? 'undefined' : height);
    return `${src}:${w}:${h}`;
  }

  getFailureCount(cacheKey) {
    return this.failedImageCache.get(cacheKey) || 0;
  }

  hasExceededMaxFailures(cacheKey) {
    return this.getFailureCount(cacheKey) >= this.maxFailures;
  }

  incrementFailureCount(cacheKey) {
    const currentFailCount = this.getFailureCount(cacheKey);
    this.failedImageCache.set(cacheKey, currentFailCount + 1);
    return currentFailCount + 1;
  }

  clearFailureCount(cacheKey) {
    this.failedImageCache.delete(cacheKey);
  }

  get(cacheKey) {
    return this.imageCache.get(cacheKey);
  }

  has(cacheKey) {
    return this.imageCache.has(cacheKey);
  }

  set(cacheKey, promise) {
    this.imageCache.set(cacheKey, promise);
  }

  delete(cacheKey) {
    this.imageCache.delete(cacheKey);
  }

  // Optional: methods for cache management
  clear() {
    this.imageCache.clear();
    this.failedImageCache.clear();
  }

  getStats() {
    return {
      cachedImages: this.imageCache.size,
      failedImages: this.failedImageCache.size,
      failures: Array.from(this.failedImageCache.entries())
    };
  }
}

export const imgElFromSrc = (src, baseUnit = null) => {
  const imgCacheInstance = ImageCache.getInstance();

  if (!src) {
    return Promise.reject('no src provided');
  }

  const cacheKey = imgCacheInstance.generateCacheKey(src, baseUnit, null);

  // Check if this image has already failed 2+ times
  const failCount = imgCacheInstance.getFailureCount(cacheKey);
  if (failCount >= 3) {
    return Promise.reject(`image failed ${failCount} times, not retrying`);
  }

  if (imgCacheInstance.has(cacheKey)) {
    return imgCacheInstance.get(cacheKey);
  }

  const img = new Image();
  img.setAttribute('crossorigin', 'anonymous');

  const imagePromise = new Promise((resolve, reject) => {
    const cleanupAndResolve = () => {
      // Clear any previous failure count on success
      imgCacheInstance.clearFailureCount(cacheKey);

      if (baseUnit && img.naturalWidth && img.naturalHeight) {
        const widthIsLarger = img.naturalWidth > img.naturalHeight;

        const aspectRatio = widthIsLarger ?
          img.naturalHeight / img.naturalWidth :
          img.naturalWidth / img.naturalHeight;

        if (widthIsLarger) {
          img.width = baseUnit;
          img.height = Math.round(baseUnit * aspectRatio);
        } else {
          img.height = baseUnit;
          img.width = Math.round(baseUnit * aspectRatio);
        }
      } else if (baseUnit) {
        img.width = baseUnit;
        img.height = baseUnit;
      }

      resolve(img);
    };

    img.addEventListener('load', cleanupAndResolve, { once: true });

    img.onerror = (e) => {
      console.warn('image error', src, e);

      if (isObjectURL(src)) {
        URL.revokeObjectURL(src);
      }

      // Increment failure count instead of just deleting
      const currentFailCount = ImageCache.getInstance().incrementFailureCount(cacheKey);

      ImageCache.getInstance().delete(cacheKey);
      img.src = '';
      img.onload = null;
      img.onerror = null;
      reject(`could not load image (attempt ${currentFailCount})`);
    };

    img.src = src;
  });

  ImageCache.getInstance().set(cacheKey, imagePromise);

  return imagePromise;
};

export const calcImgIdFromUrlForMapImages = (src, width = null, height = null) => {
  const path = calcUrlForImage(src);
  return `${path}-${width ? width : 'x'}-${height ? height : 'x'}`;
};

export const calcSpriteSvgUrl = (iconId) => `${DAS_HOST}/static/sprite-src/${iconId}.svg`;

const PRIORITY_TO_BACKEND_ICON_COLOR = { 0: 'gray', 100: 'med_green', 200: 'amber', 300: 'red' };
const RESOLVED_EVENT_ICON_COLOR = 'lt_gray';

// Mirrors the backend's priority/state -> icon-color-name mapping for events
// that don't already carry a tile-resolved `color` property.
const calcBackendIconColorName = (event) => {
  if (event.color) {
    return event.color;
  }

  if (event.state === 'resolved') {
    return RESOLVED_EVENT_ICON_COLOR;
  }

  return PRIORITY_TO_BACKEND_ICON_COLOR[event.priority] ?? 'black';
};

export const calcGenericFallbackImageUrl = (event) =>
  calcUrlForImage(`/static/generic-${calcBackendIconColorName(event)}.svg`);

export const calcUrlForImage = imagePath => {
  if (!imagePath) {
    return null;
  }
  if (!NORMALIZED_DAS_HOST || !imgNeedsHostAppended(imagePath)) {
    return imagePath;
  }
  return `${NORMALIZED_DAS_HOST}/${imagePath.replace(/^\/+/, '')}`;
};
