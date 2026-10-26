import { JIRA_IFRAME_HELP_BUTTON_SELECTOR, JIRA_WIDGET_IFRAME_SELECTOR } from '../JiraSupportWidget';

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
