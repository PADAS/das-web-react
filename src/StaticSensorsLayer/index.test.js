import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';

import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';

import { MapContext } from '../App';
import { mockMapStaticSubjectFeatureCollection, staticSubjectFeature, staticSubjectFeatureWithoutIcon, staticSubjectFeatureWithoutDefaultValue } from '../__test-helpers/fixtures/subjects';
import { LAYER_IDS } from '../constants';
import { BACKGROUND_LAYER, LABELS_LAYER } from './layerStyles';

import StaticSensorsLayer from './';

let map;
const store = {
  view: {
    simplifyMapDataOnZoom: {
      active: false
    },
  },
};
const { STATIC_SENSOR, SECOND_STATIC_SENSOR_PREFIX, UNCLUSTERED_STATIC_SENSORS_LAYER } = LAYER_IDS;
describe('adding default property', () => {
  function getDefaultProperty(feature) {
    return feature.properties.device_status_properties.find(property => property?.default ?? false) ?? null;
  }

  beforeEach(() => {
    map = createMapMock();
  });

  test('Adding default property with value and units', () => {
    expect(staticSubjectFeature.properties).not.toHaveProperty('default_status_value');

    render(<Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <StaticSensorsLayer staticSensors={{
        'type': 'FeatureCollection',
        'features': [staticSubjectFeature],
      }}/>
      </MapContext.Provider>
    </Provider>);

    const defaultDeviceProperty = getDefaultProperty(staticSubjectFeature);
    expect(staticSubjectFeature).toHaveProperty('properties.default_status_value', `${defaultDeviceProperty.value} ${defaultDeviceProperty.units}`);
  });

  test('Adding default property label when image is missing', () => {
    expect(staticSubjectFeatureWithoutIcon.properties).not.toHaveProperty('default_status_value');
    expect(staticSubjectFeatureWithoutIcon.properties).not.toHaveProperty('default_status_label');

    render(<Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <StaticSensorsLayer staticSensors={{
        'type': 'FeatureCollection',
        'features': [staticSubjectFeatureWithoutIcon],
      }}/>
      </MapContext.Provider>
    </Provider>);

    const defaultDeviceProperty = getDefaultProperty(staticSubjectFeatureWithoutIcon);
    expect(staticSubjectFeatureWithoutIcon).toHaveProperty('properties.default_status_value', `${defaultDeviceProperty.value} ${defaultDeviceProperty.units}`);
    expect(staticSubjectFeatureWithoutIcon).toHaveProperty('properties.default_status_label', defaultDeviceProperty.label);
  });

  test('It should not add default_status_value if the subject does not have a property as default', () => {
    expect(staticSubjectFeatureWithoutDefaultValue.properties).not.toHaveProperty('default_status_value');

    render(<Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <StaticSensorsLayer staticSensors={{
        'type': 'FeatureCollection',
        'features': [staticSubjectFeatureWithoutDefaultValue],
      }}/>
      </MapContext.Provider>
    </Provider>);

    expect(staticSubjectFeatureWithoutDefaultValue.properties).not.toHaveProperty('default_status_value');
  });

  test('Showing label as "No historical data" in case the time slider is active', () => {
    render(<Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <StaticSensorsLayer staticSensors={{
        'type': 'FeatureCollection',
        'features': [staticSubjectFeature],
      }} isTimeSliderActive={true} />
      </MapContext.Provider>
    </Provider>);

    expect(staticSubjectFeature.properties.default_status_value).toBe('No historical data');
  });
});

describe('adding layers to the map', () => {
  beforeEach(() => {
    map = createMapMock({
      getLayer: jest.fn().mockImplementation((id) => id === UNCLUSTERED_STATIC_SENSORS_LAYER ? {} : null),
      getSource: jest.fn().mockImplementation(() => null)
    });
  });

  test('It should create each feature with 2 layers', () => {
    map.queryRenderedFeatures.mockImplementation(() => [staticSubjectFeature]);
    render(<Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <StaticSensorsLayer staticSensors={{
        'type': 'FeatureCollection',
        'features': [staticSubjectFeature],
      }}/>
      </MapContext.Provider>
    </Provider>);

    expect(map.addLayer).toHaveBeenCalledTimes(2);

    expect(map.addLayer.mock.calls[0][0]).toStrictEqual({
      'id': `${STATIC_SENSOR}${staticSubjectFeature.properties.id}`,
      'layout': BACKGROUND_LAYER.layout,
      'paint': BACKGROUND_LAYER.paint,
      'source': `${STATIC_SENSOR}-source-${staticSubjectFeature.properties.id}`,
      'type': 'symbol'
    });

    expect(map.addLayer.mock.calls[1][0]).toStrictEqual({
      'id': `${SECOND_STATIC_SENSOR_PREFIX}${STATIC_SENSOR}${staticSubjectFeature.properties.id}`,
      'layout': LABELS_LAYER.layout,
      'paint': LABELS_LAYER.paint,
      'source': `${STATIC_SENSOR}-source-${staticSubjectFeature.properties.id}`,
      'type': 'symbol'
    });
  });

  test('Each feature should have its own source', () => {
    map.queryRenderedFeatures.mockImplementation(() => mockMapStaticSubjectFeatureCollection.features);
    render(<Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <StaticSensorsLayer staticSensors={mockMapStaticSubjectFeatureCollection}/>
      </MapContext.Provider>
    </Provider>);

    expect(map.addSource).toHaveBeenCalledTimes(3);
    expect(map.addLayer).toHaveBeenCalledTimes(6);
  });

  test('It should not create new layers if clustering is enabled and static sensors are not part of the unclustered layer', () => {
    map.queryRenderedFeatures.mockImplementation(() => []);
    render(<Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <StaticSensorsLayer staticSensors={mockMapStaticSubjectFeatureCollection}/>
      </MapContext.Provider>
    </Provider>);

    expect(map.addSource).toHaveBeenCalledTimes(0);
    expect(map.addLayer).toHaveBeenCalledTimes(0);
  });
});