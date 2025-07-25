import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import ReactGA4 from 'react-ga4';

import { CLIENT_BUILD_VERSION } from '../constants';
import getWindowLocation from './getWindowLocation';
import { hashString } from './string';

export const createUserAnalyticsData = (user = {}, selectedUserProfile = {}, serverVersion = 'unknown') => {
  const activeUser = selectedUserProfile.id ? selectedUserProfile : user;

  return {
    user_role: activeUser.role || 'unknown',
    organization: getWindowLocation().hostname,
    user_id_hash: hashString(activeUser.id),
    is_staff: activeUser.is_staff || false,
    is_superuser: activeUser.is_superuser || false,
    client_version: CLIENT_BUILD_VERSION,
    server_version: serverVersion,
  };
};

const isLocalhost = () => {
  return getWindowLocation().hostname === 'localhost' || getWindowLocation().hostname === '127.0.0.1';
};

export const initializeWebVitals = (userData = {}) => {
  const sendToGA4 = (metric) => {
    if (isLocalhost()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('localhost web vitals:', {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          path: getWindowLocation().pathname,
        });
      }
      return;
    }

    ReactGA4.event(`web_vital_${metric.name.toLowerCase()}`, {
      event_category: 'Web Vitals',
      metric_name: metric.name,
      metric_value: Math.round(metric.value),
      metric_delta: metric.delta,
      metric_rating: metric.rating,
      metric_id: metric.id,
      page_path: getWindowLocation().pathname,
      page_title: document.title,
      hostname: getWindowLocation().hostname,
      ...userData,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vital sent to GA4:', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        path: getWindowLocation().pathname,
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
