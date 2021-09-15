import { REACT_APP_DAS_HOST } from '../constants';

const urlContainsOwnHost = url => url.includes('http');
const imgIsDataUrl = url => url.includes('data:image');
const imgIsFromStaticMedia = url => /^(\/static\/media)/.test(url);

const imgNeedsHostAppended = url => {
  if (urlContainsOwnHost(url)) return false;
  if (imgIsDataUrl(url)) return false;
  if (imgIsFromStaticMedia(url)) return false;
  return true;
};

export const imgElFromSrc = (src, width = 30, height = null) => new Promise((resolve, reject) => {
  let img = new Image();
  img.setAttribute('crossorigin', 'anonymous');

  img.addEventListener('load',() => {
    if (width && height) {
      img.width = width;
      img.height = height;
    } else {
      const baseUnit = width || height;
      const { naturalHeight, naturalWidth } = img;
      const largest = Math.max(naturalHeight, naturalWidth) || baseUnit;
      const smallest = Math.min(naturalHeight, naturalWidth) || baseUnit;
      const widthIsLarger = largest === naturalWidth;
      const aspectRatio = smallest / largest;
      if (widthIsLarger) {
        img.width = baseUnit;
        img.height = baseUnit * aspectRatio;
      } else {
        img.height = baseUnit;
        img.width = baseUnit * aspectRatio;
      }
    }
    resolve(img);
  }, { once: true });

  img.onerror = (e) => {
    console.log('image error', src, e);
    reject('could not load image');
  };
  img.src = src;
});

export const calcImgIdFromUrlForMapImages = (src, width = null, height = null) => {
  const path = calcUrlForImage(src);
  return `${path}-${width ? width: 'x'}-${height ? height: 'x'}`;
};

export const calcUrlForImage = imagePath => {
  if (!imgNeedsHostAppended(imagePath)) {
    return imagePath;
  }
  const appendString = !!REACT_APP_DAS_HOST ? `${REACT_APP_DAS_HOST}/` : '';
  return `${appendString}${imagePath}`.replace(/^http:\/\//i, 'https://').replace('.org//', '.org/');
};