import { act, renderHook } from '@testing-library/react';
import axios from 'axios';
import { applyMiddleware, combineReducers, legacy_createStore as createStore } from 'redux';
import { thunk } from 'redux-thunk';

import eventFilterReducer, { INITIAL_FILTER_STATE as INITIAL_EVENT_FILTER_STATE } from '../../ducks/event-filter';
import mapLayerFilterReducer, {
  setMapLayersFilterTextFromAtlas,
  showSubjectsFromAtlas,
} from '../../ducks/map-layer-filter';
import patrolFilterReducer, { INITIAL_FILTER_STATE as INITIAL_PATROL_FILTER_STATE } from '../../ducks/patrol-filter';
import popupReducer from '../../ducks/popup';
import timeSliderReducer, { clearVirtualDate, setVirtualDate } from '../../ducks/timeslider';
import tracksReducer, { FETCH_TRACKS_SUCCESS, TRACKS_API_URL, trackSettingsReducer } from '../../ducks/tracks';
import {
  bounceEventReducer,
  heatmapSubjectIDsReducer,
  openMapFeatureTypesReducer,
  reportHeatmapStateReducer,
  subjectTrackReducer,
} from '../../ducks/map-ui';
import { fetchEvent } from '../../ducks/events';
import {
  fetchPatrol,
  patrolStoreReducer,
  patrolTracksReducer,
  UPDATE_PATROL_SUCCESS,
  UPDATE_PATROL_TRACK_STATE,
} from '../../ducks/patrols';
import { fetchTracksIfNecessary } from '../../utils/tracks';
import { getBoundsForPatrol, patrolStateAllowsTrackDisplay } from '../../utils/patrols';
import { mapFeatureHighlightIdReducer } from '../../ducks/mapFeatureHighlight';
import { PREVIEW_FEATURES, SYSTEM_CONFIG_FLAGS } from '../../constants';
import { ATLAS_TOOL_NAMES } from '../../utils/atlas-tools/validate';
import { MemoryRouter, useLocation } from 'react-router';
import { selectPatrolTrackData } from '../../selectors/patrols';
import useAtlasCameraHistory from '../useAtlasCameraHistory';

import { MapContext } from '../../MapContext';

import { runAtlasAppAction } from './';

jest.mock('../../ducks/events', () => ({ fetchEvent: jest.fn() }));

jest.mock('../../ducks/patrols', () => ({ ...jest.requireActual('../../ducks/patrols'), fetchPatrol: jest.fn() }));

jest.mock('../../selectors/patrols', () => ({ selectPatrolTrackData: jest.fn() }));

jest.mock('../../selectors/subjects', () => ({
  selectHydratedSubjectGroupsWithLastPositionTime: (state) => state.data.subjectGroups,
}));

jest.mock('../../utils/patrols', () => ({
  ...jest.requireActual('../../utils/patrols'),
  getBoundsForPatrol: jest.fn(),
  patrolStateAllowsTrackDisplay: jest.fn(),
}));

// fetchTracksIfNecessary reads and writes the app's global store, here the test's.
let mockAppStore;
jest.mock('../../store', () => ({
  __esModule: true,
  default: {
    dispatch: (action) => mockAppStore.dispatch(action),
    getState: () => mockAppStore.getState(),
  },
}));

const SUBJECT_ID = '6f1c2d3e-4b5a-4c7d-8e9f-0a1b2c3d4e5f';
const OTHER_SUBJECT_ID = '0a1b2c3d-4e5f-4a7b-8c9d-0e1f2a3b4c5d';
const THIRD_SUBJECT_ID = '11111111-2222-4333-8444-555555555555';
const EVENT_ID = '22222222-3333-4444-8555-666666666666';
const PATROL_ID = '33333333-4444-4555-8666-777777777777';
const FEATURE_ID = '44444444-5555-4666-8777-888888888888';
const ANALYZER_ID = '55555555-6666-4777-8888-999999999999';
const TYPE_ID = '66666666-7777-4888-8999-aaaaaaaaaaaa';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const iso = (time) => new Date(time).toISOString();

const done = (text) => ({ _meta: { status: 'applied' }, content: [{ text, type: 'text' }], isError: false });
const failed = (text, status = 'refused') => ({ _meta: { status }, content: [{ text, type: 'text' }], isError: true });

const identity = (initialState) => (state = initialState) => state;

const subject = {
  id: SUBJECT_ID,
  last_position: {
    geometry: { coordinates: [36.8, -1.3], type: 'Point' },
    properties: { title: 'Kito' },
    type: 'Feature',
  },
  name: 'Kito',
  tracks_available: true,
};

// A track the way the API stores it: the most recent position first.
const makeTrack = (positions) => ({
  track: {
    features: [{
      geometry: { coordinates: positions.map(([coordinates]) => coordinates), type: 'LineString' },
      properties: { coordinateProperties: { times: positions.map(([, time]) => iso(time)) } },
      type: 'Feature',
    }],
    type: 'FeatureCollection',
  },
});

// A track already in the store, fetched for the window given.
const makeStoredTrack = (positions, fetchedDateRange) => ({ ...makeTrack(positions), fetchedDateRange, points: {} });

// The track API, which answers each subject's tracks request with its track.
let mockTracksById = {};
const mockTrackApi = () => jest.spyOn(axios, 'get').mockImplementation((url) => {
  const id = Object.keys(mockTracksById).find((subjectId) => url === TRACKS_API_URL(subjectId));

  return id
    ? Promise.resolve({ data: { data: structuredClone(mockTracksById[id].track) } })
    : Promise.reject(new Error(`Unexpected request to ${url}`));
});

const countTrackRequests = () => axios.get.mock.calls.filter(([url]) => url.includes('/tracks/')).length;

const buildStore = ({ data = {}, view = {} } = {}) => {
  const actions = [];
  const recordActions = () => (next) => (action) => {
    if (typeof action === 'object') actions.push(action);

    return next(action);
  };

  const reducer = combineReducers({
    data: combineReducers({
      analyzerFeatures: identity({ data: [] }),
      eventFilter: eventFilterReducer,
      eventStore: identity({}),
      featureSets: identity({ data: [] }),
      mapLayerFilter: mapLayerFilterReducer,
      patrolFilter: patrolFilterReducer,
      patrolStore: patrolStoreReducer,
      subjectGroups: identity([]),
      subjectStore: identity({}),
      tracks: tracksReducer,
      user: identity({ id: 'user-1' }),
    }),
    view: combineReducers({
      bounceEventIDs: bounceEventReducer,
      heatmapSubjectIDs: heatmapSubjectIDsReducer,
      mapFeatureHighlightIDs: mapFeatureHighlightIdReducer,
      openMapFeatureTypeNames: openMapFeatureTypesReducer,
      patrolTrackState: patrolTracksReducer,
      popup: popupReducer,
      showInactiveRadios: identity(true),
      showMapNames: identity({}),
      showReportHeatmap: reportHeatmapStateReducer,
      subjectTrackState: subjectTrackReducer,
      systemConfig: identity({
        [SYSTEM_CONFIG_FLAGS.ANALYZERS]: true,
        [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
        [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
        [SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]: true,
        [SYSTEM_CONFIG_FLAGS.SUBJECTS]: true,
      }),
      timeSliderState: timeSliderReducer,
      trackSettings: trackSettingsReducer,
      userPreferences: identity({}),
    }),
  });

  const initialState = reducer(undefined, { type: '@@INIT' });
  const store = createStore(
    reducer,
    {
      data: { ...initialState.data, ...data },
      view: { ...initialState.view, ...view },
    },
    applyMiddleware(recordActions, thunk)
  );
  mockAppStore = store;

  return { actions, store };
};

// Mirrors the TimeSlider, which resets its date to the range end when it
// mounts and whenever the range moves.
const simulateTimeSlider = (store) => {
  let wasActive = store.getState().view.timeSliderState.active;
  let dateRange = store.getState().data.eventFilter.filter.date_range;

  return store.subscribe(() => {
    const { active } = store.getState().view.timeSliderState;
    const nextDateRange = store.getState().data.eventFilter.filter.date_range;
    const shouldReset = active && (!wasActive || nextDateRange !== dateRange);

    wasActive = active;
    dateRange = nextDateRange;

    if (shouldReset) {
      Promise.resolve().then(() => store.dispatch(nextDateRange.upper
        ? setVirtualDate(nextDateRange.upper)
        : clearVirtualDate()));
    }
  });
};

// Mirrors the map, which asks for the tracks of pinned and heatmap subjects
// whenever they or the track length change. The API has the tracks given.
const simulateTrackLoading = (store, tracksById = {}) => {
  Object.assign(mockTracksById, tracksById);

  let requestedKey = '';

  return store.subscribe(() => {
    const { heatmapSubjectIDs, subjectTrackState, trackSettings } = store.getState().view;
    const ids = [...new Set([...subjectTrackState.pinned, ...heatmapSubjectIDs])];
    const key = `${ids.join()}|${trackSettings.length}|${trackSettings.origin}`;

    if (ids.length && key !== requestedKey) {
      requestedKey = key;

      Promise.resolve().then(() => fetchTracksIfNecessary(ids));
    }
  });
};

const MAP_WIDTH = 1200;
const MAP_HEIGHT = 900;

const calcFramedCentre = (padding) => [
  (padding.left + MAP_WIDTH - padding.right) / 2,
  (padding.top + MAP_HEIGHT - padding.bottom) / 2,
];

const createMap = () => ({
  cameraForBounds: jest.fn(() => ({ zoom: 12 })),
  easeTo: jest.fn(),
  getBearing: () => 0,
  getCenter: () => ({ toArray: () => [30, -2] }),
  getContainer: () => ({ getBoundingClientRect: () => ({ height: MAP_HEIGHT, left: 0, width: MAP_WIDTH }) }),
  getPitch: () => 0,
  getZoom: () => 10,
});

const createContext = (store, overrides = {}) => {
  const map = createMap();
  const latest = {
    canReadPatrols: true,
    isMediumLayoutOrLarger: true,
    isNavigationBlocked: false,
    jumpToLocation: jest.fn(),
    location: { pathname: '/atlas', search: '' },
    map,
    navigate: jest.fn((path) => {
      latest.location = { pathname: path, search: '' };
    }),
    ...overrides,
  };

  return { context: { getLatest: () => latest, store }, latest };
};

const withSystemConfig = (overrides) => ({
  systemConfig: {
    [SYSTEM_CONFIG_FLAGS.ANALYZERS]: true,
    [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
    [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
    [SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]: true,
    [SYSTEM_CONFIG_FLAGS.SUBJECTS]: true,
    ...overrides,
  },
});

describe('hooks - useAtlasAppActions - runAtlasAppAction', () => {
  let cleanups, innerWidth, warn;
  beforeEach(() => {
    cleanups = [];
    mockTracksById = {};
    mockTrackApi();
    // Wide enough that the Atlas panel keeps its default width.
    innerWidth = window.innerWidth;
    window.innerWidth = 1440;
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    window.sessionStorage.clear();
  });

  afterEach(() => {
    window.innerWidth = innerWidth;
    document.body.innerHTML = '';
    cleanups.forEach((cleanup) => cleanup());
    warn.mockRestore();
    jest.restoreAllMocks();
  });

  const setUp = (state, contextOverrides) => {
    const { actions, store } = buildStore(state);
    cleanups.push(simulateTimeSlider(store));
    const { context, latest } = createContext(store, contextOverrides);

    return { actions, context, latest, run: (message) => runAtlasAppAction(message, context), store };
  };

  describe('the camera history', () => {
    // Records the order of history calls and moves, and makes each move at once.
    const createCameraHistory = (calls) => ({
      begin: jest.fn(() => {
        calls.push('begin');

        return 'session';
      }),
      move: jest.fn(async (session, performMove, options) => {
        calls.push(['move', session, options]);
        performMove();
      }),
    });

    test('writes the camera before navigating to an event, and moves it after', async () => {
      const calls = [];
      const cameraHistory = createCameraHistory(calls);
      const event = { geojson: { geometry: { coordinates: [36.8, -1.3], type: 'Point' } }, id: EVENT_ID };
      fetchEvent.mockImplementation(() => () => Promise.resolve({ data: { data: event } }));
      const { latest, run } = setUp(undefined, { cameraHistory });
      latest.navigate.mockImplementation((path) => {
        calls.push(['navigate', path]);
        latest.location = { pathname: path, search: '' };
      });
      latest.jumpToLocation.mockImplementation((coordinates) => calls.push(['jump', coordinates]));

      await run({ action: 'open-event', id: EVENT_ID });

      expect(calls).toEqual([
        'begin',
        ['navigate', `/events/${EVENT_ID}`],
        ['move', 'session', { signal: undefined }],
        ['jump', [36.8, -1.3]],
      ]);
    });

    test('moves a framed subject through the history', async () => {
      const calls = [];
      const cameraHistory = createCameraHistory(calls);
      const { latest, run } = setUp({ data: { subjectStore: { [SUBJECT_ID]: subject } } }, { cameraHistory });

      await run({ action: 'subject-popup', id: SUBJECT_ID });

      expect(calls).toEqual(['begin', ['move', 'session', { signal: undefined }]]);
      expect(latest.map.easeTo).toHaveBeenCalledTimes(1);
    });

    test('writes nothing for an action that does not move the camera', async () => {
      const calls = [];
      const { run } = setUp(undefined, { cameraHistory: createCameraHistory(calls) });

      await run({ action: 'report-heatmap', on: true });

      expect(calls).toEqual([]);
    });
  });

  describe('events-filter', () => {
    test('changes only the given fields', async () => {
      const { run, store } = setUp();
      const before = store.getState().data.eventFilter;

      await run({
        action: 'events-filter',
        event_types: [TYPE_ID],
        priority: [300],
        sort: { dir: 'up', field: 'event_time' },
        state: 'active',
        text: 'snare',
      });

      const { eventFilter } = store.getState().data;
      expect(eventFilter.state).toEqual(['active', 'new']);
      expect(eventFilter.filter).toEqual({
        ...before.filter,
        event_type: [TYPE_ID],
        priority: [300],
        sort: ['up', { key: 'eventTimeLabel', value: 'event_time' }],
        text: 'snare',
      });
    });

    test.each([
      ['review', ['review']],
      ['resolved', ['resolved']],
      ['all', null],
    ])('maps the %s state', async (state, expected) => {
      const { run, store } = setUp();

      await run({ action: 'events-filter', state });

      expect(store.getState().data.eventFilter.state).toEqual(expected);
    });

    test('sets the date range, keeping the end when only the start is given', async () => {
      const { run, store } = setUp();
      const { upper } = store.getState().data.eventFilter.filter.date_range;

      await run({ action: 'events-filter', since: '2026-11-01T00:00:00.000Z' });

      expect(store.getState().data.eventFilter.filter.date_range)
        .toEqual({ lower: '2026-11-01T00:00:00.000Z', upper });
    });

    test('accepts an open-ended range', async () => {
      const { run, store } = setUp();

      await run({ action: 'events-filter', since: '2026-11-01T00:00:00.000Z', until: null });

      expect(store.getState().data.eventFilter.filter.date_range.upper).toBeNull();
    });

    describe('with a range the user set', () => {
      const DATE_RANGE = { lower: '2026-11-01T00:00:00.000Z', upper: '2026-11-10T00:00:00.000Z' };

      const setUpWithDateRange = () => setUp({
        data: {
          eventFilter: {
            ...INITIAL_EVENT_FILTER_STATE,
            filter: { ...INITIAL_EVENT_FILTER_STATE.filter, date_range: DATE_RANGE },
          },
        },
      });

      test.each([
        [
          'a start after its end',
          { since: '2026-11-15T00:00:00.000Z' },
          'Refused: the filter would end (2026-11-10T00:00:00.000Z) before it starts (2026-11-15T00:00:00.000Z); '
            + 'give until or until: null.',
        ],
        [
          'an end before its start',
          { until: '2026-10-15T00:00:00.000Z' },
          'Refused: the filter would end (2026-10-15T00:00:00.000Z) before it starts (2026-11-01T00:00:00.000Z); '
            + 'give until or until: null.',
        ],
      ])('refuses %s, and changes nothing', async (_, args, text) => {
        const { actions, latest, run, store } = setUpWithDateRange();

        const result = await run({ action: 'events-filter', text: 'snare', ...args });

        expect(result).toEqual(failed(text));
        expect(actions).toEqual([]);
        expect(store.getState().data.eventFilter.filter.date_range).toEqual(DATE_RANGE);
        expect(latest.navigate).not.toHaveBeenCalled();
      });

      test('accepts a start after its end once the end is opened', async () => {
        const { run, store } = setUpWithDateRange();

        const result = await run({ action: 'events-filter', open: false, since: '2026-11-15T00:00:00.000Z', until: null });

        expect(result).toEqual(done('Set the Events filter.'));
        expect(store.getState().data.eventFilter.filter.date_range)
          .toEqual({ lower: '2026-11-15T00:00:00.000Z', upper: null });
      });
    });

    test('does not touch the patrol filter', async () => {
      const { run, store } = setUp();
      const patrolFilter = store.getState().data.patrolFilter;

      await run({ action: 'events-filter', since: '2026-11-01T00:00:00.000Z' });

      expect(store.getState().data.patrolFilter).toBe(patrolFilter);
    });

    test('opens the events feed by default', async () => {
      const { latest, run } = setUp();

      await run({ action: 'events-filter', text: 'x' });

      expect(latest.navigate).toHaveBeenCalledWith('/events', undefined, undefined);
    });

    test('stays on the page when told not to open the feed', async () => {
      const { latest, run, store } = setUp();

      await run({ action: 'events-filter', open: false, text: 'x' });

      expect(store.getState().data.eventFilter.filter.text).toBe('x');
      expect(latest.navigate).not.toHaveBeenCalled();
    });

    test('applies the filter but does not navigate over unsaved edits', async () => {
      const { latest, run, store } = setUp(undefined, { isNavigationBlocked: true });

      await run({ action: 'events-filter', text: 'x' });

      expect(store.getState().data.eventFilter.filter.text).toBe('x');
      expect(latest.navigate).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith('[atlas-tools] events-filter: not opening /events, the open record has unsaved edits');
    });

    test('is skipped when events are disabled', async () => {
      const { actions, run } = setUp({ view: withSystemConfig({ [SYSTEM_CONFIG_FLAGS.EVENTS]: false }) });

      await run({ action: 'events-filter', text: 'x' });

      expect(actions).toEqual([]);
      expect(warn).toHaveBeenCalledWith('[atlas-tools] events-filter: skipped, events are disabled');
    });
  });

  describe('patrols-filter', () => {
    test('sets the given fields', async () => {
      const { latest, run, store } = setUp();

      await run({
        action: 'patrols-filter',
        leaders: [SUBJECT_ID],
        patrol_types: [TYPE_ID],
        since: '2026-11-01T00:00:00.000Z',
        status: ['active'],
        text: 'foot',
        until: null,
      });

      const { patrolFilter } = store.getState().data;
      expect(patrolFilter.status).toEqual(['active']);
      expect(patrolFilter.filter).toEqual({
        ...INITIAL_PATROL_FILTER_STATE.filter,
        date_range: { lower: '2026-11-01T00:00:00.000Z', upper: null },
        patrol_type: [TYPE_ID],
        text: 'foot',
        tracked_by: [SUBJECT_ID],
      });
      expect(latest.navigate).not.toHaveBeenCalled();
    });

    test('refuses a start after the end of the user\'s range, and changes nothing', async () => {
      const { actions, run, store } = setUp();
      const { date_range: dateRange } = store.getState().data.patrolFilter.filter;
      const since = iso(Date.parse(dateRange.upper) + DAY_MS);

      const result = await run({ action: 'patrols-filter', open: true, since, status: ['done'] });

      expect(result).toEqual(failed(
        `Refused: the filter would end (${dateRange.upper}) before it starts (${since}); give until or until: null.`
      ));
      expect(actions).toEqual([]);
      expect(store.getState().data.patrolFilter.filter.date_range).toBe(dateRange);
    });

    test('opens the patrols feed when asked', async () => {
      const { latest, run } = setUp();

      await run({ action: 'patrols-filter', open: true, status: ['done'] });

      expect(latest.navigate).toHaveBeenCalledWith('/patrols', undefined, undefined);
    });

    test('is skipped without the patrol read permission', async () => {
      const { actions, run } = setUp(undefined, { canReadPatrols: false });

      await run({ action: 'patrols-filter', status: ['done'] });

      expect(actions).toEqual([]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[atlas-tools] patrols-filter: skipped'));
    });

    test('is skipped when patrols are disabled', async () => {
      const { actions, run } = setUp({ view: withSystemConfig({ [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: false }) });

      await run({ action: 'patrols-filter', status: ['done'] });

      expect(actions).toEqual([]);
    });
  });

  describe('open-event', () => {
    const event = { geojson: { geometry: { coordinates: [36.8, -1.3], type: 'Point' } }, id: EVENT_ID };

    beforeEach(() => {
      fetchEvent.mockImplementation(() => () => Promise.resolve({ data: { data: event } }));
    });

    test('opens the event, flies to it and bounces its marker', async () => {
      const { latest, run, store } = setUp();

      await run({ action: 'open-event', id: EVENT_ID });

      expect(latest.navigate).toHaveBeenCalledWith(`/events/${EVENT_ID}`, undefined, undefined);
      expect(fetchEvent).toHaveBeenCalledWith(EVENT_ID);
      expect(latest.jumpToLocation).toHaveBeenCalledWith([36.8, -1.3]);
      expect(store.getState().view.bounceEventIDs).toEqual([EVENT_ID]);
    });

    test('flies over every event of an incident and bounces them', async () => {
      const incident = {
        contains: [
          { related_event: { geojson: { geometry: { coordinates: [1, 1], type: 'Point' } }, id: 'a' } },
          { related_event: { geojson: { geometry: { coordinates: [2, 2], type: 'Point' } }, id: 'b' } },
        ],
        id: EVENT_ID,
        is_collection: true,
      };
      fetchEvent.mockImplementation(() => () => Promise.resolve({ data: { data: incident } }));
      const { latest, run, store } = setUp();

      await run({ action: 'open-event', id: EVENT_ID });

      expect(latest.jumpToLocation).toHaveBeenCalledWith([[1, 1], [2, 2]]);
      expect(store.getState().view.bounceEventIDs).toEqual(['a', 'b']);
    });

    test('uses an event already in the store', async () => {
      const { run } = setUp({ data: { eventStore: { [EVENT_ID]: event } } });

      await run({ action: 'open-event', id: EVENT_ID });

      expect(fetchEvent).not.toHaveBeenCalled();
    });

    test('does not bounce with event vector tiles', async () => {
      const { run, store } = setUp({
        view: { systemConfig: { ...withSystemConfig().systemConfig, previewFeatures: { [PREVIEW_FEATURES.EVENTS_VECTOR_TILES]: true } } },
      });

      await run({ action: 'open-event', id: EVENT_ID });

      expect(store.getState().view.bounceEventIDs).toBe('');
    });

    test('stops without flying or bouncing when the open record has unsaved edits', async () => {
      const { latest, run, store } = setUp(undefined, { isNavigationBlocked: true });

      await run({ action: 'open-event', id: EVENT_ID });

      expect(latest.navigate).not.toHaveBeenCalled();
      expect(fetchEvent).not.toHaveBeenCalled();
      expect(latest.jumpToLocation).not.toHaveBeenCalled();
      expect(store.getState().view.bounceEventIDs).toBe('');
    });

    test('warns when the event cannot be loaded', async () => {
      fetchEvent.mockImplementation(() => () => Promise.reject({ response: { status: 404 } }));
      const { latest, run } = setUp();

      await run({ action: 'open-event', id: EVENT_ID });

      expect(latest.jumpToLocation).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith(`[atlas-tools] open-event: skipped, event ${EVENT_ID} could not be loaded (404)`);
    });

    test('is skipped when events are disabled', async () => {
      const { latest, run } = setUp({ view: withSystemConfig({ [SYSTEM_CONFIG_FLAGS.EVENTS]: false }) });

      await run({ action: 'open-event', id: EVENT_ID });

      expect(latest.navigate).not.toHaveBeenCalled();
    });
  });

  describe('open-patrol', () => {
    const patrol = { id: PATROL_ID, patrol_segments: [] };

    beforeEach(() => {
      fetchPatrol.mockImplementation(() => (dispatch) => {
        dispatch({ payload: patrol, type: UPDATE_PATROL_SUCCESS });

        return Promise.resolve({ data: { data: patrol } });
      });
      patrolStateAllowsTrackDisplay.mockReturnValue(true);
      selectPatrolTrackData.mockReturnValue({ trackData: { track: {} } });
      getBoundsForPatrol.mockReturnValue([1, 2, 3, 4]);
    });

    test('pins its track, opens it and fits the map to it', async () => {
      const { latest, run, store } = setUp();

      await run({ action: 'open-patrol', id: PATROL_ID });

      expect(store.getState().view.patrolTrackState.pinned).toEqual([PATROL_ID]);
      expect(latest.navigate).toHaveBeenCalledWith(`/patrols/${PATROL_ID}`, undefined, undefined);
      expect(latest.jumpToLocation).toHaveBeenCalledWith([[1, 2], [3, 4]], undefined, { maxZoom: 17 });
    });

    test('pins its track only after the navigation, and moves the camera after both', async () => {
      const calls = [];
      const cameraHistory = {
        begin: jest.fn(() => 'session'),
        move: jest.fn(async (session, performMove) => {
          calls.push(['move', session]);
          performMove();
        }),
      };
      const { latest, run, store } = setUp(undefined, { cameraHistory });
      latest.navigate.mockImplementation((path) => {
        calls.push(['navigate', path, store.getState().view.patrolTrackState.pinned]);
        latest.location = { pathname: path, search: '' };
      });

      await run({ action: 'open-patrol', id: PATROL_ID });

      expect(calls).toEqual([['navigate', `/patrols/${PATROL_ID}`, []], ['move', 'session']]);
      expect(store.getState().view.patrolTrackState.pinned).toEqual([PATROL_ID]);
      expect(latest.jumpToLocation).toHaveBeenCalledWith([[1, 2], [3, 4]], undefined, { maxZoom: 17 });
    });

    test('stops without pinning or moving the camera when the open record has unsaved edits', async () => {
      const cameraHistory = { begin: jest.fn(() => 'session'), move: jest.fn() };
      const { latest, run, store } = setUp(undefined, { cameraHistory, isNavigationBlocked: true });
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      await run({ action: 'open-patrol', id: PATROL_ID });

      expect(latest.navigate).not.toHaveBeenCalled();
      expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: UPDATE_PATROL_TRACK_STATE }));
      expect(store.getState().view.patrolTrackState.pinned).toEqual([]);
      expect(latest.jumpToLocation).not.toHaveBeenCalled();
      expect(cameraHistory.move).not.toHaveBeenCalled();
    });

    test('warns when the patrol has nothing to fit to', async () => {
      getBoundsForPatrol.mockReturnValue(null);
      const { latest, run } = setUp();

      await run({ action: 'open-patrol', id: PATROL_ID });

      expect(latest.jumpToLocation).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith(`[atlas-tools] open-patrol: patrol ${PATROL_ID} has no positions to fit the map to`);
    });

    test('is skipped without the patrol read permission', async () => {
      const { latest, run } = setUp(undefined, { canReadPatrols: false });

      await run({ action: 'open-patrol', id: PATROL_ID });

      expect(fetchPatrol).not.toHaveBeenCalled();
      expect(latest.navigate).not.toHaveBeenCalled();
    });
  });

  describe('subject-popup', () => {
    test('shows the subject, frames it and opens its popup', async () => {
      const { latest, run, store } = setUp({
        data: {
          mapLayerFilter: { ...mapLayerFilterReducer(undefined, {}), hiddenSubjectIDs: [SUBJECT_ID] },
          subjectStore: { [SUBJECT_ID]: subject },
        },
      });

      await run({ action: 'subject-popup', id: SUBJECT_ID });

      const { popup } = store.getState().view;
      expect(popup.type).toBe('subject');
      expect(popup.data.coordinates).toEqual([36.8, -1.3]);
      expect(popup.data.properties).toEqual(expect.objectContaining({ id: SUBJECT_ID, title: 'Kito' }));
      expect(store.getState().data.mapLayerFilter.hiddenSubjectIDs).toEqual([]);
      expect(latest.jumpToLocation).not.toHaveBeenCalled();
      expect(latest.map.easeTo).toHaveBeenCalledWith({
        center: [36.8, -1.3],
        padding: { bottom: 0, left: 806, right: 90, top: 300 },
        zoom: 14,
      });
      expect(calcFramedCentre(latest.map.easeTo.mock.calls[0][0].padding)).toEqual([958, 600]);
      expect(store.getState().view.subjectTrackState.pinned).toEqual([]);
    });

    test('shows the subject as from Atlas, so it is kept out of storage', async () => {
      const { actions, run } = setUp({ data: { subjectStore: { [SUBJECT_ID]: subject } } });

      await run({ action: 'subject-popup', id: SUBJECT_ID });

      expect(actions).toContainEqual(showSubjectsFromAtlas(SUBJECT_ID));
    });

    test('frames the subject beside the nav rail alone when the sidebar is closed', async () => {
      const { latest, run } = setUp(
        { data: { subjectStore: { [SUBJECT_ID]: subject } } },
        { location: { pathname: '/', search: '' } }
      );

      await run({ action: 'subject-popup', id: SUBJECT_ID });

      const { padding } = latest.map.easeTo.mock.calls[0][0];
      expect(padding).toEqual({ bottom: 0, left: 70, right: 90, top: 300 });
      expect(calcFramedCentre(padding)).toEqual([590, 600]);
    });

    test('frames the subject between the map edges and the controls on small layouts', async () => {
      const { latest, run } = setUp(
        { data: { subjectStore: { [SUBJECT_ID]: subject } } },
        { isMediumLayoutOrLarger: false }
      );

      await run({ action: 'subject-popup', id: SUBJECT_ID });

      const { padding } = latest.map.easeTo.mock.calls[0][0];
      expect(padding).toEqual({ bottom: 0, left: 0, right: 12, top: 300 });
      expect(calcFramedCentre(padding)).toEqual([594, 600]);
    });

    test('ignores a panel that leaves too little of the map to frame the subject in', async () => {
      const { latest, run } = setUp({ data: { subjectStore: { [SUBJECT_ID]: subject } } });
      latest.map.getContainer = () => ({ getBoundingClientRect: () => ({ height: MAP_HEIGHT, left: 0, width: 1000 }) });

      await run({ action: 'subject-popup', id: SUBJECT_ID });

      expect(latest.map.easeTo.mock.calls[0][0].padding).toEqual({ bottom: 0, left: 0, right: 90, top: 300 });
    });

    test('pins the track when asked, without framing the subject again once its legend appears', async () => {
      const { latest, run, store } = setUp({ data: { subjectStore: { [SUBJECT_ID]: subject } } });
      cleanups.push(simulateTrackLoading(store, { [SUBJECT_ID]: makeTrack([[[36.8, -1.3], Date.now()]]) }));
      cleanups.push(store.subscribe(() => {
        if (store.getState().data.tracks[SUBJECT_ID] && !document.getElementById('subject-track-legend')) {
          const parent = document.createElement('div');
          const legend = document.createElement('div');
          legend.id = 'subject-track-legend';
          parent.appendChild(legend);
          document.body.appendChild(parent);
          parent.getBoundingClientRect = () => ({ left: 0 });
          Object.defineProperty(legend, 'offsetParent', { value: parent });
          Object.defineProperty(legend, 'offsetLeft', { value: 1000 });
        }
      }));

      await run({ action: 'subject-popup', id: SUBJECT_ID, track: true });

      expect(store.getState().view.subjectTrackState.pinned).toEqual([SUBJECT_ID]);
      expect(latest.map.easeTo).toHaveBeenCalledTimes(1);
      expect(latest.map.easeTo.mock.calls[0][0].padding).toEqual({ bottom: 0, left: 806, right: 90, top: 300 });
    });

    test('fetches a subject that is not in the store', async () => {
      const get = jest.spyOn(axios, 'get').mockResolvedValue({ data: { data: subject } });
      const { run, store } = setUp();

      await run({ action: 'subject-popup', id: SUBJECT_ID });

      expect(get).toHaveBeenCalledWith(expect.stringContaining(`subject/${SUBJECT_ID}`));
      expect(store.getState().view.popup.type).toBe('subject');
    });

    test('warns about a subject without a position', async () => {
      const { run, store } = setUp({
        data: { subjectStore: { [SUBJECT_ID]: { ...subject, last_position: { geometry: null, properties: {} } } } },
      });

      await run({ action: 'subject-popup', id: SUBJECT_ID });

      expect(store.getState().view.popup).toBeNull();
      expect(warn).toHaveBeenCalledWith(`[atlas-tools] subject-popup: skipped, subject ${SUBJECT_ID} has no known position`);
    });

    test('is skipped when subjects are disabled', async () => {
      const { actions, run } = setUp({ view: withSystemConfig({ [SYSTEM_CONFIG_FLAGS.SUBJECTS]: false }) });

      await run({ action: 'subject-popup', id: SUBJECT_ID });

      expect(actions).toEqual([]);
    });
  });

  describe('subject-track', () => {
    test('pins the tracks of several subjects and fits the map to them', async () => {
      const now = Date.now();
      const { latest, run, store } = setUp();
      cleanups.push(simulateTrackLoading(store, {
        [OTHER_SUBJECT_ID]: makeTrack([[[3, 3], now - HOUR_MS]]),
        [SUBJECT_ID]: makeTrack([[[2, 2], now - HOUR_MS], [[1, 1], now - 2 * HOUR_MS]]),
      }));

      await run({ action: 'subject-track', ids: [SUBJECT_ID, OTHER_SUBJECT_ID] });

      expect(store.getState().view.subjectTrackState.pinned.sort()).toEqual([SUBJECT_ID, OTHER_SUBJECT_ID].sort());
      expect(latest.jumpToLocation).toHaveBeenCalledWith([[2, 2], [1, 1], [3, 3]]);
      expect(latest.map.easeTo).not.toHaveBeenCalled();
    });

    test('shows the subjects as from Atlas, so they are kept out of storage', async () => {
      const now = Date.now();
      const { actions, run, store } = setUp();
      cleanups.push(simulateTrackLoading(store, { [SUBJECT_ID]: makeTrack([[[2, 2], now - HOUR_MS]]) }));

      await run({ action: 'subject-track', ids: [SUBJECT_ID] });

      expect(actions).toContainEqual(showSubjectsFromAtlas(SUBJECT_ID));
    });

    test('frames a single subject at its latest position, zoomed out past its track', async () => {
      const now = Date.now();
      const { latest, run, store } = setUp();
      cleanups.push(simulateTrackLoading(store, {
        [SUBJECT_ID]: makeTrack([[[2, 2], now - HOUR_MS], [[1, 1], now - 2 * HOUR_MS]]),
      }));

      await run({ action: 'subject-track', ids: [SUBJECT_ID] });

      expect(store.getState().view.subjectTrackState.pinned).toEqual([SUBJECT_ID]);
      expect(latest.jumpToLocation).not.toHaveBeenCalled();
      expect(latest.map.cameraForBounds).toHaveBeenCalledWith(
        [[1, 1], [2, 2]],
        { padding: { bottom: 12, left: 806, right: 90, top: 12 } }
      );
      expect(latest.map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [2, 2], zoom: 11 }));
    });

    test('sets the track length for an open-ended window', async () => {
      const now = Date.now();
      const { run, store } = setUp();
      cleanups.push(simulateTrackLoading(store, { [SUBJECT_ID]: makeTrack([[[1, 1], now - HOUR_MS]]) }));

      const result = await run({ action: 'subject-track', ids: [SUBJECT_ID], since: iso(now - 6.5 * DAY_MS) });

      expect(result.content[0].text).toMatch(/ The track length is now 7 days\.$/);
      expect(store.getState().view.trackSettings).toEqual(expect.objectContaining({ length: 7, origin: 'CUSTOM_LENGTH' }));
      expect(store.getState().view.timeSliderState.active).toBe(false);
    });

    test('draws a window ending in the past with the time slider at its end', async () => {
      const now = Date.now();
      const since = iso(now - 10 * DAY_MS);
      const until = iso(now - 5 * DAY_MS);
      const { latest, run, store } = setUp();
      cleanups.push(simulateTrackLoading(store, {
        [SUBJECT_ID]: makeTrack([
          [[9, 9], now - HOUR_MS],
          [[2, 2], now - 6 * DAY_MS],
          [[1, 1], now - 7 * DAY_MS],
        ]),
      }));

      const result = await run({ action: 'subject-track', ids: [SUBJECT_ID], since, until });

      const state = store.getState();
      expect(result).toEqual(done(
        `Pinned the track of subject ${SUBJECT_ID} and moved the map to it. `
          + `The events filter is now ${since} to ${until}, with the time slider at ${until}.`
      ));
      expect(state.data.eventFilter.filter.date_range).toEqual({ lower: since, upper: until });
      expect(state.view.trackSettings.origin).toBe('EVENT_FILTER');
      expect(state.view.timeSliderState).toEqual(expect.objectContaining({ active: true, virtualDate: until }));
      expect(latest.map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [2, 2] }));
    });

    test('fetches a track the store does not have for the window, and waits for it', async () => {
      const now = Date.now();
      const { actions, latest, run, store } = setUp({
        data: { tracks: { [SUBJECT_ID]: makeStoredTrack([[[9, 9], now - HOUR_MS]], { since: iso(now - DAY_MS) }) } },
      });
      cleanups.push(simulateTrackLoading(store, {
        [SUBJECT_ID]: makeTrack([[[2, 2], now - HOUR_MS], [[1, 1], now - 5 * DAY_MS]]),
      }));

      await run({ action: 'subject-track', ids: [SUBJECT_ID], since: iso(now - 6.5 * DAY_MS) });

      expect(countTrackRequests()).toBe(1);
      expect(actions).toContainEqual(expect.objectContaining({ type: FETCH_TRACKS_SUCCESS }));
      expect(latest.map.cameraForBounds).toHaveBeenCalledWith([[1, 1], [2, 2]], expect.any(Object));
    });

    describe('when the store already has the track for the window', () => {
      beforeEach(() => {
        jest.useFakeTimers({ now: new Date('2026-11-20T12:00:00Z') });
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      const setUpStoredTrack = () => {
        const now = Date.now();
        const storedTrack = makeStoredTrack(
          [[[2, 2], now - HOUR_MS], [[1, 1], now - 3 * DAY_MS]],
          { since: iso(now - 30 * DAY_MS) }
        );
        const setup = setUp({ data: { tracks: { [SUBJECT_ID]: storedTrack } } });
        cleanups.push(simulateTrackLoading(setup.store));

        return { ...setup, now, storedTrack };
      };

      test('uses it at once, as the map fetches nothing', async () => {
        const { actions, latest, now, run, store, storedTrack } = setUpStoredTrack();

        let result;
        run({ action: 'subject-track', ids: [SUBJECT_ID], since: iso(now - 6.5 * DAY_MS) }).then((value) => {
          result = value;
        });
        await jest.advanceTimersByTimeAsync(10);

        expect(result).toEqual(done(
          `Pinned the track of subject ${SUBJECT_ID} and moved the map to it. The track length is now 7 days.`
        ));
        expect(countTrackRequests()).toBe(0);
        expect(actions).not.toContainEqual(expect.objectContaining({ type: FETCH_TRACKS_SUCCESS }));
        expect(store.getState().data.tracks[SUBJECT_ID]).toBe(storedTrack);
        expect(latest.map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [2, 2] }));
      });

      test('uses it at once without a window', async () => {
        const { latest, run } = setUpStoredTrack();

        let result;
        run({ action: 'subject-track', ids: [SUBJECT_ID] }).then((value) => {
          result = value;
        });
        await jest.advanceTimersByTimeAsync(10);

        expect(result).toEqual(done(`Pinned the track of subject ${SUBJECT_ID} and moved the map to it.`));
        expect(countTrackRequests()).toBe(0);
        expect(latest.map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [2, 2] }));
      });
    });

    test('warns when no track loads', async () => {
      jest.useFakeTimers();
      try {
        const { latest, run } = setUp();

        const done = run({ action: 'subject-track', ids: [SUBJECT_ID] });
        await jest.advanceTimersByTimeAsync(6000);
        await done;

        expect(latest.map.easeTo).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledWith('[atlas-tools] subject-track: no track positions in the window to fit the map to');
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('subject-at-time', () => {
    test('sets the time slider at the moment and opens the popup there', async () => {
      const now = Date.now();
      const time = iso(now - 3 * DAY_MS);
      const { latest, run, store } = setUp({ data: { subjectStore: { [SUBJECT_ID]: subject } } });
      mockTracksById[SUBJECT_ID] = makeTrack([[[5, 5], now - DAY_MS], [[4, 4], now - 3 * DAY_MS - HOUR_MS], [[3, 3], now - 4 * DAY_MS]]);

      const result = await run({ action: 'subject-at-time', id: SUBJECT_ID, time });

      const state = store.getState();
      expect(result).toEqual(done(
        `Showed subject ${SUBJECT_ID} where it was at ${time}. The events filter is now ${iso(now - 4 * DAY_MS)} to ${iso(now - 2 * DAY_MS)}.`
      ));
      expect(state.view.popup.type).toBe('subject');
      expect(state.view.timeSliderState).toEqual(expect.objectContaining({ active: true, virtualDate: time }));
      expect(state.data.eventFilter.filter.date_range).toEqual({ lower: iso(now - 4 * DAY_MS), upper: iso(now - 2 * DAY_MS) });
      expect(axios.get).toHaveBeenCalledWith(
        TRACKS_API_URL(SUBJECT_ID),
        expect.objectContaining({ params: { since: iso(now - 4 * DAY_MS), until: iso(now - 2 * DAY_MS) } })
      );
      expect(latest.jumpToLocation).not.toHaveBeenCalled();
      expect(latest.map.easeTo).toHaveBeenCalledTimes(1);
      expect(latest.map.easeTo).toHaveBeenCalledWith({
        center: [4, 4],
        padding: { bottom: 0, left: 806, right: 90, top: 300 },
        zoom: 14,
      });
    });

    test('finds the position in a track the store already has for the window, at once and without fetching', async () => {
      jest.useFakeTimers({ now: new Date('2026-11-20T12:00:00Z') });
      try {
        const now = Date.now();
        const time = iso(now - 3 * DAY_MS);
        const storedTrack = makeStoredTrack(
          [[[5, 5], now - DAY_MS], [[4, 4], now - 3 * DAY_MS - HOUR_MS], [[3, 3], now - 4 * DAY_MS]],
          { since: iso(now - 10 * DAY_MS) }
        );
        const { actions, latest, run, store } = setUp({
          data: { subjectStore: { [SUBJECT_ID]: subject }, tracks: { [SUBJECT_ID]: storedTrack } },
        });

        let result;
        run({ action: 'subject-at-time', id: SUBJECT_ID, time }).then((value) => {
          result = value;
        });
        // Only the time slider's own reset is waited for.
        await jest.advanceTimersByTimeAsync(100);

        expect(result).toEqual(done(
          `Showed subject ${SUBJECT_ID} where it was at ${time}. The events filter is now ${iso(now - 4 * DAY_MS)} to ${iso(now - 2 * DAY_MS)}.`
        ));
        expect(countTrackRequests()).toBe(0);
        expect(actions).not.toContainEqual(expect.objectContaining({ type: FETCH_TRACKS_SUCCESS }));
        expect(store.getState().data.tracks[SUBJECT_ID]).toBe(storedTrack);
        expect(latest.map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [4, 4] }));
      } finally {
        jest.useRealTimers();
      }
    });

    test('does not wait for a track the subject does not have', async () => {
      jest.useFakeTimers();
      try {
        const { latest, run } = setUp({ data: { subjectStore: { [SUBJECT_ID]: { ...subject, tracks_available: false } } } });
        const now = Date.now();
        const time = iso(now - DAY_MS);

        let result;
        run({ action: 'subject-at-time', id: SUBJECT_ID, time }).then((value) => {
          result = value;
        });
        await jest.advanceTimersByTimeAsync(100);

        expect(result).toEqual(done(
          `Set the time slider to ${time}, but subject ${SUBJECT_ID} has no position at or before it. `
          + `The events filter is now ${iso(now - 2 * DAY_MS)} to ${iso(now)}.`
        ));
        expect(countTrackRequests()).toBe(0);
        expect(latest.map.easeTo).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });

    test('is skipped when subjects are disabled', async () => {
      const { actions, run } = setUp({ view: withSystemConfig({ [SYSTEM_CONFIG_FLAGS.SUBJECTS]: false }) });

      await run({ action: 'subject-at-time', id: SUBJECT_ID, time: iso(Date.now() - DAY_MS) });

      expect(actions).toEqual([]);
    });
  });

  describe('subject-heatmap', () => {
    test('turns the report heatmap off and the subject heatmap on', async () => {
      const now = Date.now();
      const { latest, run, store } = setUp({ view: { showReportHeatmap: true } });
      cleanups.push(simulateTrackLoading(store, { [SUBJECT_ID]: makeTrack([[[1, 1], now - HOUR_MS]]) }));

      await run({ action: 'subject-heatmap', ids: [SUBJECT_ID, OTHER_SUBJECT_ID] });

      expect(store.getState().view.showReportHeatmap).toBe(false);
      expect(store.getState().view.heatmapSubjectIDs).toEqual([SUBJECT_ID, OTHER_SUBJECT_ID]);
      expect(latest.jumpToLocation).toHaveBeenCalledWith([[1, 1]]);
    });

    test('uses tracks the store already has for the window at once, as the map fetches nothing', async () => {
      jest.useFakeTimers({ now: new Date('2026-11-20T12:00:00Z') });
      try {
        const now = Date.now();
        const fetchedDateRange = { since: iso(now - 30 * DAY_MS) };
        const storedTracks = {
          [OTHER_SUBJECT_ID]: makeStoredTrack([[[3, 3], now - 2 * HOUR_MS]], fetchedDateRange),
          [SUBJECT_ID]: makeStoredTrack([[[1, 1], now - HOUR_MS]], fetchedDateRange),
        };
        const { actions, latest, run, store } = setUp({ data: { tracks: storedTracks } });
        cleanups.push(simulateTrackLoading(store));

        let result;
        run({ action: 'subject-heatmap', ids: [SUBJECT_ID, OTHER_SUBJECT_ID], since: iso(now - 6.5 * DAY_MS) })
          .then((value) => {
            result = value;
          });
        await jest.advanceTimersByTimeAsync(10);

        expect(result).toEqual(done(
          'Turned on the heatmap of 2 subjects and moved the map to it. The track length is now 7 days.'
        ));
        expect(countTrackRequests()).toBe(0);
        expect(actions).not.toContainEqual(expect.objectContaining({ type: FETCH_TRACKS_SUCCESS }));
        expect(latest.jumpToLocation).toHaveBeenCalledWith([[1, 1], [3, 3]]);
      } finally {
        jest.useRealTimers();
      }
    });

    test('fetches the tracks of a window the store does not cover, and waits for them', async () => {
      const now = Date.now();
      const { latest, run, store } = setUp({
        data: { tracks: { [SUBJECT_ID]: makeStoredTrack([[[9, 9], now - HOUR_MS]], { since: iso(now - DAY_MS) }) } },
      });
      cleanups.push(simulateTrackLoading(store, {
        [SUBJECT_ID]: makeTrack([[[1, 1], now - HOUR_MS], [[2, 2], now - 5 * DAY_MS]]),
      }));

      await run({ action: 'subject-heatmap', ids: [SUBJECT_ID], since: iso(now - 6.5 * DAY_MS) });

      expect(countTrackRequests()).toBe(1);
      expect(latest.jumpToLocation).toHaveBeenCalledWith([[1, 1], [2, 2]]);
    });
  });

  describe('report-heatmap', () => {
    test('turns the subject heatmap off when it turns on', async () => {
      const { run, store } = setUp({ view: { heatmapSubjectIDs: [SUBJECT_ID] } });

      await run({ action: 'report-heatmap', on: true });

      expect(store.getState().view.heatmapSubjectIDs).toEqual([]);
      expect(store.getState().view.showReportHeatmap).toBe(true);
    });

    test('leaves the subject heatmap when it turns off', async () => {
      const { run, store } = setUp({ view: { heatmapSubjectIDs: [SUBJECT_ID], showReportHeatmap: true } });

      await run({ action: 'report-heatmap', on: false });

      expect(store.getState().view.heatmapSubjectIDs).toEqual([SUBJECT_ID]);
      expect(store.getState().view.showReportHeatmap).toBe(false);
    });
  });

  describe('subjects-visibility', () => {
    const subjectGroups = [{
      id: 'g1',
      subgroups: [{ id: 'g2', subgroups: [], subjects: [{ id: THIRD_SUBJECT_ID }] }],
      subjects: [{ id: SUBJECT_ID }, { id: OTHER_SUBJECT_ID }],
    }];

    test('hides the given subjects', async () => {
      const { run, store } = setUp();

      await run({ action: 'subjects-visibility', hide: [SUBJECT_ID] });

      expect(store.getState().data.mapLayerFilter.hiddenSubjectIDs).toEqual([SUBJECT_ID]);
    });

    test('shows the given subjects', async () => {
      const { run, store } = setUp({
        data: { mapLayerFilter: { ...mapLayerFilterReducer(undefined, {}), hiddenSubjectIDs: [SUBJECT_ID, OTHER_SUBJECT_ID] } },
      });

      await run({ action: 'subjects-visibility', show: [SUBJECT_ID] });

      expect(store.getState().data.mapLayerFilter.hiddenSubjectIDs).toEqual([OTHER_SUBJECT_ID]);
    });

    test('shows only the given subjects', async () => {
      const { run, store } = setUp({
        data: {
          mapLayerFilter: { ...mapLayerFilterReducer(undefined, {}), hiddenSubjectIDs: [SUBJECT_ID] },
          subjectGroups,
        },
      });

      await run({ action: 'subjects-visibility', only: [SUBJECT_ID] });

      expect(store.getState().data.mapLayerFilter.hiddenSubjectIDs.sort())
        .toEqual([OTHER_SUBJECT_ID, THIRD_SUBJECT_ID].sort());
    });

    test.each([
      { hide: [SUBJECT_ID] },
      { show: [SUBJECT_ID] },
      { only: [SUBJECT_ID] },
    ])('marks the change from %o as from Atlas, so it is kept out of storage', async (params) => {
      const { actions, run } = setUp({ data: { subjectGroups } });

      await run({ action: 'subjects-visibility', ...params });

      const visibilityActions = actions.filter((action) => ['HIDE_SUBJECTS', 'SHOW_SUBJECTS'].includes(action.type));
      expect(visibilityActions.length).toBeGreaterThan(0);
      expect(visibilityActions)
        .toEqual(visibilityActions.map(() => expect.objectContaining({ meta: { isFromAtlas: true } })));
    });
  });

  describe('show-feature', () => {
    const featureSets = {
      data: [{
        name: 'Places',
        types: [{
          feature_summaries: [{ bounds: [36, -2, 37, -1], id: FEATURE_ID, name: 'Kanzi boma' }],
          name: 'Bomas',
        }],
      }],
    };

    test('shows, opens, highlights and fits the feature, with its popup', async () => {
      const { latest, run, store } = setUp({
        data: {
          featureSets,
          mapLayerFilter: { ...mapLayerFilterReducer(undefined, {}), hiddenFeatureIDs: [FEATURE_ID] },
        },
      });

      await run({ action: 'show-feature', id: FEATURE_ID });

      const state = store.getState();
      expect(state.data.mapLayerFilter.hiddenFeatureIDs).toEqual([]);
      expect(state.view.openMapFeatureTypeNames).toEqual(['Bomas']);
      expect(state.view.mapFeatureHighlightIDs).toEqual([FEATURE_ID]);
      expect(latest.jumpToLocation).toHaveBeenCalledWith([[36, -2], [37, -1]]);
      expect(state.view.popup.type).toBe('feature-symbol');
      expect(state.view.popup.data.coordinates).toEqual([36.5, -1.5]);
      expect(state.view.popup.data.properties).toEqual({ id: FEATURE_ID, name: 'Kanzi boma' });
    });

    test('is skipped for a feature that is not listed', async () => {
      const { actions, run } = setUp({ data: { featureSets } });

      await run({ action: 'show-feature', id: SUBJECT_ID });

      expect(actions).toEqual([]);
      expect(warn).toHaveBeenCalledWith(`[atlas-tools] show-feature: skipped, feature ${SUBJECT_ID} is not listed in Map Layers`);
    });

    test('is skipped when spatial features are disabled', async () => {
      const { actions, run } = setUp({
        data: { featureSets },
        view: withSystemConfig({ [SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]: false }),
      });

      await run({ action: 'show-feature', id: FEATURE_ID });

      expect(actions).toEqual([]);
    });
  });

  describe('show-analyzer', () => {
    const analyzerFeatures = {
      data: [{
        geojson: {
          features: [{ geometry: { coordinates: [[1, 1], [3, 4]], type: 'LineString' }, properties: {}, type: 'Feature' }],
          type: 'FeatureCollection',
        },
        id: ANALYZER_ID,
        name: 'North fence',
      }],
    };

    test('shows the analyzer and fits the map to it', async () => {
      const { latest, run, store } = setUp({
        data: {
          analyzerFeatures,
          mapLayerFilter: { ...mapLayerFilterReducer(undefined, {}), hiddenAnalyzerIDs: [ANALYZER_ID] },
        },
      });

      await run({ action: 'show-analyzer', id: ANALYZER_ID });

      expect(store.getState().data.mapLayerFilter.hiddenAnalyzerIDs).toEqual([]);
      expect(latest.jumpToLocation).toHaveBeenCalledWith([[1, 1], [3, 4]]);
    });

    test('is skipped for an analyzer that is not active', async () => {
      const { actions, run } = setUp({ data: { analyzerFeatures } });

      await run({ action: 'show-analyzer', id: SUBJECT_ID });

      expect(actions).toEqual([]);
    });

    test('is skipped when analyzers are disabled', async () => {
      const { actions, run } = setUp({
        data: { analyzerFeatures },
        view: withSystemConfig({ [SYSTEM_CONFIG_FLAGS.ANALYZERS]: false }),
      });

      await run({ action: 'show-analyzer', id: ANALYZER_ID });

      expect(actions).toEqual([]);
    });
  });

  describe('layers-search', () => {
    test('sets the search text without navigating', async () => {
      const { latest, run, store } = setUp();

      await run({ action: 'layers-search', text: 'Kito' });

      expect(store.getState().data.mapLayerFilter.text).toBe('Kito');
      expect(latest.navigate).not.toHaveBeenCalled();
    });

    test('marks the search text as from Atlas, so it is kept out of storage', async () => {
      const { actions, run } = setUp();

      await run({ action: 'layers-search', text: 'Kito' });

      expect(actions).toContainEqual(setMapLayersFilterTextFromAtlas('Kito'));
    });

    test('opens Map Layers on the tab asked for', async () => {
      const { latest, run } = setUp();

      await run({ action: 'layers-search', tab: 'features', text: 'boma' });

      expect(latest.navigate).toHaveBeenCalledWith('/layers', undefined, { mapLayersTab: 'features' });
    });

    test('changes nothing when the tab asked for is disabled', async () => {
      const { actions, latest, run, store } = setUp({ view: withSystemConfig({ [SYSTEM_CONFIG_FLAGS.ANALYZERS]: false }) });
      const { text } = store.getState().data.mapLayerFilter;

      const result = await run({ action: 'layers-search', tab: 'analyzers', text: 'fence' });

      expect(result).toEqual(failed('Skipped, the analyzers tab is disabled.'));
      expect(actions).toEqual([]);
      expect(store.getState().data.mapLayerFilter.text).toBe(text);
      expect(latest.navigate).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith('[atlas-tools] layers-search: skipped, the analyzers tab is disabled');
    });
  });

  describe('jump-to', () => {
    test('moves the map to the coordinates and zoom, through the history', async () => {
      const calls = [];
      const cameraHistory = {
        begin: jest.fn(() => 'session'),
        move: jest.fn(async (session, performMove) => {
          calls.push(['move', session]);
          performMove();
        }),
      };
      const { latest, run } = setUp(undefined, { cameraHistory });

      const result = await run({ action: 'jump-to', coordinates: [36.8, -1.3], zoom: 12 });

      expect(cameraHistory.begin).toHaveBeenCalledTimes(1);
      expect(calls).toEqual([['move', 'session']]);
      expect(latest.jumpToLocation).toHaveBeenCalledWith([36.8, -1.3], 12);
      expect(result).toEqual(done('Moved the map to 36.8, -1.3 at zoom 12.'));
    });

    test('leaves the zoom to the default when none is given', async () => {
      const { latest, run } = setUp();

      const result = await run({ action: 'jump-to', coordinates: [36.8, -1.3] });

      expect(latest.jumpToLocation).toHaveBeenCalledWith([36.8, -1.3], undefined);
      expect(result).toEqual(done('Moved the map to 36.8, -1.3.'));
    });
  });

  describe('fit-bounds', () => {
    test('fits the map to the bbox, through the history', async () => {
      const cameraHistory = {
        begin: jest.fn(() => 'session'),
        move: jest.fn(async (_session, performMove) => performMove()),
      };
      const { latest, run } = setUp(undefined, { cameraHistory });

      const result = await run({ action: 'fit-bounds', bbox: [-10, -5, 10, 5] });

      expect(cameraHistory.move).toHaveBeenCalledWith('session', expect.any(Function), { signal: undefined });
      expect(latest.jumpToLocation).toHaveBeenCalledWith([[-10, -5], [10, 5]]);
      expect(result).toEqual(done('Fitted the map to -10, -5, 10, 5.'));
    });

    test('centres the map on a bbox without area', async () => {
      const { latest, run } = setUp();

      await run({ action: 'fit-bounds', bbox: [1, 2, 1, 2] });

      expect(latest.jumpToLocation).toHaveBeenCalledWith([1, 2]);
    });
  });

  describe('open-record', () => {
    test.each([
      ['event', `/events/${EVENT_ID}`],
      ['patrol', `/patrols/${EVENT_ID}`],
    ])('opens the %s', async (erType, path) => {
      const { latest, run } = setUp();

      const result = await run({ action: 'open-record', er_type: erType, id: EVENT_ID });

      expect(latest.navigate).toHaveBeenCalledWith(path);
      expect(result).toEqual(done(`Opened ${erType} ${EVENT_ID}.`));
    });

    test('writes no camera, as it does not move it', async () => {
      const cameraHistory = { begin: jest.fn(), move: jest.fn() };
      const { run } = setUp(undefined, { cameraHistory });

      await run({ action: 'open-record', er_type: 'event', id: EVENT_ID });

      expect(cameraHistory.begin).not.toHaveBeenCalled();
    });

    test('leaves the user to confirm leaving unsaved edits, as a link would', async () => {
      const { latest, run } = setUp(undefined, { isNavigationBlocked: true });

      const result = await run({ action: 'open-record', er_type: 'event', id: EVENT_ID });

      expect(latest.navigate).toHaveBeenCalledWith(`/events/${EVENT_ID}`);
      expect(result).toEqual(done(
        `Asked the user to leave the open record, which has unsaved edits, to open event ${EVENT_ID}.`
      ));
    });

    describe('with a point to centre the map on', () => {
      test('opens the record, then centres the map there at the zoom of a record link', async () => {
        const calls = [];
        const cameraHistory = {
          begin: jest.fn(() => {
            calls.push('begin');

            return 'session';
          }),
          move: jest.fn(async (session, performMove) => {
            calls.push(['move', session]);
            performMove();
          }),
        };
        const { latest, run } = setUp(undefined, { cameraHistory });
        latest.navigate.mockImplementation((path) => {
          calls.push(['navigate', path]);
          latest.location = { pathname: path, search: '' };
        });
        latest.jumpToLocation.mockImplementation((coordinates, zoom) => calls.push(['jump', coordinates, zoom]));

        const result = await run({ action: 'open-record', er_type: 'patrol', id: PATROL_ID, lnglat: [36.8, -1.3] });

        expect(calls).toEqual([
          'begin',
          ['navigate', `/patrols/${PATROL_ID}`],
          ['move', 'session'],
          ['jump', [36.8, -1.3], 16],
        ]);
        expect(result).toEqual(done(`Opened patrol ${PATROL_ID} and moved the map to 36.8, -1.3.`));
      });

      test('waits for the record\'s route before moving the map, as the jump padding depends on it', async () => {
        jest.useFakeTimers();
        try {
          const { latest, run } = setUp();
          latest.navigate.mockImplementation((path) => {
            setTimeout(() => {
              latest.location = { pathname: path, search: '' };
            }, 200);
          });

          const finished = run({ action: 'open-record', er_type: 'event', id: EVENT_ID, lnglat: [36.8, -1.3] });
          await jest.advanceTimersByTimeAsync(100);

          expect(latest.jumpToLocation).not.toHaveBeenCalled();

          await jest.advanceTimersByTimeAsync(200);
          await finished;

          expect(latest.jumpToLocation).toHaveBeenCalledWith([36.8, -1.3], 16);
        } finally {
          jest.useRealTimers();
        }
      });

      test('does not move the map while the user is asked to leave unsaved edits', async () => {
        const cameraHistory = { begin: jest.fn(), move: jest.fn() };
        const { latest, run } = setUp(undefined, { cameraHistory, isNavigationBlocked: true });

        const result = await run({ action: 'open-record', er_type: 'event', id: EVENT_ID, lnglat: [36.8, -1.3] });

        expect(latest.navigate).toHaveBeenCalledWith(`/events/${EVENT_ID}`);
        expect(cameraHistory.begin).not.toHaveBeenCalled();
        expect(cameraHistory.move).not.toHaveBeenCalled();
        expect(latest.jumpToLocation).not.toHaveBeenCalled();
        expect(result).toEqual(done(
          `Asked the user to leave the open record, which has unsaved edits, to open event ${EVENT_ID}; the map did not move.`
        ));
      });
    });
  });

  describe('when the call is cancelled', () => {
    const STOPPED = failed('Stopped, the call was cancelled.', 'cancelled');

    const runWithSignal = (context, message, controller) => runAtlasAppAction(message, { ...context, signal: controller.signal });

    test('does nothing once cancelled before it starts', async () => {
      const controller = new AbortController();
      controller.abort();
      const { actions, context, latest } = setUp();

      const result = await runWithSignal(context, { action: 'jump-to', coordinates: [1, 2] }, controller);

      expect(result).toEqual(STOPPED);
      expect(latest.jumpToLocation).not.toHaveBeenCalled();
      expect(actions).toEqual([]);
      expect(warn).toHaveBeenCalledWith('[atlas-tools] jump-to: stopped, the call was cancelled');
    });

    test('does not navigate after a load it was waiting for', async () => {
      let finishLoading;
      fetchPatrol.mockImplementation(() => () => new Promise((resolve) => {
        finishLoading = () => resolve({ data: { data: { id: PATROL_ID } } });
      }));
      const controller = new AbortController();
      const cameraHistory = { begin: jest.fn(() => 'session'), move: jest.fn() };
      const { context, latest } = setUp(undefined, { cameraHistory });

      const finished = runWithSignal(context, { action: 'open-patrol', id: PATROL_ID }, controller);
      await Promise.resolve();
      controller.abort();
      finishLoading();

      expect(await finished).toEqual(STOPPED);
      expect(latest.navigate).not.toHaveBeenCalled();
      expect(cameraHistory.begin).not.toHaveBeenCalled();
      expect(latest.jumpToLocation).not.toHaveBeenCalled();
    });

    test('does not move the camera or bounce after a load it was waiting for', async () => {
      let finishLoading;
      fetchEvent.mockImplementation(() => () => new Promise((resolve) => {
        finishLoading = () => resolve({ data: { data: { geojson: { geometry: { coordinates: [1, 2], type: 'Point' } }, id: EVENT_ID } } });
      }));
      const controller = new AbortController();
      const { context, latest, store } = setUp();

      const finished = runWithSignal(context, { action: 'open-event', id: EVENT_ID }, controller);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(latest.navigate).toHaveBeenCalled();
      controller.abort();
      finishLoading();

      expect(await finished).toEqual(STOPPED);
      expect(latest.jumpToLocation).not.toHaveBeenCalled();
      expect(store.getState().view.bounceEventIDs).toBe('');
    });

    test('does not move the camera once the tracks it was waiting for arrive', async () => {
      const now = Date.now();
      const controller = new AbortController();
      const { context, latest, store } = setUp();
      let finishLoading;
      axios.get.mockImplementation(() => new Promise((resolve) => {
        finishLoading = () => resolve({ data: { data: makeTrack([[[2, 2], now - HOUR_MS]]).track } });
      }));
      cleanups.push(simulateTrackLoading(store));

      const finished = runWithSignal(context, { action: 'subject-track', ids: [SUBJECT_ID] }, controller);
      await new Promise((resolve) => setTimeout(resolve, 0));
      controller.abort();
      finishLoading();

      expect(await finished).toEqual(STOPPED);
      expect(latest.jumpToLocation).not.toHaveBeenCalled();
      expect(latest.map.easeTo).not.toHaveBeenCalled();
    });

    test('writes no history once cancelled while the camera moves, and is not applied', async () => {
      const moveEndListeners = new Set();
      const map = {
        getCenter: () => ({ lat: -1.3, lng: 36.8 }),
        getZoom: () => 12,
        off: (type, listener) => moveEndListeners.delete(listener),
        on: (type, listener) => moveEndListeners.add(listener),
      };
      const rendered = renderHook(() => ({ cameraHistory: useAtlasCameraHistory(), location: useLocation() }), {
        wrapper: ({ children }) => <MemoryRouter initialEntries={['/atlas']}>
          <MapContext.Provider value={map}>{children}</MapContext.Provider>
        </MemoryRouter>,
      });
      const controller = new AbortController();
      const { context, latest } = setUp(undefined, { cameraHistory: rendered.result.current.cameraHistory });

      let finished;
      act(() => {
        finished = runWithSignal(context, { action: 'jump-to', coordinates: [1, 2] }, controller);
      });
      const locationBeforeMoveEnd = rendered.result.current.location;
      expect(latest.jumpToLocation).toHaveBeenCalled();
      expect(moveEndListeners.size).toBe(1);

      controller.abort();
      let result;
      await act(async () => {
        moveEndListeners.forEach((listener) => listener());
        result = await finished;
      });

      expect(result._meta.status).not.toBe('applied');
      expect(result).toEqual(STOPPED);
      expect(rendered.result.current.location).toBe(locationBeforeMoveEnd);
    });

    test('does not set the time slider\'s date or move the camera after waiting for the slider', async () => {
      jest.useFakeTimers();
      try {
        const controller = new AbortController();
        const { actions, context, latest } = setUp({ data: { subjectStore: { [SUBJECT_ID]: subject } } });
        // Without the slider's reset, the call waits for it until it gives up.
        cleanups.pop()();
        const time = iso(Date.now() - 3 * DAY_MS);

        const finished = runWithSignal(context, { action: 'subject-at-time', id: SUBJECT_ID, time }, controller);
        await jest.advanceTimersByTimeAsync(100);
        expect(actions).toContainEqual(expect.objectContaining({ type: 'SET_ACTIVE_STATE' }));
        controller.abort();
        await jest.advanceTimersByTimeAsync(10_000);

        expect(await finished).toEqual(STOPPED);
        expect(actions).not.toContainEqual(setVirtualDate(time));
        expect(countTrackRequests()).toBe(0);
        expect(latest.map.easeTo).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('results', () => {
    // With every feature off, each tool answers without waiting on the map.
    test.each(ATLAS_TOOL_NAMES)('runs %s', async (name) => {
      const { run } = setUp({
        view: withSystemConfig({
          [SYSTEM_CONFIG_FLAGS.ANALYZERS]: false,
          [SYSTEM_CONFIG_FLAGS.EVENTS]: false,
          [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: false,
          [SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]: false,
          [SYSTEM_CONFIG_FLAGS.SUBJECTS]: false,
        }),
      });
      const args = {
        'events-filter': { open: false },
        'fit-bounds': { bbox: [1, 2, 3, 4] },
        'jump-to': { coordinates: [1, 2] },
        'layers-search': { text: 'x' },
        'open-record': { er_type: 'event', id: EVENT_ID },
        'patrols-filter': {},
        'report-heatmap': { on: true },
        'subjects-visibility': { show: [SUBJECT_ID] },
      }[name];

      const result = await run({ action: name, ...(args ?? { id: SUBJECT_ID, ids: [SUBJECT_ID], time: iso(Date.now()) }) });

      expect(result.content[0].text).not.toMatch(/Unknown tool/);
    });

    test('is an error for an unknown tool, and changes nothing', async () => {
      const { actions, run } = setUp();

      const result = await run({ action: 'delete-everything' });

      expect(actions).toEqual([]);
      expect(result).toEqual(failed('Unknown tool: delete-everything'));
    });

    test('is an error for a tool that throws', async () => {
      fetchPatrol.mockImplementation(() => () => Promise.resolve());
      patrolStateAllowsTrackDisplay.mockImplementation(() => {
        throw new Error('boom');
      });
      const { run } = setUp();

      const result = await run({ action: 'open-patrol', id: PATROL_ID });

      expect(result).toEqual(failed('Failed: boom'));
      expect(warn).toHaveBeenCalledWith('[atlas-tools] open-patrol: failed (boom)');
    });

    describe('when a tool is skipped', () => {
      const disabled = (flag) => ({ view: withSystemConfig({ [flag]: false }) });

      test.each([
        ['events-filter', { text: 'x' }, disabled(SYSTEM_CONFIG_FLAGS.EVENTS), 'events are disabled'],
        ['open-event', { id: EVENT_ID }, disabled(SYSTEM_CONFIG_FLAGS.EVENTS), 'events are disabled'],
        ['report-heatmap', { on: true }, disabled(SYSTEM_CONFIG_FLAGS.EVENTS), 'events are disabled'],
        [
          'patrols-filter',
          {},
          disabled(SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT),
          'patrols are disabled or not readable by this user',
        ],
        [
          'open-patrol',
          { id: PATROL_ID },
          disabled(SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT),
          'patrols are disabled or not readable by this user',
        ],
        ['subject-popup', { id: SUBJECT_ID }, disabled(SYSTEM_CONFIG_FLAGS.SUBJECTS), 'subjects are disabled'],
        ['subject-track', { ids: [SUBJECT_ID] }, disabled(SYSTEM_CONFIG_FLAGS.SUBJECTS), 'subjects are disabled'],
        [
          'subject-at-time',
          { id: SUBJECT_ID, time: iso(Date.now()) },
          disabled(SYSTEM_CONFIG_FLAGS.SUBJECTS),
          'subjects are disabled',
        ],
        ['subject-heatmap', { ids: [SUBJECT_ID] }, disabled(SYSTEM_CONFIG_FLAGS.SUBJECTS), 'subjects are disabled'],
        ['subjects-visibility', { hide: [SUBJECT_ID] }, disabled(SYSTEM_CONFIG_FLAGS.SUBJECTS), 'subjects are disabled'],
        [
          'show-feature',
          { id: FEATURE_ID },
          disabled(SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES),
          'spatial features are disabled',
        ],
        ['show-feature', { id: FEATURE_ID }, undefined, `feature ${FEATURE_ID} is not listed in Map Layers`],
        ['show-analyzer', { id: ANALYZER_ID }, disabled(SYSTEM_CONFIG_FLAGS.ANALYZERS), 'analyzers are disabled'],
        ['show-analyzer', { id: ANALYZER_ID }, undefined, `analyzer ${ANALYZER_ID} is not active`],
        [
          'layers-search',
          { tab: 'analyzers', text: 'x' },
          disabled(SYSTEM_CONFIG_FLAGS.ANALYZERS),
          'the analyzers tab is disabled',
        ],
        [
          'subject-popup',
          { id: SUBJECT_ID },
          { data: { subjectStore: { [SUBJECT_ID]: { ...subject, last_position: { geometry: null, properties: {} } } } } },
          `subject ${SUBJECT_ID} has no known position`,
        ],
      ])('is an error for %s with %j', async (name, args, state, reason) => {
        const { run } = setUp(state);

        const result = await run({ action: name, ...args });

        expect(result).toEqual(failed(`Skipped, ${reason}.`));
        expect(warn).toHaveBeenCalledWith(`[atlas-tools] ${name}: skipped, ${reason}`);
      });

      test('is an error when the Map Layers tab is disabled', async () => {
        const { run } = setUp({
          view: withSystemConfig({
            [SYSTEM_CONFIG_FLAGS.ANALYZERS]: false,
            [SYSTEM_CONFIG_FLAGS.EVENTS]: false,
            [SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES]: false,
            [SYSTEM_CONFIG_FLAGS.SUBJECTS]: false,
          }),
        });

        const result = await run({ action: 'layers-search', text: 'x' });

        expect(result).toEqual(failed('Skipped, the Map Layers tab is disabled.'));
      });

      test('is an error without the patrol read permission', async () => {
        const { run } = setUp(undefined, { canReadPatrols: false });

        const result = await run({ action: 'patrols-filter', status: ['done'] });

        expect(result).toEqual(failed('Skipped, patrols are disabled or not readable by this user.'));
      });

      test('is an error when the event cannot be loaded', async () => {
        fetchEvent.mockImplementation(() => () => Promise.reject({ response: { status: 404 } }));
        const { run } = setUp();

        const result = await run({ action: 'open-event', id: EVENT_ID });

        expect(result).toEqual(failed(`Skipped, event ${EVENT_ID} could not be loaded (404).`));
      });

      test('is an error when the patrol cannot be loaded', async () => {
        fetchPatrol.mockImplementation(() => () => Promise.reject({ response: { status: 403 } }));
        const { run } = setUp();

        const result = await run({ action: 'open-patrol', id: PATROL_ID });

        expect(result).toEqual(failed(`Skipped, patrol ${PATROL_ID} could not be loaded (403).`));
      });

      test.each(['subject-popup', 'subject-at-time'])('is an error for %s when the subject cannot be loaded', async (name) => {
        jest.spyOn(axios, 'get').mockRejectedValue({ response: { status: 404 } });
        const { run } = setUp();

        const result = await run({ action: name, id: SUBJECT_ID, time: iso(Date.now()) });

        expect(result).toEqual(failed(`Skipped, subject ${SUBJECT_ID} could not be loaded (404).`));
      });
    });

    test.each([
      ['open-event', { id: EVENT_ID }, `Did not open event ${EVENT_ID}: the open record has unsaved edits.`],
      ['open-patrol', { id: PATROL_ID }, `Did not open patrol ${PATROL_ID}: the open record has unsaved edits.`],
    ])('is an error when %s cannot leave unsaved edits', async (name, args, text) => {
      fetchPatrol.mockImplementation(() => () => Promise.resolve());
      const { run } = setUp(undefined, { isNavigationBlocked: true });

      const result = await run({ action: name, ...args });

      expect(result).toEqual(failed(text));
    });

    describe('when a tool is done', () => {
      test.each([
        [{ open: false, text: 'x' }, undefined, 'Set the Events filter.'],
        [{ text: 'x' }, undefined, 'Set the Events filter and opened the Events feed.'],
        [
          { text: 'x' },
          { isNavigationBlocked: true },
          'Set the Events filter, but did not open the Events feed: the open record has unsaved edits.',
        ],
      ])('says what events-filter %j did', async (args, contextOverrides, text) => {
        const { run } = setUp(undefined, contextOverrides);

        expect(await run({ action: 'events-filter', ...args })).toEqual(done(text));
      });

      test.each([
        [{ text: 'x' }, 'Set the Patrols filter.'],
        [{ open: true }, 'Set the Patrols filter and opened the Patrols feed.'],
      ])('says what patrols-filter %j did', async (args, text) => {
        const { run } = setUp();

        expect(await run({ action: 'patrols-filter', ...args })).toEqual(done(text));
      });

      test('says the event was opened and the map moved to it', async () => {
        const event = { geojson: { geometry: { coordinates: [36.8, -1.3], type: 'Point' } }, id: EVENT_ID };
        fetchEvent.mockImplementation(() => () => Promise.resolve({ data: { data: event } }));
        const { run } = setUp();

        expect(await run({ action: 'open-event', id: EVENT_ID }))
          .toEqual(done(`Opened event ${EVENT_ID} and moved the map to it.`));
      });

      test('says the patrol was opened and the map fitted to it', async () => {
        fetchPatrol.mockImplementation(() => () => Promise.resolve());
        patrolStateAllowsTrackDisplay.mockReturnValue(false);
        selectPatrolTrackData.mockReturnValue({});
        getBoundsForPatrol.mockReturnValue([1, 2, 3, 4]);
        const { run } = setUp();

        expect(await run({ action: 'open-patrol', id: PATROL_ID }))
          .toEqual(done(`Opened patrol ${PATROL_ID}, pinned its track and fitted the map to it.`));
      });

      test.each([
        [{}, `Showed the popup of subject ${SUBJECT_ID} at its last position.`],
        [{ track: true }, `Showed the popup of subject ${SUBJECT_ID} at its last position and pinned its track.`],
      ])('says what subject-popup %j did', async (args, text) => {
        const { run } = setUp({ data: { subjectStore: { [SUBJECT_ID]: subject } } });

        expect(await run({ action: 'subject-popup', id: SUBJECT_ID, ...args })).toEqual(done(text));
      });

      test('says the tracks were pinned and the map moved to them', async () => {
        const now = Date.now();
        const { run, store } = setUp();
        cleanups.push(simulateTrackLoading(store, {
          [OTHER_SUBJECT_ID]: makeTrack([[[3, 3], now - HOUR_MS]]),
          [SUBJECT_ID]: makeTrack([[[2, 2], now - HOUR_MS]]),
        }));

        expect(await run({ action: 'subject-track', ids: [SUBJECT_ID, OTHER_SUBJECT_ID] }))
          .toEqual(done('Pinned the track of 2 subjects and moved the map to it.'));
      });

      test.each([
        [true, 'Turned the event heatmap on.'],
        [false, 'Turned the event heatmap off.'],
      ])('says report-heatmap on: %s did', async (on, text) => {
        const { run } = setUp();

        expect(await run({ action: 'report-heatmap', on })).toEqual(done(text));
      });

      test.each([
        [{ hide: [SUBJECT_ID] }, `Hid subject ${SUBJECT_ID} on the map.`],
        [{ show: [SUBJECT_ID, OTHER_SUBJECT_ID] }, 'Showed 2 subjects on the map.'],
        [{ only: [SUBJECT_ID] }, `Showed only subject ${SUBJECT_ID} on the map.`],
      ])('says what subjects-visibility %j did', async (args, text) => {
        const { run } = setUp();

        expect(await run({ action: 'subjects-visibility', ...args })).toEqual(done(text));
      });

      test('says the analyzer was shown and the map fitted to it', async () => {
        const analyzerFeatures = {
          data: [{
            geojson: {
              features: [{ geometry: { coordinates: [[1, 1], [3, 4]], type: 'LineString' }, properties: {}, type: 'Feature' }],
              type: 'FeatureCollection',
            },
            id: ANALYZER_ID,
          }],
        };
        const { run } = setUp({ data: { analyzerFeatures } });

        expect(await run({ action: 'show-analyzer', id: ANALYZER_ID }))
          .toEqual(done(`Showed analyzer ${ANALYZER_ID} and fitted the map to it.`));
      });

      test('says the feature was shown and the map fitted to it', async () => {
        const featureSets = {
          data: [{ types: [{ feature_summaries: [{ bounds: [36, -2, 37, -1], id: FEATURE_ID, name: 'Boma' }], name: 'Bomas' }] }],
        };
        const { run } = setUp({ data: { featureSets } });

        expect(await run({ action: 'show-feature', id: FEATURE_ID }))
          .toEqual(done(`Showed feature ${FEATURE_ID} and fitted the map to it.`));
      });

      test.each([
        [{ text: 'Kito' }, 'Searched Map Layers for "Kito".'],
        [{ tab: 'features', text: 'boma' }, 'Searched Map Layers for "boma" and opened its features tab.'],
      ])('says what layers-search %j did', async (args, text) => {
        const { run } = setUp();

        expect(await run({ action: 'layers-search', ...args })).toEqual(done(text));
      });
    });
  });

  test('starts from the initial event filter', () => {
    const { store } = setUp();

    expect(store.getState().data.eventFilter.state).toEqual(INITIAL_EVENT_FILTER_STATE.state);
  });
});
