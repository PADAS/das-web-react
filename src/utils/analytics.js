import debounce from 'lodash/debounce';

import { CLIENT_BUILD_VERSION } from '../constants';
/**
 * ReactGA convenience functions.
 * 
 * This file defines several convenience functions for Google Analytics calls
 * that rely on the ReactGA library.
 */
import ReactGA from 'react-ga';

/**
 * Function to emit a GA event.
 * 
 * @param {string} category Event category string. 
 * @param {string} action   Event action string.
 * @param {string} [label]  Event label string (optional).
 */
export function trackEvent(category, action, label=null) {
  ReactGA.event({
    category: category,
    action: action,
    label: label
  });
};

export const debouncedTrackEvent = (delay = 300) => debounce(trackEvent, delay);

/** 
 * Function to set the user role as a GA custom dimension.
 * Custom dimension 'UserRole' is mapped to 'dimension1' as defined in: 
 * 
 * @link: https://analytics.google.com/analytics/web/#/a12413928w206522339p199397662/admin/custom-dimensions/
 * 
 * @param {string} role User role string. 
 */

export const setServerVersionAnalyticsDimension = (version) => {
  ReactGA.set({
    dimension1: version,
  });
};

export function setUserRole(role) {
  ReactGA.set({
    dimension2: role
  });
}

export const setSitenameDimension = (site) => {
  ReactGA.set({
    dimension3: site
  });
};

export const setClientReleaseIdentifier = () => ReactGA.set({
  dimension4: CLIENT_BUILD_VERSION,
});
