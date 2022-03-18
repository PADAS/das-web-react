import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import SocketProvider from './__test-helpers/MockSocketContext';

import * as mapDuckExports from './ducks/maps';
import * as systemStatusDuckExports from './ducks/system-status';
import * as eventTypeDuckExports from './ducks/event-types';
import * as subjectDuckExports from './ducks/subjects';
import * as featuresetDuckExports from './ducks/features';
import * as analyzerDuckExports from './ducks/analyzers';
import * as patrolTypeDuckExports from './ducks/patrol-types';
import * as eventSchemaDuckExports from './ducks/event-schemas';
import { mockStore } from './__test-helpers/MockStore';
import * as socketExports from './socket';
import { mockedSocket } from './__test-helpers/MockSocketContext';

import * as toastUtils from './utils/toast';

import { ConnectedApp as App } from './App';

jest.mock('./utils/zendesk', () => {
  const real = jest.requireActual('./utils/zendesk');
  return {
    ...real,
    initZenDesk: jest.fn(),
  };
});


describe('The main app view', () => {
  let store;

  let mapFetchSpy, systemStatusFetchSpy, eventTypeFetchSpy, subjectGroupFetchSpy, featureSetFetchSpy, analyzerFetchSpy, patrolTypeFetchSpy, eventSchemaFetchSpy;

  beforeEach(() => {
    store = mockStore({
      view: {
        drawer: {},
        modals: {
          canShowModals: true,
          modals: [],
        },
        subjectTrackState: {
          visible: [],
          pinned: [],
        },
        patrolTrackState: {
          visible: [],
          pinned: [],
        },
        heatmapSubjectIDs: [],
        trackLength: 12,
        geoPermMessageTimestamps: {
          lastSeenSplashWarning: null,
        },
        userPreferences: {
          sidebarOpen: true,
        },
        userLocation: {
          coords: {
            longitude: 1,
            latitude: 2,
          },
        },
        pickingLocationOnMap: false,
        timeSliderState: {
          active: false,
          virtualDate: null,
        },
      },
      data: {
        selectedUserProfile: {},
        maps: [],
        user: {
          name: 'joshua',
          id: 12345,
          permissions: {
            view_security_events_geographic_distance: true,
          },
        },
        analyzerFeatures: {
          data: [],
        },
        systemStatus: {},
        featureSets: {
          data: [],
        },
        mapSubjects: {
          subjects: [],
        },
      } } );

    systemStatusFetchSpy = jest.spyOn(systemStatusDuckExports, 'fetchSystemStatus').mockImplementation(() => Promise.resolve({ data: { data: { patrol_enabled: true, track_length: 14 } } } ));
    eventTypeFetchSpy = jest.spyOn(eventTypeDuckExports, 'fetchEventTypes').mockReturnValue(Promise.resolve({ data: [] }));
    subjectGroupFetchSpy = jest.spyOn(subjectDuckExports, 'fetchSubjectGroups').mockReturnValue(Promise.resolve({ data: [] }));
    featureSetFetchSpy = jest.spyOn(featuresetDuckExports, 'fetchFeaturesets').mockReturnValue(Promise.resolve({ data: [] }));
    analyzerFetchSpy = jest.spyOn(analyzerDuckExports, 'fetchAnalyzers').mockReturnValue(Promise.resolve({ data: [] }));
    patrolTypeFetchSpy = jest.spyOn(patrolTypeDuckExports, 'fetchPatrolTypes').mockReturnValue(Promise.resolve({ data: [] }));
    eventSchemaFetchSpy = jest.spyOn(eventSchemaDuckExports, 'fetchEventSchema').mockReturnValue(Promise.resolve({ data: [] }));
    mapFetchSpy = jest.spyOn(mapDuckExports, 'fetchMaps').mockImplementation(() => {
      console.log('map fetch spy is totally being  called');
      return Promise.resolve({ data: [] });
    });

    jest.spyOn(socketExports, 'default').mockReturnValue(mockedSocket);

  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('rendering without crashing', () => {
    render(
      <BrowserRouter>
        <Provider store={store}>
          <SocketProvider>
            <App />
          </SocketProvider>
        </Provider>
      </BrowserRouter>);
  });

  test('showing a geo-permission toast for geo-perm-restricted users', () => {
    jest.spyOn(toastUtils, 'showToast');

    render(
      <BrowserRouter>
        <Provider store={store}>
          <SocketProvider>
            <App />
          </SocketProvider>
        </Provider>
      </BrowserRouter>);

    expect(toastUtils.showToast).toHaveBeenCalled();
  });
  test('existing', () => {
    expect(true).toBeTruthy();
  });
});
