import { REACT_APP_DAS_HOST } from '../constants';

const urlContainsOwnHost = url => url.includes('http');

export const svgSrcToPngImg = (svgSrc, config = { width: 36, height: 36 }) => new Promise((resolve, reject) => {
  const { width, height } = config;
  
  let img = new Image();
  img.setAttribute('crossorigin', 'anonymous');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;

  img.onload = () => {
    context.drawImage(img, 0, 0);
    const pngImg = new Image();
    const imgSrc = canvas.toDataURL("image/png");
    pngImg.src = imgSrc;
    pngImg.onload = () => {
      resolve(pngImg);
    };
    pngImg.onerror = () => {
      reject('could not convert SVG image to PNG');
    };
  };
  img.src = svgSrc;
 
});

export const imgElFromSrc = (src, width = 24) => new Promise((resolve, reject) => {
  let img = new Image();
  img.setAttribute('crossorigin', 'anonymous');
  img.src = src;
  img.onload = () => {
    const { naturalHeight, naturalWidth } = img;
    const aspectRatio = naturalHeight / naturalWidth;
    img.width = width;
    img.height = width * aspectRatio;
    resolve(img);
  };
  img.onerror = () => {
    reject('could not load image');
  };
});

export const calcUrlForImage = imagePath => urlContainsOwnHost(imagePath) ? imagePath : `${REACT_APP_DAS_HOST}/${imagePath}`.replace('http:', '/').replace('https:', '/').replace('.org//', '.org/');