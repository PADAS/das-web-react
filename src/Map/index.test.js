import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';

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
import { setTrackLength } from '../ducks/tracks';
import { updatePatrolTrackState } from '../ducks/patrols';

import { createMapMock } from '../__test-helpers/mocks';
import Map from './';
import { MapContext } from '../App';
import MapDrawingToolsContextProvider from '../MapDrawingTools/ContextProvider';
import { mockedSocket } from '../__test-helpers/MockSocketContext';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';

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
    renderMap,
    store;
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

    map = createMapMock();

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
        user: { permissions: [] },
      },
      view: {
        featureFlagOverrides: {},
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
        timeSliderState: {},
        trackLength: {},
        userPreferences: {},
      },
    };

    renderMap = (props, overrideStore) => {
      return render(<Provider store={mockStore(overrideStore || store)}>
        <NavigationWrapper>
          <MapDrawingToolsContextProvider>
            <MapContext.Provider value={map}>
              <Map map={map} socket={mockedSocket} {...props} />
            </MapContext.Provider>
          </MapDrawingToolsContextProvider>
        </NavigationWrapper>
      </Provider>);
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows the EventFilter', async () => {
    store.view.mapLocationSelection.isPickingLocation = false;

    renderMap();

    await waitFor(() => {
      expect((screen.findByTestId('eventFilter-form'))).toBeDefined();
    });
  });


  test('saving the map position on moveend', async () => {
    const mockStoreInstance = mockStore(store);

    render(<Provider store={mockStoreInstance}>
      <NavigationWrapper>
        <MapDrawingToolsContextProvider>
          <MapContext.Provider value={map}>
            <Map map={map} socket={mockedSocket} />
          </MapContext.Provider>
        </MapDrawingToolsContextProvider>
      </NavigationWrapper>
    </Provider>);

    // Move the map
    map.__test__.fireHandlers('moveend');

    const actions = mockStoreInstance.getActions();
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
});
