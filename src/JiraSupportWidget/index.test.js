import React from 'react';
import { render } from '@testing-library/react';

import JiraSupportWidget, { JIRA_WIDGET_IFRAME_SELECTOR, JIRA_IFRAME_HELP_BUTTON_SELECTOR } from '../JiraSupportWidget';

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

describe('the Jira Support Widget integration', () => {
  let disconnectSpy;
  let observeSpy;
  beforeEach(() => {
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
  test('disconnecting the startup observer once the JSM iframe is detected', () => {
    jest.spyOn(global.document, 'querySelector').mockImplementationOnce(() => ({
      contentDocument: 'some-fake-value-so-checking-presence-returns-true',
    }));

    render(<JiraSupportWidget />);

    expect(disconnectSpy).toHaveBeenCalled();

  });

  test('hiding the help button once the JSM iframe contents are loaded', () => {
    const [mockQuerySelector, mockButton] = createQuerySelectorMockImplementationWithHelpButtonReference();

    jest.spyOn(global.document, 'querySelector').mockImplementation(mockQuerySelector);

    render(<JiraSupportWidget />);

    expect(mockButton).toHaveAttribute('style');
    expect(mockButton.getAttribute('style')).toEqual('position: absolute; right: -9999rem;');
  });
});