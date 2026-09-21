import React from 'react';
import { render } from '@testing-library/react';

import JiraSupportWidget, {
  JIRA_IFRAME_HELP_BUTTON_SELECTOR,
  JIRA_WIDGET_IFRAME_SELECTOR,
  JIRA_WIDGET_SCRIPT_SELECTOR,
} from '../JiraSupportWidget';

export const createQuerySelectorMockImplementationWithHelpButtonReference = () => {
  const mockButton = document.createElement('button');
  mockButton.click = jest.fn();

  const querySelectorMockImplementation = (selector) => {
    if (selector === JIRA_WIDGET_IFRAME_SELECTOR) {
      return {
        contentDocument: {
          querySelector: querySelectorMockImplementation,
        }
      };
    }
    if (selector === JIRA_IFRAME_HELP_BUTTON_SELECTOR) {
      return mockButton;
    }
  };

  return [querySelectorMockImplementation, mockButton];
};

const setPathname = (pathname) => {
  window.history.replaceState({}, '', pathname);
};

const findInjectedScripts = () => document.body.querySelectorAll(JIRA_WIDGET_SCRIPT_SELECTOR);

describe('the Jira Support Widget integration', () => {
  let disconnectSpy;
  let observeSpy;
  let mockQuerySelector;
  let mockButton;
  let originalPathname;

  beforeEach(() => {
    originalPathname = window.location.pathname;

    [mockQuerySelector, mockButton] = createQuerySelectorMockImplementationWithHelpButtonReference();
    jest.spyOn(global.document, 'querySelector').mockImplementation(mockQuerySelector);

    disconnectSpy = jest.fn();
    observeSpy = jest.fn();
    global.MutationObserver = class {
      constructor(callback) {
        this.callback = callback;
      }
      disconnect = disconnectSpy;
      observe = observeSpy.mockImplementation(() => this.callback([], this));
    };

  });

  afterEach(() => {
    findInjectedScripts().forEach((script) => script.remove());
    setPathname(originalPathname);
  });

  test('disconnecting the startup observer once the JSM iframe is detected', () => {
    render(<JiraSupportWidget />);

    expect(disconnectSpy).toHaveBeenCalled();

  });

  test('hiding the help button once the JSM iframe contents are loaded', () => {
    render(<JiraSupportWidget />);

    expect(mockButton).toHaveAttribute('style');
    expect(mockButton.getAttribute('style')).toEqual('position: absolute; right: -9999rem;');
  });

  test('injecting the embed script on an app route', () => {
    setPathname('/events');

    render(<JiraSupportWidget />);

    const scripts = findInjectedScripts();

    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toHaveAttribute('data-key', 'e1d5f5e4-1bf6-43ce-ae10-972895d6c040');
    expect(scripts[0]).toHaveAttribute('data-base-url', 'https://jsd-widget.atlassian.com');
    expect(scripts[0]).toHaveAttribute('src', 'https://jsd-widget.atlassian.com/assets/embed.js');
  });

  test('not injecting the embed script or observing the document on the community route', () => {
    setPathname('/community/my-community/reports/new');

    render(<JiraSupportWidget />);

    expect(findInjectedScripts()).toHaveLength(0);
    expect(observeSpy).not.toHaveBeenCalled();
  });

  test('not injecting the embed script twice across remounts', () => {
    setPathname('/events');

    const { unmount } = render(<JiraSupportWidget />);
    unmount();
    render(<JiraSupportWidget />);

    expect(findInjectedScripts()).toHaveLength(1);
  });
});
