import React, { useContext, useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NavigationPromptModal from './';
import { NavigationContext } from '../NavigationContextProvider';
import NavigationWrapper from '../__test-helpers/navigationWrapper';

describe('NavigationPromptModal', () => {
  test('does not show the prompt modal "when" is false', async () => {
    render(<NavigationWrapper>
      <NavigationPromptModal when={false} />
    </NavigationWrapper>);

    expect((await screen.queryByText('Discard changes'))).toBeNull();
  });

  test('does not show the prompt modal if there is not a pending navigation attempt', async () => {
    render(<NavigationWrapper>
      <NavigationPromptModal when />
    </NavigationWrapper>);

    expect((await screen.queryByText('Discard changes'))).toBeNull();
  });

  test('shows the prompt modal if "when" is true there is a pending navigation attempt', async () => {
    const ChildComponent = () => {
      const { isNavigationBlocked, navigationAttemptBlocked } = useContext(NavigationContext);

      useEffect(() => {
        if (isNavigationBlocked) {
          navigationAttemptBlocked();
        }
      }, [isNavigationBlocked, navigationAttemptBlocked]);

      return null;
    };

    render(<NavigationWrapper>
      <ChildComponent />

      <NavigationPromptModal when />
    </NavigationWrapper>);

    await waitFor(async () => {
      expect((await screen.findByText('Discard changes'))).toBeDefined();
    });
  });

  test('removes the modal if the navigation attempt is resolved (clicking continue button)', async () => {
    const ChildComponent = () => {
      const {
        isNavigationBlocked,
        navigationAttemptBlocked,
        navigationAttemptResolution,
        navigationAttemptUnblocked,
      } = useContext(NavigationContext);

      // Report that user tried to navigate away
      useEffect(() => {
        if (isNavigationBlocked) {
          navigationAttemptBlocked();
        }
      }, [isNavigationBlocked, navigationAttemptBlocked]);

      // Report that the blocked navigattion attempt was resolved
      useEffect(() => {
        if (navigationAttemptResolution) {
          navigationAttemptUnblocked();
        }
      }, [navigationAttemptResolution, navigationAttemptUnblocked]);

      return null;
    };

    render(<NavigationWrapper>
      <ChildComponent />

      <NavigationPromptModal when />
    </NavigationWrapper>);

    const continueButton = await screen.queryByText('Discard');
    userEvent.click(continueButton);

    await waitFor(async () => {
      expect((await screen.queryByText('Discard changes'))).toBeNull();
    });
  });

  test('removes the modal if the navigation attempt is resolved (clicking cancel button)', async () => {
    const ChildComponent = () => {
      const {
        isNavigationBlocked,
        navigationAttemptBlocked,
        navigationAttemptResolution,
        navigationAttemptUnblocked,
      } = useContext(NavigationContext);

      // Report that user tried to navigate away
      useEffect(() => {
        if (isNavigationBlocked) {
          navigationAttemptBlocked();
        }
      }, [isNavigationBlocked, navigationAttemptBlocked]);

      // Report that the blocked navigattion attempt was resolved
      useEffect(() => {
        if (navigationAttemptResolution === false) {
          navigationAttemptUnblocked();
        }
      }, [navigationAttemptResolution, navigationAttemptUnblocked]);

      return null;
    };

    render(<NavigationWrapper>
      <ChildComponent />

      <NavigationPromptModal when />
    </NavigationWrapper>);

    const cancelButton = await screen.queryByText('Cancel');
    userEvent.click(cancelButton);

    await waitFor(async () => {
      expect((await screen.queryByText('Discard changes'))).toBeNull();
    });
  });
});
