import React from 'react';
import { featureCollection, point } from '@turf/turf';
import { Provider } from 'react-redux';
import { render, waitFor } from '@testing-library/react';

import {
  addNewClusterMarkers,
  calcClusterZoomPadding,
  createClusterHTMLMarker,
  getClusterIconFeatures,
  getRenderedClustersData,
  onClusterClick,
  removeOldClusterMarkers,
} from './utils';
import { BREAKPOINTS, CLUSTER_CLICK_ZOOM_THRESHOLD, SOURCE_IDS } from '../constants';
import { calcSpriteSvgUrl, calcUrlForImage } from '../utils/img';
import { calcSvgImageIconId } from '../utils/mapImages';
import * as eventMapIcons from '../utils/eventMapIcons';
import ClustersLayer from '.';
import { createMapMock, createMockInteractionEvent } from '../__test-helpers/mocks';
import getWindowLocation from '../utils/getWindowLocation';
import { mockStore } from '../__test-helpers/MockStore';
import { MapContext } from '../MapContext';
import {
  mockClusterIds,
  mockClusterLeaves,
  mockEventFeatureCollection,
  mockSubjectFeatureCollection,
} from '../__test-helpers/fixtures/clusters';
import { selectRealtimeOverlayFeatureCollection } from '../selectors/events-realtime-overlay';
import useClusterPolygon from '../hooks/useClusterPolygon';
import useTileEventFeaturesMock from '../hooks/useTileEventFeatures';

const { CLUSTERS_SOURCE_ID } = SOURCE_IDS;

const mapMarkers = [];

jest.mock('mapbox-gl', () => ({
  ...jest.requireActual('mapbox-gl'),
  Marker: class {
    constructor(marker) { this.marker = marker; }
    addTo() { mapMarkers.push(this.marker); return this; }
    setLngLat() { return this; }
    remove() {
      const markerIndex = mapMarkers.indexOf(this.marker);
      if (markerIndex !== -1) mapMarkers.splice(markerIndex, 1);
      return this;
    }
    getElement() { return this.marker; }
  },
}));

// Backs the event icon registry with an in-memory map so tests can seed
// resolved icons and trigger the "an icon resolved" notification directly,
// instead of round-tripping through the redux store.
jest.mock('../utils/eventMapIcons', () => {
  const icons = new Map();
  let iconListeners = new Set();
  return {
    getEventIcon: (key) => icons.get(key),
    ensureEventIcon: jest.fn(),
    subscribeEventIcons: (listener) => {
      iconListeners.add(listener);
      return () => iconListeners.delete(listener);
    },
    __seed: (key, image) => icons.set(key, image),
    __notify: () => iconListeners.forEach((listener) => listener()),
    __clear: () => {
      icons.clear();
      iconListeners = new Set();
    },
  };
});

const JENAE_ICON_KEY = calcSvgImageIconId({ icon_id: 'jenaeonefield', priority: 200 });

// Seeds a resolved icon in the registry for every event feature, optionally
// omitting specific variant keys to simulate an icon that hasn't resolved yet.
const seedIconsForFeatures = (features, { omitKeys = [] } = {}) => {
  const omitted = new Set(omitKeys);
  features.forEach(({ properties }) => {
    if (properties.icon_id) {
      const key = calcSvgImageIconId(properties);
      if (!omitted.has(key)) {
        eventMapIcons.__seed(key, document.createElement('img'));
      }
    }
  });
};

jest.mock('../selectors/events', () => ({
  ...jest.requireActual('../selectors/events'),
  getMapEventFeatureCollectionWithVirtualDate: () => mockEventFeatureCollection,
}));
jest.mock('../selectors/subjects', () => ({
  ...jest.requireActual('../selectors/subjects'),
  getMapSubjectFeatureCollectionWithVirtualPositioning: () => mockSubjectFeatureCollection,
}));
jest.mock('../hooks/useClusterPolygon', () => jest.fn());
jest.mock('../hooks/useTileEventFeatures', () => jest.fn());
jest.mock('../selectors/events-realtime-overlay', () => ({
  selectRealtimeOverlayFeatureCollection: jest.fn(),
}));
jest.mock('../utils/getWindowLocation', () => jest.fn());


describe('ClustersLayer', () => {
  let getClusterExpansionZoomMock, removeClusterPolygon;

  beforeEach(() => {
    getClusterExpansionZoomMock = jest.fn((clusterId, callback) => callback(null, CLUSTER_CLICK_ZOOM_THRESHOLD + 1));
    removeClusterPolygon = jest.fn();

    selectRealtimeOverlayFeatureCollection.mockReturnValue(featureCollection([]));
    useTileEventFeaturesMock.mockReturnValue(featureCollection([]));
    getWindowLocation.mockReturnValue({ pathname: '/' });
    BREAKPOINTS.screenIsMediumLayoutOrLarger.matches = true;
  });

  describe('the map layer', () => {
    const onShowClusterSelectPopup = jest.fn(), addClusterPolygon = jest.fn(),
      setData = jest.fn();
    let map, useClusterPolygonMock, unmount;

    const buildStore = () => mockStore({
      data: { mapLayerFilter: { showReportsOnMap: true }, mapEvents: { events: [] }, eventFilter: { filter: { date_range: {} } } },
      view: { mapImages: [], timeSliderState: {}, mapClusterConfig: { data: { events: true, subjects: true } } },
    });

    beforeEach(() => {
      jest.useFakeTimers();

      useClusterPolygonMock = () => ({ removeClusterPolygon, addClusterPolygon });
      useClusterPolygon.mockImplementation(useClusterPolygonMock);

      map = createMapMock();
      map.queryRenderedFeatures.mockImplementation(() => [
        { properties: { cluster_id: mockClusterIds[0] } },
        { properties: { cluster_id: mockClusterIds[1] } },
      ]);
      map.getSource.mockImplementation(() => ({
        getClusterExpansionZoom: getClusterExpansionZoomMock,
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
        setData,
      }));
      map.getZoom.mockImplementation(() => CLUSTER_CLICK_ZOOM_THRESHOLD - 1);

      seedIconsForFeatures([...mockClusterLeaves[0], ...mockClusterLeaves[1]]);

      ({ unmount } = render(
        <Provider store={buildStore()}>
          <MapContext.Provider value={map}>
            <ClustersLayer onShowClusterSelectPopup={onShowClusterSelectPopup} />
          </MapContext.Provider>
        </Provider>
      ));
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      jest.restoreAllMocks();

      eventMapIcons.__clear();
      mapMarkers.length = 0;
    });

    test('renders two markers in the map', async () => {
      map.__test__.fireHandlers('sourcedata', { sourceId: CLUSTERS_SOURCE_ID });

      await waitFor(() => {
        expect(mapMarkers).toHaveLength(2);
      });
    });

    test('withholds a cluster marker until all its displayed icons resolve in the registry, rather than showing a guessed placeholder', async () => {
      unmount();
      mapMarkers.length = 0;

      // Simulates the initial-page-load race: every icon is resolved except one.
      eventMapIcons.__clear();
      seedIconsForFeatures([...mockClusterLeaves[0], ...mockClusterLeaves[1]], { omitKeys: [JENAE_ICON_KEY] });

      render(
        <Provider store={buildStore()}>
          <MapContext.Provider value={map}>
            <ClustersLayer onShowClusterSelectPopup={onShowClusterSelectPopup} />
          </MapContext.Provider>
        </Provider>
      );
      map.__test__.fireHandlers('sourcedata', { sourceId: CLUSTERS_SOURCE_ID });

      // Only the cluster whose icons are already resolved gets a marker.
      await waitFor(() => {
        expect(mapMarkers).toHaveLength(1);
      });

      // The missing icon resolves and the registry notifies its subscribers.
      eventMapIcons.__seed(JENAE_ICON_KEY, document.createElement('img'));
      eventMapIcons.__notify();

      await waitFor(() => {
        expect(mapMarkers).toHaveLength(2);
        expect(mapMarkers[1].innerHTML).not.toContain(calcSpriteSvgUrl('jenaeonefield'));
      });
    });

    test('does not create a marker for a still-not-ready cluster on unrelated icon updates', async () => {
      unmount();
      mapMarkers.length = 0;

      // Simulates the initial-page-load race, same as the previous test.
      eventMapIcons.__clear();
      seedIconsForFeatures([...mockClusterLeaves[0], ...mockClusterLeaves[1]], { omitKeys: [JENAE_ICON_KEY] });

      render(
        <Provider store={buildStore()}>
          <MapContext.Provider value={map}>
            <ClustersLayer onShowClusterSelectPopup={onShowClusterSelectPopup} />
          </MapContext.Provider>
        </Provider>
      );
      map.__test__.fireHandlers('sourcedata', { sourceId: CLUSTERS_SOURCE_ID });

      await waitFor(() => {
        expect(mapMarkers).toHaveLength(1);
      });

      // An unrelated icon resolves elsewhere on the map — the cluster's own
      // missing icon is still not present, so no marker should be created for it
      // yet even though the registry notified.
      eventMapIcons.__seed(calcSvgImageIconId({ icon_id: 'unrelated_icon', priority: 100 }), document.createElement('img'));
      eventMapIcons.__notify();

      await waitFor(() => {
        expect(mapMarkers).toHaveLength(1);
      });
    });

    test('each marker has three icons and a number indicating how many features it has', async () => {
      map.__test__.fireHandlers('sourcedata', { sourceId: CLUSTERS_SOURCE_ID });

      jest.runAllTimers();

      await waitFor(() => {
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
      });
    });

    test('renders a cluster buffer polygon when user hovers a cluster', async () => {
      map.__test__.fireHandlers('sourcedata', { sourceId: CLUSTERS_SOURCE_ID });


      expect(addClusterPolygon).toHaveBeenCalledTimes(0);

      await waitFor(() => {
        mapMarkers[0].dispatchEvent(new Event('mouseover'));
      });

      jest.runAllTimers();
      expect(addClusterPolygon).toHaveBeenCalledTimes(1);
    });

    test('removes the cluster buffer polygon when user leaves a hovered cluster', async () => {
      map.__test__.fireHandlers('sourcedata', { sourceId: CLUSTERS_SOURCE_ID });


      expect(removeClusterPolygon).toHaveBeenCalledTimes(0);

      await waitFor(() => {
        mapMarkers[0].dispatchEvent(new Event('mouseover'));
        mapMarkers[0].dispatchEvent(new Event('mouseleave'));
      });

      jest.runAllTimers();

      await waitFor(() => {
        expect(removeClusterPolygon).toHaveBeenCalledTimes(1);
      });
    });

    test('zooms to a cluster if user clicks it while zoom is too far', async () => {
      map.__test__.fireHandlers('sourcedata', { sourceId: CLUSTERS_SOURCE_ID, source: { getClusterExpansionZoom: getClusterExpansionZoomMock } });

      expect(map.easeTo).toHaveBeenCalledTimes(0);

      await waitFor(() => {
        mapMarkers[0].dispatchEvent(new Event('click'));
      });

      jest.runAllTimers();

      expect(map.easeTo).toHaveBeenCalledTimes(1);
      expect(map.easeTo).toHaveBeenCalledWith({
        center: [-103.38315141, 20.677884013333337],
        zoom: CLUSTER_CLICK_ZOOM_THRESHOLD + 1.1,
        padding: { left: 0, right: 90, top: 12, bottom: 12 },
      });
    });

    test('triggers the onShowClusterSelectPopup action when user clicks a cluster if zoom is close enough', async () => {
      map.getZoom.mockImplementation(() => CLUSTER_CLICK_ZOOM_THRESHOLD + 1);

      map.__test__.fireHandlers('sourcedata', { sourceId: CLUSTERS_SOURCE_ID, source: { getClusterExpansionZoom: getClusterExpansionZoomMock } });

      expect(onShowClusterSelectPopup).toHaveBeenCalledTimes(0);

      await waitFor(() => {
        mapMarkers[0].dispatchEvent(new Event('click'));
      });

      expect(onShowClusterSelectPopup).toHaveBeenCalledTimes(1);
    });
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
      expect(clusterIconFeatures[2].properties.content_type).toBe('observations.subject');
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

      expect(clusterIconFeatures[0].properties.id).toBe('2');
      expect(clusterIconFeatures[1].properties.id).toBe('3');
      expect(clusterIconFeatures[2].properties.id).toBe('4');
    });

    test('gives priority to subjects last radio or position update', async () => {
      const clusterFeatures = [
        { properties: { id: '1', content_type: 'observations.subject', last_position_date: '2021-08-11T22:01:07.973131-07:00', radio_state_at: '2021-08-17T22:01:07.973131-07:00' } },
        { properties: { id: '2', content_type: 'observations.subject',  last_position_date: '2021-08-12T22:01:07.973131-07:00', radio_state_at: '2021-08-16T23:01:07.973131-07:00' } },
        { properties: { id: '3', content_type: 'observations.subject',  last_position_date: '2021-08-13T22:01:07.973131-07:00', radio_state_at: '2021-08-15T22:01:07.973131-07:00' } },
        { properties: { id: '4', content_type: 'observations.subject', last_position_date: '2021-08-14T22:01:07.973131-07:00', radio_state_at: undefined } },
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
        { properties: { id: '1', content_type: 'observations.subject', is_static: true, subject_type: 'stationary-subject', image_url: 'https://develop.pamdas.org/static/ranger-black.svg' } },
        { properties: { id: '2', event_type: 'jenaeonefield', image: 'https://develop.pamdas.org/static/fire_rep.svg' } },
        { properties: { id: '3', image: 'https://develop.pamdas.org/static/fire_rep.svg' } },
        { properties: { id: '4', content_type: 'observations.subject', image_url: 'https://develop.pamdas.org/static/ranger-black.svg' } },
        { properties: { id: '5', event_type: 'jenaeonefield', image: 'https://develop.pamdas.org/static/fire_rep.svg' } },
        { properties: { id: '6', image: 'https://develop.pamdas.org/static/fire_rep.svg' } },
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

    test('resolves a subject feature\'s backend-relative image against DAS_HOST via calcUrlForImage', () => {
      const relativeImage = '/static/ranger-black.svg';
      const subjectMarker = createClusterHTMLMarker(
        [{ properties: { id: '1', content_type: 'observations.subject', image_url: relativeImage } }],
        onClusterClick,
        onClusterMouseEnter,
        onClusterMouseLeave
      );

      const img = subjectMarker.querySelector('img');
      expect(img.getAttribute('src')).toBe(calcUrlForImage(relativeImage));
      // The raw backend-relative path must not be used unresolved.
      expect(img.getAttribute('src')).not.toBe(relativeImage);
    });
  });

  describe('onClusterClick', () => {
    const clusterCoordinates = {};
    let map, clickEvent;
    const clusterFeatures = [
      { properties: { id: '1', content_type: 'observations.subject' } },
      { properties: { id: '2', event_type: 'jenaeonefield' } },
      { properties: { id: '3' } },
      { properties: { id: '4', content_type: 'observations.subject' } },
      { properties: { id: '5', event_type: 'jenaeonefield' } },
      { properties: { id: '6' } },
    ];
    const clusterHash = 'abcd';
    const clusterMarkerHashMapRef = { current: { abcd: { id: '1' } } };

    const onShowClusterSelectPopup = jest.fn();

    beforeEach(() => {
      map = createMapMock();
      clickEvent = createMockInteractionEvent();

    });

    test('zooms to cluster coordinates if the current zoom is less than the threshold', () => {
      map.getSource.mockReturnValue({ getClusterExpansionZoom: getClusterExpansionZoomMock });
      map.getZoom.mockReturnValue(CLUSTER_CLICK_ZOOM_THRESHOLD - 1);

      onClusterClick(
        clusterCoordinates,
        clusterFeatures,
        clusterHash,
        clusterMarkerHashMapRef,
        map,
        onShowClusterSelectPopup,
        CLUSTERS_SOURCE_ID
      )(clickEvent);

      expect(map.easeTo).toHaveBeenCalledTimes(1);
      expect(map.easeTo).toHaveBeenCalledWith({
        center: clusterCoordinates,
        zoom: CLUSTER_CLICK_ZOOM_THRESHOLD + 1.1,
        padding: { left: 0, right: 90, top: 12, bottom: 12 },
      });
    });

    test('centers the zoom on the visible map area, accounting for the sidebar, when it is open', () => {
      getWindowLocation.mockReturnValue({ pathname: '/events' });
      map.getSource.mockReturnValue({ getClusterExpansionZoom: getClusterExpansionZoomMock });
      map.getZoom.mockReturnValue(CLUSTER_CLICK_ZOOM_THRESHOLD - 1);

      onClusterClick(
        clusterCoordinates,
        clusterFeatures,
        clusterHash,
        clusterMarkerHashMapRef,
        map,
        onShowClusterSelectPopup,
        CLUSTERS_SOURCE_ID
      )(clickEvent);

      expect(map.easeTo).toHaveBeenCalledWith({
        center: clusterCoordinates,
        zoom: CLUSTER_CLICK_ZOOM_THRESHOLD + 1.1,
        padding: { left: 582, right: 90, top: 12, bottom: 12 },
      });
    });

    test('triggers onShowClusterSelectPopup if the current zoom is equal or greater than the threshold', () => {
      map.getZoom.mockReturnValue(CLUSTER_CLICK_ZOOM_THRESHOLD + 1);

      onClusterClick(
        clusterCoordinates,
        clusterFeatures,
        clusterHash,
        clusterMarkerHashMapRef,
        map,
        onShowClusterSelectPopup,
        CLUSTERS_SOURCE_ID
      )(clickEvent);

      expect(onShowClusterSelectPopup).toHaveBeenCalledTimes(1);
      expect(onShowClusterSelectPopup).toHaveBeenCalledWith(clusterFeatures, clusterCoordinates);
    });
  });

  describe('calcClusterZoomPadding', () => {
    test('pads with a zero left offset when no sidebar tab is open, so a stale padding value never lingers on the map camera', () => {
      getWindowLocation.mockReturnValue({ pathname: '/' });

      expect(calcClusterZoomPadding()).toEqual({ left: 0, right: 90, top: 12, bottom: 12 });
    });

    test('pads for the sidebar width when a tab is open', () => {
      getWindowLocation.mockReturnValue({ pathname: '/events' });

      expect(calcClusterZoomPadding()).toEqual({ left: 582, right: 90, top: 12, bottom: 12 });
    });

    test('pads for the wider detail view when an item is open', () => {
      getWindowLocation.mockReturnValue({ pathname: '/events/some-event-id' });

      expect(calcClusterZoomPadding()).toEqual({ left: 736, right: 90, top: 12, bottom: 12 });
    });

    test('pads with a zero left offset and a narrower right offset below the medium layout breakpoint, since the sidebar covers the full viewport', () => {
      getWindowLocation.mockReturnValue({ pathname: '/events' });
      BREAKPOINTS.screenIsMediumLayoutOrLarger.matches = false;

      expect(calcClusterZoomPadding()).toEqual({ left: 0, right: 12, top: 12, bottom: 12 });
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

    test('keys the hash off the locally edited event\'s unsaved priority and icon_id (local-<priority>-<icon_id> suffix)', async () => {
      const { renderedClusterHashes: baseHashes } = await getRenderedClustersData(clustersSource, map);

      // Event id '2' lives in cluster 1; editing it should change only that cluster's hash.
      const { renderedClusterHashes: editedHashes } = await getRenderedClustersData(
        clustersSource,
        map,
        { id: '2', priority: 300 }
      );
      expect(editedHashes[0]).not.toBe(baseHashes[0]);
      expect(editedHashes[1]).toBe(baseHashes[1]);

      // A different unsaved priority produces a different local-<priority> suffix, and hash.
      const { renderedClusterHashes: rehashedHashes } = await getRenderedClustersData(
        clustersSource,
        map,
        { id: '2', priority: 100 }
      );
      expect(rehashedHashes[0]).not.toBe(editedHashes[0]);

      // An icon-only edit (same priority) still forces a rehash for that cluster.
      const { renderedClusterHashes: iconEditedHashes } = await getRenderedClustersData(
        clustersSource,
        map,
        { id: '2', priority: 300, icon_id: 'different_icon' }
      );
      expect(iconEditedHashes[0]).not.toBe(editedHashes[0]);
      expect(iconEditedHashes[1]).toBe(baseHashes[1]);
    });

    test('resolves (does not hang) and drops clusters that error, keeping the arrays aligned', async () => {
      const erroringSource = {
        getClusterLeaves: (clusterId, limit, offset, callback) => (clusterId === cluster1Id
          ? callback(new Error('boom'))
          : callback(null, cluster2Features)),
      };

      const {
        renderedClusterIds,
        renderedClusterFeatures,
        renderedClusterHashes,
      } = await getRenderedClustersData(erroringSource, map);

      expect(renderedClusterIds).toEqual([cluster2Id]);
      expect(renderedClusterFeatures).toEqual([cluster2Features]);
      expect(renderedClusterHashes).toHaveLength(1);
    });
  });

  describe('removeOldClusterMarkers', () => {
    const clusterMarkerHashMapRef = {
      current: {
        '1': { marker: { remove: jest.fn() } },
        '2': { marker: { remove: jest.fn() } },
        '3': { marker: { remove: jest.fn() } },
      },
    };
    const renderedClusterHashes = [1, 3];

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('triggers the remove method of the markers that are no longer rendered', () => {
      removeOldClusterMarkers(clusterMarkerHashMapRef, removeClusterPolygon, renderedClusterHashes);

      expect(clusterMarkerHashMapRef.current['2'].marker.remove).toHaveBeenCalledTimes(1);
      expect(removeClusterPolygon).toHaveBeenCalledTimes(1);
    });

    test('does not trigger the remove method of the markers that are rendered', () => {
      removeOldClusterMarkers(clusterMarkerHashMapRef, removeClusterPolygon, renderedClusterHashes);

      expect(clusterMarkerHashMapRef.current['1'].marker.remove).not.toHaveBeenCalled();
      expect(clusterMarkerHashMapRef.current['3'].marker.remove).not.toHaveBeenCalled();
    });
  });

  describe('addNewClusterMarkers', () => {
    afterEach(() => eventMapIcons.__clear());

    const clusterMarkerHashMapRef = { current: { '1': { marker: { remove: jest.fn() }, iconsReady: true } } };
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
        onClusterMouseEnter,
        clusterMarkerHashMapRef,
        clustersSource,
        map,
        onClusterMouseLeave,
        renderedClusterFeatures,
        renderedClusterHashes,
        renderedClusterIds,
        onShowClusterSelectPopup
      );

      expect(renderedClusterMarkersHashMap['1'].marker).toBe(clusterMarkerHashMapRef.current['1'].marker);
      expect(renderedClusterMarkersHashMap['1'].id).toBe('abcd');
    });

    test('creates new markers for the new rendered clusters', () => {
      const renderedClusterMarkersHashMap = addNewClusterMarkers(
        onClusterMouseEnter,
        clusterMarkerHashMapRef,
        clustersSource,
        map,
        onClusterMouseLeave,
        renderedClusterFeatures,
        renderedClusterHashes,
        renderedClusterIds,
        onShowClusterSelectPopup
      );

      expect(renderedClusterMarkersHashMap['2'].id).toBe('efgh');
    });

    test('keeps a cached marker as-is while its icons are still not ready', () => {
      const staleMarker = { remove: jest.fn() };
      const notReadyClusterMarkerHashMapRef = {
        current: { pending: { marker: staleMarker, iconsReady: false } },
      };
      const pendingClusterFeatures = [[{
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { id: '10', icon_id: 'snare_rep', priority: 200 },
        type: 'Feature',
      }]];

      const renderedClusterMarkersHashMap = addNewClusterMarkers(
        onClusterMouseEnter,
        notReadyClusterMarkerHashMapRef,
        clustersSource,
        map,
        onClusterMouseLeave,
        pendingClusterFeatures,
        ['pending'],
        ['ijkl'],
        onShowClusterSelectPopup
      );

      expect(staleMarker.remove).not.toHaveBeenCalled();
      expect(renderedClusterMarkersHashMap.pending.marker).toBe(staleMarker);
      expect(renderedClusterMarkersHashMap.pending.iconsReady).toBe(false);
    });

    test('refreshes a cached marker\'s icons in place once they become ready, without rebuilding it', () => {
      const staleMarkerElement = document.createElement('div');
      const staleMarker = { getElement: () => staleMarkerElement, remove: jest.fn() };
      const upgradingClusterMarkerHashMapRef = {
        current: { pending: { marker: staleMarker, iconsReady: false } },
      };
      const pendingClusterFeatures = [[{
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { id: '10', icon_id: 'snare_rep', priority: 200 },
        type: 'Feature',
      }]];
      eventMapIcons.__seed(
        calcSvgImageIconId({ icon_id: 'snare_rep', priority: 200 }),
        document.createElement('img')
      );

      const renderedClusterMarkersHashMap = addNewClusterMarkers(
        onClusterMouseEnter,
        upgradingClusterMarkerHashMapRef,
        clustersSource,
        map,
        onClusterMouseLeave,
        pendingClusterFeatures,
        ['pending'],
        ['ijkl'],
        onShowClusterSelectPopup
      );

      // The marker instance is kept as-is; only its rendered icon content is
      // refreshed.
      expect(staleMarker.remove).not.toHaveBeenCalled();
      expect(renderedClusterMarkersHashMap.pending.marker).toBe(staleMarker);
      expect(renderedClusterMarkersHashMap.pending.iconsReady).toBe(true);
      expect(staleMarkerElement.querySelector('img')).toBeTruthy();
    });
  });

  describe('event vector tiles clustering', () => {
    const mockTileFeature = point([1, 1], { id: 'tile-evt-1' });
    const mockOverlayFeature = point([2, 2], { id: 'overlay-evt-1' });

    let setData, map;
    beforeEach(() => {
      setData = jest.fn();
      map = createMapMock();
      map.getSource.mockReturnValue({ setData, getClusterExpansionZoom: jest.fn(), getClusterLeaves: jest.fn() });
      map.queryRenderedFeatures.mockReturnValue([]);

      const useTileEventFeaturesMock = require('../hooks/useTileEventFeatures');
      const { selectRealtimeOverlayFeatureCollection } = require('../selectors/events-realtime-overlay');
      useTileEventFeaturesMock.mockReturnValue(featureCollection([mockTileFeature]));
      selectRealtimeOverlayFeatureCollection.mockReturnValue(featureCollection([mockOverlayFeature]));

      useClusterPolygon.mockImplementation(() => ({ addClusterPolygon: jest.fn(), removeClusterPolygon: jest.fn() }));
    });

    const renderClustersLayerWithFlagOn = () => render(
      <Provider store={mockStore({
        data: {
          mapLayerFilter: { showReportsOnMap: true },
          mapEvents: { events: [] },
          eventFilter: { filter: { date_range: {} } },
          eventTypes: [],
          realtimeOverlayEvents: { ids: {} },
          eventStore: {},
        },
        view: {
          mapImages: [],
          timeSliderState: { active: false },
          mapClusterConfig: { data: { events: true, subjects: false } },
          systemConfig: { previewFeatures: { events_vector_tiles: true } },
        },
      })}>
        <MapContext.Provider value={map}>
          <ClustersLayer onShowClusterSelectPopup={jest.fn()} />
        </MapContext.Provider>
      </Provider>
    );

    test('feeds tile features + overlay features into the cluster source', () => {
      renderClustersLayerWithFlagOn();

      const lastSetData = setData.mock.calls.at(-1)?.[0];
      expect(lastSetData).toBeDefined();
      expect(lastSetData.features).toEqual(expect.arrayContaining([
        expect.objectContaining({ properties: expect.objectContaining({ id: 'tile-evt-1' }) }),
        expect.objectContaining({ properties: expect.objectContaining({ id: 'overlay-evt-1' }) }),
      ]));
    });

    test('does not include the GeoJSON event collection while the flag is ON', () => {
      renderClustersLayerWithFlagOn();

      const lastSetData = setData.mock.calls.at(-1)?.[0];
      const ids = lastSetData.features.map((feature) => feature.properties?.id);
      // The GeoJSON path features (mocked, non-empty) must not leak in when the flag is ON.
      mockEventFeatureCollection.features.forEach((feature) => {
        expect(ids).not.toContain(feature.properties?.id);
      });
    });

    test('excludes event features from the cluster source when events clustering is disabled', () => {
      render(
        <Provider store={mockStore({
          data: {
            mapLayerFilter: { showReportsOnMap: true },
            mapEvents: { events: [] },
            eventFilter: { filter: { date_range: {} } },
            eventTypes: [],
            realtimeOverlayEvents: { ids: {} },
            eventStore: {},
          },
          view: {
            mapImages: [],
            timeSliderState: { active: false },
            // Events clustering off (subjects off too) -> no event features in the cluster source.
            mapClusterConfig: { data: { events: false, subjects: false } },
            systemConfig: { previewFeatures: { events_vector_tiles: true } },
          },
        })}>
          <MapContext.Provider value={map}>
            <ClustersLayer onShowClusterSelectPopup={jest.fn()} />
          </MapContext.Provider>
        </Provider>
      );

      const lastSetData = setData.mock.calls.at(-1)?.[0];
      const ids = lastSetData.features.map((feature) => feature.properties?.id);
      expect(ids).not.toContain('tile-evt-1');
      expect(ids).not.toContain('overlay-evt-1');
    });
  });
});
