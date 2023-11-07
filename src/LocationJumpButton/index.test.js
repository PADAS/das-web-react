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
}));
jest.mock('../hooks/useNavigate', () => jest.fn());

describe('AddReport', () => {
  const onClick = jest.fn();
  let map, navigate, useNavigateMock;
  const initialStore = mockStore({ view: { showUserLocation: true, userPreferences: {} } });
  const initialProps = {
    bypassLocationValidation: true,
    onClick
  };

  beforeEach(() => {
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);
    map = createMapMock();
  });

  const renderLocationJumpButton = (props = initialProps) => render(
    <Provider store={initialStore}>
      <NavigationWrapper>
        <MapContext.Provider value={map}>
          <LocationJumpButton {...props} />
        </MapContext.Provider>
      </NavigationWrapper>
    </Provider>
  );

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('navigates out of the sidebar when jumping to a location in a small device', async () => {
    renderLocationJumpButton();
    expect(navigate).toHaveBeenCalledTimes(0);

    const jumpButton = await screen.findByTitle('Jump to this location');
    userEvent.click(jumpButton);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/');
  });

  test('shows jump button when receiving event coors', async () => {
    const coordinates = [-103.93549299890081, 34.49211537131302];
    renderLocationJumpButton({ ...initialProps, bypassLocationValidation: false, coordinates });

    expect(await screen.findByTitle('Jump to this location')).toBeInTheDocument();
  });

  test('shows jump button when receiving an event collection coors', async () => {
    const coordinates = [[-103.93549299890081, 34.49211537131302], [-112.26236016407142, 46.61672813483423]];
    renderLocationJumpButton({ ...initialProps, bypassLocationValidation: false, coordinates });

    expect(await screen.findByTitle('Jump to this location')).toBeInTheDocument();
  });

  test('shows jump button when receiving an event collection coors with at least one polygon', async () => {
    const coordinates = [
      [[-114.37499012262823, 46.787177293733976], [-112.26236016407142, 46.61672813483423], [-112.26272865732636, 45.408552883751014]],
      [-103.93549299890081, 34.49211537131302]
    ];
    renderLocationJumpButton({ ...initialProps, bypassLocationValidation: false, coordinates });

    expect(await screen.findByTitle('Jump to this location')).toBeInTheDocument();
  });

  test('hides jump button when receiving invalid coors', async () => {
    const coordinates = [
      [-103.93549299890081, 34.49211537131302],
      [-114.37499012262823, 'not a coordinate'],
    ];
    renderLocationJumpButton({ ...initialProps, bypassLocationValidation: false, coordinates });

    expect(await screen.queryByTitle('Jump to this location')).not.toBeInTheDocument();
  });


});