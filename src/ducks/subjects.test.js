import axios from 'axios';

import { mockStore } from '../__test-helpers/MockStore';

import mapSubjectsReducer, {
  cancelMapSubjectsFetch,
  COVERED_SCAN_MAX_AGE_MS,
  FETCH_MAP_SUBJECTS_SUCCESS,
  fetchMapSubjects,
  INITIAL_MAP_SUBJECT_STATE,
  SOCKET_DELETE_SUBJECT,
  SOCKET_NEW_SUBJECT,
  socketDeleteSubject,
  socketNewSubject,
  subjectGroupsReducer,
  subjectStoreReducer,
} from './subjects';

// Plain action constructor for use in reducer tests (bypasses the thunk).
const makeNewSubjectAction = (payload) => ({ type: SOCKET_NEW_SUBJECT, payload });

// Minimal subject fixture matching the shape returned by GET /subjects
const makeSubject = (id, overrides = {}) => ({
  content_type: 'observations.subject',
  id,
  name: `Subject ${id}`,
  subject_type: 'wildlife',
  subject_subtype: 'dugong',
  is_active: true,
  tracks_available: false,
  image_url: '/static/dugong-male.svg',
  last_position: null,
  ...overrides,
});

const SUBJECT_A_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
const SUBJECT_B_ID = 'bbbbbbbb-0000-0000-0000-000000000002';
const SUBJECT_C_ID = 'cccccccc-0000-0000-0000-000000000003';

const subjectA = makeSubject(SUBJECT_A_ID);
const subjectB = makeSubject(SUBJECT_B_ID);

// A loaded group tree in the shape produced by the subjectGroupsReducer:
// subjects are stored as plain IDs (not full objects) after FETCH_SUBJECT_GROUPS_SUCCESS.
const makeGroupTree = () => ([
  {
    id: 'group-1',
    name: 'Wildlife',
    subgroups: [
      {
        id: 'subgroup-1a',
        name: 'Marine',
        subgroups: [],
        subjects: [SUBJECT_A_ID],
      },
    ],
    subjects: [SUBJECT_B_ID],
  },
  {
    id: 'group-2',
    name: 'Rangers',
    subgroups: [],
    subjects: [],
  },
]);

describe('socketNewSubject thunk', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('dispatches SOCKET_NEW_SUBJECT with the payload', () => {
    const store = mockStore({ data: { subjectGroups: [] } });
    const payload = { subject_id: SUBJECT_A_ID, subject_data: subjectA, mid: '1', trace_id: 't1' };
    store.dispatch(socketNewSubject(payload));
    const actions = store.getActions();
    expect(actions[0]).toEqual({ type: SOCKET_NEW_SUBJECT, payload });
  });

  test('dispatches a subject-groups refetch when subject_group_ids contains an unknown group id', async () => {
    jest.spyOn(axios, 'get').mockResolvedValueOnce({
      data: { data: [] },
    });
    const store = mockStore({ data: { subjectGroups: makeGroupTree() } });
    const payload = {
      subject_id: SUBJECT_C_ID,
      subject_data: makeSubject(SUBJECT_C_ID),
      subject_group_ids: ['group-1', 'unknown-group-999'],
    };
    await store.dispatch(socketNewSubject(payload));
    const actionTypes = store.getActions().map((a) => a.type);
    expect(actionTypes).toContain(SOCKET_NEW_SUBJECT);
    expect(actionTypes).toContain('FETCH_SUBJECT_GROUPS_SUCCESS');
  });

  test('does NOT refetch when all subject_group_ids are already in the loaded tree', () => {
    const store = mockStore({ data: { subjectGroups: makeGroupTree() } });
    const payload = {
      subject_id: SUBJECT_C_ID,
      subject_data: makeSubject(SUBJECT_C_ID),
      // group-1 and subgroup-1a are both present in makeGroupTree()
      subject_group_ids: ['group-1', 'subgroup-1a'],
    };
    store.dispatch(socketNewSubject(payload));
    const dispatchedFunctions = store.getActions().filter((a) => typeof a === 'function');
    expect(dispatchedFunctions).toHaveLength(0);
  });

  test('does NOT refetch when subject_group_ids is empty', () => {
    const store = mockStore({ data: { subjectGroups: makeGroupTree() } });
    const payload = {
      subject_id: SUBJECT_C_ID,
      subject_data: makeSubject(SUBJECT_C_ID),
      subject_group_ids: [],
    };
    store.dispatch(socketNewSubject(payload));
    const dispatchedFunctions = store.getActions().filter((a) => typeof a === 'function');
    expect(dispatchedFunctions).toHaveLength(0);
  });

  test('does NOT refetch when subject_group_ids is missing', () => {
    const store = mockStore({ data: { subjectGroups: makeGroupTree() } });
    const payload = { subject_id: SUBJECT_C_ID, subject_data: makeSubject(SUBJECT_C_ID) };
    store.dispatch(socketNewSubject(payload));
    const dispatchedFunctions = store.getActions().filter((a) => typeof a === 'function');
    expect(dispatchedFunctions).toHaveLength(0);
  });
});

describe('socketDeleteSubject action creator', () => {
  test('returns a SOCKET_DELETE_SUBJECT action with the payload', () => {
    const payload = { subject_id: SUBJECT_A_ID, subject_data: null, mid: '2', trace_id: 't2' };
    expect(socketDeleteSubject(payload)).toEqual({ type: SOCKET_DELETE_SUBJECT, payload });
  });
});

const makeSubjectWithPosition = (id, titleOverride) => makeSubject(id, {
  last_position: {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [-122.38, 47.52] },
    properties: {
      id,
      title: titleOverride !== undefined ? titleOverride : `Title for ${id}`,
      name: `Name for ${id}`,
    },
  },
});

describe('subjectStoreReducer', () => {
  describe('SOCKET_NEW_SUBJECT', () => {
    test('inserts a new subject into an empty store', () => {
      const action = makeNewSubjectAction({ subject_id: SUBJECT_A_ID, subject_data: subjectA });
      const state = subjectStoreReducer({}, action);
      expect(state[SUBJECT_A_ID]).toEqual(subjectA);
    });

    test('inserts alongside existing subjects', () => {
      const initial = { [SUBJECT_B_ID]: subjectB };
      const action = makeNewSubjectAction({ subject_id: SUBJECT_A_ID, subject_data: subjectA });
      const state = subjectStoreReducer(initial, action);
      expect(state[SUBJECT_A_ID]).toEqual(subjectA);
      expect(state[SUBJECT_B_ID]).toEqual(subjectB);
    });

    test('overwrites an existing subject entry (idempotent update)', () => {
      const initial = { [SUBJECT_A_ID]: subjectA };
      const updated = makeSubject(SUBJECT_A_ID, { name: 'Updated Name' });
      const action = makeNewSubjectAction({ subject_id: SUBJECT_A_ID, subject_data: updated });
      const state = subjectStoreReducer(initial, action);
      expect(state[SUBJECT_A_ID].name).toBe('Updated Name');
    });

    test('normalizes last_position.properties.name from title when title is present', () => {
      const subject = makeSubjectWithPosition(SUBJECT_A_ID, 'Preferred Title');
      const action = makeNewSubjectAction({ subject_id: SUBJECT_A_ID, subject_data: subject });
      const state = subjectStoreReducer({}, action);
      expect(state[SUBJECT_A_ID].last_position.properties.name).toBe('Preferred Title');
    });

    test('keeps existing name when title is absent/falsy', () => {
      const subject = makeSubjectWithPosition(SUBJECT_A_ID, '');
      const action = makeNewSubjectAction({ subject_id: SUBJECT_A_ID, subject_data: subject });
      const state = subjectStoreReducer({}, action);
      expect(state[SUBJECT_A_ID].last_position.properties.name).toBe(`Name for ${SUBJECT_A_ID}`);
    });

    test('does not crash when last_position is null (brand-new positionless subject)', () => {
      const subject = makeSubject(SUBJECT_A_ID); // last_position: null
      const action = makeNewSubjectAction({ subject_id: SUBJECT_A_ID, subject_data: subject });
      expect(() => subjectStoreReducer({}, action)).not.toThrow();
      const state = subjectStoreReducer({}, action);
      expect(state[SUBJECT_A_ID].last_position).toBeNull();
    });

    test('does not mutate input state', () => {
      const initial = { [SUBJECT_B_ID]: subjectB };
      const frozenInitial = Object.freeze(initial);
      const action = makeNewSubjectAction({ subject_id: SUBJECT_A_ID, subject_data: subjectA });
      expect(() => subjectStoreReducer(frozenInitial, action)).not.toThrow();
      const state = subjectStoreReducer(initial, action);
      expect(state).not.toBe(initial);
    });
  });

  describe('SOCKET_DELETE_SUBJECT', () => {
    test('removes an existing subject from the store', () => {
      const initial = { [SUBJECT_A_ID]: subjectA, [SUBJECT_B_ID]: subjectB };
      const action = socketDeleteSubject({ subject_id: SUBJECT_A_ID, subject_data: null });
      const state = subjectStoreReducer(initial, action);
      expect(state[SUBJECT_A_ID]).toBeUndefined();
      expect(state[SUBJECT_B_ID]).toEqual(subjectB);
    });

    test('is a safe no-op when the subject is not in the store', () => {
      const initial = { [SUBJECT_B_ID]: subjectB };
      const action = socketDeleteSubject({ subject_id: SUBJECT_C_ID, subject_data: null });
      const state = subjectStoreReducer(initial, action);
      expect(state).toEqual(initial);
    });

    test('returns the same state reference when subject_id is not in the store', () => {
      const initial = { [SUBJECT_B_ID]: subjectB };
      const action = socketDeleteSubject({ subject_id: SUBJECT_C_ID, subject_data: null });
      const state = subjectStoreReducer(initial, action);
      expect(state).toBe(initial);
    });

    test('returns an empty store when the only subject is removed', () => {
      const initial = { [SUBJECT_A_ID]: subjectA };
      const action = socketDeleteSubject({ subject_id: SUBJECT_A_ID, subject_data: null });
      const state = subjectStoreReducer(initial, action);
      expect(state).toEqual({});
    });
  });
});

describe('mapSubjectsReducer (default export)', () => {
  const INITIAL = INITIAL_MAP_SUBJECT_STATE;

  describe('FETCH_MAP_SUBJECTS_SUCCESS', () => {
    const makeSuccessAction = (subjects, fetchedQuery) => ({
      type: FETCH_MAP_SUBJECTS_SUCCESS,
      payload: { data: subjects, fetchedQuery },
    });

    test('records the query that was run alongside the subjects it returned', () => {
      const action = makeSuccessAction([subjectA], { bbox: '-1,-1,1,1', params: { use_lkl: false } });
      const state = mapSubjectsReducer(INITIAL, action);

      expect(state.fetchedQuery).toEqual({
        bbox: '-1,-1,1,1',
        params: { use_lkl: false },
        subjectIds: [SUBJECT_A_ID],
      });
    });

    test('replaces the recorded query when a later fetch succeeds', () => {
      const first = mapSubjectsReducer(INITIAL, makeSuccessAction([subjectA], { bbox: '-1,-1,1,1' }));
      const second = mapSubjectsReducer(first, makeSuccessAction([subjectB], { bbox: '-2,-2,2,2' }));

      expect(second.fetchedQuery).toEqual({ bbox: '-2,-2,2,2', subjectIds: [SUBJECT_B_ID] });
    });
  });

  describe('SOCKET_NEW_SUBJECT', () => {
    test('appends the subject_id to mapSubjects.subjects when not present', () => {
      const action = makeNewSubjectAction({ subject_id: SUBJECT_A_ID, subject_data: subjectA });
      const state = mapSubjectsReducer(INITIAL, action);
      expect(state.subjects).toContain(SUBJECT_A_ID);
    });

    test('does not duplicate the subject_id when already present (idempotent)', () => {
      const initial = { bbox: null, subjects: [SUBJECT_A_ID] };
      const action = makeNewSubjectAction({ subject_id: SUBJECT_A_ID, subject_data: subjectA });
      const state = mapSubjectsReducer(initial, action);
      expect(state.subjects.filter((id) => id === SUBJECT_A_ID)).toHaveLength(1);
    });

    test('preserves existing subject IDs', () => {
      const initial = { bbox: null, subjects: [SUBJECT_B_ID] };
      const action = makeNewSubjectAction({ subject_id: SUBJECT_A_ID, subject_data: subjectA });
      const state = mapSubjectsReducer(initial, action);
      expect(state.subjects).toContain(SUBJECT_A_ID);
      expect(state.subjects).toContain(SUBJECT_B_ID);
    });
  });

  describe('SOCKET_DELETE_SUBJECT', () => {
    test('removes the subject_id from mapSubjects.subjects', () => {
      const initial = { bbox: null, subjects: [SUBJECT_A_ID, SUBJECT_B_ID] };
      const action = socketDeleteSubject({ subject_id: SUBJECT_A_ID, subject_data: null });
      const state = mapSubjectsReducer(initial, action);
      expect(state.subjects).not.toContain(SUBJECT_A_ID);
      expect(state.subjects).toContain(SUBJECT_B_ID);
    });

    test('is a safe no-op when the subject_id is not present', () => {
      const initial = { bbox: null, subjects: [SUBJECT_B_ID] };
      const action = socketDeleteSubject({ subject_id: SUBJECT_C_ID, subject_data: null });
      const state = mapSubjectsReducer(initial, action);
      expect(state.subjects).toEqual([SUBJECT_B_ID]);
    });

    test('returns the same state reference when subject_id is not in subjects', () => {
      const initial = { bbox: null, subjects: [SUBJECT_B_ID] };
      const action = socketDeleteSubject({ subject_id: SUBJECT_C_ID, subject_data: null });
      const state = mapSubjectsReducer(initial, action);
      expect(state).toBe(initial);
    });
  });

  describe('SOCKET_NEW_SUBJECT no-op reference equality', () => {
    test('returns the same state reference when subject_id is already present', () => {
      const initial = { bbox: null, subjects: [SUBJECT_A_ID, SUBJECT_B_ID] };
      const action = makeNewSubjectAction({ subject_id: SUBJECT_A_ID, subject_data: subjectA });
      const state = mapSubjectsReducer(initial, action);
      expect(state).toBe(initial);
    });
  });
});

describe('subjectGroupsReducer', () => {
  describe('SOCKET_NEW_SUBJECT', () => {
    test('inserts subject_id into the matching top-level group node', () => {
      const initial = makeGroupTree();
      const action = makeNewSubjectAction({
        subject_id: SUBJECT_C_ID,
        subject_data: makeSubject(SUBJECT_C_ID),
        subject_group_ids: ['group-1'],
      });
      const state = subjectGroupsReducer(initial, action);
      expect(state[0].subjects).toContain(SUBJECT_C_ID);
    });

    test('inserts subject_id into a nested subgroup when its id is listed', () => {
      const initial = makeGroupTree();
      const action = makeNewSubjectAction({
        subject_id: SUBJECT_C_ID,
        subject_data: makeSubject(SUBJECT_C_ID),
        subject_group_ids: ['subgroup-1a'],
      });
      const state = subjectGroupsReducer(initial, action);
      expect(state[0].subgroups[0].subjects).toContain(SUBJECT_C_ID);
      // Parent group-1 subjects unchanged
      expect(state[0].subjects).not.toContain(SUBJECT_C_ID);
    });

    test('inserts into multiple groups when subject_group_ids lists more than one', () => {
      const initial = makeGroupTree();
      const action = makeNewSubjectAction({
        subject_id: SUBJECT_C_ID,
        subject_data: makeSubject(SUBJECT_C_ID),
        subject_group_ids: ['group-1', 'group-2'],
      });
      const state = subjectGroupsReducer(initial, action);
      expect(state[0].subjects).toContain(SUBJECT_C_ID);
      expect(state[1].subjects).toContain(SUBJECT_C_ID);
    });

    test('is idempotent when subject_id is already present in the group', () => {
      const initial = makeGroupTree(); // group-1 already has SUBJECT_B_ID
      const action = makeNewSubjectAction({
        subject_id: SUBJECT_B_ID,
        subject_data: makeSubject(SUBJECT_B_ID),
        subject_group_ids: ['group-1'],
      });
      const state = subjectGroupsReducer(initial, action);
      const count = state[0].subjects.filter((id) => id === SUBJECT_B_ID).length;
      expect(count).toBe(1);
    });

    test('skips unknown group ids without crashing', () => {
      const initial = makeGroupTree();
      const action = makeNewSubjectAction({
        subject_id: SUBJECT_C_ID,
        subject_data: makeSubject(SUBJECT_C_ID),
        subject_group_ids: ['nonexistent-group'],
      });
      expect(() => subjectGroupsReducer(initial, action)).not.toThrow();
      const state = subjectGroupsReducer(initial, action);
      expect(state[0].subjects).toEqual(initial[0].subjects);
    });

    test('is a no-op when subject_group_ids is an empty array', () => {
      const initial = makeGroupTree();
      const action = makeNewSubjectAction({
        subject_id: SUBJECT_C_ID,
        subject_data: makeSubject(SUBJECT_C_ID),
        subject_group_ids: [],
      });
      const state = subjectGroupsReducer(initial, action);
      expect(state).toEqual(initial);
    });

    test('is a no-op when subject_group_ids is missing from payload', () => {
      const initial = makeGroupTree();
      const action = makeNewSubjectAction({
        subject_id: SUBJECT_C_ID,
        subject_data: makeSubject(SUBJECT_C_ID),
      });
      const state = subjectGroupsReducer(initial, action);
      expect(state).toEqual(initial);
    });

    test('does not crash on an empty group tree', () => {
      const action = makeNewSubjectAction({
        subject_id: SUBJECT_C_ID,
        subject_data: makeSubject(SUBJECT_C_ID),
        subject_group_ids: ['group-1'],
      });
      expect(() => subjectGroupsReducer([], action)).not.toThrow();
      expect(subjectGroupsReducer([], action)).toEqual([]);
    });

    test('returns the same tree reference when no group id matches', () => {
      const initial = makeGroupTree();
      const action = makeNewSubjectAction({
        subject_id: SUBJECT_C_ID,
        subject_data: makeSubject(SUBJECT_C_ID),
        subject_group_ids: ['nonexistent-group'],
      });
      const state = subjectGroupsReducer(initial, action);
      expect(state).toBe(initial);
    });

    test('preserves the reference of sibling subtrees that were not modified', () => {
      const initial = makeGroupTree();
      // Only group-1 is targeted; group-2 should keep its reference.
      const action = makeNewSubjectAction({
        subject_id: SUBJECT_C_ID,
        subject_data: makeSubject(SUBJECT_C_ID),
        subject_group_ids: ['group-1'],
      });
      const state = subjectGroupsReducer(initial, action);
      expect(state[1]).toBe(initial[1]);
    });
  });

  describe('SOCKET_DELETE_SUBJECT', () => {
    test('removes the subject_id from a top-level group', () => {
      const initial = makeGroupTree();
      const action = socketDeleteSubject({ subject_id: SUBJECT_B_ID, subject_data: null });
      const state = subjectGroupsReducer(initial, action);
      expect(state[0].subjects).not.toContain(SUBJECT_B_ID);
    });

    test('removes the subject_id from a nested subgroup', () => {
      const initial = makeGroupTree();
      const action = socketDeleteSubject({ subject_id: SUBJECT_A_ID, subject_data: null });
      const state = subjectGroupsReducer(initial, action);
      expect(state[0].subgroups[0].subjects).not.toContain(SUBJECT_A_ID);
    });

    test('leaves groups unaffected that do not contain the subject', () => {
      const initial = makeGroupTree();
      const action = socketDeleteSubject({ subject_id: SUBJECT_A_ID, subject_data: null });
      const state = subjectGroupsReducer(initial, action);
      // group-2 has no subjects and should be unchanged
      expect(state[1]).toEqual(initial[1]);
      // SUBJECT_B_ID in group-1 should survive
      expect(state[0].subjects).toContain(SUBJECT_B_ID);
    });

    test('is a safe no-op when the subject is not in any group', () => {
      const initial = makeGroupTree();
      const action = socketDeleteSubject({ subject_id: SUBJECT_C_ID, subject_data: null });
      // Should not throw and should preserve structure
      expect(() => subjectGroupsReducer(initial, action)).not.toThrow();
      const state = subjectGroupsReducer(initial, action);
      expect(state[0].subjects).toContain(SUBJECT_B_ID);
      expect(state[0].subgroups[0].subjects).toContain(SUBJECT_A_ID);
    });

    test('is a safe no-op when the group tree is empty', () => {
      const action = socketDeleteSubject({ subject_id: SUBJECT_A_ID, subject_data: null });
      expect(() => subjectGroupsReducer([], action)).not.toThrow();
      expect(subjectGroupsReducer([], action)).toEqual([]);
    });
  });

  describe('mutation safety', () => {
    test('SOCKET_NEW_SUBJECT does not mutate the input tree', () => {
      const initial = makeGroupTree();
      const originalSubjects = [...initial[0].subjects];
      const action = makeNewSubjectAction({
        subject_id: SUBJECT_C_ID,
        subject_data: makeSubject(SUBJECT_C_ID),
        subject_group_ids: ['group-1'],
      });
      const state = subjectGroupsReducer(initial, action);
      // New array returned
      expect(state).not.toBe(initial);
      expect(state[0]).not.toBe(initial[0]);
      // Original input subjects array untouched
      expect(initial[0].subjects).toEqual(originalSubjects);
      expect(initial[0].subjects).not.toContain(SUBJECT_C_ID);
    });

    test('SOCKET_DELETE_SUBJECT does not mutate the input tree', () => {
      const initial = makeGroupTree();
      const originalSubjects = [...initial[0].subjects];
      const action = socketDeleteSubject({ subject_id: SUBJECT_B_ID, subject_data: null });
      const state = subjectGroupsReducer(initial, action);
      // New array returned
      expect(state).not.toBe(initial);
      expect(state[0]).not.toBe(initial[0]);
      // Original input subjects array still contains the removed id
      expect(initial[0].subjects).toEqual(originalSubjects);
      expect(initial[0].subjects).toContain(SUBJECT_B_ID);
    });

    test('SOCKET_DELETE_SUBJECT preserves the reference of untouched group nodes', () => {
      const initial = makeGroupTree();
      // Delete SUBJECT_A_ID which is only in subgroup-1a inside group-1.
      // group-2 has no such subject so its reference should be unchanged.
      const action = socketDeleteSubject({ subject_id: SUBJECT_A_ID, subject_data: null });
      const state = subjectGroupsReducer(initial, action);
      expect(state[1]).toBe(initial[1]);
    });
  });
});

describe('subjectStoreReducer — SOCKET_SUBJECT_STATUS after SOCKET_NEW_SUBJECT', () => {
  // Regression test: a subject inserted via SOCKET_NEW_SUBJECT has last_position: null.
  // When its first subject_status arrives, the store should be populated (not crash).
  test('populates last_position in the store when subject started with null position', () => {
    const subjectWithNoPosition = makeSubject(SUBJECT_A_ID); // last_position: null

    // Step 1: insert via new_subject
    const insertAction = { type: SOCKET_NEW_SUBJECT, payload: { subject_id: SUBJECT_A_ID, subject_data: subjectWithNoPosition } };
    const storeAfterInsert = subjectStoreReducer({}, insertAction);
    expect(storeAfterInsert[SUBJECT_A_ID].last_position).toBeNull();

    // Step 2: first position update arrives via subject_status
    const statusUpdate = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-122.38, 47.52] },
      properties: {
        id: SUBJECT_A_ID,
        title: 'Subject A',
        state: 'online',
        last_voice_call_start_at: null,
        radio_state_at: '2024-01-01T10:00:00Z',
        image: '/static/dugong-male.svg',
        coordinateProperties: { time: '2024-01-01T10:00:00Z' },
      },
    };
    const statusAction = { type: 'SOCKET_SUBJECT_STATUS', payload: statusUpdate };
    expect(() => subjectStoreReducer(storeAfterInsert, statusAction)).not.toThrow();
    const storeAfterStatus = subjectStoreReducer(storeAfterInsert, statusAction);

    expect(storeAfterStatus[SUBJECT_A_ID].last_position).not.toBeNull();
    expect(storeAfterStatus[SUBJECT_A_ID].last_position.geometry.coordinates).toEqual([-122.38, 47.52]);
    expect(storeAfterStatus[SUBJECT_A_ID].last_position_date).toBe('2024-01-01T10:00:00Z');
  });
});

describe('fetchMapSubjects thunk', () => {
  const LAST_KNOWN_BBOX = '-1,-1,1,1';
  const COVERING_BBOX = '-10,-10,10,10';
  const SCRUBBED_INTO_PAST = { active: true, hasScrubbedIntoPast: true };
  const SLIDER_CLOSED = { active: false, hasScrubbedIntoPast: false };

  // A null map makes the thunk reuse the stored bbox, so the map itself needs no mocking.
  const dispatchFetch = (timeSliderState, { fetchedQuery, params } = {}) => mockStore({
    data: {
      mapSubjects: { bbox: LAST_KNOWN_BBOX, fetchedQuery, subjects: [] },
      subjectStore: { [SUBJECT_A_ID]: subjectA },
    },
    view: { timeSliderState },
  }).dispatch(fetchMapSubjects(null, params));

  const getRequestParams = () => axios.get.mock.calls[0][1].params;

  // The query the thunk builds for an observation scan carrying no extra parameters.
  const SCAN_PARAMS = { include_inactive: false, use_lkl: false };

  // What the store holds after an observation scan of a viewport wider than LAST_KNOWN_BBOX.
  const COVERED_SCAN = {
    bbox: COVERING_BBOX,
    fetchedAt: Date.now(),
    params: SCAN_PARAMS,
    subjectIds: [SUBJECT_A_ID],
  };

  beforeEach(() => {
    jest.spyOn(axios, 'get').mockResolvedValue({ data: { data: [] } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('asks for last known locations when the time slider is inactive', async () => {
    await dispatchFetch(SLIDER_CLOSED);

    expect(getRequestParams().use_lkl).toBe(true);
  });

  test('asks for last known locations while the time slider sits at the end of its range', async () => {
    await dispatchFetch({ active: true, hasScrubbedIntoPast: false });

    expect(getRequestParams().use_lkl).toBe(true);
  });

  test('matches the bbox against observations once the slider has been scrubbed into the past', async () => {
    await dispatchFetch(SCRUBBED_INTO_PAST);

    expect(getRequestParams().use_lkl).toBe(false);
  });

  test('cancels the request that is in flight, not the one it was exported beside', async () => {
    // Two fetches, so the request in flight is no longer using the original cancel token source.
    await dispatchFetch(SLIDER_CLOSED);
    await dispatchFetch(SLIDER_CLOSED);

    const { cancelToken } = axios.get.mock.calls[axios.get.mock.calls.length - 1][1];
    expect(cancelToken.reason).toBeUndefined();

    cancelMapSubjectsFetch();

    expect(cancelToken.reason).toBeDefined();
  });

  test('skips the observation scan for a viewport already covered by one', async () => {
    await dispatchFetch(SCRUBBED_INTO_PAST, { fetchedQuery: COVERED_SCAN });

    expect(axios.get).not.toHaveBeenCalled();
  });

  test('hands back the covered subjects, so a missing track is still requested', async () => {
    const covered = await dispatchFetch(SCRUBBED_INTO_PAST, { fetchedQuery: COVERED_SCAN });

    expect(covered).toEqual([subjectA]);
  });

  test('runs the observation scan when the viewport reaches outside the covered one', async () => {
    await dispatchFetch(SCRUBBED_INTO_PAST, {
      fetchedQuery: { ...COVERED_SCAN, bbox: '-0.5,-0.5,0.5,0.5' },
    });

    expect(axios.get).toHaveBeenCalled();
  });

  test('runs the observation scan again once the covered one has aged out', async () => {
    await dispatchFetch(SCRUBBED_INTO_PAST, {
      fetchedQuery: { ...COVERED_SCAN, fetchedAt: Date.now() - COVERED_SCAN_MAX_AGE_MS - 1 },
    });

    expect(axios.get).toHaveBeenCalled();
  });

  test('runs the observation scan when the covered result answered a different query', async () => {
    await dispatchFetch(SCRUBBED_INTO_PAST, {
      fetchedQuery: COVERED_SCAN,
      params: { updated_since: '2026-07-01T00:00:00.000Z' },
    });

    expect(axios.get).toHaveBeenCalled();
  });

  test('still asks for last known locations for a covered viewport, so subjects moving in appear', async () => {
    await dispatchFetch(SLIDER_CLOSED, {
      fetchedQuery: { ...COVERED_SCAN, params: { include_inactive: false, use_lkl: true } },
    });

    expect(axios.get).toHaveBeenCalled();
  });

  test('records the query it ran so a later fetch can be skipped', async () => {
    const store = mockStore({
      data: { mapSubjects: { bbox: LAST_KNOWN_BBOX, fetchedQuery: null, subjects: [] } },
      view: { timeSliderState: SCRUBBED_INTO_PAST },
    });

    await store.dispatch(fetchMapSubjects(null));

    const successAction = store.getActions().find(({ type }) => type === 'FETCH_MAP_SUBJECTS_SUCCESS');
    expect(successAction.payload.fetchedQuery).toEqual({
      bbox: LAST_KNOWN_BBOX,
      fetchedAt: expect.any(Number),
      params: SCAN_PARAMS,
    });
  });

  test('asks for last known locations when there is no time slider state at all', async () => {
    await dispatchFetch(undefined);

    expect(getRequestParams().use_lkl).toBe(true);
  });
});
