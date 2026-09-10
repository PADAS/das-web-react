import React, { useEffect, useState } from 'react';

import { APP_ROUTES } from '../constants/routes';
import { REACT_APP_ROUTE_PREFIX } from '../constants';

const DEFAULT_OBSERVER_CONFIG = { attributes: false, childList: true, subtree: true };

const COMMUNITY_PATH = APP_ROUTES.COMMUNITY.split('/:')[0];

const JIRA_WIDGET_SCRIPT_ATTRIBUTES = {
  'data-jsd-embedded': '',
  'data-key': 'e1d5f5e4-1bf6-43ce-ae10-972895d6c040',
  'data-base-url': 'https://jsd-widget.atlassian.com',
  src: 'https://jsd-widget.atlassian.com/assets/embed.js',
};

export const JIRA_WIDGET_IFRAME_SELECTOR = '#jsd-widget';
export const JIRA_WIDGET_FORM_SELECTOR = 'form.help-form';
export const JIRA_WIDGET_SCRIPT_SELECTOR = 'script[data-jsd-embedded]';
export const JIRA_IFRAME_HELP_BUTTON_SELECTOR = '#help-button';

export const selectSupportFormFieldByLabelText = (text) => {
  const supportiFrameDocument = window.document.querySelector(JIRA_WIDGET_IFRAME_SELECTOR)?.contentDocument;

  return supportiFrameDocument?.querySelector(`[title="${text}"]`)?.closest('label')?.nextElementSibling;
};

// The widget is only reachable from the global menu, which the community page never renders.
// Left loaded there, its full-width invisible iframe swallows clicks along the bottom of the viewport.
export const isCommunityPath = (pathname = window.location.pathname) => {
  const prefix = (REACT_APP_ROUTE_PREFIX ?? '').replace(/\/$/, '');
  const path = prefix && pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;

  return path === COMMUNITY_PATH || path.startsWith(`${COMMUNITY_PATH}/`);
};

const JiraSupportWidget = () => {
  const [widgetAppended, setWidgetAppended] = useState(false);

  useEffect(() => {
    if (isCommunityPath() || window.document.body.querySelector(JIRA_WIDGET_SCRIPT_SELECTOR)) return;

    const script = window.document.createElement('script');

    Object.entries(JIRA_WIDGET_SCRIPT_ATTRIBUTES).forEach(([key, value]) => script.setAttribute(key, value));

    window.document.body.appendChild(script);

    // The embed script injects the widget iframe on load and can't be torn back down,
    // so the tag stays put and doubles as the guard against a second injection.
  }, []);

  useEffect(() => {
    if (isCommunityPath()) return;

    const BOOTSTRAPPING_TIMEOUT_THRESHOLD = 1000 * 15; // fifteen seconds to time out and stop trying
    let timeoutRef;

    const disconnectObserver = () => {
      documentObserver.disconnect();
    };

    const onDocumentChange = (_tree) => {
      const supportiFrameDocument = window.document.querySelector(JIRA_WIDGET_IFRAME_SELECTOR)?.contentDocument;
      if (supportiFrameDocument) {
        setWidgetAppended(true);
        window.clearTimeout(timeoutRef);
        disconnectObserver();
      }
    };

    const documentObserver = new MutationObserver(onDocumentChange);

    timeoutRef = window.setTimeout(disconnectObserver, BOOTSTRAPPING_TIMEOUT_THRESHOLD);

    documentObserver.observe(window.document, DEFAULT_OBSERVER_CONFIG);

    // the iframe may already be in place, in which case no mutation is coming
    onDocumentChange();

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
