export const calculateSourceConfigurationFromLayer = (layer) => {
  const config = layer?.attributes?.configuration;
  const sourceConfig = {};

  if (config) {
    if (config.maxNativeZoom) {
      sourceConfig.maxzoom = config.maxNativeZoom;
    }
    if (config.minZoom) {
      sourceConfig.minzoom = config.minZoom;
    }
  }

  return sourceConfig;
};

export const calculateMapConfigurationFromLayer = (layer) => {
  const config = layer?.attributes?.configuration;
  const mapConfig = {};

  if (config) {
    if (config.minZoom) {
      mapConfig.minzoom = config.minZoom;
    }
    if (config.maxZoom) {
      mapConfig.maxzoom = config.maxZoom;
    }
  }

  return mapConfig;
};
