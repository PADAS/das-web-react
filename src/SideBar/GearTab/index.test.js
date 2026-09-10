import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../../__test-helpers/mocks';
import { mockStore } from '../../__test-helpers/MockStore';
import { MapContext } from '../../MapContext';
import { render, screen } from '../../test-utils';
import { INITIAL_GEAR_STATE } from '../../ducks/gear';
import { INITIAL_FILTER_STATE } from '../../ducks/map-layer-filter';
import useNavigate from '../../hooks/useNavigate';

import GearTab from './';

jest.mock('../../ducks/gear', () => ({
  ...jest.requireActual('../../ducks/gear'),
  fetchAllGear: jest.fn(),
}));
jest.mock('../../constants', () => ({
  ...jest.requireActual('../../constants'),
  BREAKPOINTS: { screenIsMediumLayoutOrLarger: { matches: false } },
}));
jest.mock('../../hooks/useNavigate', () => jest.fn());

const buildStore = (gearOverrides = {}) => mockStore({
  data: {
    gear: { ...INITIAL_GEAR_STATE, ...gearOverrides },
    mapLayerFilter: { ...INITIAL_FILTER_STATE },
  },
});

describe('GearTab', () => {
  let navigate;

  beforeEach(() => {
    const { fetchAllGear } = require('../../ducks/gear');
    fetchAllGear.mockReset();
    fetchAllGear.mockImplementation(() => jest.fn().mockResolvedValue([]));

    navigate = jest.fn();
    useNavigate.mockImplementation(() => navigate);
  });

  test('shows error banner with store message and retry dispatches fetch', async () => {
    const { fetchAllGear } = require('../../ducks/gear');
    const user = userEvent.setup();
    const store = buildStore({
      error: 'Gear service unavailable',
      loading: false,
      hasGear: true,
      allIds: ['1'],
      byId: { 1: { id: '1', display_id: 'X', devices: [] } },
    });

    render(
      <Provider store={store}>
        <GearTab />
      </Provider>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Gear service unavailable')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(fetchAllGear).toHaveBeenCalled();
  });

  test('shows initial loading copy when loading with no items yet', () => {
    const store = buildStore({
      loading: true,
      initialLoadInProgress: true,
      error: null,
    });

    render(
      <Provider store={store}>
        <GearTab />
      </Provider>,
    );

    expect(screen.getByText('Loading gear…')).toBeInTheDocument();
  });

  test('clicking the gear name jumps and closes the sidebar on small screens', async () => {
    const user = userEvent.setup();
    const store = buildStore({
      loading: false,
      error: null,
      hasGear: true,
      allIds: ['1'],
      byId: {
        1: {
          id: '1',
          display_id: 'Collar A',
          devices: [{ location: { latitude: 34.5, longitude: -103.9 } }],
        },
      },
    });

    render(
      <Provider store={store}>
        <MapContext.Provider value={createMapMock()}>
          <GearTab />
        </MapContext.Provider>
      </Provider>,
    );

    expect(navigate).toHaveBeenCalledTimes(0);

    await user.click(screen.getByTestId('gear-item-name'));

    expect(navigate).toHaveBeenCalledWith('/');
  });
});
