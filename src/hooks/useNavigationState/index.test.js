import useNavigationState from './';
import useNavigate from '../useNavigate';
import { render, screen } from '@testing-library/react';
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

  let useLocationSpy;

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

  const renderComponent = (Component, props) => {
    return render(
      <Provider store={mockStoreInstance}>
        <NavigationWrapper>
          <NavigationContext.Provider value={navigationContextValue}>
            <Component {...props} />
          </NavigationContext.Provider>
        </NavigationWrapper>
      </Provider>
    );
  };

  beforeEach(() => {
    useLocationSpy = jest.spyOn(reactRouterPackage, 'useLocation');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('it goes back to parent feed when nav state is not present ', async () => {
    const url = '/patrols/234235';
    const Component = ({ url }) => {
      const { goBack } = useNavigationState();
      const navigate = useNavigate();

      useEffect(() => {
        navigate(url);
      }, []);

      return <button onClick={goBack}>Go back</button>;
    };

    renderComponent(Component, { url });

    const goBackButton = screen.getByText('Go back');
    userEvent.click(goBackButton);

    const paths = [
      {
        pathname: '/',
        state: null,
      },
      {
        pathname: url,
        state: null,
      },
      {
        pathname: '/patrols',
        state: null,
      }
    ];

    const visitedPaths = useLocationSpy.mock.results.map(({ value: { pathname, state } }) => ({ pathname, state }));
    expect(visitedPaths).toEqual(paths);
  });

  test('it goes back to prev location when nav state is present ', async () => {
    const url = '/patrols';
    const Component = ({ url }) => {
      const { navigationState, goBack } = useNavigationState();
      const navigate = useNavigate();

      useEffect(() => {
        navigate(url, { state: navigationState });
      }, []);

      return <button onClick={goBack}>Go back</button>;
    };

    renderComponent(Component, { url });

    const goBackButton = screen.getByText('Go back');
    userEvent.click(goBackButton);

    const paths = [
      {
        pathname: '/',
        state: null,
      },
      {
        pathname: '/patrols',
        state: { from: '/' },
      },
      {
        pathname: '/',
        state: null,
      }
    ];

    const visitedPaths = useLocationSpy.mock.results.map(({ value: { pathname, state } }) => ({ pathname, state }));
    expect(visitedPaths).toEqual(paths);
  });
});