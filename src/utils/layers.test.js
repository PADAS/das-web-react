import { calcZoomForSourceConfig } from './layers';

import { withMaxMinAndMaxNativeZoom, withMaxZoom, withMinZoom, withNoZoomConfig } from '../__test-helpers/fixtures/layers';


describe.only('#calcZoomForSourceConfig', () => {
  test('setting max zoom from maxNativeZoom', () => {
    const config = calcZoomForSourceConfig(withMaxMinAndMaxNativeZoom);

    expect(config.maxzoom).toEqual(withMaxMinAndMaxNativeZoom.attributes.configuration.maxNativeZoom);
  });

  test('setting max zoom from maxzoom if maxNativeZoom is not set', () => {
    const config = calcZoomForSourceConfig(withMaxZoom);

    expect(config.maxzoom).toEqual(withMaxZoom.attributes.configuration.maxZoom);
  });

  test('setting min zoom from minZoom', () => {
    const config = calcZoomForSourceConfig(withMinZoom);

    expect(config.minzoom).toEqual(withMinZoom.attributes.configuration.minZoom);
  });
  test('no min or max zoom available', () => {
    const config = calcZoomForSourceConfig(withNoZoomConfig);

    expect(config).toEqual({});
  });
});