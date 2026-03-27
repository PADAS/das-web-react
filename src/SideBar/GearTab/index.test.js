import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../../__test-helpers/MockStore';
import { render, screen } from '../../test-utils';
import { INITIAL_GEAR_STATE } from '../../ducks/gear';
import { INITIAL_FILTER_STATE } from '../../ducks/map-layer-filter';

import GearTab from './';

jest.mock('../../ducks/gear', () => ({
  ...jest.requireActual('../../ducks/gear'),
  fetchAllGear: jest.fn(),
}));

const buildStore = (gearOverrides = {}) => mockStore({
  data: {
    gear: { ...INITIAL_GEAR_STATE, ...gearOverrides },
    mapLayerFilter: { ...INITIAL_FILTER_STATE },
  },
});

describe('GearTab', () => {
  beforeEach(() => {
    const { fetchAllGear } = require('../../ducks/gear');
    fetchAllGear.mockReset();
    fetchAllGear.mockImplementation(() => jest.fn().mockResolvedValue([]));
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
});
