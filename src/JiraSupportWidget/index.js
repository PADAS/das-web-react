import React, { useEffect, useState } from 'react';

const DEFAULT_OBSERVER_CONFIG = { attributes: false, childList: true, subtree: true };

export const JIRA_WIDGET_IFRAME_SELECTOR = '#jsd-widget';
export const JIRA_WIDGET_FORM_SELECTOR = 'form.help-form';
export const JIRA_IFRAME_HELP_BUTTON_SELECTOR = '#help-button';

export const selectSupportFormFieldByLabelText = (text) => {
  const supportiFrameDocument = window.document.querySelector(JIRA_WIDGET_IFRAME_SELECTOR)?.contentDocument;

  return supportiFrameDocument?.querySelector(`[title="${text}"]`)?.closest('label')?.nextElementSibling;
};

const JiraSupportWidget = () => {
  const [widgetAppended, setWidgetAppended] = useState(false);

  useEffect(() => {
    const BOOTSTRAPPING_TIMEOUT_THRESHOLD = 1000 * 15; // fifteen seconds to time out and stop trying
    let timeoutRef;

    const disconnectObserver = () => {
      documentObserver.disconnect();
    };

    const onDocumentChange = (_tree) => {
      const supportiFrameDocument = window.document.querySelector(JIRA_WIDGET_IFRAME_SELECTOR)?.contentDocument;
      if (!!supportiFrameDocument) {
        setWidgetAppended(true);
        window.clearTimeout(timeoutRef);
        disconnectObserver();
      }
    };

    const documentObserver = new MutationObserver(onDocumentChange);

    timeoutRef = window.setTimeout(disconnectObserver, BOOTSTRAPPING_TIMEOUT_THRESHOLD);

    documentObserver.observe(window.document, DEFAULT_OBSERVER_CONFIG);

    return disconnectObserver;
  }, []);

  useEffect(() => {
    if (widgetAppended) {
      const supportiFrameDocument = document.querySelector(JIRA_WIDGET_IFRAME_SELECTOR)?.contentDocument;

      if (supportiFrameDocument) {
        const callback = () => {
          const helpBtn = supportiFrameDocument.querySelector(JIRA_IFRAME_HELP_BUTTON_SELECTOR);
          const form = supportiFrameDocument.querySelector(JIRA_WIDGET_FORM_SELECTOR);

          if (!!helpBtn && !helpBtn.hasAttribute('style')) {
            helpBtn.style = 'position: absolute; right: -9999rem';
          }

          if (!!form && !form.hasAttribute('style')) {
            form.style = 'background: white;';
          }
        };

        const observer = new MutationObserver(callback);

        observer.observe(supportiFrameDocument, DEFAULT_OBSERVER_CONFIG);

        setTimeout(callback, 300);

        return () => {
          observer.disconnect();
        };
      }
    }
  }, [widgetAppended]);

  return null;
};

export default JiraSupportWidget;