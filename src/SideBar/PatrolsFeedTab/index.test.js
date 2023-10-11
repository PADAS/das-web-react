import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { activePatrol, patrolDefaultStoreData } from '../../__test-helpers/fixtures/patrols';
import { mockStore } from '../../__test-helpers/MockStore';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import useNavigate from '../../hooks/useNavigate';

import PatrolsFeedTab from './';
import { SidebarScrollContext } from '../../SidebarScrollContext';

jest.mock('../../constants', () => ({
  ...jest.requireActual('../../constants'),
  DEVELOPMENT_FEATURE_FLAGS: { ENABLE_PATROL_NEW_UI: true },
}));
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
      <NavigationWrapper>
        <SidebarScrollContext>
          <PatrolsFeedTab />
        </SidebarScrollContext>
      </NavigationWrapper>
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
