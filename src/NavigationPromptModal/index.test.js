import React, { useContext, useEffect } from 'react';
import userEvent from '@testing-library/user-event';

import NavigationPromptModal from './';
import { NavigationContext } from '../NavigationContextProvider';
import { render, screen, waitFor } from '../test-utils';

const TITLE_TEXT = 'Unsaved Changes';

describe('NavigationPromptModal', () => {
  const onCancel = jest.fn(), onContinue = jest.fn();
  const initialProps = {
    onCancel,
    onContinue,
  };

  const renderNavigationPromptModal = (props = initialProps, Children = null) => render(
    <>
      {Children && <Children />}
      <NavigationPromptModal {...props} />
    </>
  );

  test('does not show the prompt modal "when" is false', async () => {
    renderNavigationPromptModal({ ...initialProps, when: false });

    await expect(async () => await screen.findByText(TITLE_TEXT))
      .rejects
      .toThrow();
  });

  test('does not show the prompt modal if there is not a pending navigation attempt', async () => {
    renderNavigationPromptModal({ ...initialProps, when: true });

    await expect(async () => await screen.findByText(TITLE_TEXT))
      .rejects
      .toThrow();
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

    renderNavigationPromptModal({ ...initialProps, when: true }, ChildComponent);

    await screen.findByText(TITLE_TEXT);
  });

  test('forces to show the modal even if when is false', async () => {
    renderNavigationPromptModal({ ...initialProps, when: false, show: true });

    await screen.findByText(TITLE_TEXT);
  });

  test('triggers onContinue and closes the modal if navigation attempt is continued in the negative', async () => {
    const ChildComponent = () => {
      const { isNavigationBlocked, onNavigationAttemptBlocked } = useContext(NavigationContext);

      useEffect(() => {
        if (isNavigationBlocked) {
          onNavigationAttemptBlocked();
        }
      }, [isNavigationBlocked, onNavigationAttemptBlocked]);

      return null;
    };
    renderNavigationPromptModal({ ...initialProps, when: true }, ChildComponent);

    await screen.findByText(TITLE_TEXT);

    const discardButton = await screen.findByText('Discard');
    discardButton.click();

    await waitFor(async () => {
      expect(onCancel).toHaveBeenCalledTimes(0);
      expect(onContinue).toHaveBeenCalledTimes(1);
      expect(onContinue).toHaveBeenCalledWith(false);
      expect(screen.queryByText(TITLE_TEXT)).toBeNull();
    });
  });

  test('triggers onContinue and closes the modal if navigation attempt is continued in the affirmative', async () => {
    const ChildComponent = () => {
      const { isNavigationBlocked, onNavigationAttemptBlocked } = useContext(NavigationContext);

      useEffect(() => {
        if (isNavigationBlocked) {
          onNavigationAttemptBlocked();
        }
      }, [isNavigationBlocked, onNavigationAttemptBlocked]);

      return null;
    };

    renderNavigationPromptModal({ ...initialProps, when: true }, ChildComponent);

    await screen.findByText(TITLE_TEXT);

    const saveButton = await screen.findByText('Save');
    saveButton.click();

    await waitFor(async () => {
      expect(onCancel).toHaveBeenCalledTimes(0);
      expect(onContinue).toHaveBeenCalledTimes(1);
      expect(onContinue).toHaveBeenCalledWith(true);
      expect((screen.queryByText(TITLE_TEXT))).toBeNull();
    });
  });

  test('triggers onCancel and closes the modal if navigation attempt is resolved (clicking "go back" button)', async () => {
    const ChildComponent = () => {
      const {
        isNavigationBlocked,
        onNavigationAttemptBlocked,
      } = useContext(NavigationContext);

      useEffect(() => {
        if (isNavigationBlocked) {
          onNavigationAttemptBlocked();
        }
      }, [isNavigationBlocked, onNavigationAttemptBlocked]);

      return null;
    };

    renderNavigationPromptModal({ ...initialProps, when: true }, ChildComponent);

    await screen.findByText(TITLE_TEXT);

    const goBackButton = await screen.findByText('Go Back');
    userEvent.click(goBackButton);

    await waitFor(async () => {
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onContinue).toHaveBeenCalledTimes(0);
      expect((screen.queryByText(TITLE_TEXT))).toBeNull();
    });
  });
});
