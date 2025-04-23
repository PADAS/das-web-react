import React, { useContext } from 'react';

import { act, renderHook } from '../test-utils';
import NavigationContextProvider, { BLOCKER_STATES, NavigationContext } from './';

describe('NavigationContextProvider', () => {
  const blockRequestId = '123';

  test('can read and update navigation data', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    expect(result.current.navigationData).toEqual({});

    act(() => {
      result.current.setNavigationData('Navigation data!');
    });

    expect(result.current.navigationData).toBe('Navigation data!');
  });

  test('blocks the navigation', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    expect(result.current.isNavigationBlocked).toBeFalsy();

    act(() => {
      result.current.blockNavigation(blockRequestId);
    });

    expect(result.current.isNavigationBlocked).toBeTruthy();
  });

  test('unblocks the navigation', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    expect(result.current.isNavigationBlocked).toBeFalsy();

    act(() => {
      result.current.blockNavigation(blockRequestId);
    });

    expect(result.current.isNavigationBlocked).toBeTruthy();

    act(() => {
      result.current.unblockNavigation(blockRequestId);
    });

    expect(result.current.isNavigationBlocked).toBeFalsy();
  });

  test('sets the blocker proceeding state', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    expect(result.current.isNavigationBlocked).toBeFalsy();

    act(() => {
      result.current.blockNavigation(blockRequestId);
    });

    expect(result.current.isNavigationBlocked).toBeTruthy();
    expect(result.current.blocker.state).toBe(BLOCKER_STATES.UNBLOCKED);

    act(() => {
      result.current.onNavigationAttemptBlocked();
    });

    expect(result.current.blocker.state).toBe(BLOCKER_STATES.BLOCKED);

    act(() => {
      result.current.blocker.proceed();
    });

    expect(result.current.blocker.state).toBe(BLOCKER_STATES.PROCEEDING);
  });

  test('sets the blocker unblocked state', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    expect(result.current.isNavigationBlocked).toBeFalsy();

    act(() => {
      result.current.blockNavigation(blockRequestId);
    });

    expect(result.current.isNavigationBlocked).toBeTruthy();
    expect(result.current.blocker.state).toBe(BLOCKER_STATES.UNBLOCKED);

    act(() => {
      result.current.onNavigationAttemptBlocked();
    });

    expect(result.current.blocker.state).toBe(BLOCKER_STATES.BLOCKED);

    act(() => {
      result.current.blocker.reset();
    });

    expect(result.current.blocker.state).toBe(BLOCKER_STATES.UNBLOCKED);
  });

  test('stays blocked if a different blocker request id is removed', async () => {
    const anotherBlockRequestId = '456';

    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    expect(result.current.isNavigationBlocked).toBeFalsy();

    act(() => {
      result.current.blockNavigation(blockRequestId);
      result.current.blockNavigation(anotherBlockRequestId);
    });

    expect(result.current.isNavigationBlocked).toBeTruthy();

    act(() => {
      result.current.unblockNavigation(anotherBlockRequestId);
    });

    expect(result.current.isNavigationBlocked).toBeTruthy();

    act(() => {
      result.current.unblockNavigation(blockRequestId);
    });

    expect(result.current.isNavigationBlocked).toBeFalsy();
  });
});
