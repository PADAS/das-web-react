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

export const imgElFromSrc = (src, width = 30, height = null) => new Promise((resolve, reject) => {
  let img = new Image();
  img.setAttribute('crossorigin', 'anonymous');

  const shouldRevokeURL = isObjectURL(src);

  const cleanupAndResolve = () => {
    if (width && height) {
      img.width = width;
      img.height = height;
    } else {
      const baseUnit = width || height;
      const { naturalHeight, naturalWidth } = img;

      if (!naturalHeight || !naturalWidth) {
        img.width = baseUnit;
        img.height = baseUnit;
      } else {
        const widthIsLarger = naturalWidth >= naturalHeight;
        const aspectRatio = widthIsLarger ?
          naturalHeight / naturalWidth :
          naturalWidth / naturalHeight;

        if (widthIsLarger) {
          img.width = baseUnit;
          img.height = Math.round(baseUnit * aspectRatio);
        } else {
          img.height = baseUnit;
          img.width = Math.round(baseUnit * aspectRatio);
        }
      }
    }

    if (shouldRevokeURL) {
      URL.revokeObjectURL(src);
    }

    resolve(img);
  };

  img.addEventListener('load', cleanupAndResolve, { once: true });

  img.onerror = (e) => {
    console.warn('image error', src, e);
    // Also revoke URL on error to prevent memory leaks
    if (shouldRevokeURL) {
      URL.revokeObjectURL(src);
    }
    reject('could not load image');
  };
  img.src = src;
});

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