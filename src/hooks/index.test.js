import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '../test-utils';

import { FEATURE_FLAG_LABELS } from '../constants';

import { MapContext } from '../App';

import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';

import { useFeatureFlag, useMemoCompare, useMapEventBinding } from './';

jest.mock('../constants', () => ({
  ...jest.requireActual('../constants'),
  DEVELOPMENT_FEATURE_FLAGS: { DUMMY_FF_FOR_TESTING: true },
  FEATURE_FLAG_LABELS: { DUMMY_FF_FOR_TESTING: 'DUMMY_FF_FOR_TESTING' },
}));

describe('#useMapEventBinding', () => {
  let map, wrapper, handler;
  const layerId = 'test-layer-id';

  beforeEach(() => {
    map = createMapMock();
    handler = jest.fn();
    wrapper = ({ children }) => <MapContext.Provider value={map}>{children}</MapContext.Provider>; // eslint-disable-line react/display-name
  });

  test('binding a handler function', () => {
    renderHook(() => useMapEventBinding('click', handler, layerId), { wrapper });
  });

  test('not binding if no map is available', () => {
    renderHook(() => useMapEventBinding('banana', handler, layerId)); // no context wrapper means there's no map available;
  });

  describe('@param condition', () => {
    test('binding and unbinding based on the "condition" argument', () => {
      let condition = false;
      const { rerender } = renderHook(() => useMapEventBinding('fakebindingname', handler, layerId, condition), { wrapper });

      expect(map.on).not.toHaveBeenCalled();

      condition = true;

      rerender();

      expect(map.on).toHaveBeenCalledWith('fakebindingname', layerId, handler);

      condition = false;

      rerender();

      expect(map.off).toHaveBeenCalledWith('fakebindingname', layerId, handler);
    });
  });
});

describe('#useMemoCompare', () => {
  test('returning the first value on first render', () => {
    let value = { whatever: 123 };

    const { result } = renderHook(() => useMemoCompare(value));

    expect(result.current).toEqual(value);
  });

  test('returning a reference to the first value if an updated value is identical', () => {
    let value = { whatever: 123 };

    const { result, rerender } = renderHook(() => useMemoCompare(value));

    rerender({ whatever: 123 }); // pass a new object with identical props

    expect(result.current).toEqual(value); // the reference is intact
  });

  test('returning a reference to the new value if it is updated', () => {
    let value = { whatever: 123 };

    const { result, rerender } = renderHook(() => useMemoCompare(value));

    value = { hello: false };

    rerender();

    expect(result.current).toEqual({ hello: false }); // the reference is intact

  });
});

describe('#useFeatureFlag', () => {
  let wrapper, store;

  beforeEach(() => {
    store = mockStore({
      view: {
        experimentalFeatures: {}
      },
    });
    wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;  // eslint-disable-line react/display-name
  });

  test('throwing an error if no matching feature flag has been set in the environment file', async () => {
    expect(() => {
      renderHook(() => useFeatureFlag('this_does_not_exist_anywhere_yo'), { wrapper });
    }).toThrow('no feature flag with that name exists');
  });

  test('using the default value if no override has been set', () => {
    const { result } = renderHook(() => useFeatureFlag('DUMMY_FF_FOR_TESTING'), { wrapper });

    expect(result.current).toBe(true);
  });

  test('using the override value if an override has been set', () => {
    store = mockStore({
      view: {
        experimentalFeatures: {
          DUMMY_FF_FOR_TESTING: false,
        }
      },
    });

    const { result } = renderHook(() => useFeatureFlag('DUMMY_FF_FOR_TESTING'), { wrapper });

    expect(result.current).toBe(false);
  });
});