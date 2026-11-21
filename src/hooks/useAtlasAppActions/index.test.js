import axios from 'axios';
import { applyMiddleware, combineReducers, legacy_createStore as createStore } from 'redux';
import { thunk } from 'redux-thunk';

import eventFilterReducer, { INITIAL_FILTER_STATE as INITIAL_EVENT_FILTER_STATE } from '../../ducks/event-filter';
import mapLayerFilterReducer from '../../ducks/map-layer-filter';
import patrolFilterReducer, { INITIAL_FILTER_STATE as INITIAL_PATROL_FILTER_STATE } from '../../ducks/patrol-filter';
import popupReducer from '../../ducks/popup';
import timeSliderReducer, { clearVirtualDate, setVirtualDate } from '../../ducks/timeslider';
import tracksReducer, { FETCH_TRACKS_SUCCESS, trackSettingsReducer } from '../../ducks/tracks';
import {
  bounceEventReducer,
  heatmapSubjectIDsReducer,
  openMapFeatureTypesReducer,
  reportHeatmapStateReducer,
  subjectTrackReducer,
} from '../../ducks/map-ui';
import { fetchEvent } from '../../ducks/events';
import { fetchPatrol, patrolStoreReducer, patrolTracksReducer, UPDATE_PATROL_SUCCESS } from '../../ducks/patrols';
import { fetchTracksIfNecessary } from '../../utils/tracks';
import { getBoundsForPatrol, patrolStateAllowsTrackDisplay } from '../../utils/patrols';
import { mapFeatureHighlightIdReducer } from '../../ducks/mapFeatureHighlight';
import { PREVIEW_FEATURES, SYSTEM_CONFIG_FLAGS } from '../../constants';
import { selectPatrolTrackData } from '../../selectors/patrols';

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

// The real one reads the app's global store.
jest.mock('../../utils/tracks', () => ({ fetchTracksIfNecessary: jest.fn() }));

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
  },
});

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

// Mirrors the map, which fetches the tracks of pinned and heatmap subjects.
const simulateTrackLoading = (store, tracksById) => {
  let requestedKey = '';

  return store.subscribe(() => {
    const { heatmapSubjectIDs, subjectTrackState } = store.getState().view;
    const ids = [...new Set([...subjectTrackState.pinned, ...heatmapSubjectIDs])].filter((id) => tracksById[id]);
    const key = ids.join();

    if (key && key !== requestedKey) {
      requestedKey = key;

      Promise.resolve().then(() => store.dispatch({
        payload: Object.fromEntries(ids.map((id) => [id, { ...tracksById[id] }])),
        type: FETCH_TRACKS_SUCCESS,
      }));
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
        ['move', 'session', undefined],
        ['jump', [36.8, -1.3]],
      ]);
    });

    test('moves a framed subject through the history', async () => {
      const calls = [];
      const cameraHistory = createCameraHistory(calls);
      const { latest, run } = setUp({ data: { subjectStore: { [SUBJECT_ID]: subject } } }, { cameraHistory });

      await run({ action: 'subject-popup', id: SUBJECT_ID });

      expect(calls).toEqual(['begin', ['move', 'session', undefined]]);
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
      expect(warn).toHaveBeenCalledWith('[otus:app] events-filter: not opening /events, the open record has unsaved edits');
    });

    test('is skipped when events are disabled', async () => {
      const { actions, run } = setUp({ view: withSystemConfig({ [SYSTEM_CONFIG_FLAGS.EVENTS]: false }) });

      await run({ action: 'events-filter', text: 'x' });

      expect(actions).toEqual([]);
      expect(warn).toHaveBeenCalledWith('[otus:app] events-filter: skipped, events are disabled');
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

    test('opens the patrols feed when asked', async () => {
      const { latest, run } = setUp();

      await run({ action: 'patrols-filter', open: true, status: ['done'] });

      expect(latest.navigate).toHaveBeenCalledWith('/patrols', undefined, undefined);
    });

    test('is skipped without the patrol read permission', async () => {
      const { actions, run } = setUp(undefined, { canReadPatrols: false });

      await run({ action: 'patrols-filter', status: ['done'] });

      expect(actions).toEqual([]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[otus:app] patrols-filter: skipped'));
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

    test('still flies to the event when the open record has unsaved edits', async () => {
      const { latest, run } = setUp(undefined, { isNavigationBlocked: true });

      await run({ action: 'open-event', id: EVENT_ID });

      expect(latest.navigate).not.toHaveBeenCalled();
      expect(latest.jumpToLocation).toHaveBeenCalledWith([36.8, -1.3]);
    });

    test('warns when the event cannot be loaded', async () => {
      fetchEvent.mockImplementation(() => () => Promise.reject({ response: { status: 404 } }));
      const { latest, run } = setUp();

      await run({ action: 'open-event', id: EVENT_ID });

      expect(latest.jumpToLocation).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith(`[otus:app] open-event: skipped, event ${EVENT_ID} could not be loaded (404)`);
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

    test('warns when the patrol has nothing to fit to', async () => {
      getBoundsForPatrol.mockReturnValue(null);
      const { latest, run } = setUp();

      await run({ action: 'open-patrol', id: PATROL_ID });

      expect(latest.jumpToLocation).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith(`[otus:app] open-patrol: patrol ${PATROL_ID} has no positions to fit the map to`);
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
      expect(warn).toHaveBeenCalledWith(`[otus:app] subject-popup: skipped, subject ${SUBJECT_ID} has no known position`);
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

      await run({ action: 'subject-track', ids: [SUBJECT_ID], since: iso(now - 6.5 * DAY_MS) });

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

      await run({ action: 'subject-track', ids: [SUBJECT_ID], since, until });

      const state = store.getState();
      expect(state.data.eventFilter.filter.date_range).toEqual({ lower: since, upper: until });
      expect(state.view.trackSettings.origin).toBe('EVENT_FILTER');
      expect(state.view.timeSliderState).toEqual(expect.objectContaining({ active: true, virtualDate: until }));
      expect(latest.map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [2, 2] }));
    });

    test('warns when no track loads', async () => {
      jest.useFakeTimers();
      try {
        const { latest, run } = setUp();

        const done = run({ action: 'subject-track', ids: [SUBJECT_ID] });
        await jest.advanceTimersByTimeAsync(6000);
        await done;

        expect(latest.map.easeTo).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledWith('[otus:app] subject-track: no track positions in the window to fit the map to');
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
      fetchTracksIfNecessary.mockImplementation((ids) => store.dispatch({
        payload: {
          [ids[0]]: makeTrack([[[5, 5], now - DAY_MS], [[4, 4], now - 3 * DAY_MS - HOUR_MS], [[3, 3], now - 4 * DAY_MS]]),
        },
        type: FETCH_TRACKS_SUCCESS,
      }));

      await run({ action: 'subject-at-time', id: SUBJECT_ID, time });

      const state = store.getState();
      expect(state.view.popup.type).toBe('subject');
      expect(state.view.timeSliderState).toEqual(expect.objectContaining({ active: true, virtualDate: time }));
      expect(state.data.eventFilter.filter.date_range).toEqual({ lower: iso(now - 4 * DAY_MS), upper: iso(now - 2 * DAY_MS) });
      expect(fetchTracksIfNecessary).toHaveBeenCalledWith([SUBJECT_ID]);
      expect(latest.jumpToLocation).not.toHaveBeenCalled();
      expect(latest.map.easeTo).toHaveBeenCalledTimes(1);
      expect(latest.map.easeTo).toHaveBeenCalledWith({
        center: [4, 4],
        padding: { bottom: 0, left: 806, right: 90, top: 300 },
        zoom: 14,
      });
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
      expect(warn).toHaveBeenCalledWith(`[otus:app] show-feature: skipped, feature ${SUBJECT_ID} is not listed in Map Layers`);
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

    test('opens Map Layers on the tab asked for', async () => {
      const { latest, run } = setUp();

      await run({ action: 'layers-search', tab: 'features', text: 'boma' });

      expect(latest.navigate).toHaveBeenCalledWith('/layers', undefined, { mapLayersTab: 'features' });
    });

    test('does not open a disabled tab', async () => {
      const { latest, run, store } = setUp({ view: withSystemConfig({ [SYSTEM_CONFIG_FLAGS.ANALYZERS]: false }) });

      await run({ action: 'layers-search', tab: 'analyzers', text: 'fence' });

      expect(store.getState().data.mapLayerFilter.text).toBe('fence');
      expect(latest.navigate).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith('[otus:app] layers-search: skipped, the analyzers tab is disabled');
    });
  });

  test('ignores an unknown action', async () => {
    const { actions, run } = setUp();

    await run({ action: 'delete-everything' });

    expect(actions).toEqual([]);
  });

  test('starts from the initial event filter', () => {
    const { store } = setUp();

    expect(store.getState().data.eventFilter.state).toEqual(INITIAL_EVENT_FILTER_STATE.state);
  });
});
