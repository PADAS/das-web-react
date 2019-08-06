import ReactGA from 'react-ga';

// custom dimension 'UserRole' is mapped to 'dimension1' as defined in 
// https://analytics.google.com/analytics/web/#/a12413928w206522339p199397662/admin/custom-dimensions/

export function trackEvent(category, action, label) {
  ReactGA.event({
    category: category,
    action: action,
    label: label
  });
}

export function setUserRole(role) {
  ReactGA.set({
    'dimension1' : role
  });
}