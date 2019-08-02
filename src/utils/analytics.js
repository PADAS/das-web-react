import ReactGA from 'react-ga';

export function trackEvent(category, action, label) {
  ReactGA.event({
    category: category,
    action: action,
    label: label
  });
}