import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { eventTypes } from '../../__test-helpers/fixtures/event-types';
import Header from './';
import { mockStore } from '../../__test-helpers/MockStore';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import { report } from '../../__test-helpers/fixtures/reports';

describe('Header', () => {
  const setTitle = jest.fn();
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders correctly case of a 300 priority report', async () => {
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <Header report={report} setTitle={setTitle} />
      </Provider>
    );

    expect((await screen.findByTestId('reportDetailHeader-icon'))).toHaveClass('priority-300');
  });

  test('sets the display title as the title if it was empty', async () => {
    expect(setTitle).toHaveBeenCalledTimes(0);

    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <Header report={report} setTitle={setTitle} />
      </Provider>
    );

    expect(setTitle).toHaveBeenCalledTimes(1);
    expect(setTitle).toHaveBeenCalledWith('Light');
  });

  test('triggers setTitle callback when the contenteditable loses focus', async () => {
    report.title = 'Light';
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <Header report={report} setTitle={setTitle} />
      </Provider>
    );

    const titleTextBox = await screen.findByTestId('reportDetailView-header-title');
    userEvent.type(titleTextBox, '2');
    userEvent.tab();

    await waitFor(() => {
      expect(setTitle).toHaveBeenCalledTimes(1);
      expect(setTitle).toHaveBeenCalledWith('Light2');
    });
  });

  test('sets the event type title if user leaves the title input empty', async () => {
    report.title = 'Light';
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <Header report={report} setTitle={setTitle} />
      </Provider>
    );

    const titleTextBox = await screen.findByTestId('reportDetailView-header-title');
    userEvent.type(titleTextBox, '{backspace}{backspace}{backspace}{backspace}{backspace}');
    userEvent.tab();

    expect(setTitle).toHaveBeenCalledTimes(1);
    expect(setTitle).toHaveBeenCalledWith('Light');
  });

  test('shows the event type label if the title does not match the event type title', async () => {
    report.title = 'Report!';
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <Header report={report} setTitle={setTitle} />
      </Provider>
    );

    const eventTypeLabel = await screen.findByTestId('reportDetailView-header-eventType');

    expect(eventTypeLabel).toHaveTextContent('Light');
  });

  test('doest not show the event type label if the title matches the event type title', async () => {
    report.title = 'Light';
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <Header report={report} setTitle={setTitle} />
      </Provider>
    );

    expect((await screen.queryByTestId('reportDetailView-header-eventType'))).toBeNull();
  });
});
