import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import ReactGA4 from 'react-ga4';
import { hashString } from './string';
import { CLIENT_BUILD_VERSION } from '../constants';

export const createUserAnalyticsData = (user = {}, selectedUserProfile = {}, serverVersion = 'unknown') => {
  const activeUser = selectedUserProfile.id ? selectedUserProfile : user;

  return {
    user_role: activeUser.role || 'unknown',
    organization: window.location.hostname,
    user_id_hash: hashString(activeUser.id),
    is_staff: activeUser.is_staff || false,
    is_superuser: activeUser.is_superuser || false,
    client_version: CLIENT_BUILD_VERSION,
    server_version: serverVersion,
  };
};

const isLocalhost = () => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

export const initializeWebVitals = (userContext = {}) => {
  const sendToGA4 = (metric) => {
    if (isLocalhost()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('localhost web vitals:', {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          path: window.location.pathname,
        });
      }
      return;
    }

    ReactGA4.event({
      action: `web_vital_${metric.name.toLowerCase()}`,
      custom_parameters: {
        event_category: 'Web Vitals',
        metric_name: metric.name,
        metric_value: Math.round(metric.value),
        metric_delta: metric.delta,
        metric_rating: metric.rating,
        metric_id: metric.id,
        page_path: window.location.pathname,
        ...userContext,
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vital sent to GA4:', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        path: window.location.pathname,
      });
    }
  };

  onCLS(sendToGA4);
  onLCP(sendToGA4);
  onFCP(sendToGA4);
  onINP(sendToGA4);
  onTTFB(sendToGA4);
};

export default initializeWebVitals;
