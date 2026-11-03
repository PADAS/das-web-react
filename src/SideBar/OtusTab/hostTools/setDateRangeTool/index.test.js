import { mockStore } from '../../../../__test-helpers/MockStore';
import { RESET_DATE_RANGE, UPDATE_DATE_RANGE } from '../../../../ducks/global-date-range';

import setDateRangeTool from './';

const DATE_RANGE = { lower: '2026-10-01T00:00:00.000Z', upper: '2026-10-31T00:00:00.000Z' };

describe('SideBar - OtusTab - hostTools - setDateRangeTool', () => {
  let store;
  beforeEach(() => {
    store = mockStore({ data: { eventFilter: { filter: { date_range: DATE_RANGE } } } });
  });

  const runTool = (args) => setDateRangeTool.run(args, { dispatch: store.dispatch, getState: store.getState });

  test('keeps the bound it is not given', async () => {
    await runTool({ lower: '2026-09-01T00:00:00.000Z' });

    expect(store.getActions()).toEqual([{
      payload: { lower: '2026-09-01T00:00:00.000Z', upper: DATE_RANGE.upper },
      type: UPDATE_DATE_RANGE,
    }]);
  });

  test('clears the upper bound when given null', async () => {
    await runTool({ upper: null });

    expect(store.getActions()[0].payload).toEqual({ lower: DATE_RANGE.lower, upper: null });
  });

  test('returns to the default range on reset, ignoring any bounds', async () => {
    await runTool({ lower: '2026-09-01T00:00:00.000Z', reset: true });

    expect(store.getActions()).toEqual([{ type: RESET_DATE_RANGE }]);
  });
});
