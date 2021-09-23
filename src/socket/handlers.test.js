import * as socketHandlers from './handlers';
import * as toastUtils from '../utils/toast';
import store from '../store';

const { showFilterMismatchToastForHiddenReports } = socketHandlers;

const MOCK_USER_ID = '12312-adsfsadf-e413-666';

jest.mock('../store');

beforeEach(() => {
  jest.spyOn(toastUtils, 'showErrorToast');

  store.getState.mockReturnValue({
    data: {
      user: {
        id: MOCK_USER_ID,
      }, eventTypes: [],
    }
  });
});

afterEach(() => {
  toastUtils.showErrorToast.mockRestore();
});

test('showing a warning toast when a new event does not match the current report filter', () => {
  const msg = { event_data: {
    title: 'howdy',
    updates: [
      {
        time: new Date().toISOString(),
        user: {
          id: MOCK_USER_ID,
        }
      }
    ]
  }, matches_current_filter: false };

  const filterMatchMsg = {
    ...msg,
    matches_current_filter: true,
  };

  /* the toast is shown for a recent non-matching item */
  showFilterMismatchToastForHiddenReports(msg);
  expect(toastUtils.showErrorToast).toHaveBeenCalledTimes(1);

  /* the toast is not shown for a recent matching item */
  showFilterMismatchToastForHiddenReports(filterMatchMsg);
  expect(toastUtils.showErrorToast).toHaveBeenCalledTimes(1);
});