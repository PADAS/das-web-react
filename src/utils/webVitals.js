import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import ReactGA4 from 'react-ga4';

import getWindowLocation from './getWindowLocation';



const isLocalhost = () => {
  return getWindowLocation().hostname === 'localhost' || getWindowLocation().hostname === '127.0.0.1';
};

export const initializeWebVitals = (userData = {}) => {
  const sendToGA4 = (metric) => {
    if (isLocalhost()) {
      if (import.meta.env.DEV) {
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

    if (import.meta.env.DEV) {
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
