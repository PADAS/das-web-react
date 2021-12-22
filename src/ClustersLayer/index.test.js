import React from 'react';
import { Provider } from 'react-redux';
import { render, waitFor } from '@testing-library/react';

import ClustersLayer, {
  addNewClusterMarkers,
  onClusterClick,
  createClusterHTMLMarker,
  getClusterIconFeatures,
  getRenderedClustersData,
  removeOldClusterMarkers,
  UPDATE_CLUSTER_MARKERS_DEBOUNCE_TIME,
} from '.';
import { createMapMock } from '../__test-helpers/mocks';
import { CLUSTER_CLICK_ZOOM_THRESHOLD, LAYER_IDS } from '../constants';
import { mockStore } from '../__test-helpers/MockStore';
import { showPopup } from '../ducks/popup';
import {
  mockClusterIds,
  mockClusterLeaves,
  mockEventFeatureCollection,
  mockSubjectFeatureCollection,
  mockSymbolFeatureCollection,
} from '../__test-helpers/fixtures/clusters';

const { CLUSTERS_SOURCE_ID } = LAYER_IDS;

const mapMarkers = [];
jest.mock('mapbox-gl', () => {
  class Marker {
    constructor(marker) { this.marker = marker; }
    addTo() { mapMarkers.push(this.marker); }
    setLngLat() { return this; }
  };
  return {
    ...jest.requireActual('mapbox-gl'),
    Marker,
  };
});
jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  useFeatureFlag: () => true,
}));
jest.mock('../ducks/popup', () => ({
  ...jest.requireActual('../ducks/popup'),
  showPopup: jest.fn(),
}));
jest.mock('../selectors', () => ({
  ...jest.requireActual('../selectors'),
  getFeatureSetFeatureCollectionsByType: () => ({ symbolFeatures: mockSymbolFeatureCollection }),
}));
jest.mock('../selectors/events', () => ({
  ...jest.requireActual('../selectors/events'),
  getMapEventFeatureCollectionWithVirtualDate: () => mockEventFeatureCollection,
}));
jest.mock('../selectors/subjects', () => ({
  ...jest.requireActual('../selectors/subjects'),
  getMapSubjectFeatureCollectionWithVirtualPositioning: () => mockSubjectFeatureCollection,
}));

describe('ClustersLayer', () => {
  const onEventClick = jest.fn(),
    onSubjectClick = jest.fn(),
    onSymbolClick = jest.fn(),
    setClusterBufferPolygonData = jest.fn();
  let map, showPopupMock, store;

  beforeEach(() => {
    showPopupMock = jest.fn(() => () => { });
    showPopup.mockImplementation(showPopupMock);

    map = createMapMock();
    map.queryRenderedFeatures.mockImplementation(() => [
      { properties: { cluster_id: mockClusterIds[0] } },
      { properties: { cluster_id: mockClusterIds[1] } },
    ]);
    map.getSource.mockImplementation((clusterId) => {
      if (clusterId === CLUSTERS_SOURCE_ID) {
        return {
          getClusterExpansionZoom: jest.fn((clusterId, callback) => callback(null, CLUSTER_CLICK_ZOOM_THRESHOLD + 1)),
          getClusterLeaves: (clusterId, limit, offset, callback) => {
            switch (clusterId) {
            case mockClusterIds[0]:
              return callback(null, mockClusterLeaves[0]);
            case mockClusterIds[1]:
              return callback(null, mockClusterLeaves[1]);
            default:
              return;
            }
          },
          setData: jest.fn(),
        };
      } else {
        return { setData: setClusterBufferPolygonData };
      }
    });
    map.getZoom.mockImplementation(() => CLUSTER_CLICK_ZOOM_THRESHOLD - 1);

    store = mockStore({});

    render(
      <Provider store={store}>
        <ClustersLayer
          map={map}
          onEventClick={onEventClick}
          onSubjectClick={onSubjectClick}
          onSymbolClick={onSymbolClick}
        />
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mapMarkers.length = 0;
  });

  test('renders two markers in the map', async () => {
    await waitFor (() => {
      expect(mapMarkers).toHaveLength(2);
    }, { timeout: UPDATE_CLUSTER_MARKERS_DEBOUNCE_TIME + 30 });
  });

  test('each marker has three icons and a number indicating how many features it has', async () => {
    await waitFor (() => {
      expect(mapMarkers[0].childNodes).toHaveLength(4);
      expect(mapMarkers[0].childNodes[0].tagName).toBe('IMG');
      expect(mapMarkers[0].childNodes[1].tagName).toBe('IMG');
      expect(mapMarkers[0].childNodes[2].tagName).toBe('IMG');
      expect(mapMarkers[0].childNodes[3].tagName).toBe('P');
      expect(mapMarkers[0].childNodes[3].textContent).toBe('+1');

      expect(mapMarkers[1].childNodes).toHaveLength(4);
      expect(mapMarkers[1].childNodes[0].tagName).toBe('IMG');
      expect(mapMarkers[1].childNodes[1].tagName).toBe('IMG');
      expect(mapMarkers[1].childNodes[2].tagName).toBe('IMG');
      expect(mapMarkers[1].childNodes[3].tagName).toBe('P');
      expect(mapMarkers[1].childNodes[3].textContent).toBe('+3');
    }, { timeout: UPDATE_CLUSTER_MARKERS_DEBOUNCE_TIME + 30 });
  });

  test('updates the cluster buffer polygon source when user hovers a cluster', async () => {
    await waitFor (() => {
      expect(setClusterBufferPolygonData).toHaveBeenCalledTimes(1);

      mapMarkers[0].dispatchEvent(new Event('mouseover'));
    }, { timeout: UPDATE_CLUSTER_MARKERS_DEBOUNCE_TIME + 30 });

    await waitFor (() => {
      expect(setClusterBufferPolygonData).toHaveBeenCalledTimes(2);
      expect(setClusterBufferPolygonData.mock.calls[1][0].geometry).toBeDefined();
    }, { timeout: 30 });
  });

  test('updates the cluster buffer polygon source when user leaves a hovered cluster', async () => {
    await waitFor (() => {
      expect(setClusterBufferPolygonData).toHaveBeenCalledTimes(1);

      mapMarkers[0].dispatchEvent(new Event('mouseover'));
    }, { timeout: UPDATE_CLUSTER_MARKERS_DEBOUNCE_TIME + 30 });

    await waitFor (() => {
      expect(setClusterBufferPolygonData).toHaveBeenCalledTimes(2);

      mapMarkers[0].dispatchEvent(new Event('mouseleave'));
    }, { timeout: 30 });

    await waitFor (() => {
      expect(setClusterBufferPolygonData).toHaveBeenCalledTimes(3);
      expect(setClusterBufferPolygonData.mock.calls[2][0].geometry).toBeUndefined();
    }, { timeout: 30 });
  });

  test('zooms to a cluster if user clicks it while zoom is too far', async () => {
    await waitFor (() => {
      expect(map.easeTo).toHaveBeenCalledTimes(0);

      mapMarkers[0].dispatchEvent(new Event('click'));

      expect(map.easeTo).toHaveBeenCalledTimes(1);
      expect(map.easeTo).toHaveBeenCalledWith({
        center: [-103.38315141, 20.677884013333337],
        zoom: CLUSTER_CLICK_ZOOM_THRESHOLD + 1,
      });
    }, { timeout: UPDATE_CLUSTER_MARKERS_DEBOUNCE_TIME + 30 });
  });

  test('triggers the showPopup action when user clicks a cluster if zoom is close enough', async () => {
    map.getZoom.mockImplementation(() => CLUSTER_CLICK_ZOOM_THRESHOLD + 1);

    await waitFor (() => {
      expect(showPopup).toHaveBeenCalledTimes(0);

      mapMarkers[0].dispatchEvent(new Event('click'));

      expect(showPopup).toHaveBeenCalledTimes(1);
    }, { timeout: UPDATE_CLUSTER_MARKERS_DEBOUNCE_TIME + 30 });
  });

  describe('getClusterIconFeatures', () => {
    test('returns only three features', () => {
      const clusterFeatures = [
        { properties: { id: '1', content_type: 'observations.subject' } },
        { properties: { id: '2', event_type: 'jenaeonefield' } },
        { properties: { id: '3' } },
        { properties: { id: '4', content_type: 'observations.subject' } },
        { properties: { id: '5', event_type: 'immobility' } },
        { properties: { id: '6' } },
      ];

      expect(getClusterIconFeatures(clusterFeatures)).toHaveLength(3);
    });

    test('returns one of each features', () => {
      const clusterFeatures = [
        { properties: { id: '1', content_type: 'observations.subject' } },
        { properties: { id: '2', content_type: 'observations.subject' } },
        { properties: { id: '3', event_type: 'jenaeonefield' } },
        { properties: { id: '4', event_type: 'immobility' } },
        { properties: { id: '5' } },
        { properties: { id: '6' } },
      ];

      const clusterIconFeatures = getClusterIconFeatures(clusterFeatures);

      expect(clusterIconFeatures[0].properties.content_type).toBe('observations.subject');
      expect(clusterIconFeatures[1].properties.event_type).toBeTruthy();
      expect(clusterIconFeatures[2].properties.content_type).toBeUndefined();
      expect(clusterIconFeatures[2].properties.event_type).toBeUndefined();
    });

    test('returns three features of the same type if there are no others', () => {
      const clusterFeatures = [
        { properties: { id: '1', content_type: 'observations.subject' } },
        { properties: { id: '2', content_type: 'observations.subject' } },
        { properties: { id: '3', content_type: 'observations.subject' } },
        { properties: { id: '4', content_type: 'observations.subject' } },
      ];

      const clusterIconFeatures = getClusterIconFeatures(clusterFeatures);

      expect(getClusterIconFeatures(clusterFeatures)).toHaveLength(3);
      expect(clusterIconFeatures[0].properties.content_type).toBe('observations.subject');
      expect(clusterIconFeatures[1].properties.content_type).toBe('observations.subject');
      expect(clusterIconFeatures[2].properties.content_type).toBe('observations.subject');
    });

    test('gives priority to events by priority and then update date', () => {
      const clusterFeatures = [
        { properties: { id: '1', event_type: 'jenaeonefield', priority: 5, updated_at: '2021-08-11T22:01:07.973131-07:00' } },
        { properties: { id: '2', event_type: 'immobility', priority: 10, updated_at: '2021-08-10T22:01:07.973131-07:00' } },
        { properties: { id: '3', event_type: 'jenaeonefield', priority: 10, updated_at: '2021-08-10T22:01:07.973131-07:00' } },
        { properties: { id: '4', event_type: 'immobility', priority: 5, updated_at: '2021-08-12T23:01:07.973131-07:00' } },
        { properties: { id: '5', event_type: 'jenaeonefield', priority: 5, updated_at: '2021-08-12T22:01:07.973131-07:00' } },
        { properties: { id: '6', event_type: 'immobility', priority: 1, updated_at: '2021-08-10T22:01:07.973131-07:00' } },
      ];

      const clusterIconFeatures = getClusterIconFeatures(clusterFeatures);

      expect(clusterIconFeatures[0].properties.id).toBe('6');
      expect(clusterIconFeatures[1].properties.id).toBe('4');
      expect(clusterIconFeatures[2].properties.id).toBe('5');
    });

    test('gives priority to subjects last radio or position update', async () => {
      const clusterFeatures = [
        { properties: { id: '1', content_type: 'observations.subject', last_position_date: '2021-08-11T22:01:07.973131-07:00', radio_state_at: '2021-08-17T22:01:07.973131-07:00' } },
        { properties: { id: '2', content_type: 'observations.subject',  last_position_date: '2021-08-12T22:01:07.973131-07:00', radio_state_at: '2021-08-16T23:01:07.973131-07:00' } },
        { properties: { id: '3', content_type: 'observations.subject',  last_position_date: '2021-08-13T22:01:07.973131-07:00', radio_state_at: '2021-08-15T22:01:07.973131-07:00' } },
        { properties: { id: '4', content_type: 'observations.subject', last_position_date: '2021-08-14T22:01:07.973131-07:00', radio_state_at: '2021-08-14T23:01:07.973131-07:00' } },
        { properties: { id: '5', content_type: 'observations.subject', last_position_date: '2021-08-15T22:01:07.973131-07:00', radio_state_at: '2021-08-13T22:01:07.973131-07:00' } },
        { properties: { id: '6', content_type: 'observations.subject', last_position_date: '2021-08-16T22:01:07.973131-07:00', radio_state_at: '2021-08-12T22:01:07.973131-07:00' } },
      ];

      const clusterIconFeatures = getClusterIconFeatures(clusterFeatures);

      expect(clusterIconFeatures[0].properties.id).toBe('1');
      expect(clusterIconFeatures[1].properties.id).toBe('2');
      expect(clusterIconFeatures[2].properties.id).toBe('6');
    });
  });

  describe('createClusterHTMLMarker', () => {
    const onClusterClick = jest.fn(), onClusterMouseEnter = jest.fn(), onClusterMouseLeave = jest.fn();
    let clusterHTMLMarker;
    beforeEach(() => {
      const clusterFeatures = [
        { properties: { id: '1', content_type: 'observations.subject' } },
        { properties: { id: '2', event_type: 'jenaeonefield' } },
        { properties: { id: '3' } },
        { properties: { id: '4', content_type: 'observations.subject' } },
        { properties: { id: '5', event_type: 'jenaeonefield' } },
        { properties: { id: '6' } },
      ];
      clusterHTMLMarker = createClusterHTMLMarker(
        clusterFeatures,
        onClusterClick,
        onClusterMouseEnter,
        onClusterMouseLeave
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('triggers the onClusterClick event when clicking the marker', () => {
      clusterHTMLMarker.click();

      expect(onClusterClick).toHaveBeenCalledTimes(1);
    });

    test('triggers the onClusterMouseEnter event when hovering the marker', () => {
      clusterHTMLMarker.dispatchEvent(new Event('mouseover'));

      expect(onClusterMouseEnter).toHaveBeenCalledTimes(1);
    });

    test('triggers the onClusterMouseLeave event when leaving the marker', () => {
      clusterHTMLMarker.dispatchEvent(new Event('mouseleave'));

      expect(onClusterMouseLeave).toHaveBeenCalledTimes(1);
    });

    test('has 4 child nodes', () => {
      expect(clusterHTMLMarker.childNodes).toHaveLength(4);
      expect(clusterHTMLMarker.childNodes[0].tagName).toBe('IMG');
      expect(clusterHTMLMarker.childNodes[1].tagName).toBe('IMG');
      expect(clusterHTMLMarker.childNodes[2].tagName).toBe('IMG');
      expect(clusterHTMLMarker.childNodes[3].tagName).toBe('P');
    });
  });

  describe('onClusterClick', () => {
    const clusterCoordinates = {};
    const clusterFeatures = [
      { properties: { id: '1', content_type: 'observations.subject' } },
      { properties: { id: '2', event_type: 'jenaeonefield' } },
      { properties: { id: '3' } },
      { properties: { id: '4', content_type: 'observations.subject' } },
      { properties: { id: '5', event_type: 'jenaeonefield' } },
      { properties: { id: '6' } },
    ];
    const clusterHash = 'abcd';
    const clusterMarkerHashMap = { abcd: { id: '1' } };
    const map = { easeTo: jest.fn(), getZoom: () => CLUSTER_CLICK_ZOOM_THRESHOLD - 1 };
    const onShowClusterSelectPopup = jest.fn();
    const source = {
      getClusterExpansionZoom: (clusterId, callback) => callback(null, CLUSTER_CLICK_ZOOM_THRESHOLD + 1),
    };

    test('zooms to cluster coordinates if the current zoom is less than the threshold', () => {
      onClusterClick(
        clusterCoordinates,
        clusterFeatures,
        clusterHash,
        clusterMarkerHashMap,
        map,
        onShowClusterSelectPopup,
        source
      )();

      expect(map.easeTo).toHaveBeenCalledTimes(1);
      expect(map.easeTo).toHaveBeenCalledWith({ center: clusterCoordinates, zoom: CLUSTER_CLICK_ZOOM_THRESHOLD + 1 });
    });

    test('triggers onShowClusterSelectPopup if the current zoom is equal or greater than the threshold', () => {
      map.getZoom = () => CLUSTER_CLICK_ZOOM_THRESHOLD + 1;
      onClusterClick(
        clusterCoordinates,
        clusterFeatures,
        clusterHash,
        clusterMarkerHashMap,
        map,
        onShowClusterSelectPopup,
        source
      )();

      expect(onShowClusterSelectPopup).toHaveBeenCalledTimes(1);
      expect(onShowClusterSelectPopup).toHaveBeenCalledWith(clusterFeatures, clusterCoordinates);
    });
  });

  describe('getRenderedClustersData', () => {
    const cluster1Id = '1';
    const cluster1Features = [
      { properties: { id: '1', content_type: 'observations.subject' } },
      { properties: { id: '2', event_type: 'jenaeonefield' } },
      { properties: { id: '3' } },
    ];
    const cluster2Id = '2';
    const cluster2Features = [
      { properties: { id: '4', content_type: 'observations.subject' } },
      { properties: { id: '5', event_type: 'immobility' } },
      { properties: { id: '6' } },
    ];
    const clustersSource = {
      getClusterLeaves: (clusterId, limit, offset, callback) =>
        clusterId === cluster1Id ? callback(null, cluster1Features) : callback(null, cluster2Features),
    };
    const map = {
      queryRenderedFeatures: () => [
        { properties: { cluster_id: cluster1Id } },
        { properties: { cluster_id: cluster2Id } },
      ],
    };

    test('returns the cluster ids', async () => {
      const { renderedClusterIds } = await getRenderedClustersData(clustersSource, map);

      expect(renderedClusterIds).toHaveLength(2);
      expect(renderedClusterIds[0]).toBe(cluster1Id);
      expect(renderedClusterIds[1]).toBe(cluster2Id);
    });

    test('returns the cluster features', async () => {
      const { renderedClusterFeatures } = await getRenderedClustersData(clustersSource, map);

      expect(renderedClusterFeatures).toHaveLength(2);
      expect(renderedClusterFeatures[0]).toBe(cluster1Features);
      expect(renderedClusterFeatures[1]).toBe(cluster2Features);
    });

    test('returns the cluster hashes', async () => {
      const { renderedClusterHashes } = await getRenderedClustersData(clustersSource, map);

      expect(renderedClusterHashes).toHaveLength(2);
    });
  });

  describe('removeOldClusterMarkers', () => {
    const clusterMarkerHashMap = {
      '1': { marker: { remove: jest.fn() } },
      '2': { marker: { remove: jest.fn() } },
      '3': { marker: { remove: jest.fn() } },
    };
    const renderedClusterHashes = [1, 3];

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('triggers the remove method of the markers that are no longer rendered', () => {
      removeOldClusterMarkers(clusterMarkerHashMap, renderedClusterHashes);

      expect(clusterMarkerHashMap['2'].marker.remove).toHaveBeenCalledTimes(1);
    });

    test('does not trigger the remove method of the markers that are rendered', () => {
      removeOldClusterMarkers(clusterMarkerHashMap, renderedClusterHashes);

      expect(clusterMarkerHashMap['1'].marker.remove).not.toHaveBeenCalled();
      expect(clusterMarkerHashMap['3'].marker.remove).not.toHaveBeenCalled();
    });
  });

  describe('addNewClusterMarkers', () => {
    const clusterMarkerHashMap = {
      '1': { marker: {} },
    };
    const clustersSource = {};
    const map = {};
    const onClusterMouseEnter = jest.fn();
    const onClusterMouseLeave = jest.fn();
    const renderedClusterFeatures = [
      [
        {
          geometry: { type: 'Point', coordinates: [-3.319247817157387, 37.38961074832439] },
          properties: { id: '1', content_type: 'observations.subject' },
          type: 'Feature',
        },
        {
          geometry: { type: 'Point', coordinates: [-3.319247817157387, 37.38961074832439] },
          properties: { id: '2', event_type: 'jenaeonefield' },
          type: 'Feature',
        },
        {
          geometry: { type: 'Point', coordinates: [-3.319247817157387, 37.38961074832439] },
          properties: { id: '3' },
          type: 'Feature',
        },
      ],
      [
        {
          geometry: { type: 'Point', coordinates: [-3.319247817157387, 37.38961074832439] },
          properties: { id: '4', content_type: 'observations.subject' },
          type: 'Feature',
        },
        {
          geometry: { type: 'Point', coordinates: [-3.319247817157387, 37.38961074832439] },
          properties: { id: '5', event_type: 'immobility' },
          type: 'Feature',
        },
        {
          geometry: { type: 'Point', coordinates: [-3.319247817157387, 37.38961074832439] },
          properties: { id: '6' },
          type: 'Feature',
        },
      ]
    ];
    const renderedClusterHashes = ['1', '2'];
    const renderedClusterIds = ['abcd', 'efgh'];
    const onShowClusterSelectPopup = jest.fn();

    test('keeps the old cluster markers that are still rendered', () => {
      const renderedClusterMarkersHashMap = addNewClusterMarkers(
        clusterMarkerHashMap,
        clustersSource,
        map,
        onClusterMouseEnter,
        onClusterMouseLeave,
        renderedClusterFeatures,
        renderedClusterHashes,
        renderedClusterIds,
        onShowClusterSelectPopup
      );

      expect(renderedClusterMarkersHashMap['1'].marker).toBe(clusterMarkerHashMap['1'].marker);
      expect(renderedClusterMarkersHashMap['1'].id).toBe('abcd');
    });

    test('creates new markers for the new rendered clusters', () => {
      const renderedClusterMarkersHashMap = addNewClusterMarkers(
        clusterMarkerHashMap,
        clustersSource,
        map,
        onClusterMouseEnter,
        onClusterMouseLeave,
        renderedClusterFeatures,
        renderedClusterHashes,
        renderedClusterIds,
        onShowClusterSelectPopup
      );

      expect(renderedClusterMarkersHashMap['2'].id).toBe('efgh');
    });
  });
});
