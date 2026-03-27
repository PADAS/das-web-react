import axios from 'axios';

import { mockStore } from '../../__test-helpers/MockStore';
import { showToast } from '../../utils/toast';
import { API_URL } from '../../constants';

import {
  fetchAllGear,
  gearReducer,
  hideGearOnMap,
  INITIAL_GEAR_STATE,
  showGearOnMap,
} from './';

jest.mock('../../utils/toast', () => ({
  showToast: jest.fn(),
}));

const GEAR_ENDPOINT = `${API_URL}gear`;

describe('Ducks - Gear', () => {
  test('hideGearOnMap dispatches HIDE_GEAR_ON_MAP with ids', () => {
    expect(hideGearOnMap('a', 'b')).toEqual({
      type: 'HIDE_GEAR_ON_MAP',
      payload: ['a', 'b'],
    });
  });

  test('showGearOnMap dispatches SHOW_GEAR_ON_MAP with ids', () => {
    expect(showGearOnMap('x')).toEqual({
      type: 'SHOW_GEAR_ON_MAP',
      payload: ['x'],
    });
  });

  describe('gearReducer', () => {
    test('returns the initial state', () => {
      expect(gearReducer(undefined, {})).toEqual(INITIAL_GEAR_STATE);
    });

    test('FETCH_GEAR_START clears error and sets loading', () => {
      const state = { ...INITIAL_GEAR_STATE, error: 'oops', loading: false };
      const next = gearReducer(state, { type: 'FETCH_GEAR_START' });
      expect(next.error).toBeNull();
      expect(next.loading).toBe(true);
      expect(next.initialLoadInProgress).toBe(true);
    });

    test('FETCH_GEAR_APPEND_PAGE merges rows and sets hasGear', () => {
      const action = { type: 'FETCH_GEAR_APPEND_PAGE', payload: [{ id: '1', name: 'A' }] };
      const next = gearReducer(INITIAL_GEAR_STATE, action);
      expect(next.allIds).toEqual(['1']);
      expect(next.byId['1'].name).toBe('A');
      expect(next.hasGear).toBe(true);
    });

    test('FETCH_GEAR_SUCCESS rebuilds index and prunes stale hidden ids', () => {
      const prior = {
        ...INITIAL_GEAR_STATE,
        hiddenGearIds: ['gone', '2'],
        allIds: ['gone'],
        byId: { gone: { id: 'gone' } },
      };
      const next = gearReducer(prior, {
        type: 'FETCH_GEAR_SUCCESS',
        payload: [{ id: '2', name: 'B' }],
      });
      expect(next.allIds).toEqual(['2']);
      expect(next.byId['2'].name).toBe('B');
      expect(next.hiddenGearIds).toEqual(['2']);
      expect(next.loading).toBe(false);
      expect(next.error).toBeNull();
    });

    test('FETCH_GEAR_ERROR stores the message string', () => {
      const next = gearReducer(
        { ...INITIAL_GEAR_STATE, loading: true, initialLoadInProgress: true },
        { type: 'FETCH_GEAR_ERROR', payload: 'bad' },
      );
      expect(next.error).toBe('bad');
      expect(next.loading).toBe(false);
      expect(next.initialLoadInProgress).toBe(false);
    });

    test('HIDE_GEAR_ON_MAP and SHOW_GEAR_ON_MAP update hiddenGearIds', () => {
      let state = gearReducer(INITIAL_GEAR_STATE, hideGearOnMap('1', '2'));
      expect(state.hiddenGearIds).toEqual(['1', '2']);
      state = gearReducer(state, showGearOnMap('1'));
      expect(state.hiddenGearIds).toEqual(['2']);
    });
  });

  describe('fetchAllGear', () => {
    afterEach(() => {
      jest.restoreAllMocks();
      showToast.mockClear();
    });

    test('paginates, appends pages on first load, then dispatches success', async () => {
      jest.spyOn(axios, 'get')
        .mockResolvedValueOnce({ data: { results: [{ id: '1' }], next: 'http://n' } })
        .mockResolvedValueOnce({ data: { results: [{ id: '2' }], next: null } });

      const store = mockStore({ data: { gear: INITIAL_GEAR_STATE } });
      await store.dispatch(fetchAllGear());

      const types = store.getActions().map((a) => a.type);
      expect(types).toEqual([
        'FETCH_GEAR_START',
        'FETCH_GEAR_APPEND_PAGE',
        'FETCH_GEAR_APPEND_PAGE',
        'FETCH_GEAR_SUCCESS',
      ]);
      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(axios.get.mock.calls[0][0]).toBe(GEAR_ENDPOINT);
      expect(axios.get.mock.calls[0][1]).toMatchObject({ params: { page: 1, page_size: 100 } });
      expect(axios.get.mock.calls[1][1]).toMatchObject({ params: { page: 2, page_size: 100 } });
    });

    test('refresh with existing data skips append and only succeeds', async () => {
      jest.spyOn(axios, 'get').mockResolvedValue({
        data: { results: [{ id: '9' }], next: null },
      });

      const existing = {
        ...INITIAL_GEAR_STATE,
        allIds: ['9'],
        byId: { 9: { id: '9' } },
        hasGear: true,
      };
      const store = mockStore({ data: { gear: existing } });
      await store.dispatch(fetchAllGear());

      expect(store.getActions().map((a) => a.type)).toEqual([
        'FETCH_GEAR_START',
        'FETCH_GEAR_SUCCESS',
      ]);
    });

    test('dispatches error and toast on failure', async () => {
      jest.spyOn(axios, 'get').mockRejectedValue({
        message: 'network',
        response: { data: { detail: 'Forbidden' } },
      });

      const store = mockStore({ data: { gear: INITIAL_GEAR_STATE } });
      const result = await store.dispatch(fetchAllGear());

      expect(result).toEqual([]);
      expect(store.getActions().map((a) => a.type)).toEqual([
        'FETCH_GEAR_START',
        'FETCH_GEAR_ERROR',
      ]);
      expect(store.getActions()[1].payload).toBe('Forbidden');
      expect(showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Forbidden',
          toastConfig: { type: 'error' },
        }),
      );
    });
  });
});
