import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { ToastContainer } from 'react-toastify';
import { setupServer } from 'msw/node';

import EventItemContextMenu from './index';
import { mockStore } from '../__test-helpers/MockStore';
import { report } from '../__test-helpers/fixtures/reports';
import { EVENT_API_URL, UPDATE_EVENT_START } from '../ducks/events';

const server = setupServer(
  rest.patch(
        `${EVENT_API_URL}:eventId`, (req, res, ctx) => {
          return res(ctx.json({ data: [] }));
        }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());


describe('EventItemContextMenu', () => {
  test('it resolves a report using the context menu option', async () => {
    const { id, serial_number } = report;
    const optionLabel = `Resolve #${serial_number}`;
    const store = mockStore({});

    render(
      <Provider store={store}>
        <EventItemContextMenu report={report}>
          some children
        </EventItemContextMenu>
        <ToastContainer/>
      </Provider>
    );

    fireEvent.contextMenu(screen.getByTestId('contextMenuToggle'));
    const option = screen.getByText(optionLabel);
    userEvent.click(option);

    await waitFor(() => screen.getByText(`#${serial_number} Resolved`));

    const [action] = store.getActions();

    expect(action).toEqual({
      type: UPDATE_EVENT_START,
      payload: { id, state: 'resolved' }
    });
  });
});