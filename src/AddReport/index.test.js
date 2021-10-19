import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import ReactGA from 'react-ga';

import AddReport, { calculatePopoverPlacement } from './';
import { createMapMock } from '../__test-helpers/mocks';
import { createNewReportForEventType, openModalForReport } from '../utils/events';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { mockStore } from '../__test-helpers/MockStore';

jest.mock('../utils/events', () => ({
  ...jest.requireActual('../utils/events'),
  createNewReportForEventType: jest.fn(),
  openModalForReport: jest.fn(),
}));

ReactGA.initialize('dummy', { testMode: true });

describe('AddReport', () => {
  let map, store;
  beforeEach(() => {
    map = createMapMock();
    store = mockStore({ data: { eventTypes } });

    jest.spyOn(document, 'querySelector').mockImplementation(() => ({
      clientHeight: 1000,
      clientWidth: 1000,
    }));

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

  test('starts the edition of a new report', async () => {
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

    const categoryListButton = await screen.findAllByTestId('categoryList-button');
    fireEvent.click(categoryListButton[0]);

    await waitFor(() => {
      expect(createNewReportForEventType).toHaveBeenCalled();
      expect(openModalForReportMock).toHaveBeenCalled();
    });
  });
});

describe('calculatePopoverPlacement', () => {
  beforeEach(() => {
    jest.spyOn(document, 'querySelector').mockImplementation(() => ({
      clientHeight: 1000,
      clientWidth: 1000,
    }));
  });

  test('returns "left" if coordinates are more than 70% to the right of the map', async () => {
    expect(calculatePopoverPlacement({ bottom: 0, right: 701 })).toBe('left');

    jest.spyOn(document, 'querySelector').mockImplementation(() => ({
      clientHeight: 500,
      clientWidth: 500,
    }));

    expect(calculatePopoverPlacement({ bottom: 0, right: 351 })).toBe('left');
  });

  test('returns "right" if coordinates are more than 70% to the bottom of the map', async () => {
    expect(calculatePopoverPlacement({ bottom: 701, right: 0 })).toBe('right');

    jest.spyOn(document, 'querySelector').mockImplementation(() => ({
      clientHeight: 500,
      clientWidth: 500,
    }));

    expect(calculatePopoverPlacement({ bottom: 351, right: 0 })).toBe('right');
  });

  test('returns "auto" by default', async () => {
    expect(calculatePopoverPlacement({ bottom: 0, right: 0 })).toBe('auto');
    expect(calculatePopoverPlacement({ bottom: 700, right: 700 })).toBe('auto');

    jest.spyOn(document, 'querySelector').mockImplementation(() => ({
      clientHeight: 500,
      clientWidth: 500,
    }));

    expect(calculatePopoverPlacement({ bottom: 0, right: 0 })).toBe('auto');
    expect(calculatePopoverPlacement({ bottom: 350, right: 350 })).toBe('auto');
  });
});
