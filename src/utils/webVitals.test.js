import { initializeWebVitals } from './webVitals';
import ReactGA4 from 'react-ga4';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

import getWindowLocation from './getWindowLocation';

jest.mock('web-vitals', () => ({
  onCLS: jest.fn(),
  onFCP: jest.fn(),
  onINP: jest.fn(),
  onLCP: jest.fn(),
  onTTFB: jest.fn(),
}));

jest.mock('react-ga4', () => ({
  event: jest.fn(),
}));

jest.mock('./getWindowLocation', () => jest.fn());

describe('webVitals utility', () => {
  let originalTitle;

  beforeEach(() => {
    getWindowLocation.mockImplementation(() => ({
      pathname: '/test-path',
      hostname: 'test.earthranger.com'
    }));

    originalTitle = document.title;

    Object.defineProperty(document, 'title', {
      value: 'Test Page',
      writable: true
    });
  });

  afterEach(() => {
    Object.defineProperty(document, 'title', {
      value: originalTitle,
      writable: true
    });

    jest.resetAllMocks();
  });



  describe('initializeWebVitals', () => {
    it('should initialize all web vitals listeners', () => {
      const userData = {
        user_role: 'ranger',
        organization: 'test.earthranger.com',
        user_id_hash: 'abc123',
        is_staff: false,
        is_superuser: false,
      };

      initializeWebVitals(userData);

      expect(onCLS).toHaveBeenCalledWith(expect.any(Function));
      expect(onFCP).toHaveBeenCalledWith(expect.any(Function));
      expect(onINP).toHaveBeenCalledWith(expect.any(Function));
      expect(onLCP).toHaveBeenCalledWith(expect.any(Function));
      expect(onTTFB).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should send metrics to GA4 with user context', () => {
      const userData = {
        user_role: 'ranger',
        organization: 'test.earthranger.com',
        user_id_hash: 'abc123',
        is_staff: false,
        is_superuser: false,
      };

      initializeWebVitals(userData);

      const lcpCallback = onLCP.mock.calls[0][0];
      const mockMetric = {
        name: 'LCP',
        value: 2500,
        delta: 100,
        rating: 'good',
        id: 'metric123',
      };

      lcpCallback(mockMetric);

      expect(ReactGA4.event).toHaveBeenCalledWith('web_vital_lcp', {
        event_category: 'Web Vitals',
        metric_name: 'LCP',
        metric_value: 2500,
        metric_delta: 100,
        metric_rating: 'good',
        metric_id: 'metric123',
        page_path: '/test-path',
        page_title: 'Test Page',
        hostname: 'test.earthranger.com',
        user_role: 'ranger',
        organization: 'test.earthranger.com',
        user_id_hash: 'abc123',
        is_staff: false,
        is_superuser: false,
      });
    });
  });
});
