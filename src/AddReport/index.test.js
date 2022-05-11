import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';

import AddReport from './';
import { createMapMock } from '../__test-helpers/mocks';
import { createNewReportForEventType, openModalForReport } from '../utils/events';
import { DEVELOPMENT_FEATURE_FLAGS, TAB_KEYS } from '../constants';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { mockStore } from '../__test-helpers/MockStore';
import { showDetailView } from '../ducks/side-bar';

jest.mock('../constants', () => ({
  ...jest.requireActual('../constants'),
  DEVELOPMENT_FEATURE_FLAGS: {
    ENABLE_PATROL_NEW_UI: true,
    ENABLE_REPORT_NEW_UI: true,
  },
}));
jest.mock('../utils/events', () => ({
  ...jest.requireActual('../utils/events'),
  createNewReportForEventType: jest.fn(),
  openModalForReport: jest.fn(),
}));
jest.mock('../ducks/side-bar', () => ({
  ...jest.requireActual('../ducks/side-bar'),
  showDetailView: jest.fn(),
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

  test('starts the addition of a new report', async () => {
    DEVELOPMENT_FEATURE_FLAGS.ENABLE_PATROL_NEW_UI = false;
    DEVELOPMENT_FEATURE_FLAGS.ENABLE_REPORT_NEW_UI = false;

    cleanup();
    render(
      <Provider store={store}>
        <AddReport map={map} patrolTypes={[]} />
      </Provider>
    );

    const createNewReportForEventTypeMock = jest.fn();
    createNewReportForEventType.mockImplementation(createNewReportForEventTypeMock);
    const openModalForReportMock = jest.fn();
    openModalForReport.mockImplementation(openModalForReportMock);

    const addRepportButton = await screen.getByTestId('addReport-button');
    fireEvent.click(addRepportButton);

    await waitFor(() => {
      expect(createNewReportForEventType).toHaveBeenCalledTimes(0);
      expect(openModalForReportMock).toHaveBeenCalledTimes(0);
    });

    const categoryListButton = await screen.findAllByTestId('categoryList-button-d0884b8c-4ecb-45da-841d-f2f8d6246abf');
    fireEvent.click(categoryListButton[0]);

    await waitFor(() => {
      expect(createNewReportForEventType).toHaveBeenCalled();
      expect(openModalForReportMock).toHaveBeenCalled();
    });
  });

  test('opens the report detail view to add a new report', async () => {
    DEVELOPMENT_FEATURE_FLAGS.ENABLE_PATROL_NEW_UI = true;
    DEVELOPMENT_FEATURE_FLAGS.ENABLE_REPORT_NEW_UI = true;

    const createNewReportForEventTypeMock = jest.fn();
    createNewReportForEventType.mockImplementation(createNewReportForEventTypeMock);
    const showDetailViewMock = jest.fn(() => () => {});
    showDetailView.mockImplementation(showDetailViewMock);

    const addRepportButton = await screen.getByTestId('addReport-button');
    fireEvent.click(addRepportButton);

    await waitFor(() => {
      expect(createNewReportForEventType).toHaveBeenCalledTimes(0);
      expect(showDetailView).toHaveBeenCalledTimes(0);
    });

    const categoryListButton = await screen.findAllByTestId('categoryList-button-d0884b8c-4ecb-45da-841d-f2f8d6246abf');
    fireEvent.click(categoryListButton[0]);

    await waitFor(() => {
      expect(createNewReportForEventType).toHaveBeenCalled();
      expect(showDetailView).toHaveBeenCalled();
      expect(showDetailView.mock.calls[0][0]).toBe(TAB_KEYS.REPORTS);
    });
  });
});
