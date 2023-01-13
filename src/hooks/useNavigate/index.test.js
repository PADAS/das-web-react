import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { render, waitFor } from '@testing-library/react';
import { useNavigate as useRouterNavigate } from 'react-router-dom';

import { mockStore } from '../../__test-helpers/MockStore';
import { NavigationContext } from '../../NavigationContextProvider';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import useNavigate from './';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('useNavigate', () => {
  let mockStoreInstance = mockStore({});
  const routerNavigate = jest.fn(),
    navigationAttemptBlocked = jest.fn(),
    navigationAttemptUnblocked = jest.fn(),
    setNavigationData = jest.fn();

  const navigationContextValue = {
    isNavigationBlocked: false,
    navigationAttemptBlocked,
    navigationAttemptResolution: null,
    navigationAttemptUnblocked,
    setNavigationData,
  };

  let useRouterNavigateMock;
  beforeEach(() => {
    useRouterNavigateMock = jest.fn(() => routerNavigate);
    useRouterNavigate.mockImplementation(useRouterNavigateMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Uses React Router navigate cleaning context and showing the sidebar by default', async () => {
    const Component = () => {
      const navigate = useNavigate();
      useEffect(() => { navigate('/', { state: 'stateee' }); }, [navigate]);
      return null;
    };

    render(
      <Provider store={mockStoreInstance}>
        <NavigationWrapper>
          <NavigationContext.Provider value={navigationContextValue}>
            <Component />
          </NavigationContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(routerNavigate).toHaveBeenCalledTimes(1);
      expect(routerNavigate).toHaveBeenCalledWith('/', { state: 'stateee' });
      expect(setNavigationData).toHaveBeenCalledWith({});
      expect(mockStoreInstance.getActions()[0].type).toEqual('SET_SHOW_SIDE_BAR');
    });
  });

  test('Uses React Router navigate without cleaning the navigation context', async () => {
    const Component = () => {
      const navigate = useNavigate({ clearContext: false });
      useEffect(() => { navigate('/'); }, [navigate]);
      return null;
    };

    render(
      <Provider store={mockStoreInstance}>
        <NavigationWrapper>
          <NavigationContext.Provider value={navigationContextValue}>
            <Component />
          </NavigationContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(routerNavigate).toHaveBeenCalledTimes(1);
      expect(routerNavigate).toHaveBeenCalledWith('/', undefined);
      expect(setNavigationData).not.toHaveBeenCalled();
      expect(mockStoreInstance.getActions()[0].type).toEqual('SET_SHOW_SIDE_BAR');
    });
  });

  test('Uses React Router navigate without showing the side bar', async () => {
    const Component = () => {
      const navigate = useNavigate({ dispatchShowSideBar: false });
      useEffect(() => { navigate('/'); }, [navigate]);
      return null;
    };

    mockStoreInstance = mockStore({});
    render(
      <Provider store={mockStoreInstance}>
        <NavigationWrapper>
          <NavigationContext.Provider value={navigationContextValue}>
            <Component />
          </NavigationContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(routerNavigate).toHaveBeenCalledTimes(1);
      expect(routerNavigate).toHaveBeenCalledWith('/', undefined);
      expect(setNavigationData).toHaveBeenCalledWith({});
      expect(mockStoreInstance.getActions()).toHaveLength(0);
    });
  });

  test('blocks a navigation attempt', async () => {
    navigationContextValue.isNavigationBlocked = true;

    const Component = () => {
      const navigate = useNavigate();
      useEffect(() => { navigate('/'); }, [navigate]);
      return null;
    };

    render(
      <Provider store={mockStoreInstance}>
        <NavigationWrapper>
          <NavigationContext.Provider value={navigationContextValue}>
            <Component />
          </NavigationContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(routerNavigate).toHaveBeenCalledTimes(0);
      expect(navigationAttemptBlocked).toHaveBeenCalledTimes(1);
    });

    navigationContextValue.isNavigationBlocked = false;
  });

  test('unblocks a cancelled navigation attempt', async () => {
    navigationContextValue.isNavigationBlocked = true;
    navigationContextValue.navigationAttemptResolution = false;

    const Component = () => {
      const navigate = useNavigate();
      useEffect(() => { navigate('/'); }, [navigate]);
      return null;
    };

    render(
      <Provider store={mockStoreInstance}>
        <NavigationWrapper>
          <NavigationContext.Provider value={navigationContextValue}>
            <Component />
          </NavigationContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(routerNavigate).toHaveBeenCalledTimes(0);
      expect(navigationAttemptBlocked).toHaveBeenCalledTimes(1);
      expect(navigationAttemptUnblocked).toHaveBeenCalled();
    });

    navigationContextValue.isNavigationBlocked = false;
    navigationContextValue.navigationAttemptResolution = null;
  });

  test('unblocks a continued navigation attempt', async () => {
    navigationContextValue.isNavigationBlocked = true;
    navigationContextValue.navigationAttemptResolution = true;

    const Component = () => {
      const navigate = useNavigate();
      useEffect(() => { navigate('/'); }, [navigate]);
      return null;
    };

    render(
      <Provider store={mockStoreInstance}>
        <NavigationWrapper>
          <NavigationContext.Provider value={navigationContextValue}>
            <Component />
          </NavigationContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    await waitFor(() => {
      expect(routerNavigate).toHaveBeenCalledTimes(1);
      expect(navigationAttemptBlocked).toHaveBeenCalledTimes(1);
      expect(navigationAttemptUnblocked).toHaveBeenCalled();
    });

    navigationContextValue.isNavigationBlocked = false;
    navigationContextValue.navigationAttemptResolution = null;
  });
});
