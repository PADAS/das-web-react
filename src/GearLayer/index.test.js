import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';

import { MapContext } from '../App';
import { LAYER_IDS, SOURCE_IDS } from '../constants';

import GearLayer from './';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const gearRow = {
  id: 'g1',
  display_id: 'Set-1',
  manufacturer: 'Acme',
  devices: [{ location: { latitude: -2.5, longitude: 37.1 } }],
};

const createMapStub = () => {
  const sources = {};
  const layers = {};
  return {
    addLayer: jest.fn((spec) => {
      layers[spec.id] = spec;
    }),
    addSource: jest.fn((id, cfg) => {
      sources[id] = { ...cfg, setData: jest.fn() };
    }),
    getLayer: jest.fn((id) => layers[id]),
    getSource: jest.fn((id) => sources[id] ?? undefined),
    off: jest.fn(),
    on: jest.fn(),
    queryRenderedFeatures: jest.fn(() => []),
    removeLayer: jest.fn((id) => {
      delete layers[id];
    }),
    removeSource: jest.fn((id) => {
      delete sources[id];
    }),
  };
};

describe('GearLayer', () => {
  beforeEach(() => {
    useSelector.mockImplementation((selector) => selector({
      data: {
        gear: {
          allIds: ['g1'],
          byId: { g1: gearRow },
          hiddenGearIds: [],
          hasGear: true,
        },
      },
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('adds geojson source and line/point layers when gear is present', () => {
    const map = createMapStub();
    render(
      <MapContext.Provider value={map}>
        <GearLayer />
      </MapContext.Provider>,
    );

    expect(map.addSource).toHaveBeenCalledWith(
      SOURCE_IDS.GEAR_FEATURES,
      expect.objectContaining({ type: 'geojson' }),
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: LAYER_IDS.GEAR_LINE, type: 'line' }),
      LAYER_IDS.SKY_LAYER,
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: LAYER_IDS.GEAR_POINT, type: 'circle' }),
      LAYER_IDS.SKY_LAYER,
    );

    const source = map.getSource(SOURCE_IDS.GEAR_FEATURES);
    expect(source.setData).toHaveBeenCalled();
  });

  test('registers click handlers when onGearClick is provided', () => {
    const map = createMapStub();
    const onGearClick = jest.fn();
    const hit = { properties: { id: 'g1' } };
    map.queryRenderedFeatures.mockImplementation((_point, opts) => {
      if (opts?.layers?.includes(LAYER_IDS.GEAR_LINE_HIT)) return [hit];
      return [hit];
    });

    render(
      <MapContext.Provider value={map}>
        <GearLayer onGearClick={onGearClick} />
      </MapContext.Provider>,
    );

    const lineRegistration = map.on.mock.calls.find(
      (c) => c[0] === 'click' && c[1] === LAYER_IDS.GEAR_LINE_HIT,
    );
    expect(lineRegistration).toBeTruthy();
    const handler = lineRegistration[2];
    handler({ point: [0, 0] });
    expect(onGearClick).toHaveBeenCalledWith(
      expect.objectContaining({
        layer: expect.objectContaining({ properties: { id: 'g1' } }),
      }),
    );
  });

  test('does not add sources when hasGear is false', () => {
    useSelector.mockImplementation((selector) => selector({
      data: {
        gear: {
          allIds: [],
          byId: {},
          hiddenGearIds: [],
          hasGear: false,
        },
      },
    }));

    const map = createMapStub();
    render(
      <MapContext.Provider value={map}>
        <GearLayer />
      </MapContext.Provider>,
    );

    expect(map.addSource).not.toHaveBeenCalled();
    expect(map.addLayer).not.toHaveBeenCalled();
  });
});
