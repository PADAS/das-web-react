import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { ToastContainer } from 'react-toastify';
import { setupServer } from 'msw/node';

import EventItemContextMenu from './index';
import { mockStore } from '../__test-helpers/MockStore';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import { report } from '../__test-helpers/fixtures/reports';
import { EVENT_API_URL } from '../ducks/events';

const server = setupServer(
  rest.patch(`${EVENT_API_URL}:eventId`, (req, res, ctx) =>
    res(req.params.eventId !== 'undefined' ? ctx.json({ data: [] }) : ctx.status(400))),
  rest.patch(`${EVENT_API_URL}:eventId/state`, (req, res, ctx) =>
    res(req.params.eventId !== 'undefined' ? ctx.json({ data: [] }) : ctx.status(400))),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('EventItemContextMenu', () => {
  let store;
  beforeEach(() => {
    store = { data: {}, view: {} };
  });

  test('shows a message after updating a report status', async () => {
    render(
      <Provider store={mockStore(store)}>
        <EventItemContextMenu report={report}>
          Children
        </EventItemContextMenu>
        <ToastContainer/>
      </Provider>
    );

    fireEvent.contextMenu(screen.getByText('Children'));

    userEvent.click(screen.getByText(`Resolve #${report.serial_number}`));

    await waitFor(() => {
      expect(screen.getByText(`#${report.serial_number} resolved`)).toBeDefined();
    });
  });

  test('shows an error message when a report could not be updated', async () => {
    const corruptReport = { ...report, id: undefined };

    render(
      <Provider store={mockStore(store)}>
        <EventItemContextMenu report={corruptReport}>
          Children
        </EventItemContextMenu>
        <ToastContainer/>
      </Provider>
    );

    fireEvent.contextMenu(screen.getByText('Children'));

    userEvent.click(screen.getByText(`Resolve #${report.serial_number}`));

    await waitFor(() => {
      expect(screen.getByText(`#${report.serial_number} still active, something went wrong`)).toBeDefined();
    });
  });

  test('shows a message after updating an incident status', async () => {
    report.is_collection = true;
    report.contains = [{
      related_event: { id: '1', serial_number: '1' },
    }, {
      related_event: { id: '2', serial_number: '2' },
    }];

    render(
      <Provider store={mockStore(store)}>
        <EventItemContextMenu report={report}>
          Children
        </EventItemContextMenu>
        <ToastContainer/>
      </Provider>
    );

    fireEvent.contextMenu(screen.getByText('Children'));

    userEvent.click(screen.getByText(`Resolve #${report.serial_number}`));

    await waitFor(() => {
      expect(screen.getByText(`The collection #${report.serial_number} was resolved correctly`)).toBeDefined();
      expect(screen.getByText('These related events were resolved as well:')).toBeDefined();
      expect(screen.queryByText('WARNING: These reports are still active')).toBeNull();
      expect(screen.getByText('#1')).toBeDefined();
      expect(screen.getByText('#2')).toBeDefined();
    });
  });

  test('shows a message with the incident contained events that failed to update', async () => {
    report.is_collection = true;
    report.contains = [{
      related_event: { serial_number: '1' },
    }, {
      related_event: { serial_number: '2' },
    }];

    render(
      <Provider store={mockStore(store)}>
        <EventItemContextMenu report={report}>
          Children
        </EventItemContextMenu>
        <ToastContainer/>
      </Provider>
    );

    fireEvent.contextMenu(screen.getByText('Children'));

    userEvent.click(screen.getByText(`Resolve #${report.serial_number}`));

    await waitFor(() => {
      expect(screen.getByText(`The collection #${report.serial_number} was resolved correctly`)).toBeDefined();
      expect(screen.queryByText('These related events were resolved as well:')).toBeNull();
      expect(screen.getByText('WARNING: These events are still active')).toBeDefined();
      expect(screen.getByText('#1')).toBeDefined();
      expect(screen.getByText('#2')).toBeDefined();
    });
  });

  test('copies the report link', async () => {
    const writeText = jest.fn();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
    });

    render(
      <Provider store={mockStore(store)}>
        <EventItemContextMenu report={report}>
          Children
        </EventItemContextMenu>
        <ToastContainer/>
      </Provider>
    );

    fireEvent.contextMenu(screen.getByText('Children'));

    expect(writeText).toHaveBeenCalledTimes(0);

    const copyButton = screen.getByTestId('textCopyBtn');
    userEvent.click(copyButton);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith(
        'http://localhost/reports/d45cb504-4612-41fe-9ea5-f1b423ac3ba4?lnglat=-104.19557197413907,20.75709101172957'
      );
      expect(screen.getByText('Link copied')).toBeDefined();
    });
  });
});