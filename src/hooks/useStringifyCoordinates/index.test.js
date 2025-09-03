import React from 'react';
import { Provider } from 'react-redux';

import { renderHook } from '../../test-utils';
import { epsg5367 } from '../../__test-helpers/fixtures/location';
import { GPS_FORMATS } from '../../utils/location';
import { mockStore } from '../../__test-helpers/MockStore';

import useStringifyCoordinates from './';

describe('useStringifyCoordinates', () => {
  let store;
  beforeEach(() => {
    store = {
      view: {
        coordinateReferenceSystems: {
          storedSystems: [],
        },
        userPreferences: {
          gpsFormat: GPS_FORMATS.DEG,
        },
      },
    };
  });

  const Wrapper = ({ children }) => <Provider store={mockStore(store)}>{children}</Provider>;

  test('returns the coordinates string in DEG GPS format representation', async () => {
    const { result } = renderHook(
      () => useStringifyCoordinates({ latitude: -15.284632, longitude: 101.034119 }),
      { wrapper: Wrapper }
    );

    expect(result.current.coordinatesString).toBe('-15.284632°, 101.034119°');
    expect(result.current.outsideRepresentationBbox).toBe(false);
  });

  test('returns the coordinates string in DMS GPS format representation', async () => {
    store.view.userPreferences.gpsFormat = GPS_FORMATS.DMS;
    const { result } = renderHook(
      () => useStringifyCoordinates({ latitude: -15.284632, longitude: 101.034119 }),
      { wrapper: Wrapper }
    );

    expect(result.current.coordinatesString).toBe('15° 17′ 04.675200″ S, 101° 02′ 02.828400″ E');
    expect(result.current.outsideRepresentationBbox).toBe(false);
  });

  test('returns the coordinates string in DDM GPS format representation', async () => {
    store.view.userPreferences.gpsFormat = GPS_FORMATS.DDM;
    const { result } = renderHook(
      () => useStringifyCoordinates({ latitude: -15.284632, longitude: 101.034119 }),
      { wrapper: Wrapper }
    );

    expect(result.current.coordinatesString).toBe('15° 17.077920′ S, 101° 02.047140′ E');
    expect(result.current.outsideRepresentationBbox).toBe(false);
  });

  test('returns the coordinates string in UTM GPS format representation', async () => {
    store.view.userPreferences.gpsFormat = GPS_FORMATS.UTM;
    const { result } = renderHook(
      () => useStringifyCoordinates({ latitude: -15.284632, longitude: 101.034119 }),
      { wrapper: Wrapper }
    );

    expect(result.current.coordinatesString).toBe('47 S 718431 8309170');
    expect(result.current.outsideRepresentationBbox).toBe(false);
  });

  test('returns the coordinates string in MGRS GPS format representation', async () => {
    store.view.userPreferences.gpsFormat = GPS_FORMATS.MGRS;
    const { result } = renderHook(
      () => useStringifyCoordinates({ latitude: -15.284632, longitude: 101.034119 }),
      { wrapper: Wrapper }
    );

    expect(result.current.coordinatesString).toBe('47L QD 18430 09169');
    expect(result.current.outsideRepresentationBbox).toBe(false);
  });

  test('returns the coordinates string in a coordinate reference system representation', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    store.view.userPreferences.gpsFormat = '5367';
    const { result } = renderHook(
      () => useStringifyCoordinates({ latitude: 8.831957, longitude: -83.502481 }),
      { wrapper: Wrapper }
    );

    expect(result.current.coordinatesString).toBe('554726.7785, 976602.339682');
    expect(result.current.outsideRepresentationBbox).toBe(false);
  });

  test('returns the coordinates string in DEG if the representation is a coordinate reference system and the coordinates are outside the BBOX', async () => {
    store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
    store.view.userPreferences.gpsFormat = '5367';
    const { result } = renderHook(
      () => useStringifyCoordinates({ latitude: -15.284632, longitude: 101.034119 }),
      { wrapper: Wrapper }
    );

    expect(result.current.coordinatesString).toBe('-15.284632°, 101.034119°');
    expect(result.current.outsideRepresentationBbox).toBe(true);
  });
});
