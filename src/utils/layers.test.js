import { calcConfigForMapAndSourceFromLayer } from './layers';

import { withMaxMinAndMaxNativeZoom, withMaxZoom, withMinZoom, withNoZoomConfig } from '../__test-helpers/fixtures/layers';


describe('#calcConfigForMapAndSourceFromLayer', () => {
  test('setting source max zoom from maxNativeZoom', () => {
    const { sourceConfig } = calcConfigForMapAndSourceFromLayer(withMaxMinAndMaxNativeZoom);

    expect(sourceConfig.maxzoom).toEqual(withMaxMinAndMaxNativeZoom.attributes.configuration.maxNativeZoom);
  });

  test('setting map max zoom from maxzoom', () => {
    const { mapConfig } = calcConfigForMapAndSourceFromLayer(withMaxZoom);

    expect(mapConfig.maxzoom).toEqual(withMaxZoom.attributes.configuration.maxZoom);
  });

  test('setting map and source min zoom from minZoom', () => {
    const { mapConfig, sourceConfig } = calcConfigForMapAndSourceFromLayer(withMinZoom);

    expect(mapConfig.minzoom).toEqual(withMinZoom.attributes.configuration.minZoom);
    expect(sourceConfig.minzoom).toEqual(withMinZoom.attributes.configuration.minZoom);
  });

  test('no min or max zoom available', () => {
    const config = calcConfigForMapAndSourceFromLayer(withNoZoomConfig);

    expect(config).toEqual({ mapConfig: {}, sourceConfig: {} });
  });
});
