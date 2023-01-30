import React, { useContext, useEffect } from 'react';
import { render, screen } from '@testing-library/react';

import NavigationContextProvider, { BLOCKER_STATES, NavigationContext } from './';

describe('NavigationContextProvider', () => {
  test('can read and update navigation data', async () => {
    const ChildComponent = () => {
      const { navigationData, setNavigationData } = useContext(NavigationContext);

      useEffect(() => {
        setNavigationData('Navigation data!');
      }, [setNavigationData]);

      return <p>{JSON.stringify(navigationData)}</p>;
    };

    render(
      <NavigationContextProvider>
        <ChildComponent />
      </NavigationContextProvider>
    );

    expect((await screen.findByText('"Navigation data!"'))).toBeDefined();
  });

  test('blocks the navigation', async () => {
    const ChildComponent = () => {
      const { blockNavigation, isNavigationBlocked } = useContext(NavigationContext);

      useEffect(() => {
        blockNavigation();
      }, [blockNavigation]);

      return <p>{`Navigation blocked: ${isNavigationBlocked}`}</p>;
    };

    render(
      <NavigationContextProvider>
        <ChildComponent />
      </NavigationContextProvider>
    );

    expect((await screen.findByText('Navigation blocked: true'))).toBeDefined();
  });

  test('unblocks the navigation', async () => {
    const ChildComponent = () => {
      const { blockNavigation, isNavigationBlocked, unblockNavigation } = useContext(NavigationContext);

      useEffect(() => {
        blockNavigation();
      }, [blockNavigation]);

      useEffect(() => {
        if (isNavigationBlocked) {
          unblockNavigation();
        }
      }, [isNavigationBlocked, unblockNavigation]);

      return <p>{`Navigation blocked: ${isNavigationBlocked}`}</p>;
    };

    render(
      <NavigationContextProvider>
        <ChildComponent />
      </NavigationContextProvider>
    );

    expect((await screen.findByText('Navigation blocked: false'))).toBeDefined();
  });

  test('sets the blocker proceeding state', async () => {
    const ChildComponent = () => {
      const {
        blocker,
        blockNavigation,
        isNavigationBlocked,
        onNavigationAttemptBlocked,
      } = useContext(NavigationContext);

      useEffect(() => {
        blockNavigation();
      }, [blockNavigation]);

      useEffect(() => {
        if (isNavigationBlocked) {
          onNavigationAttemptBlocked();
        }
      }, [isNavigationBlocked, onNavigationAttemptBlocked]);

      useEffect(() => {
        if (blocker.state === BLOCKER_STATES.BLOCKED) {
          blocker.proceed();
        }
      }, [blocker]);

      return <p>{`Blocker state: ${blocker.state}`}</p>;
    };

    render(
      <NavigationContextProvider>
        <ChildComponent />
      </NavigationContextProvider>
    );

    expect((await screen.findByText('Blocker state: proceeding'))).toBeDefined();
  });

  test('sets the blocker unblocked state', async () => {
    const ChildComponent = () => {
      const {
        blocker,
        blockNavigation,
        isNavigationBlocked,
        onNavigationAttemptBlocked,
      } = useContext(NavigationContext);

      useEffect(() => {
        blockNavigation();
      }, [blockNavigation]);

      useEffect(() => {
        if (isNavigationBlocked) {
          onNavigationAttemptBlocked();
        }
      }, [isNavigationBlocked, onNavigationAttemptBlocked]);

      useEffect(() => {
        if (blocker.state === BLOCKER_STATES.BLOCKED) {
          blocker.reset();
        }
      }, [blocker]);

      return <p>{`Blocker state: ${blocker.state}`}</p>;
    };

    render(
      <NavigationContextProvider>
        <ChildComponent />
      </NavigationContextProvider>
    );

    expect((await screen.findByText('Blocker state: unblocked'))).toBeDefined();
  });
});
