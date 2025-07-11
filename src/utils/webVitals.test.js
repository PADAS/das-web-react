import { initializeWebVitals, createUserAnalyticsData } from '../webVitals';
import ReactGA4 from 'react-ga4';
import { onCLS, onFCP, onLCP, onTTFB } from 'web-vitals';

jest.mock('web-vitals', () => ({
  onCLS: jest.fn(),
  onFCP: jest.fn(),
  onLCP: jest.fn(),
  onTTFB: jest.fn(),
}));

jest.mock('react-ga4', () => ({
  event: jest.fn(),
}));

describe('webVitals utility', () => {
  let originalLocation;
  let originalTitle;

  beforeEach(() => {
    jest.clearAllMocks();

    originalLocation = window.location;
    originalTitle = document.title;

    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/test-path',
        hostname: 'test.earthranger.com'
      },
      writable: true
    });

    Object.defineProperty(document, 'title', {
      value: 'Test Page',
      writable: true
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true
    });
    Object.defineProperty(document, 'title', {
      value: originalTitle,
      writable: true
    });
  });

  describe('createUserAnalyticsData', () => {
    it('should create data with main user when no profile selected', () => {
      const user = {
        id: 'user123',
        role: 'ranger',
        is_staff: false,
        is_superuser: false,
      };
      const selectedUserProfile = {};

      const data = createUserAnalyticsData(user, selectedUserProfile);

      expect(data).toEqual({
        user_role: 'ranger',
        organization: 'test.earthranger.com',
        user_id_hash: expect.any(String),
        is_staff: false,
        is_superuser: false,
      });
      expect(data.user_id_hash).not.toBe('unknown');
    });

    it('should create data with selected profile when available', () => {
      const user = {
        id: 'user123',
        role: 'ranger',
        is_staff: false,
        is_superuser: false,
      };
      const selectedUserProfile = {
        id: 'profile456',
        role: 'admin',
        is_staff: true,
        is_superuser: false,
      };

      const data = createUserAnalyticsData(user, selectedUserProfile);

      expect(data).toEqual({
        user_role: 'admin',
        organization: 'test.earthranger.com',
        user_id_hash: expect.any(String),
        is_staff: true,
        is_superuser: false,
      });
    });

    it('should handle missing user data gracefully', () => {
      const data = createUserAnalyticsData({}, {});

      expect(data).toEqual({
        user_role: 'unknown',
        organization: 'test.earthranger.com',
        user_id_hash: 'unknown',
        is_staff: false,
        is_superuser: false,
      });
    });
  });

  describe('initializeWebVitals', () => {
    it('should initialize all web vitals listeners', () => {
      const userContext = {
        user_role: 'ranger',
        organization: 'test.earthranger.com',
        user_id_hash: 'abc123',
        is_staff: false,
        is_superuser: false,
      };

      initializeWebVitals(userContext);

      expect(onCLS).toHaveBeenCalledWith(expect.any(Function));
      expect(onFCP).toHaveBeenCalledWith(expect.any(Function));
      expect(onLCP).toHaveBeenCalledWith(expect.any(Function));
      expect(onTTFB).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should send metrics to GA4 with user context', () => {
      const userContext = {
        user_role: 'ranger',
        organization: 'test.earthranger.com',
        user_id_hash: 'abc123',
        is_staff: false,
        is_superuser: false,
      };

      initializeWebVitals(userContext);

      const lcpCallback = onLCP.mock.calls[0][0];
      const mockMetric = {
        name: 'LCP',
        value: 2500,
        delta: 100,
        rating: 'good',
        id: 'metric123',
      };

      lcpCallback(mockMetric);

      expect(ReactGA4.event).toHaveBeenCalledWith({
        category: 'Web Vitals',
        action: 'LCP',
        label: 'metric123',
        value: 2500,
        nonInteraction: true,
        custom_parameters: {
          metric_delta: 100,
          metric_rating: 'good',
          page_path: '/test-path',
          page_title: 'Test Page',
          hostname: 'test.earthranger.com',
          user_role: 'ranger',
          organization: 'test.earthranger.com',
          user_id_hash: 'abc123',
          is_staff: false,
          is_superuser: false,
        },
      });
    });
  });
});
