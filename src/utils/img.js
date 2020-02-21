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

export const imgElFromSrc = (src, size = 30) => new Promise((resolve, reject) => {
  let img = new Image();
  img.setAttribute('crossorigin', 'anonymous');
  img.onload = () => {
    const { naturalHeight, naturalWidth } = img;
    const largest = Math.max(naturalHeight, naturalWidth) || size;
    const smallest = Math.min(naturalHeight, naturalWidth) || size;
    const widthIsLarger = largest === naturalWidth;
    const aspectRatio = smallest / largest;
    if (widthIsLarger) {
      img.width = size;
      img.height = size * aspectRatio;
    } else {
      img.height = size;
      img.width = size * aspectRatio;
    }
    resolve(img);
  };
  img.onerror = (e) => {
    console.log('image error', src, e);
    reject('could not load image');
  };
  img.src = src;
});

export const calcUrlForImage = imagePath => {
  if (!imgNeedsHostAppended(imagePath)) {
    return imagePath;
  }
  const appendString = !!REACT_APP_DAS_HOST ? `${REACT_APP_DAS_HOST}/` : '';
  return `${appendString}${imagePath}`.replace(/^http:\/\//i, 'https://').replace('.org//', '.org/');
};