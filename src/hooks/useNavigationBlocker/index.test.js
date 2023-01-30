import React from 'react';
import { renderHook } from '@testing-library/react-hooks';

import { NavigationContext } from '../../NavigationContextProvider';
import useBlockNavigation from '.';

describe('useNavigationBlocker', () => {
  const blocker = {};
  const blockNavigation = jest.fn(), unblockNavigation = jest.fn();

  const navigationContextValue = { blocker, blockNavigation, unblockNavigation };

  test('blocks the navigation if "when" is true', async () => {
    const wrapper = ({ children }) => <NavigationContext.Provider value={navigationContextValue}>
      {children}
    </NavigationContext.Provider>;
    renderHook(() => useBlockNavigation(true), { wrapper });

    expect(blockNavigation).toHaveBeenCalledTimes(1);
    expect(unblockNavigation).toHaveBeenCalledTimes(0);
  });

  test('unblocks the navigation if "when" is false', async () => {
    const wrapper = ({ children }) => <NavigationContext.Provider value={navigationContextValue}>
      {children}
    </NavigationContext.Provider>;
    renderHook(() => useBlockNavigation(false), { wrapper });

    expect(blockNavigation).toHaveBeenCalledTimes(0);
    expect(unblockNavigation).toHaveBeenCalledTimes(1);
  });

  test('unblocks the navigation if the hook is unmounted', async () => {
    const wrapper = ({ children }) => <NavigationContext.Provider value={navigationContextValue}>
      {children}
    </NavigationContext.Provider>;
    const { unmount } = renderHook(() => useBlockNavigation(true), { wrapper });

    expect(blockNavigation).toHaveBeenCalledTimes(1);
    expect(unblockNavigation).toHaveBeenCalledTimes(0);

    unmount();

    expect(unblockNavigation).toHaveBeenCalledTimes(1);
  });

  test('returns the blocker object', async () => {
    const wrapper = ({ children }) => <NavigationContext.Provider value={navigationContextValue}>
      {children}
    </NavigationContext.Provider>;
    const { result } = renderHook(() => useBlockNavigation(true), { wrapper });

    expect(result.current).toBe(blocker);
  });
});
