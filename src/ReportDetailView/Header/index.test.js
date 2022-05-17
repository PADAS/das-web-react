import React from 'react';
import { Provider } from 'react-redux';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { eventTypes } from '../../__test-helpers/fixtures/event-types';
import Header from './';
import { mockStore } from '../../__test-helpers/MockStore';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import { report } from '../../__test-helpers/fixtures/reports';

describe('Header', () => {
  const setTitle = jest.fn();
  beforeEach(() => {
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <Header report={report} setTitle={setTitle} />
        </NavigationWrapper>
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders correctly case of a 300 priority report', async () => {
    expect((await screen.findByTestId('reportDetailHeader-icon'))).toHaveClass('priority-300');
  });

  test('triggers setTitle callback when the contenteditable loses focus', async () => {
    expect(setTitle).toHaveBeenCalledTimes(0);

    const titleTextBox = await screen.findByTestId('reportDetailView-header-title');
    userEvent.type(titleTextBox, '2');
    userEvent.tab();

    expect(setTitle).toHaveBeenCalledTimes(1);
    expect(setTitle).toHaveBeenCalledWith('Light2');
  });

  test('sets the event type title if user leaves the title input empty', async () => {
    expect(setTitle).toHaveBeenCalledTimes(0);

    const titleTextBox = await screen.findByTestId('reportDetailView-header-title');
    userEvent.type(titleTextBox, '{backspace}{backspace}{backspace}{backspace}{backspace}');
    userEvent.tab();

    expect(setTitle).toHaveBeenCalledTimes(1);
    expect(setTitle).toHaveBeenCalledWith('Light');
  });

  test('renders the location jump button if the report has coordinates', async () => {
    expect(await screen.findByTitle('Jump to this location')).toBeDefined();
  });

  test('does not render the location jump button if the report does not have coordinates', async () => {
    report.geojson.geometry.coordinates = null;
    cleanup();
    render(
      <Provider store={mockStore({ data: { eventTypes, patrolTypes } })}>
        <NavigationWrapper>
          <Header report={report} setTitle={setTitle} />
        </NavigationWrapper>
      </Provider>
    );

    expect(await screen.queryByTitle('Jump to this location')).toBeNull();
  });
});
