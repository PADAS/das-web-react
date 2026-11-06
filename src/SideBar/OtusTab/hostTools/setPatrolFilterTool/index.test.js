import { mockStore } from '../../../../__test-helpers/MockStore';
import { INITIAL_FILTER_STATE, UPDATE_PATROL_FILTER } from '../../../../ducks/patrol-filter';

import setPatrolFilterTool from './';

describe('SideBar - OtusTab - hostTools - setPatrolFilterTool', () => {
  let store;
  beforeEach(() => {
    store = mockStore({ data: { patrolFilter: INITIAL_FILTER_STATE } });
  });

  const runTool = (args) => setPatrolFilterTool.run(args, { dispatch: store.dispatch, getState: store.getState });

  test('updates only the filters it is given', async () => {
    await runTool({ statuses: ['active', 'done'], tracked_by_ids: ['a-team-lead-id'] });

    expect(store.getActions()).toEqual([{
      payload: { filter: { tracked_by: ['a-team-lead-id'] }, status: ['active', 'done'] },
      type: UPDATE_PATROL_FILTER,
    }]);
  });

  test('resets the search and every filter but the date range before applying the rest', async () => {
    await runTool({ reset: true, text: 'north' });

    expect(store.getActions()).toEqual([
      { payload: { filter: { patrol_type: [], text: '', tracked_by: [] }, status: [] }, type: UPDATE_PATROL_FILTER },
      { payload: { filter: { text: 'north' } }, type: UPDATE_PATROL_FILTER },
    ]);
  });

  test('resolves with the filter in effect, in the keys the tool takes', async () => {
    await expect(runTool({ text: 'north' })).resolves.toEqual({
      date_range: INITIAL_FILTER_STATE.filter.date_range,
      patrol_type_ids: [],
      statuses: [],
      text: '',
      tracked_by_ids: [],
    });
  });
});
