import React, { useContext } from 'react';
import { renderHook } from '@testing-library/react-hooks';

import NavigationContextProvider, { BLOCKER_STATES, NavigationContext } from './';

describe('NavigationContextProvider', () => {
  const blockRequestId = '123';

  test('can read and update navigation data', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    expect(result.current.navigationData).toEqual({});

    result.current.setNavigationData('Navigation data!');

    expect(result.current.navigationData).toBe('Navigation data!');
  });

  test('blocks the navigation', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    expect(result.current.isNavigationBlocked).toBeFalsy();

    result.current.blockNavigation(blockRequestId);

    expect(result.current.isNavigationBlocked).toBeTruthy();
  });

  test('unblocks the navigation', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    expect(result.current.isNavigationBlocked).toBeFalsy();

    result.current.blockNavigation(blockRequestId);

    expect(result.current.isNavigationBlocked).toBeTruthy();

    result.current.unblockNavigation(blockRequestId);

    expect(result.current.isNavigationBlocked).toBeFalsy();
  });

  test('sets the blocker proceeding state', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    expect(result.current.isNavigationBlocked).toBeFalsy();

    result.current.blockNavigation(blockRequestId);

    expect(result.current.isNavigationBlocked).toBeTruthy();
    expect(result.current.blocker.state).toBe(BLOCKER_STATES.UNBLOCKED);

    result.current.onNavigationAttemptBlocked();

    expect(result.current.blocker.state).toBe(BLOCKER_STATES.BLOCKED);

    result.current.blocker.proceed();

    expect(result.current.blocker.state).toBe(BLOCKER_STATES.PROCEEDING);
  });

  test('sets the blocker unblocked state', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    expect(result.current.isNavigationBlocked).toBeFalsy();

    result.current.blockNavigation(blockRequestId);

    expect(result.current.isNavigationBlocked).toBeTruthy();
    expect(result.current.blocker.state).toBe(BLOCKER_STATES.UNBLOCKED);

    result.current.onNavigationAttemptBlocked();

    expect(result.current.blocker.state).toBe(BLOCKER_STATES.BLOCKED);

    result.current.blocker.reset();

    expect(result.current.blocker.state).toBe(BLOCKER_STATES.UNBLOCKED);
  });

  test('stays blocked if a different blocker request id is removed', async () => {
    const anotherBlockRequestId = '456';

    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    expect(result.current.isNavigationBlocked).toBeFalsy();

    result.current.blockNavigation(blockRequestId);
    result.current.blockNavigation(anotherBlockRequestId);

    expect(result.current.isNavigationBlocked).toBeTruthy();

    result.current.unblockNavigation(anotherBlockRequestId);

    expect(result.current.isNavigationBlocked).toBeTruthy();

    result.current.unblockNavigation(blockRequestId);

    expect(result.current.isNavigationBlocked).toBeFalsy();
  });
});
