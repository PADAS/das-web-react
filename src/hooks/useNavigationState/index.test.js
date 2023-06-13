import useNavigationState from './';
import useNavigate from '../useNavigate';
import { render, waitFor, screen } from '@testing-library/react';
import { BLOCKER_STATES, NavigationContext } from '../../NavigationContextProvider';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import React, { useEffect } from 'react';
import { mockStore } from '../../__test-helpers/MockStore';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';
import reactRouterPackage from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
}));

describe('useNavigationState', () => {

  const mockStoreInstance = mockStore({}),
    onNavigationAttemptBlocked = jest.fn(),
    reset = jest.fn(),
    setNavigationData = jest.fn();

  const navigationContextValue = {
    blocker: { reset, state: BLOCKER_STATES.UNBLOCKED },
    isNavigationBlocked: false,
    onNavigationAttemptBlocked,
    setNavigationData,
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderComponent = (Component) => {
    return render(
      <Provider store={mockStoreInstance}>
        <NavigationWrapper>
          <NavigationContext.Provider value={navigationContextValue}>
            <Component/>
          </NavigationContext.Provider>
        </NavigationWrapper>
      </Provider>
    );
  };

  test.only('it injects navigation state to a redirection', async () => {
    const Component = () => {
      const { navigationState } = useNavigationState();
      const navigate = useNavigate();

      useEffect(() => {
        navigate('/patrols', { state: navigationState });
      }, []);

      return null;
    };

    renderComponent(Component);

    await waitFor(() => {
      expect(routeData.useNavigate).toHaveBeenCalledWith('/patrols', { state: { from: '/' } });
    });
  });

  test('it goes back to prev location when nav state is present ', async () => {
    const useLocationSpy = jest.spyOn(reactRouterPackage, 'useLocation');
    const Component = () => {
      const { navigationState, goBack } = useNavigationState();
      const navigate = useNavigate();

      useEffect(() => {
        navigate('/patrols', { state: navigationState });
      }, []);

      return <button onClick={goBack}>Go back</button>;
    };

    renderComponent(Component);

    const goBackButton = screen.getByText('Go back');
    userEvent.click(goBackButton);

    const visitedPaths = useLocationSpy.mock.results.map(({ value: { pathname } }) => pathname);
    expect(visitedPaths).toEqual(['/', '/patrols', '/']);
  });
});