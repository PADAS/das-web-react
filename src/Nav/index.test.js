import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';

import { createMapMock } from '../__test-helpers/mocks';
import { fetchCurrentUser, fetchCurrentUserProfiles, setUserProfile } from '../ducks/user';
import Nav from './';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import useNavigate from '../hooks/useNavigate';

jest.mock('../ducks/user', () => ({
  ...jest.requireActual('../ducks/user'),
  fetchCurrentUser: jest.fn(),
  fetchCurrentUserProfiles: jest.fn(),
  setUserProfile: jest.fn(),
}));
jest.mock('../hooks/useNavigate', () => jest.fn());

describe('Login', () => {
  let fetchCurrentUserMock, renderWithWrapper, fetchCurrentUserProfilesMock, map, navigate, setUserProfileMock, store, useNavigateMock;
  beforeEach(() => {
    fetchCurrentUserMock = jest.fn(() => () => Promise.resolve());
    fetchCurrentUser.mockImplementation(fetchCurrentUserMock);
    fetchCurrentUserProfilesMock = jest.fn(() => () => Promise.resolve());
    fetchCurrentUserProfiles.mockImplementation(fetchCurrentUserProfilesMock);
    setUserProfileMock = jest.fn(() => () => Promise.resolve());
    setUserProfile.mockImplementation(setUserProfileMock);
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);
    map = createMapMock();
    store = mockStore({
      data: { maps: [], user: {}, userProfiles: [], selectedUserProfile: {}, systemStatus: {} },
      view: { homeMap: {} },
    });

    renderWithWrapper = (Component) => render(Component, { wrapper: ({ children }) =>
      <Provider store={store}>
        <NavigationWrapper>
          {children}
        </NavigationWrapper>
      </Provider> });

  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('navigates to login if can not fetch the current user', async () => {
    fetchCurrentUserMock = jest.fn(() => () => Promise.reject());
    fetchCurrentUser.mockImplementation(fetchCurrentUserMock);

    renderWithWrapper(
      <Nav map={map} />
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith({ pathname: '/login', search: '' });
    });
  });
});


describe('changing profiles', () => {
  beforeEach(() => {

  });
  test('selecting a non-PIN-protected profile', async () => {


  });

  test('selecting the main user', async () => {

  });

  test('selecting a PIN-protected profile', async () => {

  });
});