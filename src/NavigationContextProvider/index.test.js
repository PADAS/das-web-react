import React, { useContext, useEffect } from 'react';
import { render, screen } from '@testing-library/react';

import NavigationContextProvider, { NavigationContext } from './';

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

  test('resolves to true when continuing the navigation of a blocked attempt', async () => {
    const ChildComponent = () => {
      const {
        blockNavigation,
        continueNavigationAttempt,
        isNavigationAttemptPending,
        isNavigationBlocked,
        navigationAttemptBlocked,
        navigationAttemptResolution,
      } = useContext(NavigationContext);

      useEffect(() => {
        blockNavigation();
      }, [blockNavigation]);

      useEffect(() => {
        if (isNavigationBlocked) {
          navigationAttemptBlocked();
        }
      }, [isNavigationBlocked, navigationAttemptBlocked]);

      useEffect(() => {
        if (isNavigationAttemptPending) {
          continueNavigationAttempt();
        }
      }, [continueNavigationAttempt, isNavigationAttemptPending]);

      return <p>{`Navigation attempt resolution: ${navigationAttemptResolution}`}</p>;
    };

    render(
      <NavigationContextProvider>
        <ChildComponent />
      </NavigationContextProvider>
    );

    expect((await screen.findByText('Navigation attempt resolution: true'))).toBeDefined();
  });

  test('resolves to false when canceling the navigation of a blocked attempt', async () => {
    const ChildComponent = () => {
      const {
        blockNavigation,
        cancelNavigationAttempt,
        isNavigationAttemptPending,
        isNavigationBlocked,
        navigationAttemptBlocked,
        navigationAttemptResolution,
      } = useContext(NavigationContext);

      useEffect(() => {
        blockNavigation();
      }, [blockNavigation]);

      useEffect(() => {
        if (isNavigationBlocked) {
          navigationAttemptBlocked();
        }
      }, [isNavigationBlocked, navigationAttemptBlocked]);

      useEffect(() => {
        if (isNavigationAttemptPending) {
          cancelNavigationAttempt();
        }
      }, [cancelNavigationAttempt, isNavigationAttemptPending]);

      return <p>{`Navigation attempt resolution: ${navigationAttemptResolution}`}</p>;
    };

    render(
      <NavigationContextProvider>
        <ChildComponent />
      </NavigationContextProvider>
    );

    expect((await screen.findByText('Navigation attempt resolution: false'))).toBeDefined();
  });
});
