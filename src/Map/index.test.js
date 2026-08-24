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
import { act, render, screen, waitFor } from '../test-utils';
import { fetchTracksIfNecessary } from '../utils/tracks';
import { setTrackLength } from '../ducks/tracks';
import { updatePatrolTrackState } from '../ducks/patrols';

import { createMapMock } from '../__test-helpers/mocks';
import { MapContext } from '../MapContext';
import MapDrawingToolsContextProvider from '../MapDrawingTools/ContextProvider';
import { mockedSocket } from '../__test-helpers/MockSocketContext';
import { mockStore } from '../__test-helpers/MockStore';
import { INITIAL_GEAR_STATE } from '../ducks/gear';
import { LAYER_IDS, PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../constants';

import Map, { MAP_DATA_FETCH_DEBOUNCE_MS, TIME_SLIDER_HISTORY_MAP_DATA_FETCH_DEBOUNCE_MS } from './';

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

jest.mock('../EventsTileLayers', () => () => null);

jest.mock('../TileEventFeaturesProvider', () => ({ children }) => children);

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

jest.mock('../utils/tracks', () => ({
  ...jest.requireActual('../utils/tracks'),
  fetchTracksIfNecessary: jest.fn(),
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
    fetchTracksIfNecessary.mockReset();

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
        gear: { ...INITIAL_GEAR_STATE },
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

  describe('map events fetch gating (vector tiles flag)', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => {
      act(() => jest.runOnlyPendingTimers());
      jest.useRealTimers();
    });

    test('fetches map events on the legacy path', () => {
      renderMap(undefined, mockStore(store));

      act(() => {
        map.__test__.fireHandlers('moveend');
        jest.runOnlyPendingTimers();
      });

      expect(fetchMapEventsMock).toHaveBeenCalled();
    });

    test('does not fetch map events when the flag is ON, but still fetches subjects', () => {
      const flagStore = {
        ...store,
        view: {
          ...store.view,
          systemConfig: { ...store.view.systemConfig, previewFeatures: { events_vector_tiles: true } },
        },
      };

      renderMap(undefined, mockStore(flagStore));

      act(() => {
        map.__test__.fireHandlers('moveend');
        jest.runOnlyPendingTimers();
      });

      expect(fetchMapSubjectsMock).toHaveBeenCalled();
      expect(fetchMapEventsMock).not.toHaveBeenCalled();
    });
  });

  describe('time slider data fetching', () => {
    const EVENT_FILTER_LOWER = '2026-08-01T00:00:00.000Z';
    const SCRUBBED = { active: true, hasScrubbedIntoPast: true, virtualDate: '2026-08-10T00:00:00.000Z' };
    const AT_RANGE_END = { active: true, hasScrubbedIntoPast: false, virtualDate: null };

    const makeSubject = (id, overrides) => ({
      id,
      last_position_date: '2026-08-20T00:00:00.000Z',
      subject_subtype: 'ranger',
      subject_type: 'person',
      tracks_available: true,
      ...overrides,
    });

    let timeSliderStore;

    beforeEach(() => {
      jest.useFakeTimers();

      const data = {
        ...store.data,
        eventFilter: {
          filter: { date_range: { lower: EVENT_FILTER_LOWER, upper: null }, event_type: [], text: '' },
        },
      };

      /* redux-mock-store never reduces, so the state is swapped behind a getState function and a
         no-op dispatch is used to make react-redux re-read it. Keeping one store instance keeps
         the dispatch identity — and therefore the fetch callbacks — stable across updates. */
      let state = { data, view: { ...store.view, timeSliderState: AT_RANGE_END } };

      timeSliderStore = mockStore(() => state);
      timeSliderStore.setTimeSliderState = (timeSliderState) => {
        state = { data, view: { ...store.view, timeSliderState } };

        // Two acts: the re-render and its effect must flush before the debounce timer is run.
        act(() => {
          timeSliderStore.dispatch({ type: 'TEST_STORE_NOTIFY' });
        });

        act(() => jest.runOnlyPendingTimers());
      };
    });

    afterEach(() => {
      act(() => jest.runOnlyPendingTimers());
      jest.useRealTimers();
    });

    const renderTimeSliderMap = () => {
      const rendered = renderMap(undefined, timeSliderStore);

      act(() => jest.runOnlyPendingTimers());

      return rendered;
    };

    test('refetches the map data when the slider is first scrubbed into the past', () => {
      renderTimeSliderMap();

      expect(fetchMapSubjectsMock).toHaveBeenCalledTimes(1);

      timeSliderStore.setTimeSliderState(SCRUBBED);

      expect(fetchMapSubjectsMock).toHaveBeenCalledTimes(2);
    });

    test('does not refetch the map data while the virtual date keeps moving', () => {
      renderTimeSliderMap();

      timeSliderStore.setTimeSliderState(SCRUBBED);
      timeSliderStore.setTimeSliderState({ ...SCRUBBED, virtualDate: '2026-08-12T00:00:00.000Z' });

      expect(fetchMapSubjectsMock).toHaveBeenCalledTimes(2);
    });

    test('does not refetch the map data when the handle returns to the end of the range', () => {
      renderTimeSliderMap();

      timeSliderStore.setTimeSliderState(SCRUBBED);

      // Playback ends by clearing the virtual date, but history stays requested.
      timeSliderStore.setTimeSliderState({ ...SCRUBBED, virtualDate: null });

      expect(fetchMapSubjectsMock).toHaveBeenCalledTimes(2);
    });

    test('refetches the map data once when the time slider is closed while scrubbed into the past', () => {
      renderTimeSliderMap();

      timeSliderStore.setTimeSliderState(SCRUBBED);

      // Closing the slider resets both fetch triggers at once.
      timeSliderStore.setTimeSliderState({ active: false, hasScrubbedIntoPast: false, virtualDate: null });

      expect(fetchMapSubjectsMock).toHaveBeenCalledTimes(3);
    });

    test('coalesces map moves for longer once the slider has been scrubbed into the past', () => {
      renderTimeSliderMap();

      timeSliderStore.setTimeSliderState(SCRUBBED);
      fetchMapSubjectsMock.mockClear();

      act(() => {
        map.__test__.fireHandlers('moveend');
        jest.advanceTimersByTime(MAP_DATA_FETCH_DEBOUNCE_MS);
      });

      expect(fetchMapSubjectsMock).not.toHaveBeenCalled();

      act(() => jest.advanceTimersByTime(TIME_SLIDER_HISTORY_MAP_DATA_FETCH_DEBOUNCE_MS));

      expect(fetchMapSubjectsMock).toHaveBeenCalledTimes(1);
    });

    test('keeps map moves responsive while the slider sits at the end of its range', () => {
      renderTimeSliderMap();

      fetchMapSubjectsMock.mockClear();

      act(() => {
        map.__test__.fireHandlers('moveend');
        jest.advanceTimersByTime(MAP_DATA_FETCH_DEBOUNCE_MS);
      });

      expect(fetchMapSubjectsMock).toHaveBeenCalledTimes(1);
    });

    test('does not fire a stale fetch when a map move is followed by the first scrub', () => {
      renderTimeSliderMap();

      fetchMapSubjectsMock.mockClear();

      // The move is still inside the short debounce window when the scrub lengthens it.
      act(() => {
        map.__test__.fireHandlers('moveend');
        jest.advanceTimersByTime(MAP_DATA_FETCH_DEBOUNCE_MS / 5);
      });

      timeSliderStore.setTimeSliderState(SCRUBBED);

      act(() => jest.advanceTimersByTime(TIME_SLIDER_HISTORY_MAP_DATA_FETCH_DEBOUNCE_MS));

      expect(fetchMapSubjectsMock).toHaveBeenCalledTimes(1);
    });

    test('only requests tracks for subjects that can show one', async () => {
      const trackableSubject = makeSubject('trackable');
      fetchMapSubjectsMock.mockImplementation(() => () => Promise.resolve([
        trackableSubject,
        makeSubject('no-track-data', { tracks_available: false }),
        makeSubject('fixed-position-radio', { subject_subtype: 'stationary-radio' }),
        makeSubject('reported-before-the-filter', { last_position_date: '2026-07-01T00:00:00.000Z' }),
      ]));

      renderTimeSliderMap();

      await waitFor(() => expect(fetchTracksIfNecessary).toHaveBeenCalledWith([trackableSubject.id]));
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
