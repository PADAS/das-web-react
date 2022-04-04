import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';

import AddReport from './';
import { createMapMock } from '../__test-helpers/mocks';
import { createNewReportForEventType } from '../utils/events';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { mockStore } from '../__test-helpers/MockStore';
import { showReportDetailView } from '../ducks/events';

jest.mock('../constants', () => ({
  ...jest.requireActual('../constants'),
  DEVELOPMENT_FEATURE_FLAGS: {
    ENABLE_PATROL_NEW_UI: true,
    ENABLE_REPORT_NEW_UI: true,
    ENABLE_UFA_NAVIGATION_UI: true,
  },
}));
jest.mock('../utils/events', () => ({
  ...jest.requireActual('../utils/events'),
  createNewReportForEventType: jest.fn(),
}));
jest.mock('../ducks/events', () => ({
  ...jest.requireActual('../ducks/events'),
  showReportDetailView: jest.fn(),
}));

describe('AddReport', () => {
  let map, store;
  beforeEach(() => {
    map = createMapMock();
    store = mockStore({ data: { eventTypes } });

    render(
      <Provider store={store}>
        <AddReport map={map} patrolTypes={[]} />
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('open popover when pressing the button', async () => {
    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).toBeNull();
    });

    const button = await screen.getByTestId('addReport-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeTruthy();
    });
  });

  test('close popover when pressing the esc key', async () => {
    const button = await screen.getByTestId('addReport-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeTruthy();
    });

    const container = await screen.getByTestId('addReport-container');
    fireEvent.keyDown(container, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).toBeNull();
    });
  });

  test('close popover when clicking outside the container', async () => {
    const button = await screen.getByTestId('addReport-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeTruthy();
    });

    fireEvent.mouseDown(document);

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).toBeNull();
    });
  });

  test('opens the report detail view to add a new report', async () => {
    const createNewReportForEventTypeMock = jest.fn();
    createNewReportForEventType.mockImplementation(createNewReportForEventTypeMock);
    const showReportDetailViewMock = jest.fn(() => () => {});
    showReportDetailView.mockImplementation(showReportDetailViewMock);

    const addRepportButton = await screen.getByTestId('addReport-button');
    fireEvent.click(addRepportButton);

    await waitFor(() => {
      expect(createNewReportForEventType).toHaveBeenCalledTimes(0);
      expect(showReportDetailView).toHaveBeenCalledTimes(0);
    });

    const categoryListButton = await screen.findAllByTestId('categoryList-button-d0884b8c-4ecb-45da-841d-f2f8d6246abf');
    fireEvent.click(categoryListButton[0]);

    await waitFor(() => {
      expect(createNewReportForEventType).toHaveBeenCalled();
      expect(showReportDetailView).toHaveBeenCalled();
    });
  });
});
