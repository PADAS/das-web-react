import isEqual from 'react-fast-compare';

import { setTimeSliderState, setVirtualDate } from '../ducks/timeslider';
import { setTrackLengthOrigin } from '../ducks/tracks';
import { updateEventFilter } from '../ducks/event-filter';

export const TIME_SLIDER_RESET_TIMEOUT_MS = 2000;
// Without an end to the range the slider's mount reset leaves no trace in the
// store, so it can only be waited out.
export const TIME_SLIDER_MOUNT_DELAY_MS = 400;
const POLL_INTERVAL_MS = 50;

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTrue = (predicate) => {
  try {
    return !!predicate();
  } catch {
    return false;
  }
};

// Resolves true once the predicate holds, or false after the timeout. With a
// store it is checked on every store change, otherwise it is polled.
export const waitUntil = (predicate, { store, timeoutMs }) => new Promise((resolve) => {
  if (isTrue(predicate)) {
    resolve(true);

    return;
  }

  let unsubscribe, intervalId;
  const finish = (result) => {
    clearTimeout(timeoutId);
    clearInterval(intervalId);
    unsubscribe?.();
    resolve(result);
  };
  const check = () => {
    if (isTrue(predicate)) finish(true);
  };

  const timeoutId = setTimeout(() => finish(false), timeoutMs);

  if (store) {
    unsubscribe = store.subscribe(check);
  } else {
    intervalId = setInterval(check, POLL_INTERVAL_MS);
  }
});

const selectTimeSliderState = (state) => state.view.timeSliderState;
const selectEventFilterDateRange = (state) => state.data.eventFilter.filter.date_range;

/* The slider's range is the event filter's date range, and the slider resets
   its date to the range end when it mounts or the range moves. So the range
   is set first, the slider turned on, and the date only set once that reset
   has landed. */
export const setTimeSliderAt = async (store, { dateRange, origin, virtualDate }) => {
  const wasActive = selectTimeSliderState(store.getState()).active;
  const previousDateRange = selectEventFilterDateRange(store.getState());

  if (dateRange) store.dispatch(updateEventFilter({ filter: { date_range: dateRange } }));
  if (origin) store.dispatch(setTrackLengthOrigin(origin));

  const currentDateRange = selectEventFilterDateRange(store.getState());

  store.dispatch(setTimeSliderState(true));

  if (!wasActive || !isEqual(previousDateRange, currentDateRange)) {
    if (currentDateRange.upper) {
      await waitUntil(
        () => selectTimeSliderState(store.getState()).virtualDate === currentDateRange.upper,
        { store, timeoutMs: TIME_SLIDER_RESET_TIMEOUT_MS }
      );
    } else {
      await sleep(TIME_SLIDER_MOUNT_DELAY_MS);
    }
  }

  if (virtualDate) store.dispatch(setVirtualDate(virtualDate));
};

// A bbox without area would make fitBounds zoom all the way in, so it becomes
// a single point that jumpToLocation centers on instead.
export const calcJumpCoordinatesForBbox = ([west, south, east, north]) => (west === east && south === north
  ? [west, south]
  : [[west, south], [east, north]]);
