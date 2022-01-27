import debounce from 'lodash/debounce';

import { CLIENT_BUILD_VERSION } from '../constants';

/**
 * ReactGA convenience functions.
 * 
 * This file defines several convenience functions for Google Analytics calls
 * that rely on the ReactGA library.
 */
import ReactGA from 'react-ga';

export const MAP_INTERACTION_CATEGORY = 'Map Interaction';
export const MAP_LAYERS_CATEGORY = 'Map Layers';
export const BASE_LAYER_CATEGORY = 'Base Layer';
export const PATROL_LIST_ITEM_CATEGORY = 'Patrol List Item';
export const PATROL_DRAWER_CATEGORY = 'Patrol Drawer';
export const PATROL_MODAL_CATEGORY = 'Patrol Modal';
export const PATROL_FILTER_CATEGORY = 'Patrol Filter';
export const ADD_TO_PATROL_CATEGORY = 'Add To Patrol';
export const REPORTS_CATEGORY = 'Reports';
export const REPORT_NOTE_CATEGORY = 'Report Note';
export const REPORT_MODAL_CATEGORY = 'Report Modal';
export const REPORT_EXPORT_CATEGORY = 'Report Export';
export const INCIDENT_REPORT_CATEGORY = 'Incident Report';
export const EVENT_REPORT_CATEGORY = 'Event Report';
export const EVENT_FILTER_CATEGORY = 'Event Filter';
export const KML_EXPORT_CATEGORY = 'KML Export';
export const MAIN_TOOLBAR_CATEGORY = 'Main Toolbar';
export const TABLEAU_ANALYSIS_CATEGORY = 'Analysis (via Tableau)';
export const ADD_INCIDENT_CATEGORY = 'Add To Incident';
export const GPS_FORMAT_CATEGORY = 'GPS Format';
export const ALERTS_CATEGORY = 'Alerts';
export const DRAWER_CATEGORY = 'Drawer';
export const FEED_CATEGORY = 'Feed';

/**
 * Function to emit a GA event.
 * 
 * @param {string} category Event category string. 
 * @param {string} action   Event action string.
 * @param {string} [label]  Event label string (optional).
 */
export function trackEvent(category, action, label=null) {
  ReactGA.event({ category, action, label });
};


/**
 * Function to create a tracker for provided category
 * @param {string} category 
 */
export function trackEventFactory (category, tracker = trackEvent) {
  const track = (action, label) => tracker(category, action, label);

  return {
    track,
    debouncedTrack: (delay = 300) => debounce(track, delay)
  };
};

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
