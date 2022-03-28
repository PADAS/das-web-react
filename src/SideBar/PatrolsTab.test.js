import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';

import { createMapMock } from '../__test-helpers/mocks';
import { mockStore } from '../__test-helpers/MockStore';
import { activePatrol, newPatrol, patrolDefaultStoreData } from '../__test-helpers/fixtures/patrols';

import PatrolsTab from './PatrolsTab';

const patrolFilter = { filter: {
  date_range: { lower: '', upper: '' },
  patrols_overlap_daterange: true,
  patrol_type: [], status: [], text: '', leader: '',
}, };

const loadingPatrols = false;
const nestedNavigationState = true;
const mockedPatrols = [activePatrol];
const setNestedNavigationState = jest.fn();

let store = patrolDefaultStoreData;
store.data.patrolFilter = patrolFilter;
store.view = { patrolDetailView: {} };

test('rendering without crashing', () => {
  render(<Provider store={mockStore(store)}>
    <PatrolsTab
      loadingPatrols={loadingPatrols}
      map={createMapMock()}
      patrolResults={mockedPatrols}
      nestedNavigationState={nestedNavigationState}
      changeNestedNavigation={setNestedNavigationState}
    />
  </Provider>);
});

describe('Patrol Detail View', () => {
  test('it should show the list patrols if the patrolDetailView does NOT contain any data', async () => {
    render(<Provider store={mockStore(store)}>
      <PatrolsTab
        loadingPatrols={loadingPatrols}
        map={createMapMock()}
        patrolResults={mockedPatrols}
        nestedNavigationState={nestedNavigationState}
        changeNestedNavigation={setNestedNavigationState}
      />
    </Provider>);

    expect((await screen.queryByTestId('patrol-detail-view'))).toBeNull();
  });

  test('it should show the detail patrols view if this contains some data', async () => {
    store.view.patrolDetailView = newPatrol;
    render(<Provider store={mockStore(store)}>
      <PatrolsTab
        loadingPatrols={loadingPatrols}
        map={createMapMock()}
        patrolResults={mockedPatrols}
        nestedNavigationState={nestedNavigationState}
        changeNestedNavigation={setNestedNavigationState}
      />
    </Provider>);
    expect((await screen.queryByTestId('patrol-detail-view'))).toBeDefined();
  });
});
