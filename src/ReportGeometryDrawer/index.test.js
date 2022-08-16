import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setMapAreaSelection } from '../ducks/map-ui';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import { report } from '../__test-helpers/fixtures/reports';
import ReportGeometryDrawer from './';

jest.mock('../ducks/map-ui', () => ({
  ...jest.requireActual('../ducks/map-ui'),
  setMapAreaSelection: jest.fn(),
}));

describe('ReportGeometryDrawer', () => {
  let setMapAreaSelectionMock, store;

  beforeEach(() => {
    setMapAreaSelectionMock = jest.fn(() => () => {});
    setMapAreaSelection.mockImplementation(setMapAreaSelectionMock);

    store = {
      data: { eventTypes: [], patrolTypes: [] },
      view: { mapLocationSelection: { event: report } },
    };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportGeometryDrawer />
        </NavigationWrapper>
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('triggers setMapAreaSelection with false parameter if user press escape', async () => {
    expect(setMapAreaSelection).toHaveBeenCalledTimes(0);

    userEvent.keyboard('{Escape}');

    expect(setMapAreaSelection).toHaveBeenCalledTimes(1);
    expect(setMapAreaSelection).toHaveBeenCalledWith(false);
  });
});
