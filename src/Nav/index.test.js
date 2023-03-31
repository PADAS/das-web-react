import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { rest } from 'msw';
import ReactGA from 'react-ga';
import { setupServer } from 'msw/node';

import { createMapMock } from '../__test-helpers/mocks';
import { clearUserProfile, USER_API_URL, CURRENT_USER_API_URL, USER_PROFILES_API_URL } from '../ducks/user';
import { NEWS_API_URL } from '../ducks/news';
import { userWithPin, userWithoutPin, userWithoutEula, userList } from '../__test-helpers/fixtures/users';
import NavigationWrapper from '../__test-helpers/navigationWrapper';

import store from '../store';
import { MapContext } from '../App';
import Nav from './';
import ModalRenderer from '../ModalRenderer';
import useNavigate from '../hooks/useNavigate';
jest.mock('../hooks/useNavigate', () => jest.fn());

ReactGA.initialize('dummy', { testMode: true });

const generateResponse = (data = []) => ({ data });

const anotherPinProfile = userWithoutEula;

const server = setupServer(
  rest.get(`${USER_API_URL}/:userId`, (req, res, ctx) => {
    const { userId } = req.params;
    const userMatch = userList.find(user => user.id === userId);

    return res(
      ctx.json(
        generateResponse(userMatch)
      )
    );
  }),
  rest.get(CURRENT_USER_API_URL, (req, res, ctx) => {
    return res(
      ctx.json(
        generateResponse(
          userWithPin,
        )
      )
    );
  }),
  rest.get(USER_PROFILES_API_URL, (req, res, ctx) => {
    return res(
      ctx.json(
        generateResponse(
          userList.filter(user => user.id !== userWithPin.id)
        ),
      )
    );
  }),
  rest.get(NEWS_API_URL, (req, res, ctx) => {
    return res(
      ctx.json(
        generateResponse(),
      )
    );
  }),
);

beforeAll(() => server.listen());
beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  server.resetHandlers();
  store.dispatch(clearUserProfile());
  jest.useRealTimers();
});
afterAll(() => server.close());

describe('the Nav component', () => {
  let renderWithWrapper, map, navigate, useNavigateMock;
  beforeEach(() => {
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);
    map = createMapMock();

    renderWithWrapper = (Component) => render(Component, { wrapper: ({ children }) =>
      <Provider store={store}>
        <NavigationWrapper>
          <MapContext.Provider value={map}>
            {children}
            <ModalRenderer />
          </MapContext.Provider>
        </NavigationWrapper>
      </Provider> });

  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('navigates to login if can not fetch the current user', async () => {
    server.use(
      rest.get(CURRENT_USER_API_URL, (req, res, ctx) => {
        return res.once(
          ctx.status(403
          ));
      })
    );

    renderWithWrapper(
      <Nav map={map} />
    );

    expect(navigate).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith({ pathname: '/login', search: '' });
    });
  });
  describe('changing profiles', () => {
    let reloadMock, userToggleBtn;

    beforeEach(async () => {
      reloadMock = jest.fn();

      delete window.location;
      window.location = { reload: jest.fn() };

      window.location.reload = reloadMock;

      renderWithWrapper(
        <Nav map={map} />
      );

      userToggleBtn = await screen.findByTestId('user-menu-toggle-btn');

      userToggleBtn.click();

    });
    test('selecting a non-PIN-protected profile', async () => {
      const nonPinProfileLink = await screen.getByRole('button', {
        name: userWithoutPin.username,
      });

      nonPinProfileLink.click();

      const state = store.getState();

      expect(state.data.selectedUserProfile).toEqual(userWithoutPin);

      jest.runAllTimers();

      await waitFor(() => {
        expect(reloadMock).toHaveBeenCalled();
      });

    });

    test('selecting a PIN-protected profile', async () => {
      let pinInputs, state;
      const profileProtectedLink = await screen.getByRole('button', {
        name: anotherPinProfile.username,
      });

      profileProtectedLink.click();

      state = store.getState();

      expect(state.data.selectedUserProfile).not.toEqual(anotherPinProfile);

      await screen.findByText('Enter Your PIN');
      pinInputs = await screen.findAllByRole('input');

      const splitPin = anotherPinProfile.pin.split('');

      splitPin.forEach((char, index) => {
        fireEvent.keyDown(pinInputs[index], { key: char, code: `key${char}` });
      });

      state = store.getState();

      expect(state.data.selectedUserProfile).toEqual(anotherPinProfile);

      jest.runAllTimers();

      await waitFor(() => {
        expect(reloadMock).toHaveBeenCalled();
      });
    });
  });
});

