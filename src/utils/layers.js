export const calcConfigForMapAndSourceFromLayer = (layer) => {
  const config = layer?.attributes?.configuration;
  const sourceConfig = {};
  const mapConfig = {};

  if (config) {
    if (config.maxNativeZoom) {
      sourceConfig.maxzoom = config.maxNativeZoom;
    }
    if (config.minZoom) {
      sourceConfig.minzoom = config.minZoom;
      mapConfig.minzoom = config.minZoom;
    }
    if (config.maxZoom) {
      mapConfig.maxzoom = config.maxZoom;
    }
  }

  return { mapConfig, sourceConfig };
};