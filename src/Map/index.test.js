import React from 'react';
import { MapContext as MapboxMapContext } from 'react-mapbox-gl';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';

import { clearEventData, fetchMapEvents } from '../ducks/events';
import { clearSubjectData, fetchMapSubjects } from '../ducks/subjects';
import { fetchBaseLayers } from '../ducks/layers';
import { hidePopup, showPopup } from '../ducks/popup';
import { setReportHeatmapVisibility, updateHeatmapSubjects, updateTrackState } from '../ducks/map-ui';
import { setTrackLength } from '../ducks/tracks';
import { updatePatrolTrackState } from '../ducks/patrols';

import { createMapMock } from '../__test-helpers/mocks';
import Map from './';
import { MapContext } from '../App';
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

jest.mock('react-mapbox-gl', () => ({
  ...jest.requireActual('react-mapbox-gl'),
  __esModule: true,
  default: () => ({ children }) => <div>{children}</div>, /* eslint-disable-line react/display-name */
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
        heatmapSubjectIDs: [],
        homeMap: { center: [] },
        mapClusterConfig: {},
        mapImages: {},
        patrolTrackState: { pinned: [], visible: [] },
        mapLocationSelection: {},
        showMapNames: {},
        simplifyMapDataOnZoom: {},
        subjectTrackState: { pinned: [], visible: [] },
        timeSliderState: {},
        trackLength: {},
        userPreferences: {},
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows the EventFilter', async () => {
    render(<Provider store={mockStore(store)}>
      <NavigationWrapper>
        <MapboxMapContext.Provider value={map}>
          <MapContext.Provider value={map}>
            <Map map={map} socket={mockedSocket} />
          </MapContext.Provider>
        </MapboxMapContext.Provider>
      </NavigationWrapper>
    </Provider>);

    expect((await screen.findByTestId('eventFilter-form'))).toBeDefined();
  });

  test('does not show the EventFilter if user is picking a location on the map', async () => {
    store.view.mapLocationSelection.isPickingPoint = true;
    render(<Provider store={mockStore(store)}>
      <NavigationWrapper>
        <MapboxMapContext.Provider value={map}>
          <MapContext.Provider value={map}>
            <Map map={map} socket={mockedSocket} />
          </MapContext.Provider>
        </MapboxMapContext.Provider>
      </NavigationWrapper>
    </Provider>);

    expect((await screen.queryByTestId('eventFilter-form'))).toBeNull();
  });

  test('does not show the EventFilter if user is picking an area on the map', async () => {
    store.view.mapLocationSelection = { event: {}, isPickingArea: true };
    render(<Provider store={mockStore(store)}>
      <NavigationWrapper>
        <MapboxMapContext.Provider value={map}>
          <MapContext.Provider value={map}>
            <Map map={map} socket={mockedSocket} />
          </MapContext.Provider>
        </MapboxMapContext.Provider>
      </NavigationWrapper>
    </Provider>);

    expect((await screen.queryByTestId('eventFilter-form'))).toBeNull();
  });

  test('does not show the ReportAreaOverview if user is picking an area on the map', async () => {
    render(<Provider store={mockStore(store)}>
      <NavigationWrapper>
        <MapboxMapContext.Provider value={map}>
          <MapContext.Provider value={map}>
            <Map map={map} socket={mockedSocket} />
          </MapContext.Provider>
        </MapboxMapContext.Provider>
      </NavigationWrapper>
    </Provider>);

    expect((await screen.queryByTestId('reportAreaOverview-wrapper'))).toBeNull();
  });

  test('shows the ReportAreaOverview', async () => {
    store.view.mapLocationSelection = { event: {}, isPickingArea: true };
    render(<Provider store={mockStore(store)}>
      <NavigationWrapper>
        <MapboxMapContext.Provider value={map}>
          <MapContext.Provider value={map}>
            <Map map={map} socket={mockedSocket} />
          </MapContext.Provider>
        </MapboxMapContext.Provider>
      </NavigationWrapper>
    </Provider>);

    expect((await screen.findByTestId('reportAreaOverview-wrapper'))).toBeDefined();
  });
});
