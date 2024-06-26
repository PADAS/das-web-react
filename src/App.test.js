import React from 'react';
import { Provider } from 'react-redux';

import { rest } from 'msw';
import { setupServer } from 'msw/node';

import SocketProvider from './__test-helpers/MockSocketContext';
import { render } from './test-utils';

import { MAPS_API_URL } from './ducks/maps';
import { CURRENT_USER_API_URL, USER_PROFILES_API_URL } from './ducks/user';
import { STATUS_API_URL } from './ducks/system-status';
import { EVENT_TYPE_API_URL } from './ducks/event-types';
import { SUBJECT_GROUPS_API_URL } from './ducks/subjects';
import { FEATURESET_API_URL } from './ducks/features';
import { ANALYZERS_API_URL } from './ducks/analyzers';
import { PATROL_TYPES_API_URL } from './ducks/patrol-types';
import { EVENT_SCHEMA_API_URL } from './ducks/event-schemas';
import { NEWS_API_URL } from './ducks/news';
import { BASE_LAYER_API_URL } from './ducks/layers';

import { mockStore } from './__test-helpers/MockStore';

import * as toastUtils from './utils/toast';

import { ConnectedApp as App } from './App';

const generateEmptyResponse = () => ({ data: [] });

const server = setupServer(
  rest.get(MAPS_API_URL, (req, res, ctx) => {
    return res(ctx.json(generateEmptyResponse()));
  }),
  rest.get(NEWS_API_URL, (req, res, ctx) => {
    return res(ctx.json(generateEmptyResponse()));
  }),
  rest.get(CURRENT_USER_API_URL, (req, res, ctx) => {
    return res(ctx.json({ data: {} }));
  }),
  rest.get(USER_PROFILES_API_URL, (req, res, ctx) => {
    return res(ctx.json(generateEmptyResponse()));
  }),
  rest.get(STATUS_API_URL, (req, res, ctx) => {
    return res(ctx.json(generateEmptyResponse()));
  }),
  rest.get(BASE_LAYER_API_URL, (req, res, ctx) => {
    return res(ctx.json(generateEmptyResponse()));
  }),
  rest.get(EVENT_TYPE_API_URL, (req, res, ctx) => {
    return res(ctx.json(generateEmptyResponse()));
  }),
  rest.get(SUBJECT_GROUPS_API_URL, (req, res, ctx) => {
    return res(ctx.json(generateEmptyResponse()));
  }),
  rest.get(FEATURESET_API_URL, (req, res, ctx) => {
    return res(ctx.json(generateEmptyResponse()));
  }),
  rest.get(ANALYZERS_API_URL, (req, res, ctx) => {
    return res(ctx.json(generateEmptyResponse()));
  }),
  rest.get(PATROL_TYPES_API_URL, (req, res, ctx) => {
    return res(ctx.json(generateEmptyResponse()));
  }),
  rest.get(EVENT_SCHEMA_API_URL, (req, res, ctx) => {
    return res(ctx.json(generateEmptyResponse()));
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());


describe('The main app view', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      view: {
        drawer: {},
        featureFlagOverrides: {},
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
        userLocation: {
          coords: {
            longitude: 1,
            latitude: 2,
          },
        },
        mapLocationSelection: { isPickingLocation: false },
        timeSliderState: {
          active: false,
          virtualDate: null,
        },
      },
      data: {
        selectedUserProfile: {},
        eventFilter: {
          filter: {
            date_range: {
              lower: '',
            },
          },
        },
        mapLayerFilter: {},
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

    jest.spyOn(toastUtils, 'showToast');

    render(
      <Provider store={store}>
        <SocketProvider>
          <App />
        </SocketProvider>
      </Provider>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('showing a geo-permission toast for geo-perm-restricted users', () => {
    expect(toastUtils.showToast).toHaveBeenCalled();
  });
});
