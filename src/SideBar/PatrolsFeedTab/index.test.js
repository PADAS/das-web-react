import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { activePatrol, patrolDefaultStoreData } from '../../__test-helpers/fixtures/patrols';
import { mockStore } from '../../__test-helpers/MockStore';
import useNavigate from '../../hooks/useNavigate';
import { render, screen } from '../../test-utils';

import PatrolsFeedTab from './';
import { SidebarScrollProvider } from '../../SidebarScrollContext';

jest.mock('../../hooks/useNavigate', () => jest.fn());

const patrolFilter = { filter: {
  date_range: { lower: '', upper: '' },
  patrols_overlap_daterange: true,
  patrol_type: [], status: [], text: '', leader: '',
}, };

let store = patrolDefaultStoreData;
store.data.patrolFilter = patrolFilter;
store.data.patrolStore = { [activePatrol.id]: activePatrol };
store.data.patrols.results = [activePatrol.id];

describe('PatrolsFeedTab', () => {
  let navigate, useNavigateMock;
  const renderPatrolsFeedTab = () => render(
    <Provider store={mockStore(store)}>
      <SidebarScrollProvider>
        <PatrolsFeedTab />
      </SidebarScrollProvider>
    </Provider>
  );
  beforeEach(() => {
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);
  });

  test('rendering without crashing', () => {
    renderPatrolsFeedTab();
  });

  test('it should show the list patrols if the patrolDetailView does NOT contain any data', async () => {
    renderPatrolsFeedTab();
    expect((await screen.queryByTestId('patrolDetailViewContainer'))).toBeNull();
  });

  test('opens the patrol detail view if an item from the list is clicked', async () => {
    renderPatrolsFeedTab();

    expect(navigate).toHaveBeenCalledTimes(0);

    const patrolItemButton = await screen.findByTestId('patrol-list-item-icon-05113dd3-3f41-49ef-aa7d-fbc6b7379533');
    userEvent.click(patrolItemButton);

    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
