import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { activePatrol, patrolDefaultStoreData } from '../../__test-helpers/fixtures/patrols';
import { createMapMock } from '../../__test-helpers/mocks';
import { mockStore } from '../../__test-helpers/MockStore';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import useNavigate from '../../hooks/useNavigate';

import PatrolsTab from './';

jest.mock('../../constants', () => ({
  ...jest.requireActual('../../constants'),
  DEVELOPMENT_FEATURE_FLAGS: { ENABLE_PATROL_NEW_UI: true, ENABLE_UFA_NAVIGATION_UI: true },
}));
jest.mock('../../hooks/useNavigate', () => jest.fn());

const patrolFilter = { filter: {
  date_range: { lower: '', upper: '' },
  patrols_overlap_daterange: true,
  patrol_type: [], status: [], text: '', leader: '',
}, };

const loadingPatrols = false;
const mockedPatrols = [activePatrol];
const map = createMapMock();

let store = patrolDefaultStoreData;
store.data.patrolFilter = patrolFilter;

describe('PatrolsTab', () => {
  let navigate, useNavigateMock;
  beforeEach(() => {
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);
  });

  test('rendering without crashing', () => {
    render(<Provider store={mockStore(store)}>
      <NavigationWrapper>
        <PatrolsTab loadingPatrols={loadingPatrols} map={map} patrolResults={mockedPatrols} />
      </NavigationWrapper>
    </Provider>);
  });

  test('it should show the list patrols if the patrolDetailView does NOT contain any data', async () => {
    render(<Provider store={mockStore(store)}>
      <NavigationWrapper>
        <PatrolsTab loadingPatrols={loadingPatrols} map={map} patrolResults={mockedPatrols} />
      </NavigationWrapper>
    </Provider>);

    expect((await screen.queryByTestId('patrolDetailViewContainer'))).toBeNull();
  });

  test('opens the patrol detail view if an item from the list is clicked', async () => {
    render(<Provider store={mockStore(store)}>
      <NavigationWrapper>
        <PatrolsTab
          loadingPatrols={loadingPatrols}
          map={map}
          patrolResults={mockedPatrols}
        />
      </NavigationWrapper>
    </Provider>);

    expect(navigate).toHaveBeenCalledTimes(0);

    const patrolItemButton = await screen.findByTestId('patrol-list-item-icon-05113dd3-3f41-49ef-aa7d-fbc6b7379533');
    userEvent.click(patrolItemButton);

    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
