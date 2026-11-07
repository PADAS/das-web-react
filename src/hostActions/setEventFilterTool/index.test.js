import { mockStore } from '../../__test-helpers/MockStore';
import { INITIAL_FILTER_STATE, UPDATE_EVENT_FILTER } from '../../ducks/event-filter';

import setEventFilterTool from './';

describe('hostActions - setEventFilterTool', () => {
  let store;
  beforeEach(() => {
    store = mockStore({ data: { eventFilter: INITIAL_FILTER_STATE } });
  });

  const runTool = (args) => setEventFilterTool.run(args, { dispatch: store.dispatch, getState: store.getState });

  test('updates only the filters it is given, translating priority and state keys to API values', async () => {
    await runTool({ priorities: ['red', 'none'], states: ['active', 'resolved'], text: 'snare' });

    expect(store.getActions()).toEqual([{
      payload: { filter: { priority: [300, 0], text: 'snare' }, state: ['active', 'new', 'resolved'] },
      type: UPDATE_EVENT_FILTER,
    }]);
  });

  test('sends no state for an empty state list, which the API reads as every state', async () => {
    await runTool({ states: [] });

    expect(store.getActions()[0].payload).toEqual({ filter: {}, state: null });
  });

  test('resets the search and every filter but the date range before applying the rest', async () => {
    await runTool({ priorities: ['amber'], reset: true });

    expect(store.getActions()).toEqual([
      {
        payload: {
          filter: { event_type: [], priority: [], reported_by: [], text: '' },
          state: INITIAL_FILTER_STATE.state,
        },
        type: UPDATE_EVENT_FILTER,
      },
      { payload: { filter: { priority: [200] } }, type: UPDATE_EVENT_FILTER },
    ]);
  });

  test('resolves with the filter in effect, in the keys the tool takes', async () => {
    await expect(runTool({ text: 'snare' })).resolves.toEqual({
      date_range: INITIAL_FILTER_STATE.filter.date_range,
      event_type_ids: [],
      priorities: [],
      reported_by_ids: [],
      states: ['active', 'review'],
      text: '',
    });
  });
});
