import React from 'react';
import { Provider } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { clearEventData, fetchMapEvents } from '../ducks/events';
import { clearSubjectData, fetchMapSubjects } from '../ducks/subjects';
import { fetchBaseLayers } from '../ducks/layers';
import { hidePopup, showPopup } from '../ducks/popup';
import {
  MAP_LOCATION_SELECTION_MODES,
  setReportHeatmapVisibility,
  updateHeatmapSubjects,
  updateTrackState
} from '../ducks/map-ui';
import { render, screen, waitFor } from '../test-utils';
import { setTrackLength } from '../ducks/tracks';
import { updatePatrolTrackState } from '../ducks/patrols';

import { createMapMock } from '../__test-helpers/mocks';
import { MapContext } from '../MapContext';
import MapDrawingToolsContextProvider from '../MapDrawingTools/ContextProvider';
import { mockedSocket } from '../__test-helpers/MockSocketContext';
import { mockStore } from '../__test-helpers/MockStore';
import { LAYER_IDS, PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../constants';

import Map from './';

const { TRACK_TIMEPOINTS } = LAYER_IDS;

jest.mock('mapbox-gl', () => ({
  ...jest.requireActual('mapbox-gl'),
  Map: class {
    on() {}
  },
}));

jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: jest.fn(),
}));

jest.mock('../ducks/events', () => ({
  ...jest.requireActual('../ducks/events'),
  clearEventData: jest.fn(),
  fetchMapEvents: jest.fn(),
}));

jest.mock('../ducks/subjects', () => ({
  ...jest.requireActual('../ducks/subjects'),
  clearSubjectData: jest.fn(),
  fetchMapSubjects: jest.fn(),
}));

jest.mock('../ducks/layers', () => ({
  ...jest.requireActual('../ducks/layers'),
  fetchBaseLayers: jest.fn(),
}));

jest.mock('../ducks/popup', () => ({
  ...jest.requireActual('../ducks/popup'),
  hidePopup: jest.fn(),
  showPopup: jest.fn(),
}));

jest.mock('../ducks/map-ui', () => ({
  ...jest.requireActual('../ducks/map-ui'),
  setReportHeatmapVisibility: jest.fn(),
  updateHeatmapSubjects: jest.fn(),
  updateTrackState: jest.fn(),
}));

jest.mock('../ducks/tracks', () => ({
  ...jest.requireActual('../ducks/tracks'),
  setTrackLength: jest.fn(),
}));

jest.mock('../ducks/patrols', () => ({
  ...jest.requireActual('../ducks/patrols'),
  updatePatrolTrackState: jest.fn(),
}));

describe('Map', () => {
  let clearEventDataMock,
    clearSubjectDataMock,
    fetchBaseLayersMock,
    fetchMapEventsMock,
    fetchMapSubjectsMock,
    hidePopupMock,
    setReportHeatmapVisibilityMock,
    setTrackLengthMock,
    showPopupMock,
    updateHeatmapSubjectsMock,
    updatePatrolTrackStateMock,
    updateTrackStateMock,
    map,
    store,
    useTranslationMock;
  beforeEach(() => {
    clearEventDataMock = jest.fn(() => () => {});
    clearEventData.mockImplementation(clearEventDataMock);
    clearSubjectDataMock = jest.fn(() => () => {});
    clearSubjectData.mockImplementation(clearSubjectDataMock);
    fetchMapEventsMock = jest.fn(() => () => Promise.resolve());
    fetchMapEvents.mockImplementation(fetchMapEventsMock);
    fetchMapSubjectsMock = jest.fn(() => () => Promise.resolve());
    fetchMapSubjects.mockImplementation(fetchMapSubjectsMock);
    fetchBaseLayersMock = jest.fn(() => () => {});
    fetchBaseLayers.mockImplementation(fetchBaseLayersMock);
    hidePopupMock = jest.fn(() => () => {});
    hidePopup.mockImplementation(hidePopupMock);
    setReportHeatmapVisibilityMock = jest.fn(() => () => {});
    setReportHeatmapVisibility.mockImplementation(setReportHeatmapVisibilityMock);
    setTrackLengthMock = jest.fn(() => () => {});
    setTrackLength.mockImplementation(setTrackLengthMock);
    showPopupMock = jest.fn(() => () => {});
    showPopup.mockImplementation(showPopupMock);
    updateHeatmapSubjectsMock = jest.fn(() => () => {});
    updateHeatmapSubjects.mockImplementation(updateHeatmapSubjectsMock);
    updatePatrolTrackStateMock = jest.fn(() => () => {});
    updatePatrolTrackState.mockImplementation(updatePatrolTrackStateMock);
    updateTrackStateMock = jest.fn(() => () => {});
    updateTrackState.mockImplementation(updateTrackStateMock);
    useTranslationMock = jest.fn(() => ({ i18n: { language: 'en-US' }, t: (key) => key }));
    useTranslation.mockImplementation(useTranslationMock);

    map = createMapMock();
    map.getStyle.mockImplementation(() => ({ layers: [] }));

    store = {
      data: {
        analyzerFeatures: { data: [] },
        baseLayers: [],
        eventFilter: { filter: { date_range: {}, event_type: [], text: '' } },
        eventTypes: [],
        eventSchemas: {},
        featureSets: { data: [] },
        feedEvents: {},
        mapEvents: { events: [] },
        mapLayerFilter: {},
        maps: [{
          center: [-103.5, 20.6],
          id: '87cb0294-4fe1-4a9e-8c04-dada5d1391be',
          name: 'GDL',
          zoom: 10,
        }],
        mapSubjects: { subjects: [] },
        patrolTypes: [],
        selectedUserProfile: {},
        user: {
          permissions: {
            [PERMISSION_KEYS.EVENTS]: [PERMISSIONS.READ],
          },
        },
      },
      view: {
        coordinateReferenceSystems: {
          storedSystems: [],
        },
        heatmapSubjectIDs: [],
        homeMap: { center: [] },
        mapClusterConfig: {},
        mapImages: {},
        patrolTrackState: { pinned: [], visible: [] },
        mapLocationSelection: {},
        modals: { modals: [] },
        showMapNames: {},
        simplifyMapDataOnZoom: {},
        subjectTrackState: { pinned: [], visible: [] },
        systemConfig: {
          [SYSTEM_CONFIG_FLAGS.ANALYZERS]: true,
          [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
          [SYSTEM_CONFIG_FLAGS.SUBJECTS]: true,
        },
        timeSliderState: {},
        trackSettings: {},
        userPreferences: {},
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderMap = (props, mockedStore) => render(<Provider store={mockedStore || mockStore(store)}>
    <MapDrawingToolsContextProvider>
      <MapContext.Provider value={map}>
        <Map map={map} socket={mockedSocket} {...props} />
      </MapContext.Provider>
    </MapDrawingToolsContextProvider>
  </Provider>);

  test('saving the map position on moveend', async () => {
    const mockedStore = mockStore(store);

    renderMap(undefined, mockedStore);

    // Move the map
    map.__test__.fireHandlers('moveend');

    const actions = mockedStore.getActions();
    await waitFor(() => {

      expect(actions).toEqual([
        {
          type: 'SET_MAP_POSITION',
          payload: {
            bearing: 0,
            center: map.getCenter(),
            pitch: 0,
            zoom: parseFloat(map.getZoom().toFixed(2)),
          }
        }
      ]);
    });

  });

  test('translates the map text layers when i18n language changes', async () => {
    map.getStyle.mockImplementation(() => ({
      layers: [{
        id: 'background',
        type: 'fill',
      }, {
        id: 'place-island',
        layout: {
          'text-field': [
            'to-string',
            ['coalesce', ['get', 'name_en'], ['get', 'name']],
          ],
        },
        type: 'symbol',
      }, {
        id: 'country-label-md',
        layout: {
          'text-field': [
            'step',
            ['zoom'],
            ['to-string', ['get', 'iso_3166_1']],
            2,
            ['to-string', ['get', 'name_en']],
          ],
        },
        type: 'symbol',
      }],
    }));

    const { rerender } = renderMap();

    expect(map.setLayoutProperty).toHaveBeenCalledTimes(2);
    expect(map.setLayoutProperty).toHaveBeenCalledWith('place-island', 'text-field', [
      'to-string',
      ['coalesce', ['get', 'name_en'], ['get', 'name']]
    ]);
    expect(map.setLayoutProperty).toHaveBeenCalledWith('country-label-md', 'text-field', [
      'step',
      ['zoom'],
      ['to-string', ['get', 'iso_3166_1']],
      2,
      ['to-string', ['get', 'name_en']],
    ]);

    useTranslationMock = jest.fn(() => ({ i18n: { language: 'es' }, t: (key) => key }));
    useTranslation.mockImplementation(useTranslationMock);

    rerender(<Provider store={mockStore(store)}>
      <MapDrawingToolsContextProvider>
        <MapContext.Provider value={map}>
          <Map map={map} socket={mockedSocket} />
        </MapContext.Provider>
      </MapDrawingToolsContextProvider>
    </Provider>);

    expect(map.setLayoutProperty).toHaveBeenCalledTimes(4);
    expect(map.setLayoutProperty).toHaveBeenCalledWith('place-island', 'text-field', [
      'to-string',
      ['coalesce', ['get', 'name_es'], ['get', 'name']]
    ]);
    expect(map.setLayoutProperty).toHaveBeenCalledWith('country-label-md', 'text-field', [
      'step',
      ['zoom'],
      ['to-string', ['get', 'iso_3166_1']],
      2,
      ['to-string', ['get', 'name_es']],
    ]);
  });

  test('does not show the EventFilter if user is picking a location on the map', async () => {
    store.view.mapLocationSelection.isPickingLocation = true;
    renderMap();

    expect((await screen.queryByTestId('eventFilter-form'))).toBeNull();
  });

  test('does not show the MapLocationSelectionOverview if user is drawing a geometry on the map', async () => {
    store.view.mapLocationSelection.mode = MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY;
    renderMap();

    expect((await screen.queryByTestId('mapLocationSelectionOverview-wrapper'))).toBeNull();
  });

  test('does not show the MapLocationSelectionOverview if user is picking location for a marker or using the ruler', async () => {
    store.view.mapLocationSelection = {
      isPickingLocation: true,
      mode: MAP_LOCATION_SELECTION_MODES.DEFAULT,
    };
    renderMap();

    expect((await screen.queryByTestId('mapLocationSelectionOverview-wrapper'))).toBeNull();
  });

  test('shows the MapLocationSelectionOverview if user is drawing a geometry', async () => {
    const mockEvent = {
      id: 'hello',
      geometry: null,
    };

    store.data.eventStore = {
      [mockEvent.id]: mockEvent
    };

    store.view.mapLocationSelection = {
      event: mockEvent,
      isPickingLocation: true,
      mode: MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY,
    };
    renderMap();

    await waitFor(() => {
      expect(screen.findByTestId('mapLocationSelectionOverview-wrapper')).toBeDefined();
    });
  });

  test('shows the MapLocationSelectionOverview if user is picking an event location', async () => {
    const mockEvent = {
      id: 'hello',
      geometry: null,
    };

    store.data.eventStore = {
      [mockEvent.id]: mockEvent
    };

    store.view.mapLocationSelection = {
      event: mockEvent,
      isPickingLocation: true,
      mode: MAP_LOCATION_SELECTION_MODES.DEFAULT,
    };
    renderMap();

    await waitFor(() => {
      expect(screen.findByTestId('mapLocationSelectionOverview-wrapper')).toBeDefined();
    });
  });

  describe('onMapClick', () => {
    test('does not hide popup when clicking on a timepoint', async () => {
      store.view.popup = {
        id: 'existing-popup-id',
        type: 'timepoint',
        data: {
          geometry: { coordinates: [0, 0] },
          properties: {},
        },
      };

      renderMap();

      // Mock queryRenderedFeatures to return a timepoint layer
      map.queryRenderedFeatures.mockImplementation((point, options) => {
        // For the timepoint check (no options or layers not specified)
        if (!options || !options.layers) {
          return [
            {
              layer: { id: `${TRACK_TIMEPOINTS}-123` },
              properties: { id: 'timepoint-1' },
            }
          ];
        }
        // For cluster check and queryMultiLayerClickFeatures
        return [];
      });

      await waitFor(() => {
        // Fire click event on map
        map.__test__.fireHandlers('click', {
          point: { x: 100, y: 100 },
          originalEvent: { stopPropagation: jest.fn() },
        });
      });

      expect(hidePopupMock).not.toHaveBeenCalled();
    });

    test('hides popup when clicking elsewhere (not on a timepoint)', async () => {
      store.view.popup = {
        id: 'existing-popup-id',
        type: 'timepoint',
        data: {
          geometry: { coordinates: [0, 0] },
          properties: {},
        },
      };

      renderMap();

      // Mock queryRenderedFeatures to return no timepoint layers
      // It's called multiple times: once for queryMultiLayerClickFeatures, once for cluster check, once for timepoint check
      map.queryRenderedFeatures.mockImplementation((point, options) => {
        if (!options || !options.layers) {
          return [
            {
              layer: { id: 'some-other-layer' },
              properties: { id: 'feature-1' },
            }
          ];
        }
        if (options?.layers?.includes('cluster-layer')) {
          return [];
        }
        // For queryMultiLayerClickFeatures
        return [];
      });

      await waitFor(() => {
        map.__test__.fireHandlers('click', {
          point: { x: 100, y: 100 },
          originalEvent: { stopPropagation: jest.fn() },
        });
      });

      expect(hidePopupMock).toHaveBeenCalledWith('existing-popup-id');
    });

    test('hides popup when clicking on empty map area', async () => {
      store.view.popup = {
        id: 'existing-popup-id',
        type: 'subject',
        data: {
          geometry: { coordinates: [0, 0] },
          properties: {},
        },
      };

      renderMap();

      // Mock queryRenderedFeatures to return no features
      map.queryRenderedFeatures.mockImplementation(() => []);

      await waitFor(() => {
        map.__test__.fireHandlers('click', {
          point: { x: 100, y: 100 },
          originalEvent: { stopPropagation: jest.fn() },
        });
      });

      // hidePopup SHOULD have been called
      expect(hidePopupMock).toHaveBeenCalledWith('existing-popup-id');
    });

    test('does not hide popup when no popup is open and clicking on a timepoint', async () => {
      store.view.popup = null;

      renderMap();

      map.queryRenderedFeatures.mockImplementation((point, options) => {
        if (!options || !options.layers) {
          return [
            {
              layer: { id: `${TRACK_TIMEPOINTS}-456` },
              properties: { id: 'timepoint-2' },
            }
          ];
        }
        return [];
      });

      await waitFor(() => {
        map.__test__.fireHandlers('click', {
          point: { x: 100, y: 100 },
          originalEvent: { stopPropagation: jest.fn() },
        });
      });

      expect(hidePopupMock).not.toHaveBeenCalled();
    });

    test('does not hide popup when clicking on a spatial feature symbol', async () => {
      store.view.popup = {
        id: 'existing-popup-id',
        type: 'feature-symbol',
        data: {
          geometry: { coordinates: [0, 0] },
          properties: { id: 'feature-1' },
        },
      };
      store.data.mapLayerFilter = { hiddenFeatureIDs: [] };

      renderMap();

      // Mock queryRenderedFeatures to return a spatial feature symbol
      map.queryRenderedFeatures.mockImplementation((point, options) => {
        // For the spatial feature check (no options or layers not specified)
        if (!options || !options.layers) {
          return [
            {
              layer: { id: 'spatial-features-symbols' },
              properties: { id: 'feature-1' },
            }
          ];
        }
        return [];
      });

      await waitFor(() => {
        map.__test__.fireHandlers('click', {
          point: { x: 100, y: 100 },
          originalEvent: { stopPropagation: jest.fn() },
        });
      });

      expect(hidePopupMock).not.toHaveBeenCalled();
    });

    test('does not hide popup when clicking on a spatial feature line', async () => {
      store.view.popup = {
        id: 'existing-popup-id',
        type: 'feature-symbol',
        data: {
          geometry: { coordinates: [[0, 0], [1, 1]] },
          properties: { id: 'feature-2' },
        },
      };
      store.data.mapLayerFilter = { hiddenFeatureIDs: [] };

      renderMap();

      // Mock queryRenderedFeatures to return a spatial feature line
      map.queryRenderedFeatures.mockImplementation((point, options) => {
        if (!options || !options.layers) {
          return [
            {
              layer: { id: 'spatial-features-lines' },
              properties: { id: 'feature-2' },
            }
          ];
        }
        return [];
      });

      await waitFor(() => {
        map.__test__.fireHandlers('click', {
          point: { x: 100, y: 100 },
          originalEvent: { stopPropagation: jest.fn() },
        });
      });

      expect(hidePopupMock).not.toHaveBeenCalled();
    });

    test('does not hide popup when clicking on a spatial feature polygon', async () => {
      store.view.popup = {
        id: 'existing-popup-id',
        type: 'feature-symbol',
        data: {
          geometry: { coordinates: [[[0, 0], [1, 1], [1, 0], [0, 0]]] },
          properties: { id: 'feature-3' },
        },
      };
      store.data.mapLayerFilter = { hiddenFeatureIDs: [] };

      renderMap();

      // Mock queryRenderedFeatures to return a spatial feature polygon
      map.queryRenderedFeatures.mockImplementation((point, options) => {
        if (!options || !options.layers) {
          return [
            {
              layer: { id: 'spatial-features-polygons' },
              properties: { id: 'feature-3' },
            }
          ];
        }
        return [];
      });

      await waitFor(() => {
        map.__test__.fireHandlers('click', {
          point: { x: 100, y: 100 },
          originalEvent: { stopPropagation: jest.fn() },
        });
      });

      expect(hidePopupMock).not.toHaveBeenCalled();
    });
  });
});
