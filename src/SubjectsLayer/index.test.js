import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { featureCollection } from '@turf/turf';

import SubjectsLayer from '.';
import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';
import { MapContext } from '../MapContext';
import { mockMapSubjectFeatureCollection } from '../__test-helpers/fixtures/subjects';

import * as subjectSelectors from '../selectors/subjects';
import * as clusterSelectors from '../selectors/clusters';

const UNCLUSTERED_ICON_LAYER_ID = 'subject-symbol-layer-unclustered';
const UNCLUSTERED_LABELS_LAYER_ID = 'subject-symbol-layer-unclustered-labels';
const UNCLUSTERED_SOURCE_ID = 'subject-symbol-source';

jest.mock('../utils/map', () => ({
  ...jest.requireActual('../utils/map'),
  addFeatureCollectionImagesToMap: jest.fn(),
}));

const store = {
  view: {
    showMapNames: {},
    simplifyMapDataOnZoom: { enabled: false },
  },
};

let getSubjectFeatureCollectionSpy, shouldClusterSpy, map;

const renderSubjectsLayer = () => render(
  <Provider store={mockStore(store)}>
    <MapContext.Provider value={map}>
      <SubjectsLayer mapImages={{}} onSubjectClick={jest.fn()} />
    </MapContext.Provider>
  </Provider>
);

describe('SubjectsLayer', () => {
  beforeEach(() => {
    map = createMapMock({
      getLayer: jest.fn(() => ({})),
      getSource: jest.fn(() => ({ setData: jest.fn() })),
    });

    getSubjectFeatureCollectionSpy = jest.spyOn(subjectSelectors, 'getMapSubjectFeatureCollectionWithVirtualPositioning');
    shouldClusterSpy = jest.spyOn(clusterSelectors, 'selectShouldSubjectsBeClustered');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when clustering is off and the unclustered subject feature set shrinks', () => {
    beforeEach(() => {
      shouldClusterSpy.mockReturnValue(false);

      getSubjectFeatureCollectionSpy.mockReturnValue(mockMapSubjectFeatureCollection);
      const { rerender } = renderSubjectsLayer();

      getSubjectFeatureCollectionSpy.mockReturnValue(featureCollection([]));
      rerender(
        <Provider store={mockStore(store)}>
          <MapContext.Provider value={map}>
            <SubjectsLayer mapImages={{}} onSubjectClick={jest.fn()} />
          </MapContext.Provider>
        </Provider>
      );
    });

    test('toggles the unclustered icon layer visibility off then on once the source finishes reloading', () => {
      map.setLayoutProperty.mockClear();

      map.__test__.fireHandlers('sourcedata', { sourceId: UNCLUSTERED_SOURCE_ID, isSourceLoaded: true });

      const iconCalls = map.setLayoutProperty.mock.calls
        .filter(([layerId, property]) => layerId === UNCLUSTERED_ICON_LAYER_ID && property === 'visibility')
        .map(([, , value]) => value);

      expect(iconCalls).toEqual(['none', 'visible']);
    });

    test('toggles the unclustered labels layer visibility off then on as well', () => {
      map.setLayoutProperty.mockClear();

      map.__test__.fireHandlers('sourcedata', { sourceId: UNCLUSTERED_SOURCE_ID, isSourceLoaded: true });

      const labelCalls = map.setLayoutProperty.mock.calls
        .filter(([layerId, property]) => layerId === UNCLUSTERED_LABELS_LAYER_ID && property === 'visibility')
        .map(([, , value]) => value);

      expect(labelCalls).toEqual(['none', 'visible']);
    });

    test('does not toggle visibility until the source reports it has finished loading', () => {
      map.setLayoutProperty.mockClear();

      map.__test__.fireHandlers('sourcedata', { sourceId: UNCLUSTERED_SOURCE_ID, isSourceLoaded: false });

      expect(map.setLayoutProperty).not.toHaveBeenCalled();
    });

    test('does not toggle visibility for an unrelated source', () => {
      map.setLayoutProperty.mockClear();

      map.__test__.fireHandlers('sourcedata', { sourceId: 'some-other-source', isSourceLoaded: true });

      expect(map.setLayoutProperty).not.toHaveBeenCalled();
    });

    test('leaves a layer untouched when its visibility is already none', () => {
      map.getLayoutProperty.mockImplementation((layerId, property) => {
        if (property !== 'visibility') return undefined;
        return layerId === UNCLUSTERED_LABELS_LAYER_ID ? 'none' : 'visible';
      });
      map.setLayoutProperty.mockClear();

      map.__test__.fireHandlers('sourcedata', { sourceId: UNCLUSTERED_SOURCE_ID, isSourceLoaded: true });

      const touchedLayers = map.setLayoutProperty.mock.calls.map(([layerId]) => layerId);
      expect(touchedLayers).not.toContain(UNCLUSTERED_LABELS_LAYER_ID);
      expect(touchedLayers).toContain(UNCLUSTERED_ICON_LAYER_ID);
    });
  });

  test('does not toggle visibility when clustering is on, even though the feature set shrinks', () => {
    shouldClusterSpy.mockReturnValue(true);

    getSubjectFeatureCollectionSpy.mockReturnValue(mockMapSubjectFeatureCollection);
    const { rerender } = renderSubjectsLayer();

    getSubjectFeatureCollectionSpy.mockReturnValue(featureCollection([]));
    rerender(
      <Provider store={mockStore(store)}>
        <MapContext.Provider value={map}>
          <SubjectsLayer mapImages={{}} onSubjectClick={jest.fn()} />
        </MapContext.Provider>
      </Provider>
    );

    map.setLayoutProperty.mockClear();

    map.__test__.fireHandlers('sourcedata', { sourceId: UNCLUSTERED_SOURCE_ID, isSourceLoaded: true });

    expect(map.setLayoutProperty).not.toHaveBeenCalled();
  });

  test('does not toggle visibility when the feature set does not shrink', () => {
    shouldClusterSpy.mockReturnValue(false);

    getSubjectFeatureCollectionSpy.mockReturnValue(mockMapSubjectFeatureCollection);
    const { rerender } = renderSubjectsLayer();

    // re-render with the same number of features (no shrink)
    getSubjectFeatureCollectionSpy.mockReturnValue({ ...mockMapSubjectFeatureCollection });
    rerender(
      <Provider store={mockStore(store)}>
        <MapContext.Provider value={map}>
          <SubjectsLayer mapImages={{}} onSubjectClick={jest.fn()} />
        </MapContext.Provider>
      </Provider>
    );

    map.setLayoutProperty.mockClear();

    map.__test__.fireHandlers('sourcedata', { sourceId: UNCLUSTERED_SOURCE_ID, isSourceLoaded: true });

    expect(map.setLayoutProperty).not.toHaveBeenCalled();
  });
});
