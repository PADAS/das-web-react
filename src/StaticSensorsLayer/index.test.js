import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';

import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';

import { MapContext } from '../App';
import { staticSubjectFeature, staticSubjectFeatureWithoutIcon, staticSubjectFeatureWithoutDefaultValue } from '../__test-helpers/fixtures/subjects';
import { LAYER_IDS } from '../constants';
import { BACKGROUND_LAYER, LABELS_LAYER } from './layerStyles';
import StaticSensorsLayer from './';

const { STATIC_SENSOR, SECOND_STATIC_SENSOR_PREFIX, UNCLUSTERED_STATIC_SENSORS_LAYER } = LAYER_IDS;
let map;

const store = {
  view: {
    simplifyMapDataOnZoom: {
      active: false
    },
    showMapNames: {
      [STATIC_SENSOR]: {
        enabled: false,
      }
    },
  },
};

describe('adding layers to the map', () => {
  beforeEach(() => {
    map = createMapMock({
      getLayer: jest.fn().mockImplementation((id) => id === UNCLUSTERED_STATIC_SENSORS_LAYER ? {} : null),
      getSource: jest.fn().mockImplementation(() => null)
    });
  });

  describe('the layer used when clustering is disabled', () => {
    beforeEach(() => {
      jest.mock('../selectors/subjects.js', () => ({
        ...jest.requireActual('../selectors/subjects.js'),
        getShouldSubjectsBeClustered: jest.fn().mockReturnValue(false),
      }));
    });

    test('the source ID points to unclustered data', () => {

    });
  });

  describe('the layer used when clustering is enabled', () => {
    beforeEach(() => {
      jest.mock('../selectors/subjects.js', () => ({
        ...jest.requireActual('../selectors/subjects.js'),
        getShouldSubjectsBeClustered: jest.fn().mockReturnValue(true),
      }));
    });
    test('the source ID points to clustered data', () => {

    });

  });

  describe('adding images to the map', () => {
    test('adding the background popup image', () => {

    });

    test('adding images for the individual sensor icons if necesssary', () => {

    });
  });

  describe('updating layout properties based on map config', () => {
    test('when data is simplified and names are hidden', () => {

    });

    test('when data is simplified and names are shown', () => {

    });

    test('when data is not simplified and names are hidden', () => {

    });

    test('when data is not simplified and names are shown', () => {

    });

    test('when the timeslider is active', () => {

    });
  });

  describe('clicking on a stationary subject', () => {
    test('showing the subject popup', () => {

    });

    test('setting the map filter to hide the selected subject\'s marker', () => {

    });

    describe('clicking the map while a stationary subject popup is visible', () => {
      test('changing the filter to a new stationary subject if another is the click target', () => {

      });

      test('setting the filter back to default if another stationary subject is not the click target', () => {

      });
    });
  });
});