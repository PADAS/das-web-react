import React, { useEffect, useState } from 'react';

const DEFAULT_OBSERVER_CONFIG = { attributes: false, childList: true, subtree: true };

export const JIRA_WIDGET_IFRAME_SELECTOR = '#jsd-widget';
export const JIRA_IFRAME_HELP_BUTTON_SELECTOR = '#help-button';

const JiraSupportWidget = () => {
  const [widgetAppended, setWidgetAppended] = useState(false);

  useEffect(() => {

    const onDocumentChange = (_tree, observer) => {
      const supportiFrameDocument = window.document.querySelector(JIRA_WIDGET_IFRAME_SELECTOR)?.contentDocument;
      if (!!supportiFrameDocument) {
        setWidgetAppended(true);
        observer.disconnect();
      }
    };

    const documentObserver = new MutationObserver(onDocumentChange);

    documentObserver.observe(window.document, DEFAULT_OBSERVER_CONFIG);

    return () => {
      documentObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (widgetAppended) {
      const supportiFrameDocument = document.querySelector(JIRA_WIDGET_IFRAME_SELECTOR)?.contentDocument;

      if (supportiFrameDocument) {
        const callback = () => {
          const helpBtn = supportiFrameDocument.querySelector(JIRA_IFRAME_HELP_BUTTON_SELECTOR);

          if (!!helpBtn && !helpBtn.hasAttribute('style')) {
            helpBtn.style = 'position: absolute; right: -9999rem';
          }
        };

        const observer = new MutationObserver(callback);

        observer.observe(supportiFrameDocument, DEFAULT_OBSERVER_CONFIG);

        return () => {
          observer.disconnect();
        };
      }
    }
  }, [widgetAppended]);

  return null;
};

export default JiraSupportWidget;