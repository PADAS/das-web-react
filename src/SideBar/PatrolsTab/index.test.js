import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { activePatrol, newPatrol, patrolDefaultStoreData } from '../../__test-helpers/fixtures/patrols';
import { createMapMock } from '../../__test-helpers/mocks';
import { mockStore } from '../../__test-helpers/MockStore';
import { showDetailView } from '../../ducks/vertical-navigation-bar';
import { TAB_KEYS } from '../../constants';

import PatrolsTab from './';

jest.mock('../../ducks/vertical-navigation-bar', () => ({
  ...jest.requireActual('../../ducks/vertical-navigation-bar'),
  showDetailView: jest.fn(),
}));

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
  let showDetailViewMock;
  beforeEach(() => {
    showDetailViewMock = jest.fn(() => () => {});
    showDetailView.mockImplementation(showDetailViewMock);
  });

  test('rendering without crashing', () => {
    render(<Provider store={mockStore(store)}>
      <PatrolsTab loadingPatrols={loadingPatrols} map={map} patrolResults={mockedPatrols} />
    </Provider>);
  });

  test('it should show the list patrols if the patrolDetailView does NOT contain any data', async () => {
    render(<Provider store={mockStore(store)}>
      <PatrolsTab loadingPatrols={loadingPatrols} map={map} patrolResults={mockedPatrols} />
    </Provider>);

    expect((await screen.queryByTestId('patrolDetailViewContainer'))).toBeNull();
  });

  test('it should show the detail patrols view if this contains some data', async () => {
    store.view.verticalNavigationBar = { currentTab: TAB_KEYS.PATROLS, data: newPatrol, showDetailView: true };
    render(<Provider store={mockStore(store)}>
      <PatrolsTab loadingPatrols={loadingPatrols} map={map} patrolResults={mockedPatrols} />
    </Provider>);

    expect((await screen.findByTestId('patrolDetailViewContainer'))).toBeDefined();
  });

  test('opens the patrol detail view if an item from the list is clicked', async () => {
    store.view.verticalNavigationBar = { showDetailView: false };
    render(<Provider store={mockStore(store)}>
      <PatrolsTab
        loadingPatrols={loadingPatrols}
        map={map}
        patrolResults={mockedPatrols}
      />
    </Provider>);

    expect(showDetailView).toHaveBeenCalledTimes(0);

    const patrolItemButton = await screen.findByTestId('patrol-list-item-icon-05113dd3-3f41-49ef-aa7d-fbc6b7379533');
    userEvent.click(patrolItemButton);

    expect(showDetailView).toHaveBeenCalledTimes(1);
  });
});