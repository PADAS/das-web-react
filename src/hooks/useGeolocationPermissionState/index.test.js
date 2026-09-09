import { act, renderHook, waitFor } from '../../test-utils';

import { GEOLOCATION_PERMISSION_STATES } from '../../utils/location/constants';
import { PROBE_GEOLOCATOR_OPTIONS, resetGeolocationPermissionProbe } from '../../utils/location/permission-probe';

import useGeolocationPermissionState from './';

describe('useGeolocationPermissionState', () => {
  let originalGeolocation, permissionStatus;
  beforeEach(() => {
    originalGeolocation = window.navigator.geolocation;

    resetGeolocationPermissionProbe();

    permissionStatus = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      state: GEOLOCATION_PERMISSION_STATES.GRANTED,
    };

    global.navigator.permissions = { query: jest.fn().mockResolvedValue(permissionStatus) };
  });

  afterEach(() => {
    delete global.navigator.permissions;

    window.navigator.geolocation = originalGeolocation;
  });

  test('returns null until the permission state is known', () => {
    const { result } = renderHook(() => useGeolocationPermissionState());

    expect(result.current).toBeNull();
  });

  test('returns the granted state reported by the permissions query', async () => {
    const { result } = renderHook(() => useGeolocationPermissionState());

    await waitFor(() => expect(result.current).toBe(GEOLOCATION_PERMISSION_STATES.GRANTED));

    expect(global.navigator.permissions.query).toHaveBeenCalledWith({ name: 'geolocation' });
  });

  test('returns the denied state reported by the permissions query', async () => {
    permissionStatus.state = GEOLOCATION_PERMISSION_STATES.DENIED;
    const { result } = renderHook(() => useGeolocationPermissionState());

    await waitFor(() => expect(result.current).toBe(GEOLOCATION_PERMISSION_STATES.DENIED));
  });

  test('returns the prompt state reported by the permissions query', async () => {
    permissionStatus.state = GEOLOCATION_PERMISSION_STATES.PROMPT;
    const { result } = renderHook(() => useGeolocationPermissionState());

    await waitFor(() => expect(result.current).toBe(GEOLOCATION_PERMISSION_STATES.PROMPT));
  });

  test('updates the state when the user denies the permission', async () => {
    permissionStatus.state = GEOLOCATION_PERMISSION_STATES.PROMPT;
    const { result } = renderHook(() => useGeolocationPermissionState());

    await waitFor(() => expect(permissionStatus.addEventListener).toHaveBeenCalled());

    const [, onPermissionStateChange] = permissionStatus.addEventListener.mock.calls[0];
    act(() => onPermissionStateChange({ target: { state: GEOLOCATION_PERMISSION_STATES.DENIED } }));

    expect(result.current).toBe(GEOLOCATION_PERMISSION_STATES.DENIED);
  });

  test('updates the state when the user unblocks the permission', async () => {
    permissionStatus.state = GEOLOCATION_PERMISSION_STATES.DENIED;
    const { result } = renderHook(() => useGeolocationPermissionState());

    await waitFor(() => expect(permissionStatus.addEventListener).toHaveBeenCalled());

    const [, onPermissionStateChange] = permissionStatus.addEventListener.mock.calls[0];
    act(() => onPermissionStateChange({ target: { state: GEOLOCATION_PERMISSION_STATES.PROMPT } }));

    expect(result.current).toBe(GEOLOCATION_PERMISSION_STATES.PROMPT);
  });

  test('falls back to the probe if the permissions query is rejected', async () => {
    global.navigator.permissions.query.mockRejectedValue(new TypeError('unknown permission name'));
    window.navigator.geolocation = {
      getCurrentPosition: jest.fn((_, errorCallback) => errorCallback({ code: 1, PERMISSION_DENIED: 1 })),
    };
    const { result } = renderHook(() => useGeolocationPermissionState());

    await waitFor(() => expect(result.current).toBe(GEOLOCATION_PERMISSION_STATES.DENIED));
  });

  test('falls back to the probe if the permissions API is not available', async () => {
    delete global.navigator.permissions;
    window.navigator.geolocation = {
      getCurrentPosition: jest.fn((successCallback) => successCallback({ coords: {} })),
    };
    const { result } = renderHook(() => useGeolocationPermissionState());

    await waitFor(() => expect(result.current).toBe(GEOLOCATION_PERMISSION_STATES.GRANTED));

    expect(window.navigator.geolocation.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      PROBE_GEOLOCATOR_OPTIONS
    );
  });

  test('does not check the permission while it is not enabled', async () => {
    window.navigator.geolocation = { getCurrentPosition: jest.fn() };
    const { result } = renderHook(() => useGeolocationPermissionState(false));

    await waitFor(() => expect(result.current).toBeNull());

    expect(global.navigator.permissions.query).not.toHaveBeenCalled();
    expect(window.navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });

  test('forgets the permission state while it is disabled and checks it again once it is enabled', async () => {
    const { rerender, result } = renderHook(
      (isEnabled) => useGeolocationPermissionState(isEnabled),
      { initialProps: true }
    );

    await waitFor(() => expect(result.current).toBe(GEOLOCATION_PERMISSION_STATES.GRANTED));

    rerender(false);

    expect(result.current).toBeNull();
    expect(global.navigator.permissions.query).toHaveBeenCalledTimes(1);

    rerender(true);

    await waitFor(() => expect(global.navigator.permissions.query).toHaveBeenCalledTimes(2));

    expect(result.current).toBe(GEOLOCATION_PERMISSION_STATES.GRANTED);
  });

  test('stops listening to permission changes on unmount', async () => {
    const { unmount } = renderHook(() => useGeolocationPermissionState());

    await waitFor(() => expect(permissionStatus.addEventListener).toHaveBeenCalled());

    unmount();

    expect(permissionStatus.removeEventListener).toHaveBeenCalledTimes(1);
  });
});
