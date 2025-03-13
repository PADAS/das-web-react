import { DAS_HOST } from '../constants';

const urlContainsOwnHost = url => url.includes('http');
const imgIsDataUrl = url => url.includes('data:image');
const imgIsFromStaticMedia = url => /^(\/static\/media)/.test(url);
const isObjectURL = url => url && typeof url === 'string' && url.startsWith('blob:');

const imgNeedsHostAppended = url => {
  if (urlContainsOwnHost(url)) return false;
  if (imgIsDataUrl(url)) return false;
  if (imgIsFromStaticMedia(url)) return false;
  return true;
};

const imageCache = new Map();

const generateImageCacheKey = (src, width, height) => {
  const w = width === null ? 'null' : (width === undefined ? 'undefined' : width);
  const h = height === null ? 'null' : (height === undefined ? 'undefined' : height);
  return `${src}:${w}:${h}`;
};

export const imgElFromSrc = (src, baseUnit = null) => {
  if (!src) {
    return Promise.reject('no src provided');
  }

  const cacheKey = generateImageCacheKey(src, baseUnit, null);

  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  const shouldRevokeURL = isObjectURL(src);

  const img = new Image();
  img.setAttribute('crossorigin', 'anonymous');

  const imagePromise = new Promise((resolve, reject) => {
    const cleanupAndResolve = () => {
      if (baseUnit && img.naturalWidth && img.naturalHeight) {
        const widthIsLarger = img.naturalWidth > img.naturalHeight;

        if (widthIsLarger || !widthIsLarger) {
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

      if (shouldRevokeURL) {
        URL.revokeObjectURL(src);
      }

      imageCache.delete(cacheKey);
      img.onload = null;
      img.onerror = null;
      reject('could not load image');
    };

    img.src = src;
  });

  imageCache.set(cacheKey, imagePromise);

  return imagePromise;
};

export const calcImgIdFromUrlForMapImages = (src, width = null, height = null) => {
  const path = calcUrlForImage(src);
  return `${path}-${width ? width : 'x'}-${height ? height : 'x'}`;
};

export const calcUrlForImage = imagePath => {
  if (!imagePath) {
    return null;
  }
  if (!imgNeedsHostAppended(imagePath)) {
    return imagePath;
  }
  const appendString = !!DAS_HOST ? `${DAS_HOST}/` : '';
  const final = `${appendString}${imagePath}`.replace(/^http:\/\//i, 'https://').replace('.org//', '.org/');

  return final;
};