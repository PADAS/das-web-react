import React, { useContext, useEffect } from 'react';

import NavigationContextProvider, { BLOCKER_STATES, NavigationContext } from './';
import { act, render, renderHook } from '../test-utils';

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

  test('ignores a navigation attempt blocked signal when nothing is actually blocking', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    expect(result.current.blocker.state).toBe(BLOCKER_STATES.UNBLOCKED);

    act(() => {
      result.current.onNavigationAttemptBlocked();
    });

    expect(result.current.blocker.state).toBe(BLOCKER_STATES.UNBLOCKED);
  });

  test('ignores proceed calls when there is no active block', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    act(() => {
      result.current.blocker.proceed();
    });

    expect(result.current.blocker.state).toBe(BLOCKER_STATES.UNBLOCKED);
  });

  test('does not run a deferred navigation twice if proceed is called more than once', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    act(() => {
      result.current.blockNavigation(blockRequestId);
    });

    const performNavigation = jest.fn();

    act(() => {
      result.current.attemptNavigation(performNavigation);
    });

    act(() => {
      result.current.blocker.proceed();
      result.current.blocker.proceed();
    });

    expect(performNavigation).toHaveBeenCalledTimes(1);
  });

  test('only runs the most recent deferred navigation when multiple attempts are made while blocked', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    act(() => {
      result.current.blockNavigation(blockRequestId);
    });

    const firstAttempt = jest.fn();
    const secondAttempt = jest.fn();

    act(() => {
      result.current.attemptNavigation(firstAttempt);
      result.current.attemptNavigation(secondAttempt);
    });

    act(() => {
      result.current.blocker.proceed();
    });

    expect(firstAttempt).not.toHaveBeenCalled();
    expect(secondAttempt).toHaveBeenCalledTimes(1);
  });

  test('ignores reset calls when navigation is already unblocked', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    expect(result.current.blocker.state).toBe(BLOCKER_STATES.UNBLOCKED);

    act(() => {
      result.current.blocker.reset();
    });

    expect(result.current.blocker.state).toBe(BLOCKER_STATES.UNBLOCKED);
  });

  test('prevents the tab from closing while navigation is blocked', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    act(() => {
      result.current.blockNavigation(blockRequestId);
    });

    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  test('does not prevent the tab from closing once navigation is unblocked', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    act(() => {
      result.current.blockNavigation(blockRequestId);
    });

    act(() => {
      result.current.unblockNavigation(blockRequestId);
    });

    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
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

  test('runs a navigation immediately when navigation is not blocked', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    const performNavigation = jest.fn();

    act(() => {
      result.current.attemptNavigation(performNavigation);
    });

    expect(performNavigation).toHaveBeenCalledTimes(1);
  });

  test('defers a navigation while blocked, and runs it once the attempt proceeds', async () => {
    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    act(() => {
      result.current.blockNavigation(blockRequestId);
    });

    const performNavigation = jest.fn();

    act(() => {
      result.current.attemptNavigation(performNavigation);
    });

    expect(performNavigation).not.toHaveBeenCalled();
    expect(result.current.blocker.state).toBe(BLOCKER_STATES.BLOCKED);

    act(() => {
      result.current.blocker.proceed();
    });

    expect(performNavigation).toHaveBeenCalledTimes(1);
    expect(result.current.blocker.state).toBe(BLOCKER_STATES.UNBLOCKED);
  });

  test('does not run a stale deferred navigation from a blocker removed before it proceeded', async () => {
    const anotherBlockRequestId = '456';

    const wrapper = ({ children }) => <NavigationContextProvider>{children}</NavigationContextProvider>;
    const { result } = renderHook(() => useContext(NavigationContext), { wrapper });

    act(() => {
      result.current.blockNavigation(blockRequestId);
    });

    const performNavigation = jest.fn();

    act(() => {
      result.current.attemptNavigation(performNavigation);
    });

    expect(result.current.blocker.state).toBe(BLOCKER_STATES.BLOCKED);

    // The blocker behind the pending attempt goes away before the user responds to it...
    act(() => {
      result.current.unblockNavigation(blockRequestId);
    });

    // ...then an unrelated navigation attempt (e.g. a plain Link click) gets blocked.
    act(() => {
      result.current.blockNavigation(anotherBlockRequestId);
    });

    act(() => {
      result.current.onNavigationAttemptBlocked();
    });

    expect(result.current.blocker.state).toBe(BLOCKER_STATES.BLOCKED);

    act(() => {
      result.current.blocker.proceed();
    });

    expect(performNavigation).not.toHaveBeenCalled();
    expect(result.current.blocker.state).toBe(BLOCKER_STATES.PROCEEDING);
  });

  test('still runs a deferred navigation after the component that attempted it unmounts', async () => {
    const performNavigation = jest.fn();
    let latestContext;

    const CaptureContext = () => {
      latestContext = useContext(NavigationContext);
      return null;
    };

    const AttemptOnMount = () => {
      const { attemptNavigation } = useContext(NavigationContext);
      useEffect(() => { attemptNavigation(performNavigation); }, [attemptNavigation]);
      return null;
    };

    const Wrapper = ({ showAttemptingComponent }) => <NavigationContextProvider>
      <CaptureContext />
      {showAttemptingComponent && <AttemptOnMount />}
    </NavigationContextProvider>;

    const { rerender } = render(<Wrapper showAttemptingComponent={false} />);

    act(() => {
      latestContext.blockNavigation(blockRequestId);
    });

    // Mounts the component that attempts the navigation while blocked...
    rerender(<Wrapper showAttemptingComponent />);

    expect(performNavigation).not.toHaveBeenCalled();

    // ...then unmounts it before the "Unsaved Changes" prompt is resolved.
    rerender(<Wrapper showAttemptingComponent={false} />);

    act(() => {
      latestContext.blocker.proceed();
    });

    expect(performNavigation).toHaveBeenCalledTimes(1);
  });
});
