import * as socketHandlers from './handlers';
import * as toastUtils from '../utils/toast';
import store from '../store';

const { showFilterMismatchToastForHiddenReports } = socketHandlers;
const { showErrorToast } = toastUtils;

const MOCK_USER_ID = '12312-adsfsadf-e413-666';

jest.mock('../store');

beforeEach(() => {
  jest.spyOn(socketHandlers, 'showFilterMismatchToastForHiddenReports');
  jest.spyOn(toastUtils, 'showErrorToast');

  store.getState.mockReturnValue({
    data: {
      user: {
        id: MOCK_USER_ID,
      }, eventTypes: [],
    }
  });
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
  }, event_id: '2-dasdf-23113', };

  showFilterMismatchToastForHiddenReports(msg);

  expect(showErrorToast).toHaveBeenCalled();
});