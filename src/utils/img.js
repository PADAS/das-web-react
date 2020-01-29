import { REACT_APP_DAS_HOST } from '../constants';

const urlContainsOwnHost = url => url.includes('http');

const imgIsDataUrl = url => url.includes('data:image');

export const imgElFromSrc = (src, size = 30) => new Promise((resolve, reject) => {
  let img = new Image();
  img.setAttribute('crossorigin', 'anonymous');
  img.onload = () => {
    const { naturalHeight, naturalWidth } = img;
    const largest = Math.max(naturalHeight, naturalWidth);
    const smallest = Math.min(naturalHeight, naturalWidth);
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
    console.log('image error', e);
    reject('could not load image');
  };
  img.src = src;
});

export const calcUrlForImage = imagePath => urlContainsOwnHost(imagePath) || imgIsDataUrl(imagePath)
  ? imagePath 
  : `${REACT_APP_DAS_HOST}/${imagePath}`.replace(/^http:\/\//i, 'https://').replace('.org//', '.org/');