import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setMapInteractionIsPickingArea } from '../ducks/map-ui';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import { report } from '../__test-helpers/fixtures/reports';
import ReportGeometryDrawer from './';

jest.mock('../ducks/map-ui', () => ({
  ...jest.requireActual('../ducks/map-ui'),
  setMapInteractionIsPickingArea: jest.fn(),
}));

describe('ReportGeometryDrawer', () => {
  let setMapInteractionIsPickingAreaMock, store;

  beforeEach(() => {
    setMapInteractionIsPickingAreaMock = jest.fn(() => () => {});
    setMapInteractionIsPickingArea.mockImplementation(setMapInteractionIsPickingAreaMock);

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

  test('triggers setMapInteractionIsPickingArea with false parameter if user press escape', async () => {
    expect(setMapInteractionIsPickingArea).toHaveBeenCalledTimes(0);

    userEvent.keyboard('{Escape}');

    expect(setMapInteractionIsPickingArea).toHaveBeenCalledTimes(1);
    expect(setMapInteractionIsPickingArea).toHaveBeenCalledWith(false);
  });
});
