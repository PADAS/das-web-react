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
  it('describes the active user it is given', () => {
    const activeUser = { id: 'profile456', is_staff: true, is_superuser: false, role: 'admin' };
    const data = createUserAnalyticsData(activeUser, '2.0.0');

    expect(data).toEqual({
      client_version: expect.any(String),
      is_staff: true,
      is_superuser: false,
      organization: 'test.earthranger.com',
      server_version: '2.0.0',
      user_id_hash: expect.any(String),
      user_role: 'admin',
    });
    expect(data.user_id_hash).not.toBe('unknown');
  });

  it('should handle missing user data gracefully', () => {
    expect(createUserAnalyticsData({})).toEqual({
      client_version: expect.any(String),
      is_staff: false,
      is_superuser: false,
      organization: 'test.earthranger.com',
      server_version: 'unknown',
      user_id_hash: 'unknown',
      user_role: 'unknown',
    });
  });

  it('should handle missing server version gracefully', () => {
    const activeUser = { id: 'user123', is_staff: false, is_superuser: false, role: 'ranger' };

    expect(createUserAnalyticsData(activeUser)).toEqual({
      client_version: expect.any(String),
      is_staff: false,
      is_superuser: false,
      organization: 'test.earthranger.com',
      server_version: 'unknown',
      user_id_hash: expect.any(String),
      user_role: 'ranger',
    });
  });
});
