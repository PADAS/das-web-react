import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { mockStore } from '../../__test-helpers/MockStore';
import WebVitalsProvider from '../index';
import { initializeWebVitals, createUserAnalyticsData } from '../../utils/webVitals';

jest.mock('../../utils/webVitals', () => ({
  initializeWebVitals: jest.fn(),
  createUserAnalyticsData: jest.fn(),
}));

describe('WebVitalsProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(console, 'log').mockImplementation(() => { }); // Mock console.log to avoid noise in tests
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderWithProvider = (storeState = {}) => {
    const testStore = mockStore({
      data: {
        user: null,
        selectedUserProfile: {},
        ...storeState.data,
      },
      ...storeState,
    });

    return render(
      <Provider store={testStore}>
        <WebVitalsProvider />
      </Provider>
    );
  };

  it('should render without crashing', () => {
    renderWithProvider();
    expect(document.body.textContent).toBe('');
  });

  it('should not initialize web vitals when user is not available', () => {
    renderWithProvider({
      data: {
        user: null,
        selectedUserProfile: {},
      },
    });

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

    renderWithProvider({
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

    const { rerender } = renderWithProvider({
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

    expect(initializeWebVitals).toHaveBeenCalledTimes(1);

    rerender(
      <Provider store={mockStore({
        data: {
          user: mockUser,
          selectedUserProfile: {},
          systemStatus: {
            server: {
              version: '1.0.0',
            },
          },
        },
      })}>
        <WebVitalsProvider />
      </Provider>
    );

    expect(initializeWebVitals).toHaveBeenCalledTimes(1);
  });
});
