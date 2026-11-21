import { applyMiddleware, combineReducers, legacy_createStore as createStore } from 'redux';
import { thunk } from 'redux-thunk';

import eventFilterReducer from '../ducks/event-filter';
import timeSliderReducer, { setVirtualDate } from '../ducks/timeslider';

import { setTimeSliderAt, TIME_SLIDER_MOUNT_DELAY_MS, TIME_SLIDER_RESET_TIMEOUT_MS, waitUntil } from './atlas-view';

// The real duck reaches the app's store through its imports.
jest.mock('../ducks/tracks', () => ({
  setTrackLengthOrigin: (origin) => ({ payload: origin, type: 'SET_TRACK_SETTINGS_TRACK_LENGTH_ORIGIN' }),
}));

const trackSettingsReducer = (state = { origin: 'CUSTOM_LENGTH' }, action) => action.type === 'SET_TRACK_SETTINGS_TRACK_LENGTH_ORIGIN'
  ? { ...state, origin: action.payload }
  : state;

const buildStore = () => createStore(
  combineReducers({
    data: combineReducers({ eventFilter: eventFilterReducer }),
    view: combineReducers({ timeSliderState: timeSliderReducer, trackSettings: trackSettingsReducer }),
  }),
  applyMiddleware(thunk)
);

describe('utils - atlas-view', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('waitUntil', () => {
    test('resolves true at once when the predicate already holds', async () => {
      await expect(waitUntil(() => true, { timeoutMs: 10 })).resolves.toBe(true);
    });

    test('resolves true once a store change makes the predicate hold', async () => {
      const store = buildStore();
      const waiting = waitUntil(() => store.getState().view.timeSliderState.active, { store, timeoutMs: 1000 });

      store.dispatch({ payload: true, type: 'SET_ACTIVE_STATE' });

      await expect(waiting).resolves.toBe(true);
    });

    test('polls without a store', async () => {
      let isDone = false;
      const waiting = waitUntil(() => isDone, { timeoutMs: 1000 });

      isDone = true;
      await jest.advanceTimersByTimeAsync(60);

      await expect(waiting).resolves.toBe(true);
    });

    test('resolves false after the timeout', async () => {
      const waiting = waitUntil(() => false, { timeoutMs: 1000 });

      await jest.advanceTimersByTimeAsync(1000);

      await expect(waiting).resolves.toBe(false);
    });

    test('treats a throwing predicate as not holding', async () => {
      const waiting = waitUntil(() => {
        throw new Error('not yet');
      }, { timeoutMs: 100 });

      await jest.advanceTimersByTimeAsync(100);

      await expect(waiting).resolves.toBe(false);
    });
  });

  describe('setTimeSliderAt', () => {
    const lower = '2026-11-01T00:00:00.000Z';
    const upper = '2026-11-05T00:00:00.000Z';
    const virtualDate = '2026-11-03T00:00:00.000Z';

    test('sets the date once the slider has reset it to the range end', async () => {
      const store = buildStore();
      const setting = setTimeSliderAt(store, { dateRange: { lower, upper }, origin: 'EVENT_FILTER', virtualDate });

      expect(store.getState().view.timeSliderState.virtualDate).toBeNull();

      store.dispatch(setVirtualDate(upper));
      await setting;

      expect(store.getState().data.eventFilter.filter.date_range).toEqual({ lower, upper });
      expect(store.getState().view.trackSettings.origin).toBe('EVENT_FILTER');
      expect(store.getState().view.timeSliderState).toEqual(expect.objectContaining({ active: true, virtualDate }));
    });

    test('sets the date after a timeout when the reset never comes', async () => {
      const store = buildStore();
      const setting = setTimeSliderAt(store, { dateRange: { lower, upper }, virtualDate });

      await jest.advanceTimersByTimeAsync(TIME_SLIDER_RESET_TIMEOUT_MS);
      await setting;

      expect(store.getState().view.timeSliderState.virtualDate).toBe(virtualDate);
    });

    test('waits out the mount of a slider over an open-ended range', async () => {
      const store = buildStore();
      const setting = setTimeSliderAt(store, { dateRange: { lower, upper: null }, virtualDate });

      await jest.advanceTimersByTimeAsync(TIME_SLIDER_MOUNT_DELAY_MS - 1);
      expect(store.getState().view.timeSliderState.virtualDate).toBeNull();

      await jest.advanceTimersByTimeAsync(1);
      await setting;

      expect(store.getState().view.timeSliderState.virtualDate).toBe(virtualDate);
    });

    test('does not wait when the slider is on and the range is unchanged', async () => {
      const store = buildStore();
      store.dispatch({ payload: { filter: { date_range: { lower, upper } } }, type: 'UPDATE_EVENT_FILTER' });
      store.dispatch({ payload: true, type: 'SET_ACTIVE_STATE' });

      await setTimeSliderAt(store, { dateRange: { lower, upper }, virtualDate });

      expect(store.getState().view.timeSliderState.virtualDate).toBe(virtualDate);
    });
  });
});
