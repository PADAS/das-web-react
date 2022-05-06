import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../__test-helpers/mocks';
import LocationJumpButton from './';
import { MapContext } from '../App';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import useNavigate from '../hooks/useNavigate';

jest.mock('../constants', () => ({
  ...jest.requireActual('../constants'),
  BREAKPOINTS: { screenIsMediumLayoutOrLarger: { matches: false } },
  DEVELOPMENT_FEATURE_FLAGS: { ENABLE_URL_NAVIGATION: true },
}));
jest.mock('../hooks/useNavigate', () => jest.fn());

describe('AddReport', () => {
  const onClick = jest.fn();
  let map, navigate, store, useNavigateMock;
  beforeEach(() => {
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);
    map = createMapMock();
    store = mockStore({ view: { showUserLocation: true, userPreferences: {} } });

    render(
      <Provider store={store}>
        <NavigationWrapper>
          <MapContext.Provider value={map}>
            <LocationJumpButton bypassLocationValidation onClick={onClick} />
          </MapContext.Provider>
        </NavigationWrapper>
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('navigates out of the sidebar when jumping to a location in a small device', async () => {
    expect(navigate).toHaveBeenCalledTimes(0);

    const jumpButton = await screen.findByTitle('Jump to this location');
    userEvent.click(jumpButton);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/');
  });
});