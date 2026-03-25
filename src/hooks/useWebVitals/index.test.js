import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react';
import { mockStore } from '../../__test-helpers/MockStore';
import useWebVitals from './index';
import { initializeWebVitals } from '../../utils/webVitals';
import { createUserAnalyticsData } from '../../utils/analytics';

jest.mock('../../utils/webVitals', () => ({
  initializeWebVitals: jest.fn(),
}));

jest.mock('../../utils/analytics', () => ({
  createUserAnalyticsData: jest.fn(),
}));

describe('useWebVitals hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(console, 'log').mockImplementation(() => { }); // Mock console.log to avoid noise in tests
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createWrapper = (storeState = {}) => {
    const testStore = mockStore({
      data: {
        user: null,
        selectedUserProfile: {},
        ...storeState.data,
      },
      ...storeState,
    });

    const Wrapper = ({ children }) => (
      <Provider store={testStore}>
        {children}
      </Provider>
    );

    return Wrapper;
  };

  it('should not initialize web vitals when user is not available', () => {
    const wrapper = createWrapper({
      data: {
        user: null,
        selectedUserProfile: {},
      },
    });

    renderHook(() => useWebVitals(), { wrapper });

    expect(initializeWebVitals).not.toHaveBeenCalled();
    expect(createUserAnalyticsData).not.toHaveBeenCalled();
  });

  it('should initialize web vitals when user with ID is available', () => {
    const mockUser = {
      id: 'user123',
      username: 'testuser',
      role: 'ranger',
      is_staff: false,
      is_superuser: false,
    };

    const mockSelectedProfile = {
      id: 'profile456',
      role: 'admin',
    };

    const mockServerVersion = '1.2.3';

    const mockUserData = {
      user_role: 'admin',
      organization: 'test.earthranger.com',
      user_id_hash: 'abc123',
      is_staff: false,
      is_superuser: false,
    };

    createUserAnalyticsData.mockReturnValue(mockUserData);

    const wrapper = createWrapper({
      data: {
        user: mockUser,
        selectedUserProfile: mockSelectedProfile,
        systemStatus: {
          server: {
            version: mockServerVersion,
          },
        },
      },
    });

    renderHook(() => useWebVitals(), { wrapper });

    expect(createUserAnalyticsData).toHaveBeenCalledWith(mockUser, mockSelectedProfile, mockServerVersion);
    expect(initializeWebVitals).toHaveBeenCalledWith(mockUserData);
  });

  it('should only initialize once even with multiple renders', () => {
    const mockUser = {
      id: 'user123',
      username: 'testuser',
      role: 'ranger',
    };

    const mockUserData = {
      user_role: 'ranger',
      organization: 'test.earthranger.com',
      user_id_hash: 'abc123',
    };

    createUserAnalyticsData.mockReturnValue(mockUserData);

    const wrapper = createWrapper({
      data: {
        user: mockUser,
        selectedUserProfile: {},
        systemStatus: {
          server: {
            version: '1.0.0',
          },
        },
      },
    });

    const { rerender } = renderHook(() => useWebVitals(), { wrapper });

    expect(initializeWebVitals).toHaveBeenCalledTimes(1);

    // Rerender the hook
    rerender();

    expect(initializeWebVitals).toHaveBeenCalledTimes(1); // Should still be 1
  });
});
