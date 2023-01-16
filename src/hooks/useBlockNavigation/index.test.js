import React from 'react';
import { renderHook } from '@testing-library/react-hooks';

import { NavigationContext } from '../../NavigationContextProvider';
import useBlockNavigation from './';

describe('useBlockNavigation', () => {
  const blockNavigation = jest.fn(),
    cancelNavigationAttempt = jest.fn(),
    continueNavigationAttempt = jest.fn(),
    isNavigationAttemptPending = false,
    unblockNavigation = jest.fn();

  const navigationContextValue = {
    blockNavigation,
    cancelNavigationAttempt,
    continueNavigationAttempt,
    isNavigationAttemptPending,
    unblockNavigation,
  };

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

  test('return cancelNavigationAttempt, continueNavigationAttempt and isNavigationAttemptPending', async () => {
    const wrapper = ({ children }) => <NavigationContext.Provider value={navigationContextValue}>
      {children}
    </NavigationContext.Provider>;
    const { result } = renderHook(() => useBlockNavigation(true), { wrapper });

    expect(result.current.cancelNavigationAttempt).toBe(cancelNavigationAttempt);
    expect(result.current.continueNavigationAttempt).toBe(continueNavigationAttempt);
    expect(result.current.isNavigationAttemptPending).toBe(isNavigationAttemptPending);
  });
});
