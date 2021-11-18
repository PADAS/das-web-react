export const calcZoomForSourceConfig = (layer) => {
  const config = layer?.attributes?.configuration;
  const returnVal = {};

  if (config) {
    if (config.maxNativeZoom || config.maxZoom) returnVal.maxzoom = config.maxNativeZoom || config.maxZoom;
    if (config.minZoom) returnVal.minzoom = config.minZoom;
  }

  return returnVal;
};