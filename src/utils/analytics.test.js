import { trackEventFactory, MAP_INTERACTION_CATEGORY, REPORTS_CATEGORY, createUserAnalyticsData } from './analytics';
import getWindowLocation from './getWindowLocation';

let tracker;

jest.mock('./getWindowLocation', () => jest.fn());

beforeEach(() => {
  tracker = jest.fn();

  getWindowLocation.mockImplementation(() => ({
    pathname: '/test-path',
    hostname: 'test.earthranger.com'
  }));

  jest.useFakeTimers();
});

test('it will trigger track for provided category', () => {
  const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY, tracker);
  mapInteractionTracker.track('some action', 'some label');

  expect(tracker).toHaveBeenCalledWith(MAP_INTERACTION_CATEGORY, 'some action', 'some label');
});


test('it will trigger track after specific delay by calling debouncedTrack', async () => {
  const mapInteractionTracker = trackEventFactory(REPORTS_CATEGORY, tracker);
  const debounceTracker = mapInteractionTracker.debouncedTrack(10);
  debounceTracker('my action', 'my label');

  jest.runAllTimers();

  expect(tracker).toHaveBeenCalledWith(REPORTS_CATEGORY, 'my action', 'my label');
  expect(tracker).toHaveBeenCalledTimes(1);

});

describe('createUserAnalyticsData', () => {
  it('should create data with main user when no profile selected', () => {
    const user = {
      id: 'user123',
      role: 'ranger',
      is_staff: false,
      is_superuser: false,
    };
    const selectedUserProfile = {};
    const serverVersion = '1.2.3';

    const data = createUserAnalyticsData(user, selectedUserProfile, serverVersion);

    expect(data).toEqual({
      user_role: 'ranger',
      organization: 'test.earthranger.com',
      user_id_hash: expect.any(String),
      is_staff: false,
      is_superuser: false,
      client_version: expect.any(String),
      server_version: '1.2.3',
    });
    expect(data.user_id_hash).not.toBe('unknown');
  });

  it('should create data with selected profile when available', () => {
    const user = {
      id: 'user123',
      role: 'ranger',
      is_staff: false,
      is_superuser: false,
    };
    const selectedUserProfile = {
      id: 'profile456',
      role: 'admin',
      is_staff: true,
      is_superuser: false,
    };
    const serverVersion = '2.0.0';

    const data = createUserAnalyticsData(user, selectedUserProfile, serverVersion);

    expect(data).toEqual({
      user_role: 'admin',
      organization: 'test.earthranger.com',
      user_id_hash: expect.any(String),
      is_staff: true,
      is_superuser: false,
      client_version: expect.any(String),
      server_version: '2.0.0',
    });
  });

  it('should handle missing user data gracefully', () => {
    const data = createUserAnalyticsData({}, {});

    expect(data).toEqual({
      user_role: 'unknown',
      organization: 'test.earthranger.com',
      user_id_hash: 'unknown',
      is_staff: false,
      is_superuser: false,
      client_version: expect.any(String),
      server_version: 'unknown',
    });
  });

  it('should handle missing server version gracefully', () => {
    const user = {
      id: 'user123',
      role: 'ranger',
      is_staff: false,
      is_superuser: false,
    };

    const data = createUserAnalyticsData(user, {});

    expect(data).toEqual({
      user_role: 'ranger',
      organization: 'test.earthranger.com',
      user_id_hash: expect.any(String),
      is_staff: false,
      is_superuser: false,
      client_version: expect.any(String),
      server_version: 'unknown',
    });
  });
});