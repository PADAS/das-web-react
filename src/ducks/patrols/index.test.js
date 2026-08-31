import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { mockStore } from '../../__test-helpers/MockStore';
import { resetGlobalState } from '../../reducers/global-resettable';

import {
  ADD_PATROL_TO_FEED,
  CREATE_PATROL_REALTIME,
  CREATE_PATROL_SUCCESS,
  DELETE_PATROL_BY_ID,
  FETCH_PATROL_TEAM_AND_TRACKING_OPTIONS_SUCCESS,
  FETCH_PATROLS_FEED_SUCCESS,
  fetchPatrolsFeed,
  fetchPatrolTeamAndTrackingOptions,
  PATROL_LEADERS_API_URL,
  patrolsFeedReducer,
  patrolStoreReducer,
  patrolTeamAndTrackingOptionsReducer,
  PATROLS_API_URL,
  REMOVE_PATROL_FROM_FEED,
  socketCreatePatrol,
  socketDeletePatrol,
  socketUpdatePatrol,
  updatePatrol,
  UPDATE_PATROL_ERROR,
  UPDATE_PATROL_REALTIME,
  UPDATE_PATROL_STORE,
  UPDATE_PATROL_SUCCESS,
} from './';

const PATROL_A_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
const PATROL_B_ID = 'bbbbbbbb-0000-0000-0000-000000000002';

const makePatrol = (id, overrides = {}) => ({
  id,
  priority: 0,
  serial_number: 100,
  state: 'open',
  title: `Patrol ${id}`,
  patrol_segments: [],
  ...overrides,
});

const patrolA = makePatrol(PATROL_A_ID);
const patrolB = makePatrol(PATROL_B_ID);

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  jest.restoreAllMocks();
});
afterAll(() => server.close());

const dispatchAndGetActions = (action) => {
  const store = mockStore({ data: {}, view: {} });
  store.dispatch(action);

  return store.getActions();
};

describe('Ducks - Patrols', () => {
  describe('socketUpdatePatrol', () => {
    test('stores the new patrol data and puts it back in the feed when it matches again', () => {
      expect(dispatchAndGetActions(socketUpdatePatrol({ patrol_data: patrolA, matches_current_filter: true })))
        .toEqual([
          { type: UPDATE_PATROL_REALTIME, payload: patrolA },
          { type: ADD_PATROL_TO_FEED, payload: PATROL_A_ID },
        ]);
    });

    test('stores the new patrol data and takes it out of the feed when it stops matching', () => {
      expect(dispatchAndGetActions(socketUpdatePatrol({ patrol_data: patrolA, matches_current_filter: false })))
        .toEqual([
          { type: UPDATE_PATROL_REALTIME, payload: patrolA },
          { type: REMOVE_PATROL_FROM_FEED, payload: PATROL_A_ID },
        ]);
    });
  });

  describe('socketCreatePatrol', () => {
    test('adds the patrol to the feed when it matches the patrol filter', () => {
      expect(dispatchAndGetActions(socketCreatePatrol({ patrol_data: patrolA, matches_current_filter: true })))
        .toEqual([
          { type: CREATE_PATROL_REALTIME, payload: patrolA },
          { type: ADD_PATROL_TO_FEED, payload: PATROL_A_ID },
        ]);
    });

    test('stores the patrol but keeps it out of the feed when it does not match', () => {
      expect(dispatchAndGetActions(socketCreatePatrol({ patrol_data: patrolA, matches_current_filter: false })))
        .toEqual([
          { type: CREATE_PATROL_REALTIME, payload: patrolA },
          { type: REMOVE_PATROL_FROM_FEED, payload: PATROL_A_ID },
        ]);
    });
  });

  describe('socketDeletePatrol', () => {
    test('deletes the patrol when it matches the patrol filter', () => {
      expect(dispatchAndGetActions(socketDeletePatrol({ patrol_id: PATROL_A_ID, matches_current_filter: true })))
        .toEqual([{ type: DELETE_PATROL_BY_ID, payload: PATROL_A_ID }]);
    });

    test('deletes the patrol even when it does not match the patrol filter', () => {
      expect(dispatchAndGetActions(socketDeletePatrol({ patrol_id: PATROL_A_ID, matches_current_filter: false })))
        .toEqual([{ type: DELETE_PATROL_BY_ID, payload: PATROL_A_ID }]);
    });
  });

  describe('fetchPatrolsFeed', () => {
    const feedResponse = { count: 2, next: null, previous: null, results: [patrolA, patrolB] };

    const respondWithFeed = () => server.use(
      http.get(PATROLS_API_URL, () => HttpResponse.json({ data: feedResponse }))
    );

    test('fills the store before listing the feed, so every listed patrol can be read back', async () => {
      respondWithFeed();

      const store = mockStore({ data: {}, view: {} });
      await store.dispatch(fetchPatrolsFeed()).request;

      expect(store.getActions()).toEqual([
        { type: UPDATE_PATROL_STORE, payload: feedResponse },
        { payload: [PATROL_A_ID, PATROL_B_ID], type: FETCH_PATROLS_FEED_SUCCESS },
      ]);
    });

    test('does not report a cancelled request as a failure', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      respondWithFeed();

      const store = mockStore({ data: {}, view: {} });
      const { cancelToken, request } = store.dispatch(fetchPatrolsFeed());

      cancelToken.cancel();
      await request;

      expect(store.getActions()).toEqual([]);
      expect(warn).not.toHaveBeenCalled();
    });

    test('reports a failed request without leaving the feed in a broken state', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      server.use(http.get(PATROLS_API_URL, () => new HttpResponse(null, { status: 500 })));

      const store = mockStore({ data: {}, view: {} });
      await store.dispatch(fetchPatrolsFeed()).request;

      expect(store.getActions()).toEqual([]);
      expect(warn).toHaveBeenCalled();
    });
  });

  describe('fetchPatrolTeamAndTrackingOptions', () => {
    const leaders = [{ id: PATROL_A_ID, name: 'Alex' }, { id: PATROL_B_ID, name: 'Priya' }];

    const respondWithLeadersSchema = (properties) => server.use(
      http.get(PATROL_LEADERS_API_URL, () => HttpResponse.json({ data: { properties } }))
    );

    test('unwraps the leaders out of the schema the endpoint answers with', async () => {
      respondWithLeadersSchema({ leader: { enum_ext: leaders.map((value) => ({ value })) } });

      const store = mockStore({ data: {}, view: {} });
      const options = await store.dispatch(fetchPatrolTeamAndTrackingOptions());

      expect(options.leaders).toEqual(leaders);
      expect(store.getActions())
        .toEqual([{ payload: options, type: FETCH_PATROL_TEAM_AND_TRACKING_OPTIONS_SUCCESS }]);
    });

    test('reports no leaders when the schema does not describe any', async () => {
      respondWithLeadersSchema({});

      const store = mockStore({ data: {}, view: {} });

      expect((await store.dispatch(fetchPatrolTeamAndTrackingOptions())).leaders).toEqual([]);
    });

    // The endpoints behind these are not deployed yet, so the creator answers with its own mocks.
    test.each(['assets', 'teamMembers', 'teams'])('stores the named %s a leg can pick from', async (key) => {
      respondWithLeadersSchema({});

      const store = mockStore({ data: {}, view: {} });
      const options = await store.dispatch(fetchPatrolTeamAndTrackingOptions());

      expect(options[key].length).toBeGreaterThan(0);
      options[key].forEach((option) => {
        expect(option).toEqual({ id: expect.any(String), name: expect.any(String) });
      });
    });
  });

  describe('updatePatrol', () => {
    test('stores the patrol the server returns and hands the response back', async () => {
      const updatedPatrol = { ...patrolA, state: 'done' };
      server.use(http.patch(`${PATROLS_API_URL}${PATROL_A_ID}`, () => HttpResponse.json({ data: updatedPatrol })));

      const store = mockStore({ data: {}, view: {} });
      const response = await store.dispatch(updatePatrol({ id: PATROL_A_ID, state: 'done' }));

      expect(store.getActions()).toEqual([{ payload: updatedPatrol, type: UPDATE_PATROL_SUCCESS }]);
      expect(response.data.data).toEqual(updatedPatrol);
    });

    test('reports the error and rejects when the update fails', async () => {
      server.use(http.patch(`${PATROLS_API_URL}${PATROL_A_ID}`, () => new HttpResponse(null, { status: 500 })));

      const store = mockStore({ data: {}, view: {} });

      await expect(store.dispatch(updatePatrol({ id: PATROL_A_ID }))).rejects.toBeDefined();
      expect(store.getActions()).toEqual([expect.objectContaining({ type: UPDATE_PATROL_ERROR })]);
    });
  });

  describe('patrolStoreReducer', () => {
    const loadedStore = { [PATROL_A_ID]: patrolA, [PATROL_B_ID]: patrolB };

    test('merges a realtime update into the stored patrol', () => {
      const state = patrolStoreReducer(loadedStore, {
        type: UPDATE_PATROL_REALTIME,
        payload: { id: PATROL_A_ID, state: 'done' },
      });

      expect(state[PATROL_A_ID]).toEqual({ ...patrolA, state: 'done' });
      expect(state[PATROL_B_ID]).toBe(patrolB);
    });

    test('merges each patrol of a fetched feed page in, leaving the patrols it left out alone', () => {
      const state = patrolStoreReducer(loadedStore, {
        type: UPDATE_PATROL_STORE,
        payload: { results: [{ ...patrolA, title: 'Renamed' }] },
      });

      expect(state[PATROL_A_ID]).toEqual({ ...patrolA, title: 'Renamed' });
      expect(state[PATROL_B_ID]).toBe(patrolB);
    });

    test('replaces the collections of a stored patrol instead of merging them item by item', () => {
      const storedPatrol = makePatrol(PATROL_A_ID, { patrol_segments: [{ id: 'leg-1' }, { id: 'leg-2' }] });

      const state = patrolStoreReducer({ [PATROL_A_ID]: storedPatrol }, {
        type: UPDATE_PATROL_STORE,
        payload: { results: [makePatrol(PATROL_A_ID, { patrol_segments: [{ id: 'leg-1' }] })] },
      });

      expect(state[PATROL_A_ID].patrol_segments).toEqual([{ id: 'leg-1' }]);
    });

    test('stores a patrol created through the API', () => {
      const state = patrolStoreReducer({}, { payload: patrolA, type: CREATE_PATROL_SUCCESS });

      expect(state[PATROL_A_ID]).toEqual(patrolA);
    });

    test('keeps the patrol data when it only leaves the feed, so open views can still show it', () => {
      const state = patrolStoreReducer(loadedStore, {
        type: REMOVE_PATROL_FROM_FEED,
        payload: PATROL_A_ID,
      });

      expect(state[PATROL_A_ID]).toBe(patrolA);
    });

    test('drops the patrol data when the patrol is deleted', () => {
      const state = patrolStoreReducer(loadedStore, {
        type: DELETE_PATROL_BY_ID,
        payload: PATROL_A_ID,
      });

      expect(state).not.toHaveProperty(PATROL_A_ID);
      expect(state[PATROL_B_ID]).toBe(patrolB);
    });

    test('empties the store on a global reset', () => {
      expect(patrolStoreReducer(loadedStore, resetGlobalState())).toEqual({});
    });
  });

  describe('patrolsFeedReducer', () => {
    const loadedFeed = [PATROL_A_ID, PATROL_B_ID];

    test('takes the patrol out of the feed when it stops matching the filter', () => {
      expect(patrolsFeedReducer(loadedFeed, { type: REMOVE_PATROL_FROM_FEED, payload: PATROL_A_ID }))
        .toEqual([PATROL_B_ID]);
    });

    test('takes the patrol out of the feed when it is deleted', () => {
      expect(patrolsFeedReducer(loadedFeed, { type: DELETE_PATROL_BY_ID, payload: PATROL_A_ID }))
        .toEqual([PATROL_B_ID]);
    });

    test('adds a patrol that matches the filter to the top of the feed, only once', () => {
      const state = patrolsFeedReducer([PATROL_B_ID], { type: ADD_PATROL_TO_FEED, payload: PATROL_A_ID });

      expect(state).toEqual([PATROL_A_ID, PATROL_B_ID]);
      expect(patrolsFeedReducer(state, { type: ADD_PATROL_TO_FEED, payload: PATROL_A_ID })).toBe(state);
    });

    test('holds on to the feed it has when a patrol it never listed leaves or is deleted', () => {
      expect(patrolsFeedReducer(loadedFeed, { type: REMOVE_PATROL_FROM_FEED, payload: 'unlisted' }))
        .toBe(loadedFeed);
      expect(patrolsFeedReducer(loadedFeed, { type: DELETE_PATROL_BY_ID, payload: 'unlisted' }))
        .toBe(loadedFeed);
    });

    test('empties the feed on a global reset', () => {
      expect(patrolsFeedReducer(loadedFeed, resetGlobalState())).toEqual([]);
    });
  });

  describe('patrolTeamAndTrackingOptionsReducer', () => {
    const loadedOptions = {
      assets: [{ id: 'asset-1', name: 'Radio 7' }],
      leaders: [{ id: 'leader-1', name: 'Alex' }],
      teamMembers: [{ id: 'member-1', name: 'Maya Chen' }],
      teams: [{ id: 'team-1', name: 'Alpha' }],
    };

    test('replaces the options it has with the ones the site serves', () => {
      const newOptions = { assets: [], leaders: [{ id: 'leader-2', name: 'Priya' }], teamMembers: [], teams: [] };

      expect(patrolTeamAndTrackingOptionsReducer(
        loadedOptions,
        { payload: newOptions, type: FETCH_PATROL_TEAM_AND_TRACKING_OPTIONS_SUCCESS }
      )).toEqual(newOptions);
    });

    test('empties the options on a global reset', () => {
      expect(patrolTeamAndTrackingOptionsReducer(loadedOptions, resetGlobalState()))
        .toEqual({ assets: [], leaders: [], teamMembers: [], teams: [] });
    });
  });
});
