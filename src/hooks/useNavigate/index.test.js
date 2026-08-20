import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { render, waitFor } from '@testing-library/react';
import { useNavigate as useRouterNavigate } from 'react-router';

import { mockStore } from '../../__test-helpers/MockStore';
import { NavigationContext } from '../../NavigationContextProvider';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import useNavigate from './';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(),
}));

describe('useNavigate', () => {
  const mockStoreInstance = mockStore({});
  const routerNavigate = jest.fn(),
    attemptNavigation = jest.fn(),
    setNavigationData = jest.fn();

  const navigationContextValue = { attemptNavigation, setNavigationData };

  beforeEach(() => {
    useRouterNavigate.mockImplementation(() => routerNavigate);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const runAttemptedNavigation = () => attemptNavigation.mock.calls[0][0]();

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

    await waitFor(() => expect(attemptNavigation).toHaveBeenCalledTimes(1));

    runAttemptedNavigation();

    expect(routerNavigate).toHaveBeenCalledWith('/', { state: 'stateee' });
    expect(setNavigationData).toHaveBeenCalledWith({});
    expect(mockStoreInstance.getActions()[0].type).toEqual('SET_SHOW_SIDE_BAR');
  });

  test('Passes along the provided navigation context data', async () => {
    const navigationContextData = { fromMap: true };

    const Component = () => {
      const navigate = useNavigate();
      useEffect(() => { navigate('/', undefined, navigationContextData); }, [navigate]);
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

    await waitFor(() => expect(attemptNavigation).toHaveBeenCalledTimes(1));

    runAttemptedNavigation();

    expect(setNavigationData).toHaveBeenCalledWith(navigationContextData);
  });

  test('Passes along the provided navigation context data even when not clearing the context', async () => {
    const navigationContextData = { fromMap: true };

    const Component = () => {
      const navigate = useNavigate({ clearContext: false });
      useEffect(() => { navigate('/', undefined, navigationContextData); }, [navigate]);
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

    await waitFor(() => expect(attemptNavigation).toHaveBeenCalledTimes(1));

    runAttemptedNavigation();

    expect(setNavigationData).toHaveBeenCalledWith(navigationContextData);
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

    await waitFor(() => expect(attemptNavigation).toHaveBeenCalledTimes(1));

    runAttemptedNavigation();

    expect(routerNavigate).toHaveBeenCalledWith('/', undefined);
    expect(setNavigationData).not.toHaveBeenCalled();
  });

  test('Uses React Router navigate without showing the side bar', async () => {
    const mockStoreInstance = mockStore({});

    const Component = () => {
      const navigate = useNavigate({ dispatchShowSideBar: false });
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

    await waitFor(() => expect(attemptNavigation).toHaveBeenCalledTimes(1));

    runAttemptedNavigation();

    expect(routerNavigate).toHaveBeenCalledWith('/', undefined);
    expect(setNavigationData).toHaveBeenCalledWith({});
    expect(mockStoreInstance.getActions()).toHaveLength(0);
  });
});
