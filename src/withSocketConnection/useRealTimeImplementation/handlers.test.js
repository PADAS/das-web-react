import * as socketHandlers from './handlers';
import * as toastUtils from '../../utils/toast';
import store from '../../store';

const { showFilterMismatchToastForHiddenReports } = socketHandlers;

const MOCK_PROFILE_ID = '98765-profile-e413-777';
const MOCK_USER_ID = '12312-adsfsadf-e413-666';

jest.mock('../../store');

beforeEach(() => {
  jest.spyOn(toastUtils, 'showToast');

  store.getState.mockReturnValue({
    data: {
      user: {
        id: MOCK_USER_ID,
      }, eventTypes: [],
    }
  });
});

afterEach(() => {
  toastUtils.showToast.mockRestore();
});

const msg = {
  event_data: {
    title: 'howdy',
    updates: [
      {
        time: new Date().toISOString(),
        user: {
          id: MOCK_USER_ID,
        }
      }
    ]
  }, matches_current_filter: false
};

test('showing a warning toast when a new event does not match the current report filter', () => {
  showFilterMismatchToastForHiddenReports(msg);
  expect(toastUtils.showToast).toHaveBeenCalledTimes(1);
});

test('not showing a warning toast when a new event does match the current filter', () => {
  const filterMatchMsg = {
    ...msg,
    matches_current_filter: true,
  };

  showFilterMismatchToastForHiddenReports(filterMatchMsg);
  expect(toastUtils.showToast).not.toHaveBeenCalled();
});

test('shows a warning toast when an event the active profile created does not match the current filter', () => {
  store.getState.mockReturnValue({
    data: { eventTypes: [], selectedUserProfile: { id: MOCK_PROFILE_ID }, user: { id: MOCK_USER_ID } },
  });
  const profileMsg = {
    ...msg,
    event_data: { ...msg.event_data, updates: [{ time: new Date().toISOString(), user: { id: MOCK_PROFILE_ID } }] },
  };

  showFilterMismatchToastForHiddenReports(profileMsg);
  expect(toastUtils.showToast).toHaveBeenCalledTimes(1);
});
