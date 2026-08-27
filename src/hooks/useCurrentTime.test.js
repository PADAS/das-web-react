import { act, renderHook } from '../test-utils';

import useCurrentTime from './useCurrentTime';

describe('useCurrentTime', () => {
  const NOW = new Date('2026-04-13T01:00:00.000Z').getTime();

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns the current time right away', () => {
    const { result } = renderHook(() => useCurrentTime(1000));

    expect(result.current).toBe(NOW);
  });

  test('refreshes the current time once every refresh interval', () => {
    const { result } = renderHook(() => useCurrentTime(1000));

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(NOW + 1000);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current).toBe(NOW + 3000);
  });

  test('does not refresh the current time before the refresh interval elapses', () => {
    const { result } = renderHook(() => useCurrentTime(1000));

    act(() => {
      jest.advanceTimersByTime(999);
    });

    expect(result.current).toBe(NOW);
  });

  test('never refreshes the current time without a refresh interval', () => {
    const { result } = renderHook(() => useCurrentTime(null));

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(result.current).toBe(NOW);
  });

  test('stops refreshing the current time once the refresh interval is cleared', () => {
    const { rerender, result } = renderHook(({ refreshInterval }) => useCurrentTime(refreshInterval), {
      initialProps: { refreshInterval: 1000 },
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    rerender({ refreshInterval: null });

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(result.current).toBe(NOW + 1000);
  });

  test('restarts the refreshes when the refresh interval changes', () => {
    const { rerender, result } = renderHook(({ refreshInterval }) => useCurrentTime(refreshInterval), {
      initialProps: { refreshInterval: 10_000 },
    });

    rerender({ refreshInterval: 1000 });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(NOW + 1000);
  });

  test('clears the interval when unmounting', () => {
    const { result, unmount } = renderHook(() => useCurrentTime(1000));

    unmount();

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(result.current).toBe(NOW);
    expect(jest.getTimerCount()).toBe(0);
  });
});
