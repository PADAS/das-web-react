import React from 'react';
import { render } from '@testing-library/react';

import { createMapMock } from '../__test-helpers/mocks';
import { MapContext } from '../App';
import { mockMapStaticSubjectFeatureCollection, staticSubjectFeature, staticSubjectFeatureWithoutIcon, staticSubjectFeatureWithoutDefaultValue } from '../__test-helpers/fixtures/subjects';

import StaticSensorsLayer from './';

let map;
describe('adding default property label', () => {
  function getDefaultProperty(feature) {
    return feature.properties.device_status_properties.find(property => property?.default ?? false) ?? null;
  }

  beforeEach(() => {
    map = createMapMock();
  });

  test('Adding default property with value and units', () => {
    expect(staticSubjectFeature.properties).not.toHaveProperty('default_status_value');

    render(<MapContext.Provider value={map}>
      <StaticSensorsLayer staticSensors={{
        'type': 'FeatureCollection',
        'features': [staticSubjectFeature],
      }}/>
    </MapContext.Provider>);

    const defaultDeviceProperty = getDefaultProperty(staticSubjectFeature);
    expect(staticSubjectFeature).toHaveProperty('properties.default_status_value', `${defaultDeviceProperty.value} ${defaultDeviceProperty.units}`);
  });

  test('Adding default property label when image is missing', () => {
    expect(staticSubjectFeatureWithoutIcon.properties).not.toHaveProperty('default_status_value');
    expect(staticSubjectFeatureWithoutIcon.properties).not.toHaveProperty('default_status_label');

    render(<MapContext.Provider value={map}>
      <StaticSensorsLayer staticSensors={{
        'type': 'FeatureCollection',
        'features': [staticSubjectFeatureWithoutIcon],
      }}/>
    </MapContext.Provider>);

    const defaultDeviceProperty = getDefaultProperty(staticSubjectFeatureWithoutIcon);
    expect(staticSubjectFeatureWithoutIcon).toHaveProperty('properties.default_status_value', `${defaultDeviceProperty.value} ${defaultDeviceProperty.units}`);
    expect(staticSubjectFeatureWithoutIcon).toHaveProperty('properties.default_status_label', defaultDeviceProperty.label);
  });

  test('missing default property', () => {
    expect(staticSubjectFeatureWithoutDefaultValue.properties).not.toHaveProperty('default_status_value');

    render(<MapContext.Provider value={map}>
      <StaticSensorsLayer staticSensors={{
        'type': 'FeatureCollection',
        'features': [staticSubjectFeatureWithoutDefaultValue],
      }}/>
    </MapContext.Provider>);

    expect(staticSubjectFeatureWithoutDefaultValue.properties).not.toHaveProperty('default_status_value');
  });

  test('Showing label as "No data" in case the time slider is active', () => {
    render(<MapContext.Provider value={map}>
      <StaticSensorsLayer staticSensors={{
        'type': 'FeatureCollection',
        'features': [staticSubjectFeature],
      }} isTimeSliderActive={true} />
    </MapContext.Provider>);

    expect(staticSubjectFeature.properties.default_status_value).toBe('No data');
  });
});

describe('adding layers to the map', () => {
  beforeEach(() => {
    map = createMapMock({
      getLayer: jest.fn().mockImplementation(() => null),
      getSource: jest.fn().mockImplementation(() => null)
    });
  });

  test('It should create the Each feature should be created with 2 layers', () => {
    render(<MapContext.Provider value={map}>
      <StaticSensorsLayer staticSensors={{
        'type': 'FeatureCollection',
        'features': [staticSubjectFeature],
      }}/>
    </MapContext.Provider>);

    expect(map.addLayer).toHaveBeenCalledTimes(2);
  });

  test('Each feature should have its own source', () => {
    render(<MapContext.Provider value={map}>
      <StaticSensorsLayer staticSensors={mockMapStaticSubjectFeatureCollection}/>
    </MapContext.Provider>);

    expect(map.addSource).toHaveBeenCalledTimes(3);
    expect(map.addLayer).toHaveBeenCalledTimes(6);
  });
});