import React, { useContext, useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NavigationPromptModal from './';
import { BLOCKER_STATES, NavigationContext } from '../NavigationContextProvider';
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

  test('shows the prompt modal if "when" is true there is a navigation attempt', async () => {
    const ChildComponent = () => {
      const { isNavigationBlocked, onNavigationAttemptBlocked } = useContext(NavigationContext);

      useEffect(() => {
        if (isNavigationBlocked) {
          onNavigationAttemptBlocked();
        }
      }, [isNavigationBlocked, onNavigationAttemptBlocked]);

      return null;
    };

    render(<NavigationWrapper>
      <ChildComponent />

      <NavigationPromptModal when />
    </NavigationWrapper>);

    await waitFor(async () => {
      expect((await screen.findByText('Unsaved Changes'))).toBeDefined();
    });
  });

  test('forces to show the modal even if when is false', async () => {
    render(<NavigationWrapper>
      <NavigationPromptModal show when={false} />
    </NavigationWrapper>);

    await waitFor(async () => {
      expect((await screen.findByText('Unsaved Changes'))).toBeDefined();
    });
  });

  test('removes the modal if the navigation attempt is continued', async () => {
    const ChildComponent = () => {
      const { blocker, isNavigationBlocked, onNavigationAttemptBlocked } = useContext(NavigationContext);

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

      return null;
    };

    render(<NavigationWrapper>
      <ChildComponent />

      <NavigationPromptModal when />
    </NavigationWrapper>);

    const continueButton = await screen.queryByText('Discard');
    continueButton.click();

    await waitFor(async () => {
      expect((await screen.queryByText('Discard changes'))).toBeNull();
    });
  });

  test('removes the modal if the navigation attempt is resolved (clicking cancel button)', async () => {
    const ChildComponent = () => {
      const {
        blocker,
        isNavigationBlocked,
        onNavigationAttemptBlocked,
      } = useContext(NavigationContext);

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

      return null;
    };

    render(<NavigationWrapper>
      <ChildComponent />

      <NavigationPromptModal when />
    </NavigationWrapper>);

    const goBackButton = await screen.findByText('Go Back');
    userEvent.click(goBackButton);

    await waitFor(async () => {
      expect((await screen.queryByText('Unsaved Changes'))).toBeNull();
    });
  });
});
