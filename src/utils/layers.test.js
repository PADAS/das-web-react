import { calculateSourceConfigurationFromLayer, calculateMapConfigurationFromLayer } from './layers';

import { withMaxMinAndMaxNativeZoom, withMaxZoom, withMinZoom, withNoZoomConfig } from '../__test-helpers/fixtures/layers';


describe('#calculateSourceConfigurationFromLayer', () => {
  test('setting source max zoom from maxNativeZoom', () => {
    const sourceConfig = calculateSourceConfigurationFromLayer(withMaxMinAndMaxNativeZoom);

    expect(sourceConfig.maxzoom).toEqual(withMaxMinAndMaxNativeZoom.attributes.configuration.maxNativeZoom);
  });

  test('setting source min zoom from minZoom', () => {
    const sourceConfig = calculateSourceConfigurationFromLayer(withMinZoom);

    expect(sourceConfig.minzoom).toEqual(withMinZoom.attributes.configuration.minZoom);
  });

  test('no zoom config available', () => {
    const sourceConfig = calculateSourceConfigurationFromLayer(withNoZoomConfig);

    expect(sourceConfig).toEqual({});
  });
});

describe('#calculateMapConfigurationFromLayer', () => {
  test('setting map max zoom from maxZoom', () => {
    const mapConfig = calculateMapConfigurationFromLayer(withMaxZoom);

    expect(mapConfig.maxzoom).toEqual(withMaxZoom.attributes.configuration.maxZoom);
  });

  test('setting map min zoom from minZoom', () => {
    const mapConfig = calculateMapConfigurationFromLayer(withMinZoom);

    expect(mapConfig.minzoom).toEqual(withMinZoom.attributes.configuration.minZoom);
  });

  test('no zoom config available', () => {
    const mapConfig = calculateMapConfigurationFromLayer(withNoZoomConfig);

    expect(mapConfig).toEqual({});
  });
});
