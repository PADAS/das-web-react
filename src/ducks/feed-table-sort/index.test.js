import { DELETE_PATROL_BY_ID, REMOVE_PATROL_FROM_FEED } from '../patrols';
import { REMOVE_EVENT_BY_ID } from '../events';
import { TAB_KEYS } from '../../constants';

import feedTableSortReducer, {
  addFeedTableFullLoadPage,
  INITIAL_STATE,
  setFeedTableClientSort,
  startFeedTableFullLoad,
} from './';

const URL = 'https://das/events?use_cursor=true';

describe('feedTableSortReducer', () => {
  const loadedState = (tab, ids) => feedTableSortReducer(
    feedTableSortReducer(INITIAL_STATE, startFeedTableFullLoad(tab, 'key-1', URL)),
    addFeedTableFullLoadPage(tab, 'key-1', ids, null)
  );

  test('keeps the sort of each table apart', () => {
    const state = feedTableSortReducer(INITIAL_STATE, setFeedTableClientSort(TAB_KEYS.PATROLS, { colId: 'title' }));

    expect(state[TAB_KEYS.PATROLS].clientSort).toEqual({ colId: 'title' });
    expect(state[TAB_KEYS.EVENTS].clientSort).toBeNull();
  });

  test('shows the rows of a load once its last page arrives', () => {
    let state = feedTableSortReducer(INITIAL_STATE, startFeedTableFullLoad(TAB_KEYS.EVENTS, 'key-1', URL));
    state = feedTableSortReducer(state, addFeedTableFullLoadPage(TAB_KEYS.EVENTS, 'key-1', ['event-1'], `${URL}&cursor=2`));

    expect(state[TAB_KEYS.EVENTS].fullLoad).toMatchObject({ ids: [], loadingIds: ['event-1'], next: `${URL}&cursor=2` });

    state = feedTableSortReducer(state, addFeedTableFullLoadPage(TAB_KEYS.EVENTS, 'key-1', ['event-1', 'event-2'], null));

    expect(state[TAB_KEYS.EVENTS].fullLoad).toMatchObject({ ids: ['event-1', 'event-2'], loadingIds: [], next: null });
  });

  test('ignores a page of a load that was restarted', () => {
    const state = feedTableSortReducer(INITIAL_STATE, startFeedTableFullLoad(TAB_KEYS.EVENTS, 'key-2', URL));

    expect(feedTableSortReducer(state, addFeedTableFullLoadPage(TAB_KEYS.EVENTS, 'key-1', ['event-1'], null)))
      .toBe(state);
  });

  test('keeps the loaded rows while the same rows load again, but not for another filter', () => {
    const state = loadedState(TAB_KEYS.EVENTS, ['event-1']);

    expect(feedTableSortReducer(state, startFeedTableFullLoad(TAB_KEYS.EVENTS, 'key-2', URL))[TAB_KEYS.EVENTS]
      .fullLoad.ids).toEqual(['event-1']);
    expect(feedTableSortReducer(state, startFeedTableFullLoad(TAB_KEYS.EVENTS, 'key-2', `${URL}&state=active`))[
      TAB_KEYS.EVENTS].fullLoad.ids).toEqual([]);
  });

  test('drops an event that leaves the feed', () => {
    const state = feedTableSortReducer(
      loadedState(TAB_KEYS.EVENTS, ['event-1', 'event-2']),
      { payload: 'event-1', type: REMOVE_EVENT_BY_ID }
    );

    expect(state[TAB_KEYS.EVENTS].fullLoad.ids).toEqual(['event-2']);
  });

  test('drops a patrol that leaves the feed or is deleted', () => {
    let state = loadedState(TAB_KEYS.PATROLS, ['patrol-1', 'patrol-2', 'patrol-3']);
    state = feedTableSortReducer(state, { payload: 'patrol-1', type: REMOVE_PATROL_FROM_FEED });
    state = feedTableSortReducer(state, { payload: 'patrol-2', type: DELETE_PATROL_BY_ID });

    expect(state[TAB_KEYS.PATROLS].fullLoad.ids).toEqual(['patrol-3']);
  });
});
