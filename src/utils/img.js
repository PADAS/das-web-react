import { REACT_APP_DAS_HOST } from '../constants';

const urlContainsOwnHost = url => url.includes('http');

export const svgSrcToPngImg = (svgSrc, { width = 36, height = 36 }) => new Promise((resolve, reject) => {
  try {
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
    };
    img.src = svgSrc;
  } catch (e) {
    reject(e);
  }
});

export const calcUrlForImage = imagePath => urlContainsOwnHost(imagePath) ? imagePath : `${REACT_APP_DAS_HOST}/${imagePath}`.replace(/(?<!(http:|https:))\/\//gi, '/');